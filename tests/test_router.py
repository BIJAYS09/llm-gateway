import pytest

from app.config import settings
from app.router.model_router import calculate_cost, route_model
from app.schemas.request import ChatCompletionRequest, Message


def make_request(content: str, model: str = "gpt-4o") -> ChatCompletionRequest:
    return ChatCompletionRequest(
        model=model,
        messages=[Message(role="user", content=content)],
    )


class TestRouteModel:
    def test_short_query_routes_cheap(self):
        req = make_request("what is RAG?")
        assert route_model(req) == settings.cheap_model

    def test_what_is_pattern_routes_cheap(self):
        req = make_request("what is the difference between RAG and fine-tuning?")
        assert route_model(req) == settings.cheap_model

    def test_summarize_pattern_routes_cheap(self):
        req = make_request("summarize the following document: " + "word " * 50)
        assert route_model(req) == settings.cheap_model

    def test_long_complex_query_routes_smart(self):
        complex_query = (
            "I need you to design a multi-agent system that handles document ingestion, "
            "chunking, embedding, retrieval, re-ranking, and response generation. "
            "Please provide a detailed architecture with trade-offs for each component "
            "and explain how you would handle failures in a production environment. "
            "Include considerations for latency, cost, and accuracy."
        )
        req = make_request(complex_query)
        assert route_model(req) == settings.smart_model

    def test_explicit_cheap_model_always_respected(self):
        long_complex = "x " * 200
        req = make_request(long_complex, model=settings.cheap_model)
        assert route_model(req) == settings.cheap_model

    def test_translate_routes_cheap(self):
        req = make_request("translate this to German: Hello world")
        assert route_model(req) == settings.cheap_model

    def test_define_routes_cheap(self):
        req = make_request("define transformer architecture")
        assert route_model(req) == settings.cheap_model

    def test_empty_messages_routes_cheap(self):
        req = ChatCompletionRequest(
            model="gpt-4o",
            messages=[Message(role="system", content="You are helpful.")],
        )
        assert route_model(req) == settings.cheap_model


class TestCalculateCost:
    def test_cheap_model_cost(self):
        cost = calculate_cost(settings.cheap_model, prompt_tokens=1000, completion_tokens=500)
        expected = (
            1000 / 1000 * settings.cheap_model_price_per_1k_input
            + 500 / 1000 * settings.cheap_model_price_per_1k_output
        )
        assert abs(cost - expected) < 1e-9

    def test_smart_model_costs_more(self):
        cheap = calculate_cost(settings.cheap_model, 1000, 500)
        smart = calculate_cost(settings.smart_model, 1000, 500)
        assert smart > cheap

    def test_zero_tokens_is_zero_cost(self):
        assert calculate_cost(settings.cheap_model, 0, 0) == 0.0

    def test_unknown_model_falls_back_to_smart_pricing(self):
        cost = calculate_cost("gpt-unknown", 1000, 500)
        smart_cost = calculate_cost(settings.smart_model, 1000, 500)
        assert cost == smart_cost
