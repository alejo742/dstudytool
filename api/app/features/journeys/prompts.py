from __future__ import annotations

from typing import List, Optional

SYSTEM_BASE = (
    "You are a careful instructor building a sequential learning journey from a "
    "Dartmouth student's uploaded course material. You stay strictly grounded in "
    "the excerpts provided. You never invent facts, theorems, or notation the "
    "material does not support. You respond directly without greetings or "
    "apologies, and you emit JSON exactly matching the requested schema when "
    "asked to."
)


# -------------------- outline --------------------

COURSE_ORDERING_GUIDANCE = {
    "math": (
        "Order: motivation → definition → key result or theorem → worked example → "
        "problem practice. Keep theory and application close together."
    ),
    "science": (
        "Order: concept → mechanism / derivation → example or experiment → applied problem. "
        "Weave quantitative and qualitative modules."
    ),
    "cs": (
        "Order: problem framing → algorithm / data structure → trace or example → "
        "implementation nuance or applied problem."
    ),
    "reading": (
        "Order from short, concrete passages toward longer or more argumentative ones. "
        "Follow comprehension with inference, then synthesis across passages."
    ),
    "humanities": (
        "Order: key terms / context → source analysis → broader argument → synthesis. "
        "Treat each author or primary source as a cluster."
    ),
    "other": (
        "Order sequentially, grouping tightly related material into coherent modules."
    ),
}


def build_outline_messages(
    *,
    plan_title: str,
    course_type: str,
    sources: List[dict],
) -> list[dict]:
    """Build the outline prompt from one or more labeled uploads.

    `sources` is a list of {filename, content_type, chunks} where chunks are
    numbered globally across the plan via `global_index` on each chunk dict.
    The LLM references these global indices in `source_chunk_indices`.
    """
    file_blocks = []
    for s in sources:
        header = f"=== {s['filename']} ({s.get('content_type') or 'other'}) ==="
        chunk_block = "\n\n".join(
            f"[{c['global_index']}] ({c.get('source_label') or 'source'})\n{c['content']}"
            for c in s["chunks"]
        )
        file_blocks.append(f"{header}\n{chunk_block}")

    ordering = COURSE_ORDERING_GUIDANCE.get(
        course_type, COURSE_ORDERING_GUIDANCE["other"]
    )

    user = (
        f"Course: {plan_title}\n"
        f"Course type: {course_type}\n\n"
        "You are designing one learning journey for the whole course. The "
        "student has uploaded one or more files, each already labeled by "
        "content type (math-textbook / problem-set / slides / narrative / "
        "reference / other). Each chunk has a global index you must reference.\n\n"
        f"Pedagogical ordering for this course type:\n{ordering}\n\n"
        "Design 6 to 12 sequential modules. A module may draw from one file or "
        "span several files when it makes sense (e.g. pull a definition from "
        "the textbook and the matching exercise from the problem set). "
        "Each module should feel like a coherent 10–15 minute study block.\n\n"
        "Return STRICT JSON (no prose, no code fences) matching:\n"
        "{\n"
        '  "modules": [\n'
        '    {\n'
        '      "title": "<= 70 chars, concrete and specific",\n'
        '      "concept_labels": ["<= 5 short concept names"],\n'
        '      "source_chunk_indices": [<global integer indices>]\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        f"Uploaded material:\n\n"
        + "\n\n".join(file_blocks)
    )
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": user},
    ]


# -------------------- extract --------------------

EXTRACT_INSTRUCTIONS = (
    "Distill the KEY IDEAS of this module into a tight markdown note that a "
    "student can read in under 90 seconds. Include: (1) the central "
    "definition(s), (2) the main result or technique, (3) one short worked "
    "micro-example or intuition sentence. Use markdown headings and inline "
    "math where appropriate (write LaTeX inside $...$ or $$...$$). Target "
    "<= 400 words. Do NOT invent material that is not supported by the "
    "excerpts below."
)


def build_extract_messages(
    *,
    module_title: str,
    concept_labels: List[str],
    chunks: List[dict],
) -> list[dict]:
    bullet_excerpts = "\n\n".join(
        f"[{i+1}] ({c.get('source_label') or 'source'})\n{c['content']}"
        for i, c in enumerate(chunks)
    )
    concepts = ", ".join(concept_labels) if concept_labels else "(none specified)"
    user = (
        f"Module: {module_title}\n"
        f"Concepts to cover: {concepts}\n\n"
        f"Instructions:\n{EXTRACT_INSTRUCTIONS}\n\n"
        f"Source excerpts:\n\n{bullet_excerpts}"
    )
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": user},
    ]


# -------------------- checkpoints --------------------

CHECKPOINT_KIND_SPECS = {
    "concept-check": (
        "Short free-response that probes understanding. Expected answer is 1-3 "
        'sentences. Include a `"rubric"` describing what a correct answer must '
        "name (concepts, relationships, or distinctions)."
    ),
    "problem": (
        "A non-trivial applied problem the student must solve. Include a "
        '`"rubric"` describing the key reasoning steps and the final result '
        "a correct solution must contain."
    ),
    "multiple-choice": (
        "One question with exactly 4 options. Only one is correct. Include "
        '`"choices": [{"id": "a", "text": "..."}, {"id": "b", ...}, ...]` and '
        '`"answer_key": "<the id of the correct option>"`. The incorrect '
        "options must be plausible distractors drawn from common misconceptions."
    ),
    "true-false-why": (
        "A True/False claim followed by: 'Explain why in one sentence.' The "
        '`"rubric"` MUST describe what a correct one-sentence justification '
        "needs to say (not just the True/False answer)."
    ),
    "spot-the-error": (
        "A short worked attempt (3-6 lines) containing exactly ONE wrong step. "
        "Ask: 'Which step is wrong and why?' Include a `\"rubric\"` naming the "
        "exact wrong step and the reason."
    ),
    "complete-the-step": (
        "A worked solution with ONE step blanked out as `___`. Ask the student "
        "to supply the missing step. Include a `\"rubric\"` describing the "
        "semantic content the missing step must have (not just surface syntax)."
    ),
}


def _spec_block(kinds: List[str]) -> str:
    lines = []
    for k in kinds:
        if k not in CHECKPOINT_KIND_SPECS:
            continue
        lines.append(f"- **{k}**: {CHECKPOINT_KIND_SPECS[k]}")
    return "\n".join(lines)


def build_checkpoints_messages(
    *,
    module_title: str,
    key_extract: str,
    concept_labels: List[str],
    required_kinds: List[str],
) -> list[dict]:
    specs = _spec_block(required_kinds)
    kinds_json = ", ".join(f'"{k}"' for k in required_kinds)
    concepts = ", ".join(concept_labels) if concept_labels else "(none specified)"

    user = (
        f"Module: {module_title}\n"
        f"Concepts: {concepts}\n\n"
        f"Key extract the student just read:\n---\n{key_extract}\n---\n\n"
        f"Produce exactly {len(required_kinds)} checkpoint questions. Each one "
        f"must use one of the following kinds, in order: [{kinds_json}].\n\n"
        f"Kind specifications:\n{specs}\n\n"
        "Return STRICT JSON (no prose, no code fences) matching:\n"
        "{\n"
        '  "checkpoints": [\n'
        '    {\n'
        '      "kind": "<one of the kinds above>",\n'
        '      "question": "<the question as the student will see it>",\n'
        '      "rubric": "<null for multiple-choice; required otherwise>",\n'
        '      "choices": [{"id": "a", "text": "..."}] | null,\n'
        '      "answer_key": "<choice id for MCQ; null otherwise>"\n'
        "    }\n"
        "  ]\n"
        "}\n"
        "Grounding: use ONLY the key extract above. Do not invent new material."
    )
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": user},
    ]


# -------------------- spaced recall --------------------

def build_spaced_recall_messages(
    *,
    current_module_title: str,
    current_concepts: List[str],
    current_extract: str,
    prior_module_title: str,
    prior_concepts: List[str],
    base_kind: str,
) -> list[dict]:
    spec = CHECKPOINT_KIND_SPECS.get(base_kind, CHECKPOINT_KIND_SPECS["problem"])
    user = (
        f"Current module: {current_module_title}\n"
        f"Current concepts: {', '.join(current_concepts) or '(none)'}\n\n"
        f"Prior module to reconnect: {prior_module_title}\n"
        f"Prior concepts: {', '.join(prior_concepts) or '(none)'}\n\n"
        f"Current extract:\n---\n{current_extract}\n---\n\n"
        f"Produce ONE 'spaced-recall' checkpoint in the `{base_kind}` format. "
        f"Format spec:\n{spec}\n\n"
        "The question MUST explicitly connect at least one current concept to "
        "at least one prior concept — e.g. 'Using {prior concept}, show that "
        "{current concept}...'. The student should not be able to answer "
        "without recalling the prior concept.\n\n"
        "Return STRICT JSON (no prose, no code fences) matching:\n"
        "{\n"
        '  "kind": "spaced-recall",\n'
        f'  "base_kind": "{base_kind}",\n'
        '  "question": "<the question>",\n'
        '  "rubric": "<null for multiple-choice; required otherwise>",\n'
        '  "choices": [{"id": "a", "text": "..."}] | null,\n'
        '  "answer_key": "<choice id for MCQ; null otherwise>",\n'
        '  "linked_concept_labels": ["<prior concept labels referenced>"]\n'
        "}"
    )
    return [
        {"role": "system", "content": SYSTEM_BASE},
        {"role": "user", "content": user},
    ]


# -------------------- grader --------------------

GRADER_SYSTEM = (
    "You are a strict but fair grader for a Dartmouth student practicing from "
    "their own course material. Score the answer against the rubric from 0.00 "
    "to 1.00 (two decimals). A 1.00 is complete and correct; 0.50 is "
    "partially correct or missing a key piece; 0.00 is wrong or missing. "
    "Provide one short feedback sentence (<= 220 chars) that tells the student "
    "specifically what to fix or confirm, grounded in the rubric. Do NOT "
    "reveal the full rubric verbatim. Respond ONLY with strict JSON."
)


def build_grader_messages(
    *,
    kind: str,
    question: str,
    rubric: str,
    answer: str,
) -> list[dict]:
    user = (
        f"Checkpoint kind: {kind}\n\n"
        f"Question:\n{question}\n\n"
        f"Rubric (internal — do not quote verbatim):\n{rubric}\n\n"
        f"Student answer:\n{answer}\n\n"
        'Return exactly: {"score": <0..1 with 2 decimals>, "feedback": "<=220 chars"}'
    )
    return [
        {"role": "system", "content": GRADER_SYSTEM},
        {"role": "user", "content": user},
    ]


# -------------------- mix policy --------------------

# Per-course-type pools. Each entry is (warmup, apply, rotate).
_MIX_POOLS = {
    "math": (
        ["multiple-choice", "concept-check"],
        ["problem", "complete-the-step"],
        ["spot-the-error", "true-false-why"],
    ),
    "science": (
        ["multiple-choice", "concept-check"],
        ["problem", "complete-the-step"],
        ["spot-the-error", "true-false-why"],
    ),
    "cs": (
        ["multiple-choice", "concept-check"],
        ["problem", "complete-the-step"],
        ["spot-the-error", "true-false-why"],
    ),
    "reading": (
        ["concept-check", "multiple-choice"],
        ["concept-check", "true-false-why"],
        ["spot-the-error", "problem"],
    ),
    "humanities": (
        ["concept-check", "multiple-choice"],
        ["concept-check", "true-false-why"],
        ["spot-the-error", "problem"],
    ),
    "other": (
        ["multiple-choice", "concept-check"],
        ["problem", "complete-the-step"],
        ["true-false-why", "spot-the-error"],
    ),
}


def mix_for_module(
    *, module_ordinal: int, seed: str, course_type: str = "other"
) -> List[str]:
    """Deterministic mix of 3 base checkpoint kinds for a module.

    Pools are selected by `course_type` so math-style courses bias toward
    problems and complete-the-step while reading courses bias toward
    conceptual articulation.
    """
    warmup_pool, apply_pool, rotate_pool = _MIX_POOLS.get(
        course_type, _MIX_POOLS["other"]
    )
    h = sum(ord(c) for c in seed) + module_ordinal
    warmup = warmup_pool[h % len(warmup_pool)]
    apply_ = apply_pool[(h // 7) % len(apply_pool)]
    rotate = rotate_pool[(h // 13) % len(rotate_pool)]
    return [warmup, apply_, rotate]


def should_add_spaced_recall(*, module_ordinal: int) -> bool:
    return module_ordinal > 0 and module_ordinal % 3 == 0


def pick_spaced_recall_base_kind(*, seed: str, module_ordinal: int) -> str:
    h = sum(ord(c) for c in seed) + module_ordinal
    pool = ["problem", "concept-check", "true-false-why"]
    return pool[h % len(pool)]


def pick_prior_module_ordinal(
    *, current_ordinal: int, seed: str
) -> Optional[int]:
    if current_ordinal <= 0:
        return None
    h = sum(ord(c) for c in seed) + current_ordinal
    # pick from [0 .. current_ordinal - 1]
    return h % current_ordinal
