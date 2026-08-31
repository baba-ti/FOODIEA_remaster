import pytest

from src.config.settings import get_settings
from src.workflows.foodia.nodes.recipe_nodes import (
    build_search_query,
    route_after_verification,
    verify_recipes,
)


def test_route_finishes_when_recipe_is_verified() -> None:
    assert route_after_verification({"verified_recipes": [{"title": "테스트"}]}) == "format_result"


def test_route_finishes_empty_result_when_fast_mode_disables_retry() -> None:
    get_settings.cache_clear()
    assert route_after_verification({"verified_recipes": [], "retry_count": 0}) == "format_result"


@pytest.mark.asyncio
async def test_search_query_includes_user_food_preferences() -> None:
    result = await build_search_query(
        {
            "request": {
                "ingredients": ["오늘 저녁 메뉴 추천"],
                "preferences": [
                    '좋아하는 완전한 메뉴명: "돼지 국밥"',
                    "즐겨찾기 맛집 취향: 봄식당의 들기름 막국수 (5/5점)",
                ],
            }
        }
    )

    assert '좋아하는 완전한 메뉴명: "돼지 국밥"' in result["search_query"]
    assert "정확 구문으로 검색" in result["search_query"]
    assert "들기름 막국수" in result["search_query"]


@pytest.mark.asyncio
async def test_fast_verifier_accepts_recipe_with_allowed_source() -> None:
    get_settings.cache_clear()
    recipe_url = "https://www.10000recipe.com/recipe/123"
    result = await verify_recipes(
        {
            "request": {
                "request_text": "빠른 점심 추천",
                "excluded_ingredients": ["땅콩"],
                "max_cooking_minutes": 20,
            },
            "search_results": [{"title": "달걀볶음밥", "url": recipe_url, "content": ""}],
            "draft_recipes": [
                {
                    "title": "달걀볶음밥",
                    "summary": "빠른 한 끼",
                    "ingredients": [
                        {"name": "달걀", "amount": "2개", "is_available": False}
                    ],
                    "steps": ["재료를 익힌다."],
                    "cooking_time_minutes": 15,
                    "servings": 1,
                    "difficulty": "쉬움",
                    "source_urls": [recipe_url],
                    "score": 0.8,
                }
            ],
        }
    )

    assert len(result["verified_recipes"]) == 1
    assert result["validation_errors"] == []
