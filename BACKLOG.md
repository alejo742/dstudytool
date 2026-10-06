# Backlog

Ideas and follow-ups that are **not** part of the Section 4 proof-of-concept
definition. Nothing here gets built until the core loop in PLAN.md §4 is
genuinely usable end-to-end.

## Known small debts (not blocking the POC)

- `SUPABASE_PUBLISHABLE_KEY` is unset on the API side. Fine for now because
  no router calls `user_client`. Fill it (or drop `user_client`) once we
  actually need user-scoped Supabase access from the backend.
- Figure out what `DARTMOUTH_CHAT_API_KEY` in `api/.env.local` should do.
  Current design pulls each user's key from `/settings` (Fernet-encrypted).
  Either wire a server-level fallback for the single-user POC or delete the
  env var to avoid drift.

## Section 5 / future (per PLAN.md)

- Vector-DB retrieval over large stored material (pgvector in Supabase).
- Topic coverage tracking — what you've drilled vs. what you haven't.
- Supporting more than one active study plan smoothly in the UI.
- Opening the tool up to other students.
