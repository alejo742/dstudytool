from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ApiKeySet(BaseModel):
    key: str = Field(min_length=10, max_length=400)


class ApiKeyStatus(BaseModel):
    configured: bool
    last_verified_at: Optional[datetime] = None
    masked_hint: Optional[str] = None
