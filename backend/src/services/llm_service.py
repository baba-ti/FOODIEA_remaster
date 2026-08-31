from functools import lru_cache

from langchain_openai import ChatOpenAI

from src.config.settings import get_settings
from src.utils.errors import ConfigurationError


def _api_key() -> str:
    key = get_settings().openai_api_key
    if key is None or not key.get_secret_value().strip():
        raise ConfigurationError("OPENAI_API_KEY가 설정되지 않았습니다.")
    return key.get_secret_value()


@lru_cache
def get_vision_llm() -> ChatOpenAI:
    settings = get_settings()
    return ChatOpenAI(
        model=settings.openai_vision_model,
        api_key=_api_key(),
        temperature=0,
        timeout=45,
        max_retries=1,
    )


@lru_cache
def get_recipe_llm() -> ChatOpenAI:
    settings = get_settings()
    return ChatOpenAI(
        model=settings.openai_recipe_model,
        api_key=_api_key(),
        temperature=0.2,
        timeout=45,
        max_retries=1,
    )
