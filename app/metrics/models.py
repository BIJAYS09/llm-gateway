from datetime import datetime, UTC

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class LLMCall(Base):
    __tablename__ = "llm_calls"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    request_id        = Column(String, index=True, nullable=False)
    requested_model   = Column(String, nullable=False)   # what the client asked for
    routed_model      = Column(String, nullable=False)   # what we actually used
    prompt_tokens     = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens      = Column(Integer, default=0)
    cost_usd          = Column(Float, default=0.0)
    latency_ms        = Column(Float, default=0.0)
    cache_hit         = Column(Boolean, default=False)
    created_at        = Column(DateTime, default=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return (
            f"<LLMCall id={self.id} model={self.routed_model} "
            f"cost=${self.cost_usd:.6f} cache_hit={self.cache_hit}>"
        )
