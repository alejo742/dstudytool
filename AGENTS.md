# AGENTS.md

Orientation for any agent (Claude, Codex, Cursor, etc.) opening this repo.
Read this file first.

## What this is

A study tool for Dartmouth students: upload course materials (PDFs, slides,
images, DOCX), then study from an unlimited stream of practice problems
grounded in that material. Uses Dartmouth-hosted LLMs; students bring their
own Dartmouth Chat API key.

Access is restricted to `@dartmouth.edu` Google sign-in. Auth via Supabase.

## Layout

```
api/                FastAPI backend (uploads, extraction, generation)
web/                React Router v8 + Vite + Tailwind v4 frontend (SPA mode)
  app/
    features/      Feature folders (auth, landing, plans, uploads, study, settings)
    shared/        Shared components, lib, types
    app.css        Design tokens + utility classes (see below)
    root.tsx       Root layout + ErrorBoundary + HydrateFallback
  public/          Static assets
  style.html       Read-only inspiration — "Quant Playbook" style reference
  style-guide.html Living style guide for this project (open in browser directly)
PLAN.md / BACKLOG.md / LOG.md / STACK.md   Project docs
```

## Stack

- Frontend: React 19, React Router v8 (`ssr: false`, SPA mode), Tailwind v4,
  motion/react, lucide-react, sonner, three.js (one hero scene).
- Backend: FastAPI, Supabase (Postgres + auth + storage).
- See `STACK.md` for deeper detail.

## Design system

The site uses a "quant notebook / paper" aesthetic — bold Barlow Condensed
headings, Source Serif 4 body, flat hard-bordered panels, 2px corners, hard
offset "stamp" shadows, grid textures on backdrops. **`web/style-guide.html`
is the source of truth** — open it directly in a browser (no server) to see
every component. Match that look when adding UI.

Design tokens are defined in `web/app/app.css` under `@theme`:

- Colors: `paper`, `paper2`, `ink`, `ink2`, `ink3`, `rule`, `blue`,
  `blue-wash`, `red`, `red-wash`, `hl` (yellow), `hl-wash`, `green`,
  `green-wash`. Use via Tailwind utilities (`bg-paper2`, `text-ink2`,
  `border-ink`, etc.).
- Fonts: `font-head` (Barlow Condensed), `font-sans`/`font-serif` (Source
  Serif 4 — same family both aliases), `font-hand` (Caveat),
  `font-mono` (JetBrains Mono).
- Reusable class components defined in `app.css`: `.btn`, `.btn-pri`,
  `.btn-danger`, `.btn-ghost`, `.btn-sm`, `.btn-lg`, `.input`, `.callout`
  with `.callout-{hl,blue,red,green}`, `.frame`, `.frame-head`, `.frame-foot`,
  `.shadow-brut`, `.shadow-brut-sm`, `.bg-grid`, `.bg-grid-sm`, `.eyebrow`,
  `.hand`.
- Legacy `ink-50..ink-950` and `accent-*` scales are aliased for back-compat;
  prefer the new names in new code.

Don't: add rounded corners above 2px, add drop shadows other than
`shadow-brut`, add new font families without updating the style guide and
`root.tsx` link tag.

## Working rules

1. **Before claiming anything is done**, run `cd web && npm run build`.
   The build must pass with no errors. If a Tailwind utility class doesn't
   appear in the generated CSS, that class doesn't exist — fix the token or
   the class name.
2. **For UI work**, also run `cd web && npm run dev` and smoke-test `/`,
   `/login`, `/plans`, `/plans/:id`, `/plans/:id/study`, `/settings`. Watch
   the browser console. A clean build is necessary but not sufficient.
3. **Match the style guide** before inventing new patterns. If what you need
   isn't there, add it to `web/style-guide.html` first.
4. **SPA mode**: `web/react-router.config.ts` has `ssr: false`. Any route
   that'd produce a blank initial render should be covered by the
   `HydrateFallback` in `root.tsx`, or add a route-level fallback.
5. **Secrets**: never commit `.env*`. Supabase keys follow the new naming —
   `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend), `SUPABASE_SECRET_KEY` /
   service role (backend). Do not use the deprecated `SUPABASE_ANON_KEY`
   name.
6. **Backend proximity**: the frontend's `env.API_URL` is read in
   `web/app/shared/lib/env.ts`. Backend lives in `api/`.

## Commands

```sh
# frontend
cd web
npm install
npm run dev          # vite dev at http://localhost:5173
npm run build        # production SPA build
npm run typecheck    # tsc + route typegen

# backend
cd api
# see api/README.md
```

## When in doubt

- Design question → open `web/style-guide.html`.
- Where does X live? → `PLAN.md` and the folder structure above.
- What's the plan? → `PLAN.md`, `BACKLOG.md`.
- What recently changed? → `LOG.md` and `git log`.
