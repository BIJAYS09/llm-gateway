import hashlib
import json
import numpy as np
from openai import AsyncOpenAI

from app.config import settings

_openai_client = None


def get_openai_client() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        _openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _openai_client


async def embed(text: str) -> list[float]:
    client = get_openai_client()
    response = await client.embeddings.create(
        model=settings.embedding_model,
        input=text[:8000],  # embedding model token limit safety
    )
    return response.data[0].embedding


def cosine_similarity(a: list[float], b: list[float]) -> float:
    a_arr = np.array(a, dtype=np.float32)
    b_arr = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(a_arr)
    norm_b = np.linalg.norm(b_arr)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a_arr, b_arr) / (norm_a * norm_b))


async def cache_lookup(redis_client, query: str) -> str | None:
    """
    Embed the query and scan Redis for a semantically similar cached response.
    Returns the cached response string if similarity >= threshold, else None.
    """
    query_vec = await embed(query)
    keys = await redis_client.keys("cache:vec:*")

    best_score = 0.0
    best_response = None

    for key in keys:
        raw = await redis_client.get(key)
        if not raw:
            continue
        try:
            stored = json.loads(raw)
            score = cosine_similarity(query_vec, stored["embedding"])
            if score > best_score:
                best_score = score
                best_response = stored["response"]
        except (json.JSONDecodeError, KeyError):
            continue

    if best_score >= settings.cache_similarity_threshold:
        return best_response
    return None


async def cache_store(redis_client, query: str, response: str) -> None:
    """
    Embed the query and store the query+response pair in Redis.
    TTL is 24 hours.
    """
    query_vec = await embed(query)
    key = f"cache:vec:{hashlib.md5(query.encode()).hexdigest()}"
    payload = json.dumps({"embedding": query_vec, "response": response})
    await redis_client.set(key, payload, ex=86400)
