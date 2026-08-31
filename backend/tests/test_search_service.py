from types import SimpleNamespace

import pytest

from src.schemas.assistant import AssistantRecipeDrafts
from src.schemas.recipes import RecipeSearchRequest
from src.services import search_service
from src.services.search_service import (
    _extract_sources,
    _is_allowed_url,
    _is_assistant_source_url,
    _is_recipe_url,
)


def test_allowed_domain_accepts_domain_and_subdomain() -> None:
    assert _is_allowed_url("https://www.10000recipe.com/recipe/123", "10000recipe.com")
    assert _is_allowed_url("https://10000recipe.com/recipe/123", "10000recipe.com")


def test_allowed_domain_rejects_lookalike_domain() -> None:
    assert not _is_allowed_url("https://10000recipe.com.example.com/recipe/123", "10000recipe.com")


def test_recipe_url_accepts_only_recipe_detail_pages() -> None:
    assert _is_recipe_url("https://www.10000recipe.com/recipe/123", "10000recipe.com")
    assert not _is_recipe_url(
        "https://www.10000recipe.com/recipe/list.html?q=감자",
        "10000recipe.com",
    )
    assert not _is_recipe_url("https://www.10000recipe.com/profile/123", "10000recipe.com")


def test_assistant_source_accepts_recipe_search_but_rejects_external_url() -> None:
    assert _is_assistant_source_url(
        "https://www.10000recipe.com/recipe/list.html?q=감자",
        "10000recipe.com",
    )
    assert not _is_assistant_source_url(
        "https://example.com/recipe/list.html?q=감자",
        "10000recipe.com",
    )


def test_extract_sources_filters_and_deduplicates() -> None:
    payload = {
        "output": [
            {
                "action": {
                    "sources": [
                        {"title": "감자 요리", "url": "https://www.10000recipe.com/recipe/1"},
                        {"title": "외부 결과", "url": "https://example.com/recipe/2"},
                    ]
                }
            },
            {"url": "https://www.10000recipe.com/recipe/1", "title": "중복 결과"},
        ]
    }

    assert _extract_sources(payload, "10000recipe.com") == [
        {"title": "감자 요리", "url": "https://www.10000recipe.com/recipe/1"}
    ]


@pytest.mark.asyncio
async def test_assistant_search_uses_one_web_call_and_compact_schema(monkeypatch) -> None:
    recipe_url = "https://www.10000recipe.com/recipe/123"
    captured: dict = {}

    class FakeResponses:
        async def parse(self, **kwargs):
            captured.update(kwargs)
            drafts = AssistantRecipeDrafts.model_validate(
                {
                    "recipes": [
                        {
                            "title": "감자볶음",
                            "summary": "빠르게 만들기 좋은 메뉴",
                            "cooking_time_minutes": 15,
                            "difficulty": "쉬움",
                            "source_urls": [recipe_url],
                            "score": 0.9,
                        }
                    ]
                }
            )
            return SimpleNamespace(
                output_parsed=drafts,
                model_dump=lambda **kwargs: {
                    "output": [{"url": recipe_url, "title": "감자볶음"}]
                },
            )

    monkeypatch.setattr(
        search_service,
        "get_search_client",
        lambda: SimpleNamespace(responses=FakeResponses()),
    )

    sources, drafts = await search_service.search_assistant_recipes(
        "감자 요리",
        RecipeSearchRequest(ingredients=["감자"], max_results=3),
    )

    assert captured["max_tool_calls"] == 1
    assert captured["parallel_tool_calls"] is False
    assert captured["reasoning"] == {"effort": "none"}
    assert captured["text"] == {"verbosity": "low"}
    assert captured["text_format"] is AssistantRecipeDrafts
    assert drafts.recipes[0].source_urls == [recipe_url]
    assert sources == [{"title": "감자볶음", "url": recipe_url}]
