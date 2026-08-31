from datetime import date
from urllib.parse import quote_plus

from src.config.settings import get_settings
from src.schemas.assistant import (
    AssistantRecipe,
    AssistantRecommendationRequest,
    AssistantRecommendationResponse,
)
from src.schemas.recipes import RecipeSearchRequest, SourceReference
from src.services.search_service import search_assistant_recipes
from src.services.weather_service import get_current_weather
from src.workflows.foodia.nodes.recipe_nodes import build_search_query
from src.workflows.foodia.state.assistant_state import AssistantState


def _season_for_month(month: int) -> str:
    if month in (3, 4, 5):
        return "봄"
    if month in (6, 7, 8):
        return "여름"
    if month in (9, 10, 11):
        return "가을"
    return "겨울"


async def build_assistant_context(state: AssistantState) -> dict:
    request = AssistantRecommendationRequest.model_validate(state["request"])
    context_used: list[str] = []
    preferences: list[str] = []

    for food in request.favorite_foods[:5]:
        preferences.append(f'좋아하는 완전한 메뉴명: "{food}"')
    if request.favorite_foods:
        context_used.append("좋아하는 음식")

    if request.restaurant_history_recommendations:
        for item in request.favorite_restaurants[:5]:
            preferences.append(
                f"즐겨찾기 맛집 취향: {item.restaurant_name}의 {item.menu_name} "
                f"({item.rating}/5점)"
            )
        if request.favorite_restaurants:
            context_used.append("즐겨찾기 맛집")

    if request.recent_menus:
        recent_menu_names = ", ".join(f'"{menu}"' for menu in request.recent_menus[:10])
        preferences.append(
            f"최근 {request.avoid_recent_days}일 내 먹은 완전한 메뉴명(추천 제외): "
            f"{recent_menu_names}"
        )
        context_used.append("최근 먹은 메뉴 제외")

    preferences.append(f"매운맛 선호: {request.spice_level}")
    context_used.append("매운맛 선호")

    if request.seasonal_recommendations:
        current_date = request.client_date or date.today()
        preferences.append(
            f"날짜와 계절: {current_date.isoformat()}, {_season_for_month(current_date.month)}"
        )
        context_used.append("날짜·계절")

    if (
        request.weather_recommendations
        and request.latitude is not None
        and request.longitude is not None
    ):
        weather = await get_current_weather(request.latitude, request.longitude)
        if weather:
            preferences.append(f"현재 날씨: {weather}")
            context_used.append("현재 날씨")

    recipe_request = RecipeSearchRequest(
        request_text=request.message,
        ingredients=request.available_ingredients,
        excluded_ingredients=request.excluded_ingredients,
        preferences=preferences[:15],
        max_cooking_minutes=request.max_cooking_minutes,
        max_results=request.max_results,
    )
    return {
        "recipe_request": recipe_request.model_dump(),
        "context_used": context_used,
    }


async def run_recipe_agent(state: AssistantState) -> dict:
    request = RecipeSearchRequest.model_validate(state["recipe_request"])
    query_result = await build_search_query({"request": request.model_dump()})
    sources, drafts = await search_assistant_recipes(
        query_result["search_query"],
        request,
    )
    assistant_request = AssistantRecommendationRequest.model_validate(state["request"])
    excluded = {item.casefold() for item in assistant_request.excluded_ingredients}
    recent = {item.casefold() for item in assistant_request.recent_menus}
    source_map = {item["url"]: item["title"] for item in sources}
    verified_recipes: list[AssistantRecipe] = []
    warnings: list[str] = []

    for recipe in drafts.recipes:
        searchable_text = f"{recipe.title} {recipe.summary}".casefold()
        if any(item in searchable_text for item in excluded):
            warnings.append(f"{recipe.title}: 제외 재료가 확인되어 제외했습니다.")
            continue
        if recipe.title.casefold() in recent:
            warnings.append(f"{recipe.title}: 최근에 먹은 메뉴라 제외했습니다.")
            continue
        if request.max_cooking_minutes and recipe.cooking_time_minutes > request.max_cooking_minutes:
            warnings.append(f"{recipe.title}: 요청한 조리 시간을 초과해 제외했습니다.")
            continue
        if not recipe.source_urls or recipe.source_urls[0] not in source_map:
            warnings.append(f"{recipe.title}: 유효한 상세 레시피 링크가 없어 제외했습니다.")
            continue
        verified_recipes.append(recipe)

    used_urls = {
        recipe.source_urls[0]
        for recipe in verified_recipes
        if recipe.source_urls
    }
    return {
        "recipe_result": {
            "recipes": [recipe.model_dump() for recipe in verified_recipes],
            "sources": [
                {"title": source_map[url], "url": url}
                for url in used_urls
            ],
            "warnings": warnings,
            "retry_count": 0,
            "fallback_used": False,
        }
    }


async def format_assistant_result(state: AssistantState) -> dict:
    recipe_result = state["recipe_result"]
    count = len(recipe_result.get("recipes", []))
    context_used = state.get("context_used", [])
    if count and context_used:
        message = f"{', '.join(context_used)}을 반영해 {count}개의 메뉴를 추천했어요."
    elif count:
        message = f"요청에 맞는 {count}개의 메뉴를 추천했어요."
    else:
        message = "조건에 맞는 검증된 레시피를 찾지 못했어요. 요청을 조금 바꿔 주세요."
    response = AssistantRecommendationResponse(
        **recipe_result,
        assistant_message=message,
        context_used=context_used,
    )
    return {"result": response.model_dump()}


def build_fallback_response(
    request: AssistantRecommendationRequest,
    reason: str = "timeout",
) -> AssistantRecommendationResponse:
    candidates: list[str] = []

    candidates.extend(request.favorite_foods)
    if request.restaurant_history_recommendations:
        candidates.extend(item.menu_name for item in request.favorite_restaurants)
    if request.available_ingredients:
        candidates.append(f"{' '.join(request.available_ingredients[:3])} 요리")
    candidates.append(request.message)

    recent = {item.casefold() for item in request.recent_menus}
    excluded = {item.casefold() for item in request.excluded_ingredients}
    unique_queries: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        query = candidate.strip()
        key = query.casefold()
        if not query or key in seen or key in recent:
            continue
        if any(item in key for item in excluded):
            continue
        seen.add(key)
        unique_queries.append(query)
        if len(unique_queries) >= request.max_results:
            break

    if not unique_queries:
        unique_queries = ["간단한 집밥"]

    cooking_minutes = request.max_cooking_minutes or 30
    recipes: list[AssistantRecipe] = []
    sources: list[SourceReference] = []
    for index, query in enumerate(unique_queries):
        url = (
            f"https://www.{get_settings().recipe_search_domain}/recipe/list.html"
            f"?q={quote_plus(query)}"
        )
        recipes.append(
            AssistantRecipe(
                title=query,
                summary="실시간 상세 검색이 지연되어 관련 레시피 검색 결과로 연결합니다.",
                cooking_time_minutes=cooking_minutes,
                difficulty="보통",
                source_urls=[url],
                score=max(0.5, 0.65 - index * 0.05),
            )
        )
        sources.append(SourceReference(title=f"{query} 검색 결과", url=url))

    warning = (
        "8초 안에 상세 레시피 검색이 끝나지 않아 검색 결과 링크를 제공했습니다."
        if reason == "timeout"
        else "상세 레시피 검색 중 오류가 발생해 검색 결과 링크를 제공했습니다."
    )
    return AssistantRecommendationResponse(
        recipes=recipes,
        sources=sources,
        warnings=[warning],
        assistant_message=(
            "검색이 조금 지연되고 있어요. 우선 조건에 맞춘 만개의레시피 검색 결과를 준비했어요."
        ),
        context_used=["사용자 요청", "저장된 추천 기준"],
        fallback_used=True,
    )
