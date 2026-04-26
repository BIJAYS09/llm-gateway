from pydantic import BaseModel, Field
from typing import Literal

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ProxiedRequest(BaseModel):
    model: str
    messages: list[Message]
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=1000, gt=0)
    stream: bool = False