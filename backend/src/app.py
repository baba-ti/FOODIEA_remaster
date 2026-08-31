from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import get_settings
from src.routes.assistant import router as assistant_router
from src.routes.health import router as health_router
from src.routes.ingredients import router as ingredients_router
from src.routes.recipes import router as recipes_router


settings = get_settings()

app = FastAPI(
    title="Foodia AI API",
    description="개인 취향·날씨·날짜를 반영하는 음식 AI 비서 API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(assistant_router, prefix="/api/v1")
app.include_router(ingredients_router, prefix="/api/v1")
app.include_router(recipes_router, prefix="/api/v1")
