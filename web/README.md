# web

React Router v7 (SPA mode) + Tailwind v4 + three.js + motion.

## Run

```bash
npm install
cp .env.example .env.local
# fill VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY / VITE_API_URL
npm run dev
```

## Feature layout

```
app/
├── root.tsx
├── routes.ts
├── app.css              # Tailwind v4 theme + base
├── features/
│   ├── landing/
│   ├── auth/            # Supabase Google OAuth
│   ├── plans/
│   ├── uploads/
│   ├── study/
│   └── settings/
└── shared/
    ├── lib/             # supabase client, api fetcher, env, cn
    ├── components/
    │   ├── ui/          # Button, Input, Field, Card, Dialog, Skeleton...
    │   ├── layout/      # AppShell, Page
    │   └── three/       # OrbitalHero
    └── types/
```

Each feature folder owns its routes, components, services, and hooks.
Shared primitives live under `shared/`.

## Auth

- `AuthProvider` listens to Supabase and routes users to `/login` if they're
  signed out.
- `GoogleButton` kicks off `supabase.auth.signInWithOAuth({ provider: "google" })`
  with `hd=dartmouth.edu` and sends users to Supabase's own callback.
- Supabase then redirects back to `/auth/callback?next=…`, where we just
  wait for the session, verify the email domain, and send the user on.

Do **not** build your own OAuth redirect endpoint. Supabase handles the
PKCE/code exchange on its own domain; the client picks up the session when
the browser returns.
