# SQL

Run `001_init.sql` once per Supabase environment, from the SQL editor in the
Supabase dashboard.

The schema:

- `plans` — one per course.
- `uploads` — a file that belongs to a plan; carries its own extraction status.
- `extracted_chunks` — the retrievable text extracted from an upload.
- `generations` — practice material produced for a plan.
- `user_api_keys` — the user's Dartmouth Chat API key, encrypted with Fernet
  before it reaches the database.
- `plans_with_counts` — a view the API reads from to display counts on cards.

Row-level security is enabled on every table and only owners can see their own
rows. The FastAPI server uses the service-role key so it can write cross-cutting
updates (extraction status, generation counts), but every repository function
filters by `user_id` as defense in depth.

The `enforce_dartmouth_email` trigger rejects signups whose email doesn't end
in `@dartmouth.edu`. The web client also enforces this at the Google OAuth
step via the `hd=dartmouth.edu` query param and a post-signin check.
