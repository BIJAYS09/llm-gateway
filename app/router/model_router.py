from app.api.llm_price_router import MODEL_PRICING_TABLE
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

    Rules (priority order):
    1. If client explicitly requests ANY model → honour it.
    2. If no model specified → decide based on heuristics.
    """

    # 1. If user explicitly provided a model → use it
    if request.model:
        return request.model

    # Extract user messages
    user_messages = [
        m.content.lower().strip()
        for m in request.messages
        if m.role == "user"
    ]

    if not user_messages:
        return settings.cheap_model

    last_user_msg = user_messages[-1]

    # 2. Heuristic routing
    if any(pattern in last_user_msg for pattern in CHEAP_PATTERNS):
        return settings.cheap_model

    if len(last_user_msg) < SHORT_QUERY_THRESHOLD:
        return settings.cheap_model

    return settings.smart_model


def calculate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    """
    Calculate cost dynamically using Groq pricing table.
    """

    # fallback if model not found
    model_pricing = GROQ_PRICING.get(model)

    if not model_pricing:
        # fallback to cheapest available model
        model_pricing = next(iter(GROQ_PRICING.values()))

    cost = (
        prompt_tokens / 1000 * model_pricing["input"]
        + completion_tokens / 1000 * model_pricing["output"]
    )

    return round(cost, 8)


import re

def extract_price(price_str: str) -> float:
    """
    Extract numeric price from string like:
    "$0.075 (13.3M / $1)*"
    """
    match = re.search(r"\$([0-9.]+)", price_str)
    if not match:
        return 0.0
    return float(match.group(1))  # price per 1M tokens


def build_pricing_map(table):
    pricing = {}

    for row in table:
        model_name = row["AI Model"]
        model = MODEL_NAME_MAP.get(model, model)

        input_price_per_million = extract_price(
            row["Input Token Price (Per Million Tokens)"]
        )
        output_price_per_million = extract_price(
            row["Output Token Price (Per Million Tokens)"]
        )

        # Convert → per 1K tokens
        pricing[model_name] = {
            "input": input_price_per_million / 1000,
            "output": output_price_per_million / 1000,
        }

    return pricing


MODEL_NAME_MAP = {
    settings.llama_3_1_8b_instant: "Llama 3.1 8B Instant 128k",
    settings.llama_3_3_70b_versatile: "Llama 3.3 70B Versatile 128k",
    settings.qwen_qwen3_32b: "Qwen 3 32B 131k",
    settings.meta_llama_llama_4_scout_17b_16e_instruct: "Llama 4 Scout (17Bx16E) 128k",
    settings.openai_gpt_oss_120b: "GPT OSS 120B 128k",
    settings.openai_gpt_oss_safeguard_20b: "GPT OSS Safeguard 20B"
}

# Build once globally
GROQ_PRICING = build_pricing_map(MODEL_PRICING_TABLE)
