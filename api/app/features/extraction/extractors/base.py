from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List, Protocol


@dataclass
class ExtractedChunk:
    text: str
    page: int | None = None
    source_label: str = ""  # e.g. "slides.pdf · p. 12"


@dataclass
class ExtractionResult:
    chunks: List[ExtractedChunk]
    pages: int | None = None

    @property
    def total_chars(self) -> int:
        return sum(len(c.text) for c in self.chunks)


class Extractor(Protocol):
    def can_handle(self, mime: str, path: Path) -> bool: ...
    def extract(self, path: Path, filename: str) -> ExtractionResult: ...
