import json
import time
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.cache.redis_client import get_redis
from app.cache.semantic import cache_lookup, cache_store
from app.config import settings
from app.dependencies import get_db
from app.metrics.tracker import log_call
from app.router.model_router import calculate_cost, route_model
from app.schemas.request import ChatCompletionRequest

router = APIRouter(tags=["proxy"])

# Lazy import to avoid circular deps
_openai_client = None
_groq_client = None


def get_openai():
    global _openai_client
    if _openai_client is None:
        from openai import AsyncOpenAI
        _openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai_client


def get_groq():
    global _groq_client
    if _groq_client is None:
        from groq import AsyncGroq
        _groq_client = AsyncGroq(api_key=settings.groq_api_key)
        print("Initialized Groq client with provided API key.",settings.groq_api_key)
    return _groq_client


@router.post("/v1/chat/completions")
async def chat_completions(
    request: ChatCompletionRequest,
    db: Session = Depends(get_db),
    redis=Depends(get_redis),
):
    """
    Drop-in replacement for OpenAI's /v1/chat/completions.
    Adds semantic caching, model routing, and cost tracking transparently.
    """
    start_time = time.time()
    request_id = str(uuid.uuid4())

    # Build the user query string for cache lookup
    user_query = " ".join(
        m.content for m in request.messages if m.role == "user"
    )

    # ── 1. Semantic cache check ────────────────────────────────────────────────
    cached_response = await cache_lookup(redis, user_query)
    if cached_response:
        latency_ms = (time.time() - start_time) * 1000
        log_call(
            db=db,
            request_id=request_id,
            requested_model=request.model,
            routed_model="cache",
            prompt_tokens=0,
            completion_tokens=0,
            cost_usd=0.0,
            latency_ms=round(latency_ms, 2),
            cache_hit=True,
        )
        result = json.loads(cached_response)
        result["cache_hit"] = True
        result["latency_ms"] = round(latency_ms, 2)
        return result

    # ── 2. Route to cheapest appropriate model ─────────────────────────────────
    routed_model = route_model(request)

    # ── 3. Call the LLM ────────────────────────────────────────────────────────
    # openai_client = get_openai()
    groq_client = get_groq()
    try:
        # response = await openai_client.chat.completions.create(
        #     model=routed_model,
        #     messages=[
        #         {"role": m.role, "content": m.content}
        #         for m in request.messages
        #     ],
        #     temperature=request.temperature,
        #     max_tokens=request.max_tokens,
        # )
        response = await groq_client.chat.completions.create(
            model=routed_model,
            messages=[
                {"role": m.role, "content": m.content}
                for m in request.messages
            ],
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"LLM API error: {exc}")

    latency_ms = (time.time() - start_time) * 1000

    # ── 4. Calculate cost ──────────────────────────────────────────────────────
    prompt_tokens = response.usage.prompt_tokens
    completion_tokens = response.usage.completion_tokens
    cost = calculate_cost(routed_model, prompt_tokens, completion_tokens)

    # ── 5. Build OpenAI-compatible response ────────────────────────────────────
    result = {
        "id": response.id,
        "object": "chat.completion",
        "model": routed_model,
        "choices": [
            {
                "index": c.index,
                "message": {
                    "role": c.message.role,
                    "content": c.message.content,
                },
                "finish_reason": c.finish_reason,
            }
            for c in response.choices
        ],
        "usage": {
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": response.usage.total_tokens,
        },
        # Prism metadata
        "cache_hit": False,
        "routed_model": routed_model,
        "cost_usd": cost,
        "latency_ms": round(latency_ms, 2),
    }

    # ── 6. Store in semantic cache ─────────────────────────────────────────────
    await cache_store(redis, user_query, json.dumps(result))

    # ── 7. Log metrics ─────────────────────────────────────────────────────────
    log_call(
        db=db,
        request_id=request_id,
        requested_model=request.model,
        routed_model=routed_model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        cost_usd=cost,
        latency_ms=round(latency_ms, 2),
        cache_hit=False,
    )

    return result
