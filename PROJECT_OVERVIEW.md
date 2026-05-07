# Project Overview: Prism LLM Gateway & UI

## Backend: Prism LLM Gateway
A transparent proxy for LLM API calls, providing:
- **Semantic caching** (cosine similarity, threshold configurable)
- **Intelligent model routing** (routes simple/complex queries to cheapest model)
- **Full cost observability** (metrics, cost, cache hits, latency)
- **Zero client code changes** (just change base_url)

### Key Features
- **Semantic cache**: Embeds queries, checks similarity, returns cached responses if similar enough
- **Model routing**: Classifies query complexity, routes to cheapest model
- **Metrics logging**: Tracks model, tokens, cost, latency, cache hits
- **Dashboard endpoints**: `/metrics/summary`, `/metrics/recent`, `/metrics/cost-by-day`, `/metrics/routing-breakdown`

### Structure
- `app/` — FastAPI app, config, dependencies
  - `cache/` — Redis client, semantic cache logic
  - `router/` — Model routing, cost calculation
  - `metrics/` — SQLAlchemy models, call tracker
  - `schemas/` — Pydantic schemas
  - `api/` — Proxy and dashboard endpoints
- `tests/` — Unit tests for cache, routing, metrics
- `Dockerfile`, `docker-compose.yml`, `.env.example`, `requirements.txt`

### Usage
- **Run with Docker**: `docker-compose up --build`
- **Run locally**: Python venv, install requirements, run Redis, start FastAPI app
- **API**: Drop-in replacement for OpenAI SDK, LangChain, or direct HTTP
- **Metrics**: Exposed via REST endpoints

---

## Frontend: Prism UI
A Next.js 14 dashboard for the Prism backend.

### Pages
- `/` — Overview: metrics, cost chart, model breakdown
- `/playground` — Chat UI (proxy through Prism)
- `/calls` — Table of recent LLM calls
- `/cost` — 14-day cost trend, routing efficiency
- `/settings` — Env var reference, API docs, cache threshold guide

### Stack
- Next.js 14 (App Router)
- Tailwind CSS (custom dark theme)
- Recharts (charts)
- Lucide React (icons)

### Usage
- **Install**: `npm install`
- **Configure**: Copy `.env.local.example` to `.env.local`
- **Dev server**: `npm run dev` (http://localhost:3000)
- **Production**: `npm run build && npm start`
- **Connect to backend**: Set `NEXT_PUBLIC_API_URL` in `.env.local`

---

## Testing
- Backend: `pytest tests/ -v` (in-memory SQLite, no external services required)
- Frontend: Standard Next.js/React testing (not detailed here)

---

## Configuration
- All backend config via `.env` (see `.env.example`)
- Key variables: `OPENAI_API_KEY`, `REDIS_URL`, `DATABASE_URL`, `CACHE_SIMILARITY_THRESHOLD`, `CHEAP_MODEL`, `SMART_MODEL`

---

## Architecture Notes
- **Cosine similarity**: Catches semantically similar queries, not just exact matches
- **Threshold**: 0.92 is default (tunable)
- **SQLite**: Default for simplicity, can swap to Postgres
- **No streaming**: For cacheability and cost tracking

---

## Authors & License
- See individual `README.md` files for more details and usage instructions.
