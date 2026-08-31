import asyncio
from datetime import date

import pytest

from src.schemas.assistant import AssistantRecommendationRequest
from src.routes import assistant as assistant_route
from src.workflows.foodia.nodes.assistant_nodes import (
    build_assistant_context,
    build_fallback_response,
)


@pytest.mark.asyncio
async def test_assistant_context_combines_frontend_profile() -> None:
    result = await build_assistant_context(
        {
            "request": {
                "message": "오늘 저녁 메뉴 추천해줘",
                "excluded_ingredients": ["땅콩"],
                "favorite_foods": ["돼지 국밥"],
                "recent_menus": ["김치찌개"],
                "avoid_recent_days": 7,
                "favorite_restaurants": [
                    {
                        "restaurant_name": "봄식당",
                        "menu_name": "들기름 막국수",
                        "rating": 5,
                    }
                ],
                "client_date": date(2026, 8, 25).isoformat(),
                "weather_recommendations": False,
            }
        }
    )

    recipe_request = result["recipe_request"]
    assert recipe_request["request_text"] == "오늘 저녁 메뉴 추천해줘"
    assert recipe_request["excluded_ingredients"] == ["땅콩"]
    assert '좋아하는 완전한 메뉴명: "돼지 국밥"' in recipe_request["preferences"]
    assert any("최근 7일" in item and '"김치찌개"' in item for item in recipe_request["preferences"])
    assert any("들기름 막국수" in item for item in recipe_request["preferences"])
    assert "날짜·계절" in result["context_used"]
    assert "최근 먹은 메뉴 제외" in result["context_used"]


def test_timeout_fallback_returns_compact_search_links() -> None:
    response = build_fallback_response(
        AssistantRecommendationRequest(
            message="점심 메뉴 추천",
            favorite_foods=["돼지 국밥"],
            recent_menus=["김치찌개"],
            max_cooking_minutes=20,
            max_results=3,
        )
    )

    assert response.fallback_used is True
    assert response.recipes[0].title == "돼지 국밥"
    assert response.recipes[0].cooking_time_minutes == 20
    assert "/recipe/list.html?q=" in response.recipes[0].source_urls[0]
    assert response.recipes[0].model_dump().keys() == {
        "title",
        "summary",
        "cooking_time_minutes",
        "difficulty",
        "source_urls",
        "score",
    }


@pytest.mark.asyncio
async def test_assistant_route_returns_fallback_after_timeout(monkeypatch) -> None:
    class SlowGraph:
        async def ainvoke(self, *args, **kwargs):
            await asyncio.sleep(0.05)
            return {}

    monkeypatch.setattr(assistant_route, "get_assistant_graph", lambda: SlowGraph())
    monkeypatch.setattr(
        assistant_route.get_settings(),
        "assistant_timeout_seconds",
        0.01,
    )

    response = await assistant_route.recommend_food(
        AssistantRecommendationRequest(message="저녁 추천", max_results=3)
    )

    assert response.fallback_used is True
    assert response.warnings
