from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.core.auth import CurrentUser, UserDep
from app.features.api_keys import service
from app.features.api_keys.schemas import ApiKeySet, ApiKeyStatus

router = APIRouter(prefix="/me/api-key", tags=["api-key"])


@router.get("", response_model=ApiKeyStatus)
def get_status(user: CurrentUser = UserDep) -> ApiKeyStatus:
    return ApiKeyStatus(**service.status_row(user.id))


@router.put("", response_model=ApiKeyStatus)
def set_key(body: ApiKeySet, user: CurrentUser = UserDep) -> ApiKeyStatus:
    service.set_key(user.id, body.key)
    # Attempt a live verification so the UI can show green immediately
    service.verify_key(user.id)
    return ApiKeyStatus(**service.status_row(user.id))


@router.post("/verify", response_model=ApiKeyStatus)
def verify(user: CurrentUser = UserDep) -> ApiKeyStatus:
    ok = service.verify_key(user.id)
    if not ok:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Could not verify key against Dartmouth AI",
        )
    return ApiKeyStatus(**service.status_row(user.id))


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def delete(user: CurrentUser = UserDep) -> None:
    service.remove(user.id)
