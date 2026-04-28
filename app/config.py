from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str = "sk-placeholder"
    redis_url: str = "redis://localhost:6379"
    database_url: str = "sqlite:///./llm-gateway.db"
    groq_api_key: str = "groq-placeholder"

    cache_similarity_threshold: float = 0.92
    embedding_model: str = "text-embedding-3-small"

    cheap_model: str = "llama-3.1-8b-instant"
    smart_model: str = "llama-3.3-70b-versatile"
    llama_3_1_8b_instant: str = "llama-3.1-8b-instant"
    llama_3_3_70b_versatile: str = "llama-3.3-70b-versatile"
    qwen_qwen3_32b: str = "qwen/qwen3-32b"
    meta_llama_llama_4_scout_17b_16e_instruct: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    openai_gpt_oss_120b: str = "openai/gpt-oss-120b"
    openai_gpt_oss_20b: str = "openai/gpt-oss-20b"
    openai_gpt_oss_safeguard_20b: str = "openai/gpt-oss-safeguard-20b"


    # Pricing per 1k tokens (as of 2024)
    cheap_model_price_per_1k_input: float = 0.00015
    cheap_model_price_per_1k_output: float = 0.0006
    smart_model_price_per_1k_input: float = 0.0025
    smart_model_price_per_1k_output: float = 0.01

    class Config:
        env_file = ".env"


settings = Settings()
