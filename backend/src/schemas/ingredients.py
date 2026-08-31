from pydantic import BaseModel, Field


class DetectedIngredient(BaseModel):
    name: str = Field(min_length=1, description="한국어 표준 재료명")
    quantity_hint: str | None = Field(default=None, description="사진에서 추정한 수량")
    confidence: float = Field(ge=0, le=1)
    needs_review: bool = False
    evidence: str | None = Field(default=None, description="인식 근거 또는 불확실한 이유")


class IngredientDetection(BaseModel):
    ingredients: list[DetectedIngredient]
    summary: str
    warnings: list[str] = Field(default_factory=list)


class IngredientAnalysisResponse(IngredientDetection):
    requires_user_confirmation: bool = True
