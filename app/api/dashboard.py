from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.metrics.models import LLMCall

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    """
    High-level cost and cache summary across all recorded calls.
    """
    calls = db.query(LLMCall).all()
    if not calls:
        return {"message": "No calls recorded yet. Make some requests to /v1/chat/completions first."}

    total = len(calls)
    cache_hits = sum(1 for c in calls if c.cache_hit)
    total_cost = sum(c.cost_usd for c in calls)
    avg_latency = sum(c.latency_ms for c in calls) / total

    # Savings = what the cache-hit calls would have cost (rough estimate using cheap model price)
    cache_savings = cache_hits * 0.0005  # estimate: avg ~500 tokens at cheap model price

    by_model: dict = {}
    for call in calls:
        m = call.routed_model
        if m not in by_model:
            by_model[m] = {"calls": 0, "cost_usd": 0.0, "total_tokens": 0}
        by_model[m]["calls"] += 1
        by_model[m]["cost_usd"] = round(by_model[m]["cost_usd"] + call.cost_usd, 8)
        by_model[m]["total_tokens"] += call.total_tokens

    return {
        "total_calls": total,
        "cache_hits": cache_hits,
        "cache_misses": total - cache_hits,
        "cache_hit_rate": f"{cache_hits / total * 100:.1f}%",
        "total_cost_usd": round(total_cost, 6),
        "estimated_cache_savings_usd": round(cache_savings, 6),
        "avg_latency_ms": round(avg_latency, 1),
        "by_model": by_model,
    }


@router.get("/recent")
def get_recent(
    limit: int = Query(default=20, le=100, description="Max records to return"),
    db: Session = Depends(get_db),
):
    """
    Most recent LLM calls, newest first.
    """
    calls = (
        db.query(LLMCall)
        .order_by(LLMCall.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": c.id,
            "request_id": c.request_id,
            "requested_model": c.requested_model,
            "routed_model": c.routed_model,
            "prompt_tokens": c.prompt_tokens,
            "completion_tokens": c.completion_tokens,
            "total_tokens": c.total_tokens,
            "cost_usd": c.cost_usd,
            "latency_ms": c.latency_ms,
            "cache_hit": c.cache_hit,
            "created_at": c.created_at.isoformat(),
        }
        for c in calls
    ]


@router.get("/cost-by-day")
def get_cost_by_day(
    days: int = Query(default=7, le=30, description="Number of days to look back"),
    db: Session = Depends(get_db),
):
    """
    Daily cost and call volume breakdown.
    """
    since = datetime.now(UTC) - timedelta(days=days)
    calls = db.query(LLMCall).filter(LLMCall.created_at >= since).all()

    by_day: dict = {}
    for call in calls:
        day = call.created_at.strftime("%Y-%m-%d")
        if day not in by_day:
            by_day[day] = {"calls": 0, "cost_usd": 0.0, "cache_hits": 0}
        by_day[day]["calls"] += 1
        by_day[day]["cost_usd"] = round(by_day[day]["cost_usd"] + call.cost_usd, 8)
        if call.cache_hit:
            by_day[day]["cache_hits"] += 1

    # Fill in missing days with zeros
    result = {}
    for i in range(days):
        day = (datetime.now(UTC) - timedelta(days=i)).strftime("%Y-%m-%d")
        result[day] = by_day.get(day, {"calls": 0, "cost_usd": 0.0, "cache_hits": 0})

    return dict(sorted(result.items()))


@router.get("/routing-breakdown")
def get_routing_breakdown(db: Session = Depends(get_db)):
    """
    Shows how many calls were routed to each model vs what clients originally requested.
    Useful for demonstrating the cost-saving impact of the model router.
    """
    rows = (
        db.query(
            LLMCall.requested_model,
            LLMCall.routed_model,
            func.count().label("calls"),
            func.sum(LLMCall.cost_usd).label("total_cost"),
        )
        .group_by(LLMCall.requested_model, LLMCall.routed_model)
        .all()
    )

    return [
        {
            "requested_model": r.requested_model,
            "routed_to": r.routed_model,
            "calls": r.calls,
            "total_cost_usd": round(r.total_cost or 0.0, 6),
        }
        for r in rows
    ]
