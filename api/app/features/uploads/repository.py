from __future__ import annotations

from typing import List, Optional

from app.core.supabase_client import service_client

TABLE = "uploads"


def list_for_plan(user_id: str, plan_id: str) -> List[dict]:
    client = service_client()
    res = (
        client.table(TABLE)
        .select("*")
        .eq("user_id", user_id)
        .eq("plan_id", plan_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [dict(r) for r in (res.data or [])]


def get(user_id: str, upload_id: str) -> Optional[dict]:
    client = service_client()
    res = (
        client.table(TABLE)
        .select("*")
        .eq("user_id", user_id)
        .eq("id", upload_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return dict(rows[0]) if rows else None


def create(
    *,
    user_id: str,
    plan_id: str,
    filename: str,
    mime_type: str,
    size_bytes: int,
    storage_path: str,
) -> dict:
    client = service_client()
    res = (
        client.table(TABLE)
        .insert(
            {
                "user_id": user_id,
                "plan_id": plan_id,
                "filename": filename,
                "mime_type": mime_type,
                "size_bytes": size_bytes,
                "storage_path": storage_path,
                "status": "pending",
            }
        )
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        raise RuntimeError("Insert returned no row")
    return dict(row)


def update_status(
    upload_id: str,
    *,
    status: str,
    pages: Optional[int] = None,
    chars_extracted: Optional[int] = None,
    error: Optional[str] = None,
) -> None:
    client = service_client()
    patch = {"status": status}
    if pages is not None:
        patch["pages"] = pages
    if chars_extracted is not None:
        patch["chars_extracted"] = chars_extracted
    if error is not None:
        patch["error"] = error
    client.table(TABLE).update(patch).eq("id", upload_id).execute()


def delete(user_id: str, upload_id: str) -> Optional[dict]:
    client = service_client()
    row = get(user_id, upload_id)
    if not row:
        return None
    client.table(TABLE).delete().eq("id", upload_id).eq("user_id", user_id).execute()
    return row
