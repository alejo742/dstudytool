from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from app.core.supabase_client import service_client

JOURNEYS = "learning_journeys"
MODULES = "journey_modules"
CHECKPOINTS = "module_checkpoints"
ATTEMPTS = "checkpoint_attempts"
PROGRESS = "journey_progress"


# -------------------- journeys --------------------

def get_journey(*, journey_id: str, user_id: str) -> Optional[dict]:
    res = (
        service_client()
        .table(JOURNEYS)
        .select("*")
        .eq("id", journey_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return dict(rows[0]) if rows else None


def get_journey_for_plan(*, user_id: str, plan_id: str) -> Optional[dict]:
    res = (
        service_client()
        .table(JOURNEYS)
        .select("*")
        .eq("user_id", user_id)
        .eq("plan_id", plan_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return dict(rows[0]) if rows else None


def create_journey(
    *,
    user_id: str,
    plan_id: str,
    title: str,
    course_type: str = "other",
) -> dict:
    res = (
        service_client()
        .table(JOURNEYS)
        .insert(
            {
                "user_id": user_id,
                "plan_id": plan_id,
                "title": title,
                "status": "generating",
                "module_count": 0,
                "course_type": course_type,
            }
        )
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        raise RuntimeError("Insert returned no journey row")
    return dict(row)


def list_journeys_with_progress_for_plan(
    *, user_id: str, plan_id: str
) -> List[dict]:
    """Return each journey for the plan with its progress row inlined.

    The returned shape is a journey dict with an added `progress` field holding
    the matching journey_progress row (or an empty dict if missing). Ordered by
    created_at ascending so callers can short-circuit deterministically.
    """
    j_res = (
        service_client()
        .table(JOURNEYS)
        .select("*")
        .eq("user_id", user_id)
        .eq("plan_id", plan_id)
        .order("created_at", desc=False)
        .execute()
    )
    journeys = [dict(r) for r in (j_res.data or [])]
    if not journeys:
        return []
    ids = [j["id"] for j in journeys]
    p_res = (
        service_client()
        .table(PROGRESS)
        .select("*")
        .eq("user_id", user_id)
        .in_("journey_id", ids)
        .execute()
    )
    progress_by_id = {p["journey_id"]: dict(p) for p in (p_res.data or [])}
    for j in journeys:
        j["progress"] = progress_by_id.get(j["id"], {})
    return journeys


def mark_journey_status(
    *,
    journey_id: str,
    status: str,
    module_count: Optional[int] = None,
    error: Optional[str] = None,
) -> None:
    patch: dict = {"status": status}
    if module_count is not None:
        patch["module_count"] = module_count
    if error is not None:
        patch["error"] = error
    service_client().table(JOURNEYS).update(patch).eq("id", journey_id).execute()


# -------------------- modules --------------------

def insert_modules(*, user_id: str, journey_id: str, modules: List[dict]) -> List[dict]:
    if not modules:
        return []
    rows = [
        {
            "journey_id": journey_id,
            "user_id": user_id,
            "ordinal": m["ordinal"],
            "title": m["title"],
            "concept_labels": m.get("concept_labels", []),
            "source_chunk_ids": m.get("source_chunk_ids", []),
        }
        for m in modules
    ]
    res = service_client().table(MODULES).insert(rows).execute()
    return [dict(r) for r in (res.data or [])]


def list_modules(*, user_id: str, journey_id: str) -> List[dict]:
    res = (
        service_client()
        .table(MODULES)
        .select("*")
        .eq("user_id", user_id)
        .eq("journey_id", journey_id)
        .order("ordinal", desc=False)
        .execute()
    )
    return [dict(r) for r in (res.data or [])]


def get_module(*, user_id: str, journey_id: str, ordinal: int) -> Optional[dict]:
    res = (
        service_client()
        .table(MODULES)
        .select("*")
        .eq("user_id", user_id)
        .eq("journey_id", journey_id)
        .eq("ordinal", ordinal)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return dict(rows[0]) if rows else None


def set_module_extract(*, module_id: str, key_extract: str) -> None:
    service_client().table(MODULES).update(
        {
            "key_extract": key_extract,
            "extract_generated_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", module_id).execute()


def mark_module_checkpoints_generated(*, module_id: str) -> None:
    service_client().table(MODULES).update(
        {"checkpoints_generated_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", module_id).execute()


# -------------------- checkpoints --------------------

def insert_checkpoints(
    *,
    user_id: str,
    module_id: str,
    checkpoints: List[dict],
) -> List[dict]:
    if not checkpoints:
        return []
    rows = [
        {
            "module_id": module_id,
            "user_id": user_id,
            "ordinal": c["ordinal"],
            "kind": c["kind"],
            "question": c["question"],
            "rubric": c.get("rubric"),
            "choices": c.get("choices"),
            "answer_key": c.get("answer_key"),
            "linked_concept_labels": c.get("linked_concept_labels", []),
        }
        for c in checkpoints
    ]
    res = service_client().table(CHECKPOINTS).insert(rows).execute()
    return [dict(r) for r in (res.data or [])]


def list_checkpoints(*, user_id: str, module_id: str) -> List[dict]:
    res = (
        service_client()
        .table(CHECKPOINTS)
        .select("*")
        .eq("user_id", user_id)
        .eq("module_id", module_id)
        .order("ordinal", desc=False)
        .execute()
    )
    return [dict(r) for r in (res.data or [])]


def get_checkpoint(*, user_id: str, checkpoint_id: str) -> Optional[dict]:
    res = (
        service_client()
        .table(CHECKPOINTS)
        .select("*")
        .eq("user_id", user_id)
        .eq("id", checkpoint_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return dict(rows[0]) if rows else None


def count_checkpoints_per_module(*, user_id: str, module_ids: List[str]) -> dict[str, int]:
    """Return {module_id: count} for the given module ids."""
    if not module_ids:
        return {}
    res = (
        service_client()
        .table(CHECKPOINTS)
        .select("module_id")
        .eq("user_id", user_id)
        .in_("module_id", module_ids)
        .execute()
    )
    counts: dict[str, int] = {}
    for row in res.data or []:
        counts[row["module_id"]] = counts.get(row["module_id"], 0) + 1
    return counts


# -------------------- attempts --------------------

def insert_attempt(
    *,
    user_id: str,
    checkpoint_id: str,
    answer: str,
    score: float,
    feedback: Optional[str],
) -> dict:
    res = (
        service_client()
        .table(ATTEMPTS)
        .insert(
            {
                "user_id": user_id,
                "checkpoint_id": checkpoint_id,
                "answer": answer,
                "score": score,
                "feedback": feedback,
            }
        )
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        raise RuntimeError("Insert returned no attempt row")
    return dict(row)


def latest_attempts_for_checkpoints(
    *, user_id: str, checkpoint_ids: List[str]
) -> dict[str, dict]:
    """Return {checkpoint_id: latest attempt row}."""
    if not checkpoint_ids:
        return {}
    res = (
        service_client()
        .table(ATTEMPTS)
        .select("*")
        .eq("user_id", user_id)
        .in_("checkpoint_id", checkpoint_ids)
        .order("attempted_at", desc=True)
        .execute()
    )
    latest: dict[str, dict] = {}
    for row in res.data or []:
        cid = row["checkpoint_id"]
        if cid not in latest:
            latest[cid] = dict(row)
    return latest


def attempted_checkpoint_ids_for_module(
    *, user_id: str, module_id: str
) -> set[str]:
    """Return the set of checkpoint ids under this module the user has attempted."""
    cps = list_checkpoints(user_id=user_id, module_id=module_id)
    if not cps:
        return set()
    ids = [c["id"] for c in cps]
    res = (
        service_client()
        .table(ATTEMPTS)
        .select("checkpoint_id")
        .eq("user_id", user_id)
        .in_("checkpoint_id", ids)
        .execute()
    )
    return {r["checkpoint_id"] for r in (res.data or [])}


# -------------------- progress --------------------

def get_progress(*, user_id: str, journey_id: str) -> Optional[dict]:
    res = (
        service_client()
        .table(PROGRESS)
        .select("*")
        .eq("user_id", user_id)
        .eq("journey_id", journey_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return dict(rows[0]) if rows else None


def init_progress(*, user_id: str, journey_id: str) -> dict:
    res = (
        service_client()
        .table(PROGRESS)
        .insert(
            {
                "user_id": user_id,
                "journey_id": journey_id,
                "current_module_ordinal": 0,
                "completed_module_ordinals": [],
            }
        )
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        raise RuntimeError("Insert returned no progress row")
    return dict(row)


def advance_progress(
    *,
    user_id: str,
    journey_id: str,
    completed_ordinal: int,
    next_ordinal: int,
) -> dict:
    existing = get_progress(user_id=user_id, journey_id=journey_id) or init_progress(
        user_id=user_id, journey_id=journey_id
    )
    completed = list(existing.get("completed_module_ordinals") or [])
    if completed_ordinal not in completed:
        completed.append(completed_ordinal)
    patch = {
        "current_module_ordinal": max(
            existing.get("current_module_ordinal") or 0, next_ordinal
        ),
        "completed_module_ordinals": sorted(completed),
        "last_activity_at": datetime.now(timezone.utc).isoformat(),
    }
    res = (
        service_client()
        .table(PROGRESS)
        .update(patch)
        .eq("user_id", user_id)
        .eq("journey_id", journey_id)
        .execute()
    )
    row = (res.data or [None])[0]
    return dict(row) if row else {**existing, **patch}


def touch_progress(*, user_id: str, journey_id: str) -> None:
    """Bump last_activity_at without advancing ordinals."""
    existing = get_progress(user_id=user_id, journey_id=journey_id)
    if not existing:
        init_progress(user_id=user_id, journey_id=journey_id)
        return
    service_client().table(PROGRESS).update(
        {"last_activity_at": datetime.now(timezone.utc).isoformat()}
    ).eq("user_id", user_id).eq("journey_id", journey_id).execute()
