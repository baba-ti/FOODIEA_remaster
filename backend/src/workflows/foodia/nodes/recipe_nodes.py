import json

from langchain_core.messages import HumanMessage, SystemMessage

from src.config.settings import get_settings
from src.prompts.recipe import VERIFIER_SYSTEM_PROMPT
from src.schemas.recipes import (
    RecipeDrafts,
    RecipeSearchRequest,
    RecipeSearchResponse,
    RecipeVerification,
    SourceReference,
)
from src.services.llm_service import get_recipe_llm
from src.services.search_service import search_web_recipes
from src.utils.errors import ConfigurationError, WorkflowError
from src.workflows.foodia.state.recipe_state import RecipeState


async def build_search_query(state: RecipeState) -> dict:
    request = RecipeSearchRequest.model_validate(state["request"])
    parts = []
    if request.request_text:
        parts.append(f"{request.request_text} 관련 레시피 조리법")
    if request.ingredients:
        parts.append(f"보유 재료 {' '.join(request.ingredients)} 활용")
    if request.preferences:
        parts.append(
            "선호 조건(따옴표 안의 메뉴명은 분리하지 않고 정확 구문으로 검색): "
            + ", ".join(request.preferences)
        )
    if request.max_cooking_minutes:
        parts.append(f"{request.max_cooking_minutes}분 이내")
    if request.excluded_ingredients:
        parts.append(f"제외: {', '.join(request.excluded_ingredients)}")
    if request.excluded_source_urls:
        parts.append(
            "이미 제공한 레시피 URL 제외: "
            + ", ".join(request.excluded_source_urls)
        )
    if state.get("validation_errors"):
        parts.append(f"이전 검증 문제 보완: {'; '.join(state['validation_errors'][:3])}")
    return {"search_query": " ".join(parts)}


async def web_search(state: RecipeState) -> dict:
    request = RecipeSearchRequest.model_validate(state["request"])
    candidate_limit = min(max(request.max_results + 3, 6), 10)
    search_results, drafts = await search_web_recipes(
        state["search_query"],
        request=request,
        max_results=candidate_limit,
    )
    return {
        "search_results": search_results,
        "draft_recipes": [
            recipe.model_dump() for recipe in drafts.recipes[: request.max_results]
        ],
    }


def _search_context(state: RecipeState) -> str:
    return json.dumps(state["search_results"], ensure_ascii=False)


async def verify_recipes(state: RecipeState) -> dict:
    request = RecipeSearchRequest.model_validate(state["request"])
    allowed_urls = [item["url"] for item in state["search_results"]]
    settings = get_settings()

    if settings.enable_llm_recipe_verification:
        model = get_recipe_llm().with_structured_output(
            RecipeVerification,
            method="json_schema",
        )
        prompt = {
            "request": request.model_dump(),
            "allowed_source_urls": allowed_urls,
            "draft_recipes": state["draft_recipes"],
            "web_evidence": _search_context(state),
        }
        try:
            verification = await model.ainvoke(
                [
                    SystemMessage(content=VERIFIER_SYSTEM_PROMPT),
                    HumanMessage(content=json.dumps(prompt, ensure_ascii=False)),
                ]
            )
        except ConfigurationError:
            raise
        except Exception as exc:
            raise WorkflowError("AI 레시피 검증에 실패했습니다.") from exc
        candidate_recipes = verification.verified_recipes
        issues = list(verification.issues)
    else:
        candidate_recipes = RecipeDrafts.model_validate(
            {"recipes": state["draft_recipes"]}
        ).recipes
        issues = []

    allowed = set(allowed_urls)
    verified = []
    excluded = {item.casefold() for item in request.excluded_ingredients}
    for recipe in candidate_recipes:
        recipe.source_urls = [url for url in recipe.source_urls if url in allowed]
        recipe_text = " ".join(item.name for item in recipe.ingredients).casefold()
        blocked = [item for item in excluded if item in recipe_text]
        if not recipe.source_urls:
            issues.append(f"{recipe.title}: 유효한 웹 출처가 없습니다.")
        elif blocked:
            issues.append(f"{recipe.title}: 제외 재료가 포함되어 있습니다.")
        elif (
            request.max_cooking_minutes
            and recipe.cooking_time_minutes > request.max_cooking_minutes
        ):
            issues.append(f"{recipe.title}: 요청한 조리 시간을 초과합니다.")
        else:
            verified.append(recipe.model_dump())

    return {
        "verified_recipes": verified,
        "validation_errors": issues,
    }


async def prepare_retry(state: RecipeState) -> dict:
    return {"retry_count": state.get("retry_count", 0) + 1}


async def format_result(state: RecipeState) -> dict:
    source_map: dict[str, str] = {}
    for item in state["search_results"]:
        source_map[item["url"]] = item["title"]
    used_urls = {
        url
        for recipe in state.get("verified_recipes", [])
        for url in recipe.get("source_urls", [])
    }
    sources = [
        SourceReference(title=source_map[url], url=url)
        for url in used_urls
        if url in source_map
    ]
    response = RecipeSearchResponse(
        recipes=state.get("verified_recipes", []),
        sources=sources,
        warnings=state.get("validation_errors", []),
        retry_count=state.get("retry_count", 0),
    )
    return {"result": response.model_dump()}


def route_after_verification(state: RecipeState) -> str:
    if state.get("verified_recipes"):
        return "format_result"
    if state.get("retry_count", 0) < get_settings().recipe_max_retries:
        return "prepare_retry"
    return "format_result"
