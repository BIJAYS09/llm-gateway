from sqlalchemy.orm import Session

from app.metrics.models import LLMCall


def log_call(
    db: Session,
    request_id: str,
    requested_model: str,
    routed_model: str,
    prompt_tokens: int,
    completion_tokens: int,
    cost_usd: float,
    latency_ms: float,
    cache_hit: bool,
) -> LLMCall:
    """
    Persist a single LLM call record to the database.
    Returns the saved record.
    """
    call = LLMCall(
        request_id=request_id,
        requested_model=requested_model,
        routed_model=routed_model,
        prompt_tokens=prompt_tokens,
        completion_tokens=completion_tokens,
        total_tokens=prompt_tokens + completion_tokens,
        cost_usd=cost_usd,
        latency_ms=latency_ms,
        cache_hit=cache_hit,
    )
    db.add(call)
    db.commit()
    db.refresh(call)
    return call
