# Prism — LLM Gateway

A transparent proxy for LLM API calls that adds **semantic caching**, **intelligent model routing**, and **full cost observability** — with zero changes to existing client code.

---

## What it does

Every LLM call goes through Prism instead of OpenAI directly. Prism then:

1. **Semantic cache check** — embeds the query and compares it against previously seen queries using cosine similarity. If a sufficiently similar query was answered before (default threshold: 0.92), returns the cached response instantly at zero cost.

2. **Model routing** — if no cache hit, classifies the query complexity and routes to the cheapest appropriate model. Simple questions (`what is`, `define`, `summarize`, short queries) go to `gpt-4o-mini`. Complex, long queries go to `gpt-4o`.

3. **Metrics logging** — every call is recorded: model used, tokens consumed, USD cost, latency, and whether it was a cache hit.

4. **Dashboard endpoints** — query `/metrics/summary`, `/metrics/recent`, `/metrics/cost-by-day`, and `/metrics/routing-breakdown` to see cost trends and savings.

---

## Project structure

```
prism/
├── app/
│   ├── main.py              # FastAPI app + lifespan
│   ├── config.py            # Settings via pydantic-settings
│   ├── dependencies.py      # DB session, table creation
│   ├── cache/
│   │   ├── redis_client.py  # Async Redis connection
│   │   └── semantic.py      # Embedding, cosine similarity, cache I/O
│   ├── router/
│   │   └── model_router.py  # Routing logic + cost calculation
│   ├── metrics/
│   │   ├── models.py        # SQLAlchemy LLMCall model
│   │   └── tracker.py       # log_call() helper
│   ├── schemas/
│   │   └── request.py       # Pydantic request/response schemas
│   └── api/
│       ├── proxy.py         # POST /v1/chat/completions
│       └── dashboard.py     # GET /metrics/*
├── tests/
│   ├── test_router.py       # Model routing + cost logic
│   ├── test_cache.py        # Cosine similarity unit tests
│   └── test_metrics.py      # DB persistence tests
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── .env.example
```

---

## Quickstart

### 1. Clone and configure

```bash
git clone https://github.com/yoBIJAYS09urname/llm-gateway
cd llm-gateway
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

### 2. Run with Docker

```bash
docker-compose up --build
```

The API is now live at `http://localhost:8000`.

### 3. Run locally (without Docker)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Start Redis separately
docker run -p 6379:6379 redis:7-alpine

uvicorn app.main:app --reload
```

---

## Usage

### Drop-in with OpenAI SDK

```python
from openai import OpenAI

# Just change the base_url — everything else is identical
client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="unused",  # Prism uses its own key from .env
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What is RAG?"}],
)

print(response)
# Response includes extra fields:
# cache_hit: false
# routed_model: "gpt-4o-mini"   ← Prism routed to cheaper model
# cost_usd: 0.0000375
# latency_ms: 823.4
```

### Drop-in with LangChain

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="http://localhost:8000/v1",
    model="gpt-4o",
)
```

### Direct HTTP

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "What is RAG?"}]
  }'
```

---

## Metrics endpoints

```bash
# Overall summary
GET /metrics/summary

# Last 20 calls
GET /metrics/recent?limit=20

# Daily cost breakdown (last 7 days)
GET /metrics/cost-by-day?days=7

# Model routing breakdown
GET /metrics/routing-breakdown

# Health check
GET /health
```

### Example summary response

```json
{
  "total_calls": 1000,
  "cache_hits": 312,
  "cache_misses": 688,
  "cache_hit_rate": "31.2%",
  "total_cost_usd": 0.847293,
  "estimated_cache_savings_usd": 0.156,
  "avg_latency_ms": 634.2,
  "by_model": {
    "gpt-4o-mini": {"calls": 521, "cost_usd": 0.142, "total_tokens": 680000},
    "gpt-4o":      {"calls": 167, "cost_usd": 0.705, "total_tokens": 210000},
    "cache":       {"calls": 312, "cost_usd": 0.0,   "total_tokens": 0}
  }
}
```

---

## Configuration

All config is via environment variables (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | Your OpenAI key |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `DATABASE_URL` | `sqlite:///./prism.db` | SQLite or Postgres |
| `CACHE_SIMILARITY_THRESHOLD` | `0.92` | Cosine similarity cutoff for cache hits |
| `CHEAP_MODEL` | `gpt-4o-mini` | Model for simple queries |
| `SMART_MODEL` | `gpt-4o` | Model for complex queries |

---

## Running tests

```bash
pytest tests/ -v
```

Tests cover: cosine similarity edge cases, model routing rules, cost calculation, and DB persistence. All tests use in-memory SQLite — no external services required.

---

## Architecture decisions worth discussing

**Why cosine similarity over exact match?** Exact match caching misses semantically identical questions phrased differently ("what is RAG?" vs "can you explain RAG?"). Cosine similarity over embeddings catches these — at the cost of one embedding call per cache miss.

**Why 0.92 as the default threshold?** Below ~0.90 you start getting false positives (different questions getting the same answer). Above ~0.95 the cache hit rate drops significantly. 0.92 is a pragmatic default — expose it as a config so operators can tune it.

**Why SQLite not Postgres?** SQLite is zero-config and perfect for a portfolio project. The SQLAlchemy ORM means swapping to Postgres is a one-line change in `.env`.

**Why not streaming?** Streaming responses can't be cached (you'd have to buffer the full response anyway). For a cost-optimization proxy, non-streaming is the right default.
