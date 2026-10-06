from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, status

from app.core.auth import CurrentUser, UserDep
from app.features.plans import repository
from app.features.plans.schemas import Plan, PlanCreate

router = APIRouter(prefix="/plans", tags=["plans"])


@router.get("", response_model=List[Plan])
def list_plans(user: CurrentUser = UserDep) -> List[Plan]:
    return [Plan(**row) for row in repository.list_for_user(user.id)]


@router.post("", response_model=Plan, status_code=status.HTTP_201_CREATED)
def create_plan(body: PlanCreate, user: CurrentUser = UserDep) -> Plan:
    created = repository.create(
        user_id=user.id,
        title=body.title,
        course_code=body.course_code,
        description=body.description,
    )
    return Plan(**created)


@router.get("/{plan_id}", response_model=Plan)
def get_plan(plan_id: str, user: CurrentUser = UserDep) -> Plan:
    row = repository.get_for_user(user.id, plan_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return Plan(**row)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(plan_id: str, user: CurrentUser = UserDep) -> None:
    ok = repository.delete(user.id, plan_id)
    if not ok:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
