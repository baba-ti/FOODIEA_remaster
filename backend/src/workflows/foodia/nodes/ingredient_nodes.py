from langchain_core.messages import HumanMessage, SystemMessage

from src.prompts.ingredient import INGREDIENT_SYSTEM_PROMPT
from src.schemas.ingredients import DetectedIngredient, IngredientAnalysisResponse, IngredientDetection
from src.services.llm_service import get_vision_llm
from src.utils.errors import ConfigurationError, WorkflowError
from src.workflows.foodia.state.ingredient_state import IngredientState


async def detect_ingredients(state: IngredientState) -> dict:
    image_url = f"data:{state['media_type']};base64,{state['image_base64']}"
    model = get_vision_llm().with_structured_output(IngredientDetection, method="json_schema")
    try:
        detection = await model.ainvoke(
            [
                SystemMessage(content=INGREDIENT_SYSTEM_PROMPT),
                HumanMessage(
                    content=[
                        {"type": "text", "text": "이 이미지에서 식재료를 분석해줘."},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ]
                ),
            ]
        )
    except ConfigurationError:
        raise
    except Exception as exc:
        raise WorkflowError("AI 이미지 재료 분석에 실패했습니다.") from exc
    return {"detection": detection.model_dump()}


async def normalize_ingredients(state: IngredientState) -> dict:
    detection = IngredientDetection.model_validate(state["detection"])
    unique: dict[str, DetectedIngredient] = {}
    for ingredient in detection.ingredients:
        normalized_name = ingredient.name.strip()
        key = normalized_name.casefold()
        if not normalized_name:
            continue
        ingredient.name = normalized_name
        current = unique.get(key)
        if current is None or ingredient.confidence > current.confidence:
            unique[key] = ingredient

    response = IngredientAnalysisResponse(
        ingredients=list(unique.values()),
        summary=detection.summary,
        warnings=detection.warnings,
        requires_user_confirmation=True,
    )
    return {"result": response.model_dump()}
