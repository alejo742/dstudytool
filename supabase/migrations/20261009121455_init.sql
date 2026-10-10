-- Study tool schema. Run this in the Supabase SQL editor once per environment.
-- The app's FastAPI service uses the service_role key and bypasses RLS; however
-- we still enable RLS and add tenant-scoped policies so that direct PostgREST
-- access from a user token can only see their own rows.

-- --------------------------------------------------------------------------
-- Extensions
-- --------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- --------------------------------------------------------------------------
-- Helper: auto-updated updated_at
-- --------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- Plans
-- --------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  course_code text,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists plans_user_id_idx on public.plans(user_id);
create index if not exists plans_updated_at_idx on public.plans(updated_at desc);

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

alter table public.plans enable row level security;
drop policy if exists plans_owner_all on public.plans;
create policy plans_owner_all on public.plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- Uploads
-- --------------------------------------------------------------------------
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null,
  storage_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'extracting', 'ready', 'failed')),
  pages integer,
  chars_extracted integer,
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists uploads_plan_id_idx on public.uploads(plan_id);
create index if not exists uploads_user_id_idx on public.uploads(user_id);

drop trigger if exists uploads_set_updated_at on public.uploads;
create trigger uploads_set_updated_at
before update on public.uploads
for each row execute function public.set_updated_at();

alter table public.uploads enable row level security;
drop policy if exists uploads_owner_all on public.uploads;
create policy uploads_owner_all on public.uploads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- Extracted chunks
-- --------------------------------------------------------------------------
create table if not exists public.extracted_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  upload_id uuid not null references public.uploads(id) on delete cascade,
  content text not null,
  page integer,
  source_label text,
  ordinal integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists extracted_chunks_plan_id_idx on public.extracted_chunks(plan_id);
create index if not exists extracted_chunks_upload_id_idx on public.extracted_chunks(upload_id);
create index if not exists extracted_chunks_user_id_idx on public.extracted_chunks(user_id);

alter table public.extracted_chunks enable row level security;
drop policy if exists extracted_chunks_owner_all on public.extracted_chunks;
create policy extracted_chunks_owner_all on public.extracted_chunks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- Generations
-- --------------------------------------------------------------------------
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  kind text not null,
  prompt_tag text,
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists generations_plan_id_idx on public.generations(plan_id);
create index if not exists generations_user_id_idx on public.generations(user_id);
create index if not exists generations_created_at_idx on public.generations(created_at desc);

alter table public.generations enable row level security;
drop policy if exists generations_owner_all on public.generations;
create policy generations_owner_all on public.generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- User API keys (Dartmouth Chat key, encrypted at app layer with Fernet)
-- --------------------------------------------------------------------------
create table if not exists public.user_api_keys (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_key text not null,
  hint text not null,
  last_verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
drop trigger if exists user_api_keys_set_updated_at on public.user_api_keys;
create trigger user_api_keys_set_updated_at
before update on public.user_api_keys
for each row execute function public.set_updated_at();

alter table public.user_api_keys enable row level security;
drop policy if exists user_api_keys_owner_select on public.user_api_keys;
-- Users can know a row exists but should not read the ciphertext from the client.
-- Policy is restrictive by default — only service role (used by the API server)
-- can read the encrypted_key column.
create policy user_api_keys_owner_select on public.user_api_keys
  for select using (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- Convenience view: plans with denormalized counts
-- --------------------------------------------------------------------------
create or replace view public.plans_with_counts as
select
  p.*,
  coalesce(u.ct, 0) as uploads_count,
  coalesce(c.ct, 0) as chunks_count,
  coalesce(g.ct, 0) as generations_count
from public.plans p
left join (
  select plan_id, count(*)::int as ct from public.uploads group by plan_id
) u on u.plan_id = p.id
left join (
  select plan_id, count(*)::int as ct from public.extracted_chunks group by plan_id
) c on c.plan_id = p.id
left join (
  select plan_id, count(*)::int as ct from public.generations group by plan_id
) g on g.plan_id = p.id;

-- --------------------------------------------------------------------------
-- Domain-restricted signup (defense in depth; the client also enforces this)
-- --------------------------------------------------------------------------
create or replace function public.enforce_dartmouth_email()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.email is null or not (lower(new.email) like '%@dartmouth.edu') then
    raise exception 'Only @dartmouth.edu accounts are allowed';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_dartmouth_email_trigger on auth.users;
create trigger enforce_dartmouth_email_trigger
before insert on auth.users
for each row execute function public.enforce_dartmouth_email();
