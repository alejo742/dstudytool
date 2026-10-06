from __future__ import annotations

from typing import List

from app.core.supabase_client import service_client

TABLE = "generations"


def list_for_plan(user_id: str, plan_id: str, limit: int = 20) -> List[dict]:
    res = (
        service_client()
        .table(TABLE)
        .select("*")
        .eq("user_id", user_id)
        .eq("plan_id", plan_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [dict(r) for r in (res.data or [])]


def recent_content(user_id: str, plan_id: str, limit: int = 8) -> List[str]:
    res = (
        service_client()
        .table(TABLE)
        .select("content")
        .eq("user_id", user_id)
        .eq("plan_id", plan_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [r["content"] for r in (res.data or [])]


def insert(
    *,
    user_id: str,
    plan_id: str,
    kind: str,
    content: str,
    sources: List[str],
    prompt_tag: str | None,
) -> dict:
    res = (
        service_client()
        .table(TABLE)
        .insert(
            {
                "user_id": user_id,
                "plan_id": plan_id,
                "kind": kind,
                "content": content,
                "sources": sources,
                "prompt_tag": prompt_tag,
            }
        )
        .execute()
    )
    row = (res.data or [None])[0]
    if not row:
        raise RuntimeError("Insert returned no row")
    return dict(row)
