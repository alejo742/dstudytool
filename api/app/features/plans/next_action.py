from __future__ import annotations

from app.features.journeys import repository as journeys_repo
from app.features.plans.schemas import NextAction
from app.features.uploads import repository as uploads_repo


def resolve_next_action(*, user_id: str, plan_id: str) -> NextAction:
    """Compute the single next action for a plan.

    Priority (first match wins):
      1. continue_journey — the plan journey exists and has incomplete modules
      2. start_journey    — plan has ≥1 ready upload but no journey yet
      3. upload_prompt    — plan has no ready uploads
      4. all_done         — plan journey exists and every module is complete
    """
    journey = journeys_repo.get_journey_for_plan(user_id=user_id, plan_id=plan_id)
    progress = (
        journeys_repo.get_progress(user_id=user_id, journey_id=journey["id"])
        if journey
        else None
    )

    module_count = int((journey or {}).get("module_count") or 0)
    completed_set = set((progress or {}).get("completed_module_ordinals") or [])
    completed_count = len(completed_set)

    # 1. continue_journey
    if journey and journey.get("status") == "ready" and completed_count < module_count:
        next_ord = _next_incomplete_ordinal(total=module_count, completed=completed_set)
        return NextAction(
            kind="continue_journey",
            label=f"Continue · {journey['title']}",
            sublabel=f"Module {next_ord + 1} of {module_count}",
            journey_id=journey["id"],
            module_ordinal=next_ord,
            modules_completed=completed_count,
            modules_total=module_count,
        )

    uploads = uploads_repo.list_for_plan(user_id, plan_id)
    ready_uploads = [u for u in uploads if u.get("status") == "ready"]

    # 2. start_journey — ready uploads exist but no journey has been created
    if ready_uploads and not journey:
        return NextAction(
            kind="start_journey",
            label="Start journey",
            sublabel=_begin_sublabel(ready_uploads),
            modules_completed=0,
            modules_total=0,
        )

    # 3. upload_prompt
    if not ready_uploads and not journey:
        return NextAction(
            kind="upload_prompt",
            label="Add material to get started",
            sublabel="Drop a PDF or set of notes below.",
            modules_completed=0,
            modules_total=0,
        )

    # 4. all_done
    return NextAction(
        kind="all_done",
        label="You've completed every module",
        sublabel="Add more material to keep going.",
        modules_completed=completed_count,
        modules_total=module_count,
    )


def _begin_sublabel(ready_uploads: list[dict]) -> str:
    n = len(ready_uploads)
    if n == 1:
        return f"We'll outline {ready_uploads[0].get('filename') or 'your file'} into a journey."
    return f"We'll outline a journey across your {n} files."


def _next_incomplete_ordinal(*, total: int, completed: set[int]) -> int:
    for i in range(total):
        if i not in completed:
            return i
    return max(total - 1, 0)
