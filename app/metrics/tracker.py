from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime, UTC

class Base(DeclarativeBase): pass

class LLMCall(Base):
    __tablename__ = "llm_calls"
    id           = Column(Integer, primary_key=True)
    model        = Column(String)
    prompt_tokens  = Column(Integer)
    completion_tokens = Column(Integer)
    cost_usd     = Column(Float)
    latency_ms   = Column(Float)
    cache_hit    = Column(Integer, default=0)  # 0 or 1
    created_at   = Column(DateTime, default=lambda: datetime.now(UTC))