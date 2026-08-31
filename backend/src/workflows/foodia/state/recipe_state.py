from typing_extensions import TypedDict


class RecipeState(TypedDict, total=False):
    request: dict
    search_query: str
    search_results: list[dict[str, str]]
    draft_recipes: list[dict]
    verified_recipes: list[dict]
    validation_errors: list[str]
    retry_count: int
    result: dict
