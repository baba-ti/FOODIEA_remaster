from fastapi import APIRouter

from src.config.settings import get_settings


router = APIRouter(tags=["system"])


@router.get("/health")
async def health() -> dict[str, str]:
    settings = get_settings()
    return {"status": "ok", "environment": settings.app_env}
