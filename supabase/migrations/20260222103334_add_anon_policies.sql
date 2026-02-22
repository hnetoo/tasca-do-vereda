
-- Enable RLS and create policies for anonymous access (SELECT, INSERT)

do $$
declare
  tables text[] := array[
    'employees', 'dishes', 'menu_categories', 'restaurant_tables', 
    'customers', 'reservations', 'cash_shifts', 'deliveries', 
    'orders', 'order_items', 'settings', 'products', 
    'revenues', 'expenses', 'attendance_records', 'payroll_records', 
    'dashboard_summary'
  ];
  t text;
begin
  foreach t in array tables loop
    begin
      -- Enable RLS
      execute format('alter table if exists %I enable row level security;', t);
      
      -- Drop existing anon policies if any
      execute format('drop policy if exists "Anon Select" on %I;', t);
      execute format('drop policy if exists "Anon Insert" on %I;', t);
      
      -- Create Anon Select Policy
      execute format('create policy "Anon Select" on %I for select to anon using (true);', t);
      
      -- Create Anon Insert Policy
      execute format('create policy "Anon Insert" on %I for insert to anon with check (true);', t);
      
      -- Grant permissions to anon role
      execute format('grant select, insert on %I to anon;', t);
    exception when others then
      raise notice 'Error processing table %: %', t, sqlerrm;
    end;
  end loop;
end $$;
