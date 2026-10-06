from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.features.plans.router import router as plans_router
from app.features.uploads.router import router as uploads_router
from app.features.generation.router import router as generation_router
from app.features.api_keys.router import router as api_keys_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)
log = logging.getLogger("study-tool.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if not settings.supabase_ready:
        log.warning(
            "Supabase env vars missing — the API will return 500 on protected routes "
            "until SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_JWT_SECRET are set."
        )
    if not settings.api_key_encryption_key:
        log.warning(
            "API_KEY_ENCRYPTION_KEY is unset — user API keys cannot be stored."
        )
    yield


app = FastAPI(
    title="Study tool API",
    version="0.1.0",
    description="Backend for the Dartmouth Study Companion.",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "supabase": settings.supabase_ready,
        "encryption": bool(settings.api_key_encryption_key),
    }


@app.exception_handler(Exception)
async def unhandled(request, exc):
    log.exception("unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(plans_router)
app.include_router(uploads_router)
app.include_router(generation_router)
app.include_router(api_keys_router)
