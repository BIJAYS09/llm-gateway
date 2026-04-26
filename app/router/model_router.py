from pydantic import BaseModel

CHEAP_MODEL = "gpt-4o-mini"    # ~$0.15 / 1M tokens
SMART_MODEL  = "gpt-4o"        # ~$2.50 / 1M tokens

CHEAP_TRIGGERS = ["summarize", "translate", "list", "what is", "define"]

def route_model(request: ProxiedRequest) -> str:
    user_msg = next(m.content.lower() for m in request.messages if m.role == "user")
    # Force cheap model if the request is explicitly cheap
    if request.model == CHEAP_MODEL:
        return CHEAP_MODEL
    if any(trigger in user_msg for trigger in CHEAP_TRIGGERS):
        return CHEAP_MODEL
    if len(user_msg) < 200:           # short query = simple
        return CHEAP_MODEL
    return SMART_MODEL