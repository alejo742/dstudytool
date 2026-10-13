from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.core.auth import CurrentUser, UserDep
from app.features.journeys import repository as repo, service
from app.features.journeys.schemas import (
    AttemptCreate,
    AttemptResult,
    Checkpoint,
    CheckpointChoice,
    CompleteModuleResponse,
    Journey,
    JourneyModuleSummary,
    JourneyProgress,
    ModuleDetail,
)
from app.features.plans import repository as plans_repo

router = APIRouter(tags=["journeys"])


# -------------------- create / get journey --------------------

@router.post(
    "/plans/{plan_id}/journey",
    response_model=Journey,
    status_code=status.HTTP_201_CREATED,
)
def create_journey(
    plan_id: str,
    user: CurrentUser = UserDep,
) -> Journey:
    plan = plans_repo.get_for_user(user.id, plan_id)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")

    journey_row = service.create_journey_for_plan(
        user_id=user.id,
        plan_id=plan_id,
    )
    return _serialize_journey(user_id=user.id, journey=journey_row)


@router.get("/journeys/{journey_id}", response_model=Journey)
def get_journey(journey_id: str, user: CurrentUser = UserDep) -> Journey:
    journey = repo.get_journey(journey_id=journey_id, user_id=user.id)
    if not journey:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Journey not found")
    return _serialize_journey(user_id=user.id, journey=journey)


# -------------------- module content --------------------

@router.get(
    "/journeys/{journey_id}/modules/{ordinal}",
    response_model=ModuleDetail,
)
def get_module(
    journey_id: str,
    ordinal: int,
    user: CurrentUser = UserDep,
) -> ModuleDetail:
    journey = repo.get_journey(journey_id=journey_id, user_id=user.id)
    if not journey:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Journey not found")
    if journey.get("status") != "ready":
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            detail=f"Journey is {journey.get('status')}; modules not available yet.",
        )

    module = service.ensure_module_ready(
        user_id=user.id, journey=journey, module_ordinal=ordinal
    )
    repo.touch_progress(user_id=user.id, journey_id=journey_id)

    checkpoints = repo.list_checkpoints(user_id=user.id, module_id=module["id"])
    latest = repo.latest_attempts_for_checkpoints(
        user_id=user.id, checkpoint_ids=[c["id"] for c in checkpoints]
    )

    public_checkpoints = [
        Checkpoint(
            id=c["id"],
            ordinal=c["ordinal"],
            kind=c["kind"],
            question=c["question"],
            choices=_choices_from(c.get("choices")),
            linked_concept_labels=c.get("linked_concept_labels") or [],
            latest_attempt=_attempt_from(latest.get(c["id"])),
        )
        for c in checkpoints
    ]

    source_labels = _source_labels_for_module(
        user_id=user.id, source_chunk_ids=module.get("source_chunk_ids") or []
    )

    return ModuleDetail(
        id=module["id"],
        ordinal=module["ordinal"],
        title=module["title"],
        concept_labels=module.get("concept_labels") or [],
        key_extract=module.get("key_extract"),
        source_labels=source_labels,
        checkpoints=public_checkpoints,
        is_spaced_recall_module=any(c["kind"] == "spaced-recall" for c in checkpoints),
    )


# -------------------- attempts --------------------

@router.post(
    "/journeys/{journey_id}/modules/{ordinal}/attempts",
    response_model=AttemptResult,
    status_code=status.HTTP_201_CREATED,
)
def submit_attempt(
    journey_id: str,
    ordinal: int,
    body: AttemptCreate,
    user: CurrentUser = UserDep,
) -> AttemptResult:
    journey = repo.get_journey(journey_id=journey_id, user_id=user.id)
    if not journey:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Journey not found")

    # Validate checkpoint belongs to the specified module (defense in depth).
    cp = repo.get_checkpoint(user_id=user.id, checkpoint_id=body.checkpoint_id)
    if not cp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Checkpoint not found")
    module = repo.get_module(
        user_id=user.id, journey_id=journey_id, ordinal=ordinal
    )
    if not module or module["id"] != cp["module_id"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Checkpoint does not belong to this module")

    attempt = service.grade_attempt(
        user_id=user.id, checkpoint_id=body.checkpoint_id, answer=body.answer
    )
    repo.touch_progress(user_id=user.id, journey_id=journey_id)
    return _attempt_from(attempt)  # type: ignore[return-value]


# -------------------- progress --------------------

@router.post(
    "/journeys/{journey_id}/modules/{ordinal}/complete",
    response_model=CompleteModuleResponse,
)
def complete_module(
    journey_id: str,
    ordinal: int,
    user: CurrentUser = UserDep,
) -> CompleteModuleResponse:
    journey = repo.get_journey(journey_id=journey_id, user_id=user.id)
    if not journey:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Journey not found")
    result = service.complete_module(
        user_id=user.id, journey=journey, module_ordinal=ordinal
    )
    return CompleteModuleResponse(
        progress=_progress_from(result["progress"]),
        next_module_ordinal=result["next_module_ordinal"],
        journey_complete=result["journey_complete"],
    )


# ============================================================
# Serialization helpers
# ============================================================

def _serialize_journey(*, user_id: str, journey: dict) -> Journey:
    modules = repo.list_modules(user_id=user_id, journey_id=journey["id"])
    counts = repo.count_checkpoints_per_module(
        user_id=user_id, module_ids=[m["id"] for m in modules]
    )
    summaries = [
        JourneyModuleSummary(
            id=m["id"],
            ordinal=m["ordinal"],
            title=m["title"],
            concept_labels=m.get("concept_labels") or [],
            has_extract=bool(m.get("key_extract")),
            checkpoint_count=counts.get(m["id"], 0),
        )
        for m in modules
    ]
    progress = repo.get_progress(user_id=user_id, journey_id=journey["id"])
    return Journey(
        id=journey["id"],
        plan_id=journey["plan_id"],
        course_type=journey.get("course_type"),
        title=journey["title"],
        status=journey["status"],
        module_count=journey.get("module_count") or 0,
        error=journey.get("error"),
        created_at=journey["created_at"],
        updated_at=journey["updated_at"],
        modules=summaries,
        progress=_progress_from(progress) if progress else None,
    )


def _progress_from(row: dict) -> JourneyProgress:
    return JourneyProgress(
        current_module_ordinal=row.get("current_module_ordinal") or 0,
        completed_module_ordinals=row.get("completed_module_ordinals") or [],
        last_activity_at=row.get("last_activity_at"),
    )


def _attempt_from(row: dict | None):
    if not row:
        return None
    return AttemptResult(
        id=row["id"],
        checkpoint_id=row["checkpoint_id"],
        score=float(row["score"]),
        feedback=row.get("feedback"),
        attempted_at=row["attempted_at"],
    )


def _choices_from(raw) -> list[CheckpointChoice] | None:
    if not raw:
        return None
    if isinstance(raw, str):
        import json
        try:
            raw = json.loads(raw)
        except json.JSONDecodeError:
            return None
    if not isinstance(raw, list):
        return None
    out = []
    for item in raw:
        if isinstance(item, dict) and "id" in item and "text" in item:
            out.append(CheckpointChoice(id=str(item["id"]), text=str(item["text"])))
    return out or None


def _source_labels_for_module(*, user_id: str, source_chunk_ids: list[str]) -> list[str]:
    if not source_chunk_ids:
        return []
    from app.features.extraction import repository as extraction_repo

    chunks = extraction_repo.get_chunks_by_ids(
        user_id=user_id, chunk_ids=source_chunk_ids
    )
    seen = set()
    out: list[str] = []
    for c in chunks:
        label = c.get("source_label") or "source"
        if label not in seen:
            seen.add(label)
            out.append(label)
    return out
