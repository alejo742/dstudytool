from __future__ import annotations

import logging
from pathlib import Path

from app.features.extraction import pipeline as extraction_pipeline
from app.features.extraction import repository as extraction_repo
from app.features.uploads import repository as uploads_repo

log = logging.getLogger(__name__)


def run_extraction(
    *,
    user_id: str,
    plan_id: str,
    upload_id: str,
    storage_path: Path,
    mime: str,
    filename: str,
) -> None:
    """Blocking extraction job. Called from a BackgroundTask on upload.

    Updates the upload row through its lifecycle (`extracting` → `ready`/`failed`)
    and writes extracted chunks to the database.
    """
    try:
        uploads_repo.update_status(upload_id, status="extracting")
        result = extraction_pipeline.extract_file(storage_path, mime, filename)
        chunks = extraction_pipeline.chunk_extracted(result)

        extraction_repo.clear_for_upload(upload_id)
        inserted = extraction_repo.insert_chunks(
            user_id=user_id,
            plan_id=plan_id,
            upload_id=upload_id,
            chunks=chunks,
        )
        uploads_repo.update_status(
            upload_id,
            status="ready",
            pages=result.pages,
            chars_extracted=sum(len(c.text) for c in chunks),
            error=None,
        )
        log.info(
            "Extraction complete for %s: %d chunks (%d chars)",
            filename,
            inserted,
            sum(len(c.text) for c in chunks),
        )
    except Exception as e:
        log.exception("Extraction failed for %s: %s", filename, e)
        uploads_repo.update_status(upload_id, status="failed", error=str(e)[:400])
