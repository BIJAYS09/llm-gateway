import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.metrics.models import Base, LLMCall
from app.metrics.tracker import log_call


@pytest.fixture
def db():
    """In-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


class TestLogCall:
    def test_log_call_creates_record(self, db):
        call = log_call(
            db=db,
            request_id="test-123",
            requested_model="gpt-4o",
            routed_model="gpt-4o-mini",
            prompt_tokens=100,
            completion_tokens=50,
            cost_usd=0.000025,
            latency_ms=312.5,
            cache_hit=False,
        )
        assert call.id is not None
        assert call.request_id == "test-123"

    def test_log_call_computes_total_tokens(self, db):
        call = log_call(
            db=db,
            request_id="test-456",
            requested_model="gpt-4o",
            routed_model="gpt-4o-mini",
            prompt_tokens=200,
            completion_tokens=100,
            cost_usd=0.00005,
            latency_ms=200.0,
            cache_hit=False,
        )
        assert call.total_tokens == 300

    def test_cache_hit_log(self, db):
        call = log_call(
            db=db,
            request_id="cached-789",
            requested_model="gpt-4o",
            routed_model="cache",
            prompt_tokens=0,
            completion_tokens=0,
            cost_usd=0.0,
            latency_ms=5.2,
            cache_hit=True,
        )
        assert call.cache_hit is True
        assert call.cost_usd == 0.0
        assert call.routed_model == "cache"

    def test_multiple_calls_persist(self, db):
        for i in range(5):
            log_call(
                db=db,
                request_id=f"req-{i}",
                requested_model="gpt-4o",
                routed_model="gpt-4o-mini",
                prompt_tokens=50,
                completion_tokens=25,
                cost_usd=0.00001,
                latency_ms=100.0,
                cache_hit=False,
            )
        count = db.query(LLMCall).count()
        assert count == 5

    def test_total_cost_accumulates(self, db):
        for _ in range(3):
            log_call(
                db=db,
                request_id="cost-test",
                requested_model="gpt-4o",
                routed_model="gpt-4o",
                prompt_tokens=1000,
                completion_tokens=500,
                cost_usd=0.01,
                latency_ms=500.0,
                cache_hit=False,
            )
        from sqlalchemy import func
        total = db.query(func.sum(LLMCall.cost_usd)).scalar()
        assert abs(total - 0.03) < 1e-9
