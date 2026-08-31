from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from src.schemas.recipes import SourceReference


class FavoriteRestaurantPreference(BaseModel):
    restaurant_name: str = Field(min_length=1, max_length=100)
    menu_name: str = Field(min_length=1, max_length=100)
    rating: float = Field(ge=1, le=5)

    @field_validator("restaurant_name", "menu_name")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return value.strip()


class AssistantRecommendationRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    available_ingredients: list[str] = Field(default_factory=list, max_length=20)
    excluded_ingredients: list[str] = Field(default_factory=list, max_length=20)
    favorite_foods: list[str] = Field(default_factory=list, max_length=10)
    favorite_restaurants: list[FavoriteRestaurantPreference] = Field(
        default_factory=list,
        max_length=10,
    )
    recent_menus: list[str] = Field(default_factory=list, max_length=20)
    avoid_recent_days: int = Field(default=3, ge=1, le=30)
    spice_level: Literal["mild", "medium", "spicy"] = "medium"
    max_cooking_minutes: int | None = Field(default=None, ge=5, le=240)
    weather_recommendations: bool = True
    seasonal_recommendations: bool = True
    restaurant_history_recommendations: bool = True
    client_date: date | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    max_results: int = Field(default=5, ge=1, le=10)

    @field_validator("message")
    @classmethod
    def clean_message(cls, value: str) -> str:
        return value.strip()

    @field_validator(
        "available_ingredients",
        "excluded_ingredients",
        "favorite_foods",
        "recent_menus",
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
    def validate_coordinates(self) -> "AssistantRecommendationRequest":
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude와 longitude는 함께 제공해야 합니다.")
        return self


class AssistantRecipe(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    summary: str = Field(min_length=1, max_length=240)
    cooking_time_minutes: int = Field(ge=1, le=240)
    difficulty: Literal["쉬움", "보통", "어려움"]
    source_urls: list[str] = Field(default_factory=list, max_length=1)
    score: float = Field(ge=0, le=1)


class AssistantRecipeDrafts(BaseModel):
    recipes: list[AssistantRecipe]


class AssistantRecommendationResponse(BaseModel):
    recipes: list[AssistantRecipe]
    sources: list[SourceReference] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    retry_count: int = 0
    assistant_message: str
    context_used: list[str] = Field(default_factory=list)
    fallback_used: bool = False
