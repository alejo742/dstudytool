# api

FastAPI backend for the study tool.

## Run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.local
# fill vars, then:
uvicorn app.main:app --reload --port 8000
```

OpenAPI docs at http://localhost:8000/docs.

## Native dependencies for extraction

- **tesseract** — image OCR (`brew install tesseract` on macOS).
- **poppler** — `pdf2image` renders PDF pages for OCR fallback
  (`brew install poppler`).

Without either, uploads still work; PDF text layers still extract via
`pdfplumber` + `pypdf`, but image-heavy slides and standalone images won't
yield text.

## Feature layout

```
app/
├── main.py            # FastAPI app, CORS, routers
├── config.py          # pydantic-settings
├── core/
│   ├── auth.py        # Supabase JWT verification + domain gate
│   ├── supabase_client.py
│   └── crypto.py      # Fernet encrypt/decrypt for user secrets
└── features/
    ├── plans/
    ├── uploads/            # file ingest, local storage, background extraction
    ├── extraction/         # pluggable extractors + chunker
    ├── generation/         # ChatDartmouth prompting + dedupe
    └── api_keys/           # per-user Dartmouth Chat key
```

Each feature follows: `router.py` (HTTP), `service.py` (orchestration),
`repository.py` (Supabase I/O), `schemas.py` (pydantic). Keep it that way.
