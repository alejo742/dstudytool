-- AI-assigned labels on uploads. Powers course-type-aware journey outlining
-- and in-UI content badges. All columns nullable so historical rows survive
-- without a backfill — the resolver treats missing labels as 'other'/'other'.

alter table public.uploads
  add column if not exists content_type text,
  add column if not exists course_type text,
  add column if not exists labels_generated_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'uploads_content_type_check'
  ) then
    alter table public.uploads
      add constraint uploads_content_type_check
      check (content_type is null or content_type in
        ('narrative','math-textbook','problem-set','slides','reference','other'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'uploads_course_type_check'
  ) then
    alter table public.uploads
      add constraint uploads_course_type_check
      check (course_type is null or course_type in
        ('reading','math','science','humanities','cs','other'));
  end if;
end
$$;

create index if not exists uploads_course_type_idx on public.uploads(course_type);
