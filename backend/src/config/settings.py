from functools import lru_cache

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    cors_origins: str = "http://localhost:8081,http://localhost:19006"

    openai_api_key: SecretStr | None = None
    openai_vision_model: str = "gpt-4o-mini"
    openai_recipe_model: str = "gpt-4o-mini"
    openai_search_model: str = "gpt-5.6-luna"
    recipe_search_domain: str = "10000recipe.com"
    enable_llm_recipe_verification: bool = False

    max_image_bytes: int = Field(default=10 * 1024 * 1024, ge=1)
    recipe_max_retries: int = Field(default=0, ge=0, le=2)
    assistant_timeout_seconds: float = Field(default=8.0, ge=1, le=30)

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
