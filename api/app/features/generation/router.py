from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, Query, status

from app.core.auth import CurrentUser, UserDep
from app.features.generation import repository, service
from app.features.generation.schemas import Generation, GenerationRequest
from app.features.plans import repository as plans_repo

router = APIRouter(prefix="/plans/{plan_id}/generations", tags=["generations"])


@router.get("", response_model=List[Generation])
def list_generations(
    plan_id: str,
    limit: int = Query(default=20, ge=1, le=100),
    user: CurrentUser = UserDep,
) -> List[Generation]:
    plan = plans_repo.get_for_user(user.id, plan_id)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    rows = repository.list_for_plan(user.id, plan_id, limit=limit)
    return [Generation(**r) for r in rows]


@router.post("", response_model=Generation, status_code=status.HTTP_201_CREATED)
def create_generation(
    plan_id: str,
    body: GenerationRequest,
    user: CurrentUser = UserDep,
) -> Generation:
    row = service.generate(
        user_id=user.id,
        plan_id=plan_id,
        kind=body.kind,
        hint=body.hint,
    )
    return Generation(**row)
