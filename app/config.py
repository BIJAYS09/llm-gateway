from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = "sk-placeholder"
    redis_url: str = "redis://localhost:6379"
    database_url: str = "sqlite:///./prism.db"

    cache_similarity_threshold: float = 0.92
    embedding_model: str = "text-embedding-3-small"

    cheap_model: str = "gpt-4o-mini"
    smart_model: str = "gpt-4o"

    # Pricing per 1k tokens (as of 2024)
    cheap_model_price_per_1k_input: float = 0.00015
    cheap_model_price_per_1k_output: float = 0.0006
    smart_model_price_per_1k_input: float = 0.0025
    smart_model_price_per_1k_output: float = 0.01

    class Config:
        env_file = ".env"


settings = Settings()
