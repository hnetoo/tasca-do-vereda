-- Financial transactions unified view and basic RLS
create or replace view public.financial_transactions as
select
  r.id::text as id,
  r.created_at::timestamptz as date,
  r.amount::numeric as amount,
  r.description::text as description,
  coalesce(r.category, 'REVENUE')::text as category,
  'REVENUE'::text as type,
  coalesce(r.status, 'COMPLETED')::text as status
from public.revenues r
union all
select
  e.id::text as id,
  e.created_at::timestamptz as date,
  e.amount::numeric as amount,
  e.description::text as description,
  coalesce(e.category, 'EXPENSE')::text as category,
  'EXPENSE'::text as type,
  coalesce(e.status, 'COMPLETED')::text as status
from public.expenses e;

alter view public.financial_transactions owner to postgres;

-- Enable RLS on source tables if not already
alter table if exists public.revenues enable row level security;
alter table if exists public.expenses enable row level security;

-- Allow read-only access for anon (adjust as needed for your project)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'revenues' and policyname = 'revenue_read_anon'
  ) then
    create policy revenue_read_anon on public.revenues
      for select
      to anon
      using (true);
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'expenses' and policyname = 'expense_read_anon'
  ) then
    create policy expense_read_anon on public.expenses
      for select
      to anon
      using (true);
  end if;
end $$;

-- Realtime publication
-- Ensure the public schema/tables are in the supabase_realtime publication
alter publication supabase_realtime add table public.revenues;
alter publication supabase_realtime add table public.expenses;

