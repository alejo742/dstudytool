from __future__ import annotations

from typing import List, Optional

from app.core.supabase_client import service_client


TABLE = "plans"


def _apply_counts(row: dict) -> dict:
    """The DB view returns counts as uploads_count, etc. Normalize keys."""
    for k_src, k_dst in (
        ("uploads_count", "upload_count"),
        ("chunks_count", "extracted_chunk_count"),
        ("generations_count", "generation_count"),
    ):
        if k_src in row and k_dst not in row:
            row[k_dst] = row.pop(k_src) or 0
    row.setdefault("upload_count", 0)
    row.setdefault("extracted_chunk_count", 0)
    row.setdefault("generation_count", 0)
    return row


def list_for_user(user_id: str) -> List[dict]:
    client = service_client()
    res = (
        client.table("plans_with_counts")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return [_apply_counts(dict(r)) for r in (res.data or [])]


def get_for_user(user_id: str, plan_id: str) -> Optional[dict]:
    client = service_client()
    res = (
        client.table("plans_with_counts")
        .select("*")
        .eq("user_id", user_id)
        .eq("id", plan_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return _apply_counts(dict(rows[0])) if rows else None


def create(user_id: str, title: str, course_code: Optional[str], description: Optional[str]) -> dict:
    client = service_client()
    res = (
        client.table(TABLE)
        .insert(
            {
                "user_id": user_id,
                "title": title,
                "course_code": course_code,
                "description": description,
            }
        )
        .execute()
    )
    created = (res.data or [None])[0]
    if not created:
        raise RuntimeError("Insert returned no row")
    created = dict(created)
    created["upload_count"] = 0
    created["extracted_chunk_count"] = 0
    created["generation_count"] = 0
    return created


def delete(user_id: str, plan_id: str) -> bool:
    client = service_client()
    res = (
        client.table(TABLE)
        .delete()
        .eq("user_id", user_id)
        .eq("id", plan_id)
        .execute()
    )
    return bool(res.data)
