from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class RecipeSearchRequest(BaseModel):
    request_text: str | None = Field(default=None, max_length=500)
    ingredients: list[str] = Field(default_factory=list, max_length=20)
    excluded_ingredients: list[str] = Field(default_factory=list, max_length=20)
    excluded_source_urls: list[str] = Field(default_factory=list, max_length=50)
    preferences: list[str] = Field(default_factory=list, max_length=15)
    servings: int = Field(default=2, ge=1, le=12)
    max_cooking_minutes: int | None = Field(default=None, ge=5, le=240)
    max_results: int = Field(default=8, ge=1, le=10)

    @field_validator(
        "ingredients",
        "excluded_ingredients",
        "excluded_source_urls",
        "preferences",
    )
    @classmethod
    def clean_text_list(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        seen: set[str] = set()
        for value in values:
            item = value.strip()
            key = item.casefold()
            if item and key not in seen:
                seen.add(key)
                cleaned.append(item)
        return cleaned

    @model_validator(mode="after")
    def require_at_least_one_ingredient(self) -> "RecipeSearchRequest":
        if self.request_text is not None:
            self.request_text = self.request_text.strip() or None
        if not self.ingredients and not self.request_text:
            raise ValueError("ingredients 또는 request_text가 필요합니다.")
        return self


class RecipeIngredient(BaseModel):
    name: str
    amount: str
    is_available: bool


class Recipe(BaseModel):
    title: str
    summary: str
    ingredients: list[RecipeIngredient]
    steps: list[str] = Field(min_length=1)
    cooking_time_minutes: int = Field(ge=1, le=1440)
    servings: int = Field(ge=1, le=50)
    difficulty: Literal["쉬움", "보통", "어려움"]
    matched_ingredients: list[str] = Field(default_factory=list)
    missing_ingredients: list[str] = Field(default_factory=list)
    source_urls: list[str] = Field(default_factory=list)
    safety_notes: list[str] = Field(default_factory=list)
    score: float = Field(ge=0, le=1)


class RecipeDrafts(BaseModel):
    recipes: list[Recipe]


class RecipeVerification(BaseModel):
    is_valid: bool
    issues: list[str] = Field(default_factory=list)
    verified_recipes: list[Recipe] = Field(default_factory=list)


class SourceReference(BaseModel):
    title: str
    url: str


class RecipeSearchResponse(BaseModel):
    recipes: list[Recipe]
    sources: list[SourceReference]
    warnings: list[str] = Field(default_factory=list)
    retry_count: int = 0
