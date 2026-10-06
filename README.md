# Study tool

A Dartmouth-only study companion that ingests any format of course material,
extracts what's inside (including image-heavy slide decks), and generates an
unlimited, non-repeating stream of practice grounded in that material. Backed
by Dartmouth-hosted LLMs via `langchain-dartmouth`.

## Layout

```
study-tool/
├── web/          # React Router v7 (SPA) + Tailwind v4 + three.js + motion
└── api/          # FastAPI + Supabase + langchain-dartmouth
```

Each project is self-contained: web talks to the API over HTTPS and talks to
Supabase directly for auth.

## Quick start

### 1. Supabase

Create a Supabase project. In the SQL editor run `api/sql/001_init.sql`. Then
enable Google OAuth under Authentication → Providers:

- Set the authorized client ID / secret from a Google Cloud OAuth consent
  screen configured for `*.supabase.co` redirect URLs. **Do not** override
  Supabase's redirect URL — the client triggers OAuth with
  `supabase.auth.signInWithOAuth` and specifies its own `redirectTo` that
  Supabase will send users to after it finishes.

### 2. Backend

```bash
cd api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env.local
# fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET,
# generate API_KEY_ENCRYPTION_KEY with:
#   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
uvicorn app.main:app --reload --port 8000
```

The server writes uploads to `./.data/uploads` by default.

### 3. Web

```bash
cd web
npm install
cp .env.example .env.local
# fill VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_API_URL
npm run dev
```

Open http://localhost:5173.

## Env variables you'll need from external dashboards

- **Supabase** (dashboard → Settings → API): `SUPABASE_URL`,
  `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`.
- **Google Cloud OAuth** (added inside the Supabase Google provider): client ID
  and client secret for a web OAuth client. The `hd` param restricts the
  consent screen to `dartmouth.edu`.
- **Dartmouth Chat API key**: each user pastes their own in `/settings`;
  nothing to configure globally.

## How it all talks together

```
                 ┌──────────────────────────────────┐
                 │   React Router v7 web (SPA)      │
                 │   - supabase.auth (Google)       │
                 │   - calls FastAPI with JWT       │
                 └───────────────┬──────────────────┘
                                 │ HTTPS
                                 ▼
                 ┌──────────────────────────────────┐
                 │   FastAPI backend                │
                 │   - verifies Supabase JWT (HS256)│
                 │   - plans / uploads / extraction │
                 │   - ChatDartmouth generation     │
                 └───────────────┬──────────────────┘
                                 │ service-role key
                                 ▼
                 ┌──────────────────────────────────┐
                 │           Supabase               │
                 │   Postgres + Auth + (Storage)    │
                 └──────────────────────────────────┘
```

Session lifetime, token refresh, and the OAuth redirect dance are all handled
by the Supabase JS SDK. Dartmouth-domain enforcement happens in three places:
Google (`hd` param), the client (post-signin check), and the database
(trigger on `auth.users`).
