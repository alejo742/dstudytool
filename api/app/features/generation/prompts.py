from __future__ import annotations

from typing import List

from app.features.generation.schemas import GenerationKind


KIND_INSTRUCTIONS = {
    "problem": (
        "Create ONE non-trivial practice PROBLEM that would actually be worth "
        "working through for an exam in this course. If the subject is "
        "mathematical, derivational, or notation-heavy (math, CS, physics, "
        "stats, engineering), make it a worked-style problem — not a fact "
        "recall question. Include a brief restatement of relevant setup. "
        "If appropriate, finish with a hidden solution behind a line marked `---SOLUTION---`."
    ),
    "concept-check": (
        "Create ONE short concept-check question that probes understanding "
        "(not recall) of an idea covered in the uploaded material. Expect a "
        "1-3 sentence response. Include an `---ANSWER---` section with the "
        "expected key points."
    ),
    "walkthrough": (
        "Produce a tight (<= 250 words) walkthrough that explains ONE "
        "specific technique, derivation, algorithm, or notational convention "
        "that appears in the uploaded material. End with 'Try next:' and a "
        "single prompt the student can attempt."
    ),
    "mixed": (
        "Pick the most useful format for the material in front of you: a "
        "problem, a concept check, or a quick walkthrough. Choose whatever a "
        "serious student would find most valuable right now. Follow the same "
        "formatting conventions used for the specific kinds."
    ),
}


SYSTEM = (
    "You are a focused study companion for a specific Dartmouth course. You "
    "generate ONE practice item at a time, grounded ONLY in the course "
    "material excerpts the user provides. You never invent facts the material "
    "doesn't support, and you never produce content unrelated to the course. "
    "You do not greet or apologize; you output the practice item directly."
)


def build_messages(
    *,
    plan_title: str,
    course_code: str | None,
    kind: GenerationKind,
    excerpts: List[dict],
    recent_generations: List[str],
    hint: str | None,
) -> list[dict]:
    """Return a list of messages for ChatDartmouth.invoke()."""
    bullet_excerpts = "\n\n".join(
        f"[{i+1}] ({e.get('source_label') or 'source'})\n{e['content']}"
        for i, e in enumerate(excerpts)
    )
    avoid_block = ""
    if recent_generations:
        avoid_block = (
            "\n\nAlready produced recently — do NOT produce something similar:\n"
            + "\n---\n".join(recent_generations[:5])
        )

    hint_block = f"\n\nStudent focus hint: {hint}" if hint else ""

    user_msg = (
        f"Course: {plan_title}"
        + (f" ({course_code})" if course_code else "")
        + f"\n\nTask: {KIND_INSTRUCTIONS[kind]}"
        + f"\n\nGround your output ONLY in these excerpts. If they're thin, "
          f"it's better to produce a narrower item than invent new material.\n\n"
        + bullet_excerpts
        + avoid_block
        + hint_block
    )

    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": user_msg},
    ]
