# Running log

Dated, plain-language notes of what changed and why. Newest on top.
Per PLAN.md §6, every work session should leave a short entry here.

---

## 2026-10-04 — env wiring + Supabase key rename

- Added Supabase credentials and set up Google OAuth in the Supabase project.
- Renamed `anon` key → `publishable` key everywhere, since the legacy
  `anon` naming is deprecated by Supabase in favor of `sb_publishable_…`.
  Touched: `web/app/shared/lib/env.ts`, `web/app/shared/lib/supabase.ts`,
  `api/app/config.py`, `api/app/core/supabase_client.py`, both READMEs,
  both `.env.example` files.
- Generated and set a Fernet `API_KEY_ENCRYPTION_KEY` in `api/.env.local`
  so user-supplied Dartmouth Chat keys can be stored at rest.
- API settings now load clean: `supabase_ready=True`, encryption on.
- `supabase_publishable_key` is unset on the API side; harmless for now
  since `user_client` isn't called by any router. Deferred to BACKLOG.

Next: boot API + web, confirm `/health` is green, run the full flow —
create plan → upload a real deck → wait for extraction → generate.
