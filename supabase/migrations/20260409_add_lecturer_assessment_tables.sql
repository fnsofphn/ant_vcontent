create table if not exists public.vcontent_lecturer_assessment_forms (
  id text primary key,
  title text not null,
  intro text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  created_by_auth_user_id uuid
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vcontent_lecturer_assessment_forms_status_check'
  ) then
    alter table public.vcontent_lecturer_assessment_forms
      add constraint vcontent_lecturer_assessment_forms_status_check
      check (status in ('active', 'paused'));
  end if;
end $$;

create table if not exists public.vcontent_lecturer_assessment_submissions (
  id text primary key,
  form_id text not null references public.vcontent_lecturer_assessment_forms(id) on delete cascade,
  lecturer_name text not null,
  email text not null,
  phone text,
  years_teaching text,
  notes text,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create index if not exists vcontent_lecturer_assessment_forms_created_at_idx
  on public.vcontent_lecturer_assessment_forms (created_at desc);

create index if not exists vcontent_lecturer_assessment_submissions_form_id_idx
  on public.vcontent_lecturer_assessment_submissions (form_id);

create index if not exists vcontent_lecturer_assessment_submissions_submitted_at_idx
  on public.vcontent_lecturer_assessment_submissions (submitted_at desc);

alter table public.vcontent_lecturer_assessment_forms enable row level security;
alter table public.vcontent_lecturer_assessment_submissions enable row level security;

drop policy if exists "Authenticated can manage lecturer assessment forms"
  on public.vcontent_lecturer_assessment_forms;
create policy "Authenticated can manage lecturer assessment forms"
  on public.vcontent_lecturer_assessment_forms
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Public can read active lecturer assessment forms"
  on public.vcontent_lecturer_assessment_forms;
create policy "Public can read active lecturer assessment forms"
  on public.vcontent_lecturer_assessment_forms
  for select
  to anon
  using (status = 'active');

drop policy if exists "Authenticated can read lecturer assessment submissions"
  on public.vcontent_lecturer_assessment_submissions;
create policy "Authenticated can read lecturer assessment submissions"
  on public.vcontent_lecturer_assessment_submissions
  for select
  to authenticated
  using (true);

drop policy if exists "Public can submit lecturer assessment submissions"
  on public.vcontent_lecturer_assessment_submissions;
create policy "Public can submit lecturer assessment submissions"
  on public.vcontent_lecturer_assessment_submissions
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from public.vcontent_lecturer_assessment_forms forms
      where forms.id = form_id
        and forms.status = 'active'
    )
  );
