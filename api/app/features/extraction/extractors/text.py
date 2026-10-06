from __future__ import annotations

from pathlib import Path

from app.features.extraction.extractors.base import ExtractedChunk, ExtractionResult


class TextExtractor:
    def can_handle(self, mime: str, path: Path) -> bool:
        return mime.startswith("text/") or path.suffix.lower() in {
            ".txt",
            ".md",
            ".markdown",
            ".csv",
            ".tsv",
            ".json",
        }

    def extract(self, path: Path, filename: str) -> ExtractionResult:
        text = path.read_text(encoding="utf-8", errors="replace")
        return ExtractionResult(
            chunks=[ExtractedChunk(text=text, source_label=filename)],
            pages=None,
        )
