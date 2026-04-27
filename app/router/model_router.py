from app.schemas.request import ChatCompletionRequest
from app.config import settings

# Patterns that strongly indicate a simple, cheap query
CHEAP_PATTERNS = [
    "what is", "what are", "who is", "who are",
    "when did", "when was", "where is", "where are",
    "define", "definition", "meaning of",
    "summarize", "summary", "briefly",
    "translate", "in english", "in german",
    "how many", "how much", "list", "give me a list",
    "yes or no", "true or false",
]

# Short threshold in characters — queries under this are almost always simple
SHORT_QUERY_THRESHOLD = 150


def route_model(request: ChatCompletionRequest) -> str:
    """
    Determine the most cost-effective model for this request.

    Rules (in priority order):
    1. If client explicitly requests the cheap model, honour it.
    2. If the user message matches a cheap pattern, use cheap model.
    3. If the user message is short, use cheap model.
    4. Otherwise, use the smart model.
    """
    # Honour explicit cheap model request
    if request.model == settings.cheap_model:
        return settings.cheap_model

    user_messages = [
        m.content.lower().strip()
        for m in request.messages
        if m.role == "user"
    ]
    if not user_messages:
        return settings.cheap_model

    last_user_msg = user_messages[-1]

    if any(pattern in last_user_msg for pattern in CHEAP_PATTERNS):
        return settings.cheap_model

    if len(last_user_msg) < SHORT_QUERY_THRESHOLD:
        return settings.cheap_model

    return settings.smart_model


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """
    Calculate the USD cost of an LLM call based on token usage and model pricing.
    """
    pricing = {
        settings.cheap_model: {
            "input": settings.cheap_model_price_per_1k_input,
            "output": settings.cheap_model_price_per_1k_output,
        },
        settings.smart_model: {
            "input": settings.smart_model_price_per_1k_input,
            "output": settings.smart_model_price_per_1k_output,
        },
    }

    model_pricing = pricing.get(model, pricing[settings.smart_model])
    cost = (
        prompt_tokens / 1000 * model_pricing["input"]
        + completion_tokens / 1000 * model_pricing["output"]
    )
    return round(cost, 8)
