import hashlib, json
import numpy as np
from openai import OpenAI

client = OpenAI()

def embed(text: str) -> list[float]:
    resp = client.embeddings.create(model="text-embedding-3-small", input=text)
    return resp.data[0].embedding

def cosine_similarity(a: list[float], b: list[float]) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

async def cache_lookup(redis, query: str, threshold: float = 0.92) -> str | None:
    query_vec = embed(query)
    # scan all cached vectors in Redis, compare
    keys = await redis.keys("cache:vec:*")
    for key in keys:
        stored = json.loads(await redis.get(key))
        if cosine_similarity(query_vec, stored["embedding"]) >= threshold:
            return stored["response"]
    return None