from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import List

from app.features.extraction.extractors.base import ExtractedChunk, ExtractionResult, Extractor
from app.features.extraction.extractors.docx import DocxExtractor
from app.features.extraction.extractors.image import ImageExtractor
from app.features.extraction.extractors.pdf import PdfExtractor
from app.features.extraction.extractors.text import TextExtractor

log = logging.getLogger(__name__)

_EXTRACTORS: List[Extractor] = [
    PdfExtractor(),
    DocxExtractor(),
    ImageExtractor(),
    TextExtractor(),
]

# Rough target chunk size in characters (~800 tokens for English).
TARGET_CHUNK_CHARS = 3200
OVERLAP_CHARS = 200


def extract_file(path: Path, mime: str, filename: str) -> ExtractionResult:
    for ex in _EXTRACTORS:
        if ex.can_handle(mime, path):
            log.info("Extracting %s with %s", filename, ex.__class__.__name__)
            return ex.extract(path, filename)
    raise ValueError(f"No extractor can handle {filename} ({mime})")


def chunk_extracted(result: ExtractionResult) -> List[ExtractedChunk]:
    """Split long per-page/document chunks into retrieval-friendly windows.
    Preserves `source_label` so we can cite the slide/page/doc each piece came from.
    """
    out: List[ExtractedChunk] = []
    for chunk in result.chunks:
        for piece in _slice(chunk.text):
            out.append(
                ExtractedChunk(
                    text=piece,
                    page=chunk.page,
                    source_label=chunk.source_label,
                )
            )
    return out


def _slice(text: str) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= TARGET_CHUNK_CHARS:
        return [text] if text else []
    pieces: List[str] = []
    step = TARGET_CHUNK_CHARS - OVERLAP_CHARS
    i = 0
    while i < len(text):
        end = min(len(text), i + TARGET_CHUNK_CHARS)
        pieces.append(text[i:end])
        if end == len(text):
            break
        i += step
    return pieces
