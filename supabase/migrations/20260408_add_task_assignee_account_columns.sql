alter table public.vcontent_tasks
  add column if not exists assignee_profile_id text null,
  add column if not exists assignee_account_id uuid null;

create index if not exists vcontent_tasks_assignee_profile_id_idx
  on public.vcontent_tasks (assignee_profile_id);

create index if not exists vcontent_tasks_assignee_account_id_idx
  on public.vcontent_tasks (assignee_account_id);
