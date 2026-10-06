from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class PlanCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    course_code: Optional[str] = Field(default=None, max_length=40)
    description: Optional[str] = Field(default=None, max_length=2000)


class Plan(BaseModel):
    id: str
    user_id: str
    title: str
    course_code: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    upload_count: int = 0
    extracted_chunk_count: int = 0
    generation_count: int = 0
