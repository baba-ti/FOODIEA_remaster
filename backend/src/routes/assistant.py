import asyncio

from fastapi import APIRouter, HTTPException, status

from src.config.settings import get_settings
from src.schemas.assistant import AssistantRecommendationRequest, AssistantRecommendationResponse
from src.utils.errors import ConfigurationError, WorkflowError
from src.workflows.foodia.assistant_graph import get_assistant_graph
from src.workflows.foodia.nodes.assistant_nodes import build_fallback_response


router = APIRouter(prefix="/assistant", tags=["assistant"])


@router.post("/recommend", response_model=AssistantRecommendationResponse)
async def recommend_food(
    request: AssistantRecommendationRequest,
) -> AssistantRecommendationResponse:
    try:
        result = await asyncio.wait_for(
            get_assistant_graph().ainvoke(
                {"request": request.model_dump(mode="json")},
                {"recursion_limit": 20},
            ),
            timeout=get_settings().assistant_timeout_seconds,
        )
        return AssistantRecommendationResponse.model_validate(result["result"])
    except TimeoutError:
        return build_fallback_response(request, reason="timeout")
    except ConfigurationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except WorkflowError:
        return build_fallback_response(request, reason="search_error")
