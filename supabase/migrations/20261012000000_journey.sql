-- Guided-learning "Journey" mode. Adds 5 tables layered on top of plans/uploads/extracted_chunks.
-- Follows the same RLS and updated-at conventions as 001_init.sql.

-- --------------------------------------------------------------------------
-- learning_journeys
-- --------------------------------------------------------------------------
create table if not exists public.learning_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete cascade,
  upload_id uuid not null references public.uploads(id) on delete cascade,
  title text not null,
  status text not null default 'generating'
    check (status in ('generating', 'ready', 'failed')),
  module_count integer not null default 0,
  error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, upload_id)
);
create index if not exists learning_journeys_user_id_idx on public.learning_journeys(user_id);
create index if not exists learning_journeys_plan_id_idx on public.learning_journeys(plan_id);
create index if not exists learning_journeys_upload_id_idx on public.learning_journeys(upload_id);

drop trigger if exists learning_journeys_set_updated_at on public.learning_journeys;
create trigger learning_journeys_set_updated_at
before update on public.learning_journeys
for each row execute function public.set_updated_at();

alter table public.learning_journeys enable row level security;
drop policy if exists learning_journeys_owner_all on public.learning_journeys;
create policy learning_journeys_owner_all on public.learning_journeys
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- journey_modules
-- --------------------------------------------------------------------------
create table if not exists public.journey_modules (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.learning_journeys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ordinal integer not null,
  title text not null,
  concept_labels text[] not null default '{}',
  source_chunk_ids uuid[] not null default '{}',
  key_extract text,
  extract_generated_at timestamptz,
  checkpoints_generated_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  unique (journey_id, ordinal)
);
create index if not exists journey_modules_journey_id_idx on public.journey_modules(journey_id);
create index if not exists journey_modules_user_id_idx on public.journey_modules(user_id);

alter table public.journey_modules enable row level security;
drop policy if exists journey_modules_owner_all on public.journey_modules;
create policy journey_modules_owner_all on public.journey_modules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- module_checkpoints
-- --------------------------------------------------------------------------
create table if not exists public.module_checkpoints (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.journey_modules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ordinal integer not null,
  kind text not null
    check (kind in (
      'concept-check', 'problem', 'multiple-choice',
      'true-false-why', 'spot-the-error', 'complete-the-step',
      'spaced-recall'
    )),
  question text not null,
  rubric text,
  choices jsonb,
  answer_key text,
  linked_concept_labels text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  unique (module_id, ordinal)
);
create index if not exists module_checkpoints_module_id_idx on public.module_checkpoints(module_id);
create index if not exists module_checkpoints_user_id_idx on public.module_checkpoints(user_id);

alter table public.module_checkpoints enable row level security;
drop policy if exists module_checkpoints_owner_all on public.module_checkpoints;
create policy module_checkpoints_owner_all on public.module_checkpoints
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- checkpoint_attempts
-- --------------------------------------------------------------------------
create table if not exists public.checkpoint_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkpoint_id uuid not null references public.module_checkpoints(id) on delete cascade,
  answer text not null,
  score numeric(3,2) not null check (score >= 0 and score <= 1),
  feedback text,
  attempted_at timestamptz not null default timezone('utc', now())
);
create index if not exists checkpoint_attempts_user_id_idx on public.checkpoint_attempts(user_id);
create index if not exists checkpoint_attempts_checkpoint_id_idx on public.checkpoint_attempts(checkpoint_id);
create index if not exists checkpoint_attempts_attempted_at_idx on public.checkpoint_attempts(attempted_at desc);

alter table public.checkpoint_attempts enable row level security;
drop policy if exists checkpoint_attempts_owner_all on public.checkpoint_attempts;
create policy checkpoint_attempts_owner_all on public.checkpoint_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- --------------------------------------------------------------------------
-- journey_progress  (one row per journey; user_id implicit via journey)
-- --------------------------------------------------------------------------
create table if not exists public.journey_progress (
  journey_id uuid primary key references public.learning_journeys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  current_module_ordinal integer not null default 0,
  completed_module_ordinals integer[] not null default '{}',
  last_activity_at timestamptz not null default timezone('utc', now())
);
create index if not exists journey_progress_user_id_idx on public.journey_progress(user_id);

alter table public.journey_progress enable row level security;
drop policy if exists journey_progress_owner_all on public.journey_progress;
create policy journey_progress_owner_all on public.journey_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
