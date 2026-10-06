from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.core.supabase_client import service_client

TABLE = "user_api_keys"


def get(user_id: str) -> Optional[dict]:
    res = (
        service_client()
        .table(TABLE)
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = res.data or []
    return dict(rows[0]) if rows else None


def upsert(user_id: str, *, encrypted_key: str, hint: str) -> dict:
    row = {
        "user_id": user_id,
        "encrypted_key": encrypted_key,
        "hint": hint,
        "last_verified_at": None,
    }
    res = (
        service_client()
        .table(TABLE)
        .upsert(row, on_conflict="user_id")
        .execute()
    )
    return dict((res.data or [row])[0])


def mark_verified(user_id: str) -> None:
    service_client().table(TABLE).update(
        {"last_verified_at": datetime.now(timezone.utc).isoformat()}
    ).eq("user_id", user_id).execute()


def delete(user_id: str) -> None:
    service_client().table(TABLE).delete().eq("user_id", user_id).execute()
