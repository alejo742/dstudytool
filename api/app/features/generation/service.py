from __future__ import annotations

import logging
import os
import random
from typing import List

from fastapi import HTTPException, status

from app.config import get_settings
from app.features.api_keys import service as api_keys_service
from app.features.extraction import repository as extraction_repo
from app.features.generation import prompts, repository as gen_repo
from app.features.generation.schemas import GenerationKind
from app.features.plans import repository as plans_repo

log = logging.getLogger(__name__)


MIN_EXCERPTS = 1
EXCERPT_LIMIT = 8


def generate(
    *,
    user_id: str,
    plan_id: str,
    kind: GenerationKind,
    hint: str | None,
) -> dict:
    plan = plans_repo.get_for_user(user_id, plan_id)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")

    api_key = api_keys_service.get_decrypted(user_id)
    if not api_key:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Add your Dartmouth Chat API key in settings before generating.",
        )

    excerpts = extraction_repo.sample_for_plan(
        user_id=user_id, plan_id=plan_id, limit=EXCERPT_LIMIT * 4
    )
    if len(excerpts) < MIN_EXCERPTS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Upload at least one file and wait for extraction to finish before generating.",
        )

    # Rotate selection to keep things fresh across calls
    random.shuffle(excerpts)
    picked = excerpts[:EXCERPT_LIMIT]

    recent = gen_repo.recent_content(user_id, plan_id, limit=6)

    messages = prompts.build_messages(
        plan_title=plan["title"],
        course_code=plan.get("course_code"),
        kind=kind,
        excerpts=picked,
        recent_generations=recent,
        hint=hint,
    )

    content = _invoke(api_key=api_key, messages=messages)

    sources = _dedup_sources([e.get("source_label") or "source" for e in picked])

    stored = gen_repo.insert(
        user_id=user_id,
        plan_id=plan_id,
        kind=kind,
        content=content,
        sources=sources,
        prompt_tag=hint,
    )
    return stored


def _invoke(*, api_key: str, messages: list[dict]) -> str:
    os.environ["DARTMOUTH_CHAT_API_KEY"] = api_key
    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_dartmouth.llms import ChatDartmouth
    except Exception as e:
        log.exception("langchain-dartmouth import failed: %s", e)
        raise HTTPException(500, detail="Server misconfigured: langchain-dartmouth missing")

    settings = get_settings()
    llm = ChatDartmouth(model_name=settings.dartmouth_default_model, temperature=0.7)
    lc_messages = []
    for m in messages:
        if m["role"] == "system":
            lc_messages.append(SystemMessage(content=m["content"]))
        else:
            lc_messages.append(HumanMessage(content=m["content"]))

    try:
        resp = llm.invoke(lc_messages)
    except Exception as e:
        log.exception("ChatDartmouth call failed: %s", e)
        raise HTTPException(502, detail=f"Dartmouth AI call failed: {e}")

    text = getattr(resp, "content", None)
    if not text:
        raise HTTPException(502, detail="Dartmouth AI returned an empty response")
    return text.strip()


def _dedup_sources(labels: List[str]) -> List[str]:
    seen = set()
    out = []
    for s in labels:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out
