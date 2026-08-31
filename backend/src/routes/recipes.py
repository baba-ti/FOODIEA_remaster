from fastapi import APIRouter, HTTPException, status

from src.schemas.recipes import RecipeSearchRequest, RecipeSearchResponse
from src.utils.errors import ConfigurationError, WorkflowError
from src.workflows.foodia.recipe_graph import get_recipe_graph


router = APIRouter(prefix="/recipes", tags=["recipes"])


@router.post("/search", response_model=RecipeSearchResponse)
async def search_recipes(request: RecipeSearchRequest) -> RecipeSearchResponse:
    try:
        result = await get_recipe_graph().ainvoke(
            {
                "request": request.model_dump(),
                "retry_count": 0,
                "validation_errors": [],
            },
            {"recursion_limit": 12},
        )
        return RecipeSearchResponse.model_validate(result["result"])
    except ConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except WorkflowError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
