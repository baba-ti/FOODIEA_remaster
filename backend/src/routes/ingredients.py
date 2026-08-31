from fastapi import APIRouter, File, HTTPException, UploadFile, status

from src.config.settings import get_settings
from src.schemas.ingredients import IngredientAnalysisResponse
from src.services.image_service import encode_image
from src.utils.errors import ConfigurationError, WorkflowError
from src.workflows.foodia.ingredient_graph import get_ingredient_graph


router = APIRouter(prefix="/ingredients", tags=["ingredients"])


@router.post("/analyze", response_model=IngredientAnalysisResponse)
async def analyze_ingredients(image: UploadFile = File(...)) -> IngredientAnalysisResponse:
    settings = get_settings()
    try:
        encoded = await encode_image(image, settings.max_image_bytes)
        result = await get_ingredient_graph().ainvoke(
            {
                "image_base64": encoded.base64_data,
                "media_type": encoded.media_type,
                "filename": image.filename,
            }
        )
        return IngredientAnalysisResponse.model_validate(result["result"])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except ConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except WorkflowError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
