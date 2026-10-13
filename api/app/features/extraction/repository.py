from __future__ import annotations

from typing import List

from app.core.supabase_client import service_client
from app.features.extraction.extractors.base import ExtractedChunk

TABLE = "extracted_chunks"


def clear_for_upload(upload_id: str) -> None:
    client = service_client()
    client.table(TABLE).delete().eq("upload_id", upload_id).execute()


def insert_chunks(
    *,
    user_id: str,
    plan_id: str,
    upload_id: str,
    chunks: List[ExtractedChunk],
) -> int:
    if not chunks:
        return 0
    client = service_client()
    rows = [
        {
            "user_id": user_id,
            "plan_id": plan_id,
            "upload_id": upload_id,
            "content": c.text,
            "page": c.page,
            "source_label": c.source_label,
            "ordinal": i,
        }
        for i, c in enumerate(chunks)
    ]
    # Batch to stay under PostgREST limits
    inserted = 0
    for i in range(0, len(rows), 200):
        batch = rows[i : i + 200]
        res = client.table(TABLE).insert(batch).execute()
        inserted += len(res.data or [])
    return inserted


def list_chunks_for_upload(*, user_id: str, upload_id: str) -> List[dict]:
    """Return every chunk for an upload, ordered by ordinal. Used by the
    guided-learning journey outline pass."""
    client = service_client()
    res = (
        client.table(TABLE)
        .select("id,content,source_label,page,ordinal")
        .eq("user_id", user_id)
        .eq("upload_id", upload_id)
        .order("ordinal", desc=False)
        .execute()
    )
    return [dict(r) for r in (res.data or [])]


def get_chunks_by_ids(*, user_id: str, chunk_ids: List[str]) -> List[dict]:
    """Return specific chunks by id (owner-scoped), preserving stable ordering
    by ordinal. Used when generating a module's extract from its source chunks."""
    if not chunk_ids:
        return []
    client = service_client()
    res = (
        client.table(TABLE)
        .select("id,content,source_label,page,ordinal")
        .eq("user_id", user_id)
        .in_("id", chunk_ids)
        .order("ordinal", desc=False)
        .execute()
    )
    return [dict(r) for r in (res.data or [])]


def sample_for_plan(
    *, user_id: str, plan_id: str, limit: int = 10, exclude_ids: list[str] | None = None
) -> List[dict]:
    """Pick a diverse-ish set of chunks to ground generation. Deterministic
    nicety: order by random seed on the server would be ideal, but PostgREST
    doesn't do that cleanly — we just take recent-first and let the caller
    rotate hint keywords to avoid repetition."""
    client = service_client()
    q = (
        client.table(TABLE)
        .select("id,content,source_label,page")
        .eq("user_id", user_id)
        .eq("plan_id", plan_id)
        .order("ordinal", desc=False)
        .limit(limit)
    )
    if exclude_ids:
        q = q.not_.in_("id", exclude_ids)
    res = q.execute()
    return [dict(r) for r in (res.data or [])]
