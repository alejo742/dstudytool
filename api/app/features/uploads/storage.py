from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.config import get_settings

log = logging.getLogger(__name__)

# For the POC we write to a local directory. Swap for Supabase Storage later
# without touching callers — the only public surface is `save_upload` and
# `local_path`.


def _root() -> Path:
    root = Path(get_settings().local_storage_root)
    root.mkdir(parents=True, exist_ok=True)
    return root


def _plan_dir(user_id: str, plan_id: str) -> Path:
    d = _root() / user_id / plan_id
    d.mkdir(parents=True, exist_ok=True)
    return d


async def save_upload(
    *, user_id: str, plan_id: str, file: UploadFile
) -> tuple[str, int]:
    """Persist the upload stream and return (storage_path, size_bytes)."""
    suffix = Path(file.filename or "").suffix.lower()
    unique = f"{uuid.uuid4().hex}{suffix}"
    rel = f"{user_id}/{plan_id}/{unique}"
    full = _root() / rel

    size = 0
    chunk_size = 1024 * 1024
    with open(full, "wb") as out:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            size += len(chunk)
            out.write(chunk)
    log.info("Stored upload %s (%d bytes)", rel, size)
    return rel, size


def local_path(storage_path: str) -> Path:
    return _root() / storage_path


def delete_storage(storage_path: str) -> None:
    p = local_path(storage_path)
    if p.exists():
        try:
            p.unlink()
        except OSError as e:
            log.warning("Could not delete %s: %s", p, e)
