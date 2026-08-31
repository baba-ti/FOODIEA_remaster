import pytest
from pydantic import ValidationError

from src.schemas.recipes import RecipeSearchRequest


def test_recipe_request_normalizes_duplicate_ingredients() -> None:
    request = RecipeSearchRequest(ingredients=[" 달걀 ", "달걀", "양파"])
    assert request.ingredients == ["달걀", "양파"]


def test_recipe_request_rejects_blank_ingredients() -> None:
    with pytest.raises(ValidationError):
        RecipeSearchRequest(ingredients=["  "])


def test_recipe_request_supports_more_results_and_source_exclusions() -> None:
    request = RecipeSearchRequest(
        ingredients=["감자"],
        excluded_source_urls=[
            " https://www.10000recipe.com/recipe/1 ",
            "https://www.10000recipe.com/recipe/1",
        ],
        max_results=8,
    )
    assert request.max_results == 8
    assert request.excluded_source_urls == [
        "https://www.10000recipe.com/recipe/1"
    ]
