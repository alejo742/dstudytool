from __future__ import annotations

import logging
from pathlib import Path

from app.features.extraction.extractors.base import ExtractedChunk, ExtractionResult

log = logging.getLogger(__name__)


class ImageExtractor:
    def can_handle(self, mime: str, path: Path) -> bool:
        return mime.startswith("image/") or path.suffix.lower() in {
            ".png",
            ".jpg",
            ".jpeg",
            ".bmp",
            ".tiff",
            ".webp",
        }

    def extract(self, path: Path, filename: str) -> ExtractionResult:
        try:
            from PIL import Image
            import pytesseract
        except Exception as e:
            raise RuntimeError(
                "Image OCR requires pillow and pytesseract to be installed, "
                "and the tesseract binary on the system path."
            ) from e

        img = Image.open(str(path))
        text = pytesseract.image_to_string(img).strip()
        chunks = (
            [ExtractedChunk(text=text, page=1, source_label=filename)] if text else []
        )
        return ExtractionResult(chunks=chunks, pages=1)
