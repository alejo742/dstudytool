from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel

UploadStatus = Literal["pending", "extracting", "ready", "failed"]


class Upload(BaseModel):
    id: str
    plan_id: str
    filename: str
    mime_type: str
    size_bytes: int
    status: UploadStatus
    pages: Optional[int] = None
    chars_extracted: Optional[int] = None
    error: Optional[str] = None
    created_at: datetime
