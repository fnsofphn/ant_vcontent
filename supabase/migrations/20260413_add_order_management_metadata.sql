alter table public.vcontent_orders
  add column if not exists project_code text null,
  add column if not exists priority text null default 'medium',
  add column if not exists order_type text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vcontent_orders_priority_check'
  ) then
    alter table public.vcontent_orders
      add constraint vcontent_orders_priority_check
      check (priority in ('high', 'medium', 'low'));
  end if;
end $$;

alter table public.vcontent_products
  add column if not exists product_note text null;

create index if not exists vcontent_orders_project_code_idx
  on public.vcontent_orders (project_code);

create index if not exists vcontent_orders_order_type_idx
  on public.vcontent_orders (order_type);
