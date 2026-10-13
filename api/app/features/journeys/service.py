from __future__ import annotations

import json
import logging
import os
import re
from typing import List

from fastapi import HTTPException, status

from app.config import get_settings
from app.features.api_keys import service as api_keys_service
from app.features.extraction import repository as extraction_repo
from app.features.journeys import prompts, repository as repo
from app.features.plans import repository as plans_repo
from app.features.uploads import repository as uploads_repo

log = logging.getLogger(__name__)

# Chunk-count budget for the outline pass. If a document exceeds this, we
# downsample uniformly so the prompt stays within a reasonable window.
OUTLINE_CHUNK_BUDGET = 90


# ============================================================
# Journey creation (synchronous outline generation)
# ============================================================

def create_journey_for_plan(
    *,
    user_id: str,
    plan_id: str,
) -> dict:
    existing = repo.get_journey_for_plan(user_id=user_id, plan_id=plan_id)
    if existing:
        return existing

    plan = plans_repo.get_for_user(user_id, plan_id)
    if not plan:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Plan not found")

    api_key = _require_api_key(user_id)

    uploads = [
        u
        for u in uploads_repo.list_for_plan(user_id, plan_id)
        if u.get("status") == "ready"
    ]
    if not uploads:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Add and extract at least one file before starting a journey.",
        )

    # Pull each upload's chunks, assign global indices across the plan.
    sources: list[dict] = []
    all_chunks: list[dict] = []
    for u in uploads:
        u_chunks = extraction_repo.list_chunks_for_upload(
            user_id=user_id, upload_id=u["id"]
        )
        if not u_chunks:
            continue
        for c in u_chunks:
            c["global_index"] = len(all_chunks)
            all_chunks.append(c)
        sources.append(
            {
                "filename": u.get("filename") or "upload",
                "content_type": u.get("content_type") or "other",
                "chunks": u_chunks,
            }
        )

    if not all_chunks:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Uploads have no extracted content yet.",
        )

    course_type = _dominant_course_type(uploads)
    title = plan.get("title") or "Journey"
    journey = repo.create_journey(
        user_id=user_id, plan_id=plan_id, title=title, course_type=course_type
    )
    repo.init_progress(user_id=user_id, journey_id=journey["id"])

    try:
        outline_modules = _run_outline(
            api_key=api_key,
            plan_title=title,
            course_type=course_type,
            sources=sources,
            total_chunks=len(all_chunks),
        )
        _persist_outline(
            user_id=user_id,
            journey_id=journey["id"],
            all_chunks=all_chunks,
            outline=outline_modules,
        )
        repo.mark_journey_status(
            journey_id=journey["id"],
            status="ready",
            module_count=len(outline_modules),
        )
        return repo.get_journey(journey_id=journey["id"], user_id=user_id) or journey
    except HTTPException:
        repo.mark_journey_status(
            journey_id=journey["id"], status="failed", error="LLM call failed"
        )
        raise
    except Exception as e:
        log.exception("outline generation failed")
        repo.mark_journey_status(
            journey_id=journey["id"], status="failed", error=str(e)[:300]
        )
        raise HTTPException(502, detail=f"Outline generation failed: {e}")


def _dominant_course_type(uploads: list[dict]) -> str:
    """Majority vote over upload course_type labels; ties → 'other'."""
    counts: dict[str, int] = {}
    for u in uploads:
        ct = u.get("course_type") or "other"
        counts[ct] = counts.get(ct, 0) + 1
    if not counts:
        return "other"
    sorted_cts = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    top_ct, top_n = sorted_cts[0]
    if len(sorted_cts) > 1 and sorted_cts[1][1] == top_n:
        return "other"
    return top_ct


def _persist_outline(
    *,
    user_id: str,
    journey_id: str,
    all_chunks: List[dict],
    outline: List[dict],
) -> None:
    chunk_id_by_idx = {c["global_index"]: c["id"] for c in all_chunks}
    rows: List[dict] = []
    for i, m in enumerate(outline):
        src_idxs = [
            idx for idx in m.get("source_chunk_indices", []) if idx in chunk_id_by_idx
        ]
        rows.append(
            {
                "ordinal": i,
                "title": m.get("title") or f"Module {i + 1}",
                "concept_labels": m.get("concept_labels") or [],
                "source_chunk_ids": [chunk_id_by_idx[idx] for idx in src_idxs],
            }
        )
    repo.insert_modules(user_id=user_id, journey_id=journey_id, modules=rows)


# ============================================================
# Lazy per-module content (extract + checkpoints)
# ============================================================

def ensure_module_ready(
    *,
    user_id: str,
    journey: dict,
    module_ordinal: int,
) -> dict:
    """Return the module row with key_extract + checkpoints materialized.

    Lazy generation: if either is missing, generate and persist.
    """
    module = repo.get_module(
        user_id=user_id, journey_id=journey["id"], ordinal=module_ordinal
    )
    if not module:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Module not found")

    api_key = None  # fetched lazily if we actually need the LLM

    if not module.get("key_extract"):
        api_key = api_key or _require_api_key(user_id)
        chunks = extraction_repo.get_chunks_by_ids(
            user_id=user_id, chunk_ids=module.get("source_chunk_ids") or []
        )
        extract = _run_extract(
            api_key=api_key,
            module_title=module["title"],
            concept_labels=module.get("concept_labels") or [],
            chunks=chunks,
        )
        repo.set_module_extract(module_id=module["id"], key_extract=extract)
        module["key_extract"] = extract

    if not module.get("checkpoints_generated_at"):
        api_key = api_key or _require_api_key(user_id)
        base_kinds = prompts.mix_for_module(
            module_ordinal=module_ordinal,
            seed=module["id"],
            course_type=journey.get("course_type") or "other",
        )
        checkpoints = _run_checkpoints(
            api_key=api_key,
            module_title=module["title"],
            key_extract=module["key_extract"],
            concept_labels=module.get("concept_labels") or [],
            required_kinds=base_kinds,
        )
        rows = [
            {
                "ordinal": i,
                "kind": c["kind"],
                "question": c["question"],
                "rubric": c.get("rubric"),
                "choices": c.get("choices"),
                "answer_key": c.get("answer_key"),
                "linked_concept_labels": [],
            }
            for i, c in enumerate(checkpoints)
        ]

        if prompts.should_add_spaced_recall(module_ordinal=module_ordinal):
            prior_ordinal = prompts.pick_prior_module_ordinal(
                current_ordinal=module_ordinal, seed=module["id"]
            )
            if prior_ordinal is not None:
                prior = repo.get_module(
                    user_id=user_id, journey_id=journey["id"], ordinal=prior_ordinal
                )
                if prior:
                    base_kind = prompts.pick_spaced_recall_base_kind(
                        seed=module["id"], module_ordinal=module_ordinal
                    )
                    sr = _run_spaced_recall(
                        api_key=api_key,
                        current_module_title=module["title"],
                        current_concepts=module.get("concept_labels") or [],
                        current_extract=module["key_extract"],
                        prior_module_title=prior["title"],
                        prior_concepts=prior.get("concept_labels") or [],
                        base_kind=base_kind,
                    )
                    rows.append(
                        {
                            "ordinal": len(rows),
                            "kind": "spaced-recall",
                            "question": sr["question"],
                            "rubric": sr.get("rubric"),
                            "choices": sr.get("choices"),
                            "answer_key": sr.get("answer_key"),
                            "linked_concept_labels": sr.get(
                                "linked_concept_labels"
                            ) or (prior.get("concept_labels") or [])[:2],
                        }
                    )

        repo.insert_checkpoints(
            user_id=user_id, module_id=module["id"], checkpoints=rows
        )
        repo.mark_module_checkpoints_generated(module_id=module["id"])

    return module


# ============================================================
# Grading
# ============================================================

def grade_attempt(
    *,
    user_id: str,
    checkpoint_id: str,
    answer: str,
) -> dict:
    cp = repo.get_checkpoint(user_id=user_id, checkpoint_id=checkpoint_id)
    if not cp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Checkpoint not found")

    kind = cp["kind"]
    if kind == "multiple-choice":
        key = (cp.get("answer_key") or "").strip().lower()
        picked = (answer or "").strip().lower()
        correct = bool(key) and picked == key
        score = 1.0 if correct else 0.0
        feedback = (
            "Correct." if correct else f"Not quite — the correct option was \"{key}\"."
        )
    else:
        api_key = _require_api_key(user_id)
        rubric = cp.get("rubric") or "A correct answer should address the question directly."
        result = _run_grader(
            api_key=api_key,
            kind=kind,
            question=cp["question"],
            rubric=rubric,
            answer=answer,
        )
        score = _clamp_score(result.get("score", 0.0))
        feedback = result.get("feedback") or ""

    attempt = repo.insert_attempt(
        user_id=user_id,
        checkpoint_id=checkpoint_id,
        answer=answer,
        score=score,
        feedback=feedback,
    )
    return attempt


# ============================================================
# Progress
# ============================================================

def complete_module(
    *,
    user_id: str,
    journey: dict,
    module_ordinal: int,
) -> dict:
    module = repo.get_module(
        user_id=user_id, journey_id=journey["id"], ordinal=module_ordinal
    )
    if not module:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Module not found")

    checkpoints = repo.list_checkpoints(user_id=user_id, module_id=module["id"])
    if not checkpoints:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Module checkpoints not generated yet — open the module first.",
        )
    attempted = repo.attempted_checkpoint_ids_for_module(
        user_id=user_id, module_id=module["id"]
    )
    missing = [c["id"] for c in checkpoints if c["id"] not in attempted]
    if missing:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Attempt all checkpoints before completing (missing {len(missing)}).",
        )

    next_ordinal = module_ordinal + 1
    is_last = next_ordinal >= (journey.get("module_count") or 0)
    progress = repo.advance_progress(
        user_id=user_id,
        journey_id=journey["id"],
        completed_ordinal=module_ordinal,
        next_ordinal=next_ordinal if not is_last else module_ordinal,
    )
    return {
        "progress": progress,
        "next_module_ordinal": None if is_last else next_ordinal,
        "journey_complete": is_last,
    }


# ============================================================
# LLM calls
# ============================================================

def _run_outline(
    *,
    api_key: str,
    plan_title: str,
    course_type: str,
    sources: List[dict],
    total_chunks: int,
) -> List[dict]:
    """Run the outline pass across the plan's uploads.

    If the plan has more than OUTLINE_CHUNK_BUDGET chunks total, uniformly
    down-sample within each source while preserving global_index values. The
    LLM references global indices; the service already clamps them against the
    full chunk map in _persist_outline.
    """
    picked_sources: list[dict] = []
    if total_chunks > OUTLINE_CHUNK_BUDGET:
        keep_ratio = OUTLINE_CHUNK_BUDGET / total_chunks
        for s in sources:
            picks = []
            step = max(1, int(round(1 / keep_ratio)))
            for i, c in enumerate(s["chunks"]):
                if i % step == 0:
                    picks.append(c)
            if picks:
                picked_sources.append({**s, "chunks": picks})
    else:
        picked_sources = sources

    messages = prompts.build_outline_messages(
        plan_title=plan_title,
        course_type=course_type,
        sources=picked_sources,
    )
    text = _invoke_llm(api_key=api_key, messages=messages)
    data = _parse_json(text)
    modules = data.get("modules") if isinstance(data, dict) else None
    if not isinstance(modules, list) or not modules:
        raise HTTPException(502, detail="Outline response was not a non-empty module list")
    # Clamp indices to the valid global range (0 .. total_chunks-1).
    valid = set(range(total_chunks))
    for m in modules:
        m["source_chunk_indices"] = [
            i for i in (m.get("source_chunk_indices") or []) if i in valid
        ]
    return modules


def _run_extract(
    *,
    api_key: str,
    module_title: str,
    concept_labels: List[str],
    chunks: List[dict],
) -> str:
    if not chunks:
        return ""
    messages = prompts.build_extract_messages(
        module_title=module_title, concept_labels=concept_labels, chunks=chunks
    )
    return _invoke_llm(api_key=api_key, messages=messages).strip()


def _run_checkpoints(
    *,
    api_key: str,
    module_title: str,
    key_extract: str,
    concept_labels: List[str],
    required_kinds: List[str],
) -> List[dict]:
    messages = prompts.build_checkpoints_messages(
        module_title=module_title,
        key_extract=key_extract,
        concept_labels=concept_labels,
        required_kinds=required_kinds,
    )
    text = _invoke_llm(api_key=api_key, messages=messages)
    data = _parse_json(text)
    out = data.get("checkpoints") if isinstance(data, dict) else None
    if not isinstance(out, list) or not out:
        raise HTTPException(502, detail="Checkpoints response was not a non-empty list")
    # enforce required kinds in order (defensive — the LLM sometimes reorders)
    normalized = []
    for i, requested_kind in enumerate(required_kinds):
        if i < len(out):
            cp = dict(out[i])
            cp["kind"] = requested_kind
            normalized.append(cp)
    return normalized


def _run_spaced_recall(
    *,
    api_key: str,
    current_module_title: str,
    current_concepts: List[str],
    current_extract: str,
    prior_module_title: str,
    prior_concepts: List[str],
    base_kind: str,
) -> dict:
    messages = prompts.build_spaced_recall_messages(
        current_module_title=current_module_title,
        current_concepts=current_concepts,
        current_extract=current_extract,
        prior_module_title=prior_module_title,
        prior_concepts=prior_concepts,
        base_kind=base_kind,
    )
    text = _invoke_llm(api_key=api_key, messages=messages)
    data = _parse_json(text)
    if not isinstance(data, dict) or "question" not in data:
        raise HTTPException(502, detail="Spaced-recall response malformed")
    return data


def _run_grader(
    *,
    api_key: str,
    kind: str,
    question: str,
    rubric: str,
    answer: str,
) -> dict:
    messages = prompts.build_grader_messages(
        kind=kind, question=question, rubric=rubric, answer=answer
    )
    text = _invoke_llm(api_key=api_key, messages=messages)
    data = _parse_json(text)
    if not isinstance(data, dict):
        return {"score": 0.0, "feedback": "Grader returned no usable response."}
    return data


# ============================================================
# Helpers
# ============================================================

def _require_api_key(user_id: str) -> str:
    key = api_keys_service.get_decrypted(user_id)
    if not key:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Add your Dartmouth Chat API key in settings before starting a journey.",
        )
    return key


def _derive_title(filename: str) -> str:
    base = re.sub(r"\.[^.]+$", "", filename or "").strip() or "Journey"
    return base[:120]


def _clamp_score(value) -> float:
    try:
        f = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, round(f, 2)))


_JSON_FENCE_RE = re.compile(r"```(?:json)?\s*(.+?)```", re.DOTALL)


def _parse_json(text: str) -> dict:
    """Best-effort JSON extraction. The outline/checkpoints/grader prompts all
    ask for strict JSON; occasionally Claude wraps in a code fence despite
    being told not to — strip and retry."""
    text = (text or "").strip()
    for candidate in (text, _strip_fence(text), _slice_json_object(text)):
        if not candidate:
            continue
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            continue
    log.warning("LLM output was not valid JSON: %r", text[:400])
    raise HTTPException(502, detail="LLM did not return valid JSON")


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
    try:
        from langchain_core.messages import HumanMessage, SystemMessage
        from langchain_dartmouth.llms import ChatDartmouth
    except Exception as e:
        log.exception("langchain-dartmouth import failed: %s", e)
        raise HTTPException(500, detail="Server misconfigured: langchain-dartmouth missing")

    settings = get_settings()
    temperature = None if settings.journey_model.startswith("anthropic.") else 0.3
    llm = ChatDartmouth(
        model_name=settings.journey_model,
        temperature=temperature,
        max_tokens=8192,
    )
    lc = []
    for m in messages:
        if m["role"] == "system":
            lc.append(SystemMessage(content=m["content"]))
        else:
            lc.append(HumanMessage(content=m["content"]))
    try:
        resp = llm.invoke(lc)
    except Exception as e:
        log.exception("ChatDartmouth call failed: %s", e)
        raise HTTPException(502, detail=f"Dartmouth AI call failed: {e}")
    text = _coerce_content(getattr(resp, "content", None))
    if not text:
        log.warning("Empty LLM response. finish=%s raw=%r", getattr(resp, "response_metadata", None), resp)
        raise HTTPException(502, detail="Dartmouth AI returned an empty response")
    return text


def _coerce_content(content) -> str:
    if content is None:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict):
                t = block.get("text") or block.get("content") or ""
                if t:
                    parts.append(t)
        return "".join(parts)
    return str(content)
