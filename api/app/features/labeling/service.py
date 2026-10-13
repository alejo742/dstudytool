from __future__ import annotations

import json
import logging
import os
import re
from typing import Optional

from app.config import get_settings
from app.features.api_keys import service as api_keys_service
from app.features.extraction import repository as extraction_repo
from app.features.labeling import prompts
from app.features.uploads import repository as uploads_repo

log = logging.getLogger(__name__)

# Characters of extracted text fed to the labeler. Enough to classify a file,
# small enough that Haiku runs cheaply and in <1s typically.
SAMPLE_BUDGET_CHARS = 5000


def label_upload(*, user_id: str, upload_id: str) -> Optional[dict]:
    """Run the labeler for a single upload.

    No-op if labels already generated. Returns the chosen labels, or None if
    anything failed (we intentionally swallow failures — missing labels just
    become 'other'/'other' downstream).
    """
    upload = uploads_repo.get(user_id, upload_id)
    if not upload:
        return None
    if upload.get("labels_generated_at"):
        return {
            "content_type": upload.get("content_type") or "other",
            "course_type": upload.get("course_type") or "other",
        }

    api_key = api_keys_service.get_decrypted(user_id)
    if not api_key:
        # No key means we can't call the LLM; skip quietly so extraction still
        # succeeds. The caller sees uploads.labels_generated_at remain null.
        log.info("labeling skipped for upload=%s (no API key)", upload_id)
        return None

    chunks = extraction_repo.list_chunks_for_upload(
        user_id=user_id, upload_id=upload_id
    )
    if not chunks:
        return None

    sample = _concat_sample(chunks, SAMPLE_BUDGET_CHARS)
    messages = prompts.build_labeling_messages(
        filename=upload.get("filename") or "upload",
        sample_text=sample,
    )

    try:
        raw = _invoke_llm(api_key=api_key, messages=messages)
        data = _parse_json(raw)
    except Exception as e:
        log.warning("labeling LLM call failed for upload=%s: %s", upload_id, e)
        return None

    content_type = prompts.coerce_content_type(data.get("content_type"))
    course_type = prompts.coerce_course_type(data.get("course_type"))
    log.info(
        "labeled upload=%s content=%s course=%s rationale=%r",
        upload_id,
        content_type,
        course_type,
        (data.get("rationale") or "")[:160],
    )
    uploads_repo.set_labels(
        upload_id, content_type=content_type, course_type=course_type
    )
    return {"content_type": content_type, "course_type": course_type}


# ---------- helpers (parallel to features/journeys/service.py) ----------

def _concat_sample(chunks: list[dict], budget: int) -> str:
    acc: list[str] = []
    used = 0
    for c in chunks:
        text = (c.get("content") or "").strip()
        if not text:
            continue
        remaining = budget - used
        if remaining <= 0:
            break
        acc.append(text[:remaining])
        used += min(len(text), remaining)
    return "\n\n".join(acc)


_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.+?)```", re.DOTALL)


def _parse_json(text: str) -> dict:
    text = (text or "").strip()
    for candidate in (text, _strip_fence(text), _slice_json_object(text)):
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    raise ValueError(f"Not valid JSON: {text[:200]!r}")


def _strip_fence(text: str) -> str:
    m = _JSON_FENCE_RE.search(text)
    return m.group(1).strip() if m else ""


def _slice_json_object(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return ""
    return text[start : end + 1]


def _invoke_llm(*, api_key: str, messages: list[dict]) -> str:
    os.environ["DARTMOUTH_CHAT_API_KEY"] = api_key
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_dartmouth.llms import ChatDartmouth

    settings = get_settings()
    temperature = None if settings.labeling_model.startswith("anthropic.") else 0.0
    llm = ChatDartmouth(
        model_name=settings.labeling_model,
        temperature=temperature,
        max_tokens=2048,
    )
    lc = []
    for m in messages:
        if m["role"] == "system":
            lc.append(SystemMessage(content=m["content"]))
        else:
            lc.append(HumanMessage(content=m["content"]))
    resp = llm.invoke(lc)
    content = getattr(resp, "content", None)
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                t = block.get("text") or block.get("content") or ""
                if t:
                    parts.append(t)
        text = "".join(parts)
    else:
        text = content or ""
    if not text:
        raise RuntimeError("empty labeling response")
    return text if isinstance(text, str) else str(text)
