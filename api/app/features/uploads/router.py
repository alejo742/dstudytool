from __future__ import annotations

import mimetypes
from typing import List

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile, status

from app.core.auth import CurrentUser, UserDep
from app.features.plans import repository as plans_repo
from app.features.uploads import repository as uploads_repo
from app.features.uploads import service as upload_service
from app.features.uploads import storage
from app.features.uploads.schemas import Upload

router = APIRouter(prefix="/plans/{plan_id}/uploads", tags=["uploads"])


def _ensure_plan(user: CurrentUser, plan_id: str) -> dict:
    plan = plans_repo.get_for_user(user.id, plan_id)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.get("", response_model=List[Upload])
def list_uploads(plan_id: str, user: CurrentUser = UserDep) -> List[Upload]:
    _ensure_plan(user, plan_id)
    return [Upload(**row) for row in uploads_repo.list_for_plan(user.id, plan_id)]


@router.post("", response_model=Upload, status_code=status.HTTP_201_CREATED)
async def create_upload(
    plan_id: str,
    background: BackgroundTasks,
    file: UploadFile = File(...),
    user: CurrentUser = UserDep,
) -> Upload:
    _ensure_plan(user, plan_id)
    if not file.filename:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Filename required")

    guessed_mime, _ = mimetypes.guess_type(file.filename)
    mime = file.content_type or guessed_mime or "application/octet-stream"

    storage_path, size = await storage.save_upload(
        user_id=user.id, plan_id=plan_id, file=file
    )

    row = uploads_repo.create(
        user_id=user.id,
        plan_id=plan_id,
        filename=file.filename,
        mime_type=mime,
        size_bytes=size,
        storage_path=storage_path,
    )

    background.add_task(
        upload_service.run_extraction,
        user_id=user.id,
        plan_id=plan_id,
        upload_id=row["id"],
        storage_path=storage.local_path(storage_path),
        mime=mime,
        filename=file.filename,
    )
    return Upload(**row)


@router.delete("/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_upload(plan_id: str, upload_id: str, user: CurrentUser = UserDep) -> None:
    _ensure_plan(user, plan_id)
    row = uploads_repo.delete(user.id, upload_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Upload not found")
    storage.delete_storage(row.get("storage_path", ""))


@router.post("/{upload_id}/reprocess", response_model=Upload)
def reprocess_upload(
    plan_id: str,
    upload_id: str,
    background: BackgroundTasks,
    user: CurrentUser = UserDep,
) -> Upload:
    _ensure_plan(user, plan_id)
    row = uploads_repo.get(user.id, upload_id)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Upload not found")

    uploads_repo.update_status(upload_id, status="pending", error=None)

    background.add_task(
        upload_service.run_extraction,
        user_id=user.id,
        plan_id=plan_id,
        upload_id=upload_id,
        storage_path=storage.local_path(row["storage_path"]),
        mime=row["mime_type"],
        filename=row["filename"],
    )
    row["status"] = "pending"
    row["error"] = None
    return Upload(**row)
