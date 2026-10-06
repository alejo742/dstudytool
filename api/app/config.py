from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env.local", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Supabase
    supabase_url: str = Field(default="")
    supabase_publishable_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")
    supabase_jwt_secret: str = Field(default="")

    # Web
    web_origins: str = Field(default="http://localhost:5173")

    # Encryption for user-provided API keys at rest
    api_key_encryption_key: str = Field(default="")

    # Dartmouth AI defaults
    dartmouth_default_model: str = Field(
        default="openai.gpt-4.1-mini-2025-04-14",
    )

    # Access restriction
    allowed_email_domain: str = Field(default="dartmouth.edu")

    # Storage
    local_storage_root: str = Field(default="./.data/uploads")

    @field_validator("local_storage_root")
    @classmethod
    def _ensure_storage(cls, v: str) -> str:
        Path(v).mkdir(parents=True, exist_ok=True)
        return v

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.web_origins.split(",") if o.strip()]

    @property
    def supabase_ready(self) -> bool:
        return bool(
            self.supabase_url
            and self.supabase_service_role_key
            and self.supabase_jwt_secret
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
