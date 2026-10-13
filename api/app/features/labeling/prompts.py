from __future__ import annotations

CONTENT_TYPES = (
    "narrative",      # a short story, chapter of a novel, essay
    "math-textbook",  # chapter with definitions, theorems, worked examples
    "problem-set",    # mostly exercises; little exposition
    "slides",         # lecture slide deck (short bullets, visual-heavy)
    "reference",      # cheat sheet, formula list, glossary, syllabus
    "other",          # catch-all
)

COURSE_TYPES = (
    "reading",     # English, lit, writing, close reading
    "math",        # pure/applied math
    "science",     # physics / chem / bio / engineering
    "humanities",  # history, philosophy, politics, art theory
    "cs",          # programming, algorithms, systems
    "other",
)


SYSTEM = (
    "You classify uploaded course material for a Dartmouth study tool. "
    "You respond ONLY with strict JSON matching the requested schema. "
    "You never invent fields and you never add commentary. If a document "
    "truly does not fit the taxonomy, choose 'other'."
)


def build_labeling_messages(*, filename: str, sample_text: str) -> list[dict]:
    content_types = ", ".join(f'"{c}"' for c in CONTENT_TYPES)
    course_types = ", ".join(f'"{c}"' for c in COURSE_TYPES)

    user = (
        f"Filename: {filename}\n\n"
        f"Sample of the extracted text (first few thousand characters):\n"
        f"---\n{sample_text}\n---\n\n"
        f"Classify this upload. Pick exactly ONE value for each field.\n\n"
        f"Allowed content_type: [{content_types}]\n"
        f"Allowed course_type:  [{course_types}]\n\n"
        'Return exactly: {"content_type": "<one of the above>", '
        '"course_type": "<one of the above>", '
        '"rationale": "<<= 160 chars explaining your pick>"}'
    )
    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": user},
    ]


def coerce_content_type(value: str | None) -> str:
    v = (value or "").strip().lower()
    return v if v in CONTENT_TYPES else "other"


def coerce_course_type(value: str | None) -> str:
    v = (value or "").strip().lower()
    return v if v in COURSE_TYPES else "other"
