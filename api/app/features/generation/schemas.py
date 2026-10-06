from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

GenerationKind = Literal["problem", "concept-check", "walkthrough", "mixed"]


class GenerationRequest(BaseModel):
    kind: GenerationKind = "mixed"
    hint: Optional[str] = Field(default=None, max_length=200)


class Generation(BaseModel):
    id: str
    plan_id: str
    kind: str
    prompt_tag: Optional[str] = None
    content: str
    sources: List[str] = Field(default_factory=list)
    created_at: datetime
