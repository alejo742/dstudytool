from __future__ import annotations

import logging
from pathlib import Path
from typing import List

from app.features.extraction.extractors.base import ExtractedChunk, ExtractionResult

log = logging.getLogger(__name__)

# OCR fallback is attempted when a page has fewer than this many chars.
OCR_FALLBACK_THRESHOLD = 40


class PdfExtractor:
    def can_handle(self, mime: str, path: Path) -> bool:
        return mime == "application/pdf" or path.suffix.lower() == ".pdf"

    def extract(self, path: Path, filename: str) -> ExtractionResult:
        chunks: List[ExtractedChunk] = []
        page_count = 0

        try:
            import pdfplumber

            with pdfplumber.open(str(path)) as pdf:
                page_count = len(pdf.pages)
                for i, page in enumerate(pdf.pages, start=1):
                    text = (page.extract_text() or "").strip()
                    if len(text) < OCR_FALLBACK_THRESHOLD:
                        ocr_text = _ocr_page(path, i)
                        if ocr_text and len(ocr_text) > len(text):
                            text = ocr_text
                    if text:
                        chunks.append(
                            ExtractedChunk(
                                text=text,
                                page=i,
                                source_label=f"{filename} · p. {i}",
                            )
                        )
        except Exception as e:
            log.warning("pdfplumber failed on %s: %s", filename, e)
            # fallback to pypdf
            try:
                from pypdf import PdfReader

                reader = PdfReader(str(path))
                page_count = len(reader.pages)
                for i, page in enumerate(reader.pages, start=1):
                    text = (page.extract_text() or "").strip()
                    if len(text) < OCR_FALLBACK_THRESHOLD:
                        ocr_text = _ocr_page(path, i)
                        if ocr_text and len(ocr_text) > len(text):
                            text = ocr_text
                    if text:
                        chunks.append(
                            ExtractedChunk(
                                text=text,
                                page=i,
                                source_label=f"{filename} · p. {i}",
                            )
                        )
            except Exception as e2:
                log.exception("Both pdfplumber and pypdf failed: %s", e2)
                raise

        return ExtractionResult(chunks=chunks, pages=page_count)


def _ocr_page(path: Path, page_num: int) -> str | None:
    """OCR a single PDF page via pdf2image + pytesseract. Returns None if
    either dependency is missing — the caller falls back to the text layer."""
    try:
        from pdf2image import convert_from_path
        import pytesseract
    except Exception:  # pragma: no cover
        return None
    try:
        images = convert_from_path(
            str(path),
            first_page=page_num,
            last_page=page_num,
            dpi=200,
        )
        if not images:
            return None
        return pytesseract.image_to_string(images[0]).strip() or None
    except Exception as e:
        log.warning("OCR failed on %s p.%s: %s", path.name, page_num, e)
        return None
