from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.dashboard import router as dashboard_router
from app.api.proxy import router as proxy_router
from app.cache.redis_client import close_redis
from app.dependencies import create_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    yield
    # Shutdown
    await close_redis()


app = FastAPI(
    title="LLM Gateway",
    description=(
        "A transparent proxy for LLM calls that adds semantic caching, "
        "intelligent model routing, and full cost observability. "
        "Drop-in compatible with the OpenAI API."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proxy_router)
app.include_router(dashboard_router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok", "service": "LLM Gateway"}
