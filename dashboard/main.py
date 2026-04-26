@app.get("/metrics/summary")
async def metrics_summary(db: Session = Depends(get_db)):
    calls = db.query(LLMCall).all()
    return {
        "total_calls":     len(calls),
        "cache_hits":      sum(c.cache_hit for c in calls),
        "cache_hit_rate":  f"{sum(c.cache_hit for c in calls)/len(calls)*100:.1f}%",
        "total_cost_usd":  round(sum(c.cost_usd for c in calls), 4),
        "avg_latency_ms":  round(sum(c.latency_ms for c in calls)/len(calls), 1),
        "savings_usd":     round(sum(c.cost_usd for c in calls if c.cache_hit), 4),
        "by_model": {
            model: {"calls": count, "cost": cost}
            for model, count, cost in db.query(
                LLMCall.model,
                func.count(),
                func.sum(LLMCall.cost_usd)
            ).group_by(LLMCall.model).all()
        }
    }