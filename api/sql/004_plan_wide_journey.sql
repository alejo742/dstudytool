-- Journeys become plan-scoped (one per plan) instead of per-upload.
-- No real users yet; this is a destructive migration and existing rows are
-- cleared so the new uniqueness constraint can be applied cleanly.

-- Clear existing rows so dependent indexes / constraints don't collide and so
-- the (user_id, plan_id) unique holds.
truncate table public.learning_journeys cascade;

-- Drop the FK + index + unique constraint tied to upload_id. We don't know the
-- auto-generated unique constraint name, so look it up by column membership.
do $$
declare
  cname text;
begin
  for cname in
    select con.conname
    from pg_constraint con
    join pg_class t on t.oid = con.conrelid
    where t.relname = 'learning_journeys'
      and con.contype = 'u'
      and exists (
        select 1
        from unnest(con.conkey) ck
        join pg_attribute a
          on a.attrelid = con.conrelid and a.attnum = ck
        where a.attname = 'upload_id'
      )
  loop
    execute format('alter table public.learning_journeys drop constraint %I', cname);
  end loop;
end
$$;

drop index if exists public.learning_journeys_upload_id_idx;

alter table public.learning_journeys
  drop column if exists upload_id;

alter table public.learning_journeys
  add constraint learning_journeys_user_plan_unique unique (user_id, plan_id);

-- Store the derived course type on the journey so lazy module generation can
-- select the right checkpoint mix pool without re-aggregating uploads.
alter table public.learning_journeys
  add column if not exists course_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'learning_journeys_course_type_check'
  ) then
    alter table public.learning_journeys
      add constraint learning_journeys_course_type_check
      check (course_type is null or course_type in
        ('reading','math','science','humanities','cs','other'));
  end if;
end
$$;
