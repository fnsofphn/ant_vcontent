create table if not exists public.vcontent_lecturer_question_sets (
  id text primary key,
  code text not null unique,
  name text not null,
  description text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vcontent_lecturer_question_sets_status_check'
  ) then
    alter table public.vcontent_lecturer_question_sets
      add constraint vcontent_lecturer_question_sets_status_check
      check (status in ('active', 'draft'));
  end if;
end $$;

create table if not exists public.vcontent_lecturer_question_set_sections (
  id text primary key,
  question_set_id text not null references public.vcontent_lecturer_question_sets(id) on delete cascade,
  code text not null,
  title text not null,
  subtitle text not null default '',
  max_score integer not null default 0,
  question_count integer not null default 0,
  tone text not null default 'warning',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vcontent_lecturer_question_set_sections_tone_check'
  ) then
    alter table public.vcontent_lecturer_question_set_sections
      add constraint vcontent_lecturer_question_set_sections_tone_check
      check (tone in ('danger', 'warning', 'success', 'violet'));
  end if;
end $$;

create table if not exists public.vcontent_lecturer_question_set_questions (
  id text primary key,
  question_set_id text not null references public.vcontent_lecturer_question_sets(id) on delete cascade,
  section_id text not null references public.vcontent_lecturer_question_set_sections(id) on delete cascade,
  code text not null,
  title text not null,
  prompt text not null default '',
  guidance text not null default '',
  max_score integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.vcontent_lecturer_assessment_forms
  add column if not exists question_set_id text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vcontent_lecturer_assessment_forms_question_set_id_fkey'
  ) then
    alter table public.vcontent_lecturer_assessment_forms
      add constraint vcontent_lecturer_assessment_forms_question_set_id_fkey
      foreign key (question_set_id)
      references public.vcontent_lecturer_question_sets(id)
      on delete set null;
  end if;
end $$;

create index if not exists vcontent_lecturer_question_sets_created_at_idx
  on public.vcontent_lecturer_question_sets (created_at desc);

create index if not exists vcontent_lecturer_question_set_sections_question_set_id_idx
  on public.vcontent_lecturer_question_set_sections (question_set_id, sort_order);

create index if not exists vcontent_lecturer_question_set_questions_question_set_id_idx
  on public.vcontent_lecturer_question_set_questions (question_set_id, sort_order);

create index if not exists vcontent_lecturer_assessment_forms_question_set_id_idx
  on public.vcontent_lecturer_assessment_forms (question_set_id);

alter table public.vcontent_lecturer_question_sets enable row level security;
alter table public.vcontent_lecturer_question_set_sections enable row level security;
alter table public.vcontent_lecturer_question_set_questions enable row level security;

drop policy if exists "Authenticated can manage lecturer question sets"
  on public.vcontent_lecturer_question_sets;
create policy "Authenticated can manage lecturer question sets"
  on public.vcontent_lecturer_question_sets
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read active lecturer question sets"
  on public.vcontent_lecturer_question_sets;
create policy "Public can read active lecturer question sets"
  on public.vcontent_lecturer_question_sets
  for select
  to anon, authenticated
  using (status = 'active' or auth.role() = 'authenticated');

drop policy if exists "Authenticated can manage lecturer question set sections"
  on public.vcontent_lecturer_question_set_sections;
create policy "Authenticated can manage lecturer question set sections"
  on public.vcontent_lecturer_question_set_sections
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read lecturer question set sections"
  on public.vcontent_lecturer_question_set_sections;
create policy "Public can read lecturer question set sections"
  on public.vcontent_lecturer_question_set_sections
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.vcontent_lecturer_question_sets sets
      where sets.id = question_set_id
        and (sets.status = 'active' or auth.role() = 'authenticated')
    )
  );

drop policy if exists "Authenticated can manage lecturer question set questions"
  on public.vcontent_lecturer_question_set_questions;
create policy "Authenticated can manage lecturer question set questions"
  on public.vcontent_lecturer_question_set_questions
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read lecturer question set questions"
  on public.vcontent_lecturer_question_set_questions;
create policy "Public can read lecturer question set questions"
  on public.vcontent_lecturer_question_set_questions
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.vcontent_lecturer_question_sets sets
      where sets.id = question_set_id
        and (sets.status = 'active' or auth.role() = 'authenticated')
    )
  );
