from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

CheckpointKind = Literal[
    "concept-check",
    "problem",
    "multiple-choice",
    "true-false-why",
    "spot-the-error",
    "complete-the-step",
    "spaced-recall",
]

JourneyStatus = Literal["generating", "ready", "failed"]


class JourneyModuleSummary(BaseModel):
    """Compact per-module payload used in the journey overview response."""

    id: str
    ordinal: int
    title: str
    concept_labels: List[str] = Field(default_factory=list)
    has_extract: bool = False
    checkpoint_count: int = 0


class JourneyProgress(BaseModel):
    current_module_ordinal: int
    completed_module_ordinals: List[int] = Field(default_factory=list)
    last_activity_at: Optional[datetime] = None


class Journey(BaseModel):
    id: str
    plan_id: str
    title: str
    status: JourneyStatus
    module_count: int
    course_type: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    modules: List[JourneyModuleSummary] = Field(default_factory=list)
    progress: Optional[JourneyProgress] = None


class CheckpointChoice(BaseModel):
    id: str
    text: str


class Checkpoint(BaseModel):
    """Public checkpoint shape — never leaks `rubric` or `answer_key`."""

    id: str
    ordinal: int
    kind: CheckpointKind
    question: str
    choices: Optional[List[CheckpointChoice]] = None
    linked_concept_labels: List[str] = Field(default_factory=list)
    latest_attempt: Optional["AttemptResult"] = None


class ModuleDetail(BaseModel):
    id: str
    ordinal: int
    title: str
    concept_labels: List[str] = Field(default_factory=list)
    key_extract: Optional[str] = None
    source_labels: List[str] = Field(default_factory=list)
    checkpoints: List[Checkpoint] = Field(default_factory=list)
    is_spaced_recall_module: bool = False


class AttemptCreate(BaseModel):
    checkpoint_id: str
    answer: str = Field(min_length=1, max_length=5000)


class AttemptResult(BaseModel):
    id: str
    checkpoint_id: str
    score: float
    feedback: Optional[str] = None
    attempted_at: datetime


class CompleteModuleResponse(BaseModel):
    progress: JourneyProgress
    next_module_ordinal: Optional[int] = None
    journey_complete: bool = False


Checkpoint.model_rebuild()
