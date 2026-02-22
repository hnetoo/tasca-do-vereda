-- Emergency migration to open all access to all tables as requested
-- This grants SELECT, INSERT, UPDATE, DELETE permissions to anon and authenticated roles for all tables

DO $$ 
DECLARE 
    tables text[] := ARRAY[
        'attendance_records',
        'cash_shifts',
        'customers',
        'daily_analytics',
        'deliveries',
        'dishes',
        'employees',
        'expenses',
        'menu_categories',
        'notifications',
        'order_items',
        'orders',
        'payroll_records',
        'profiles',
        'reservations',
        'restaurant_tables',
        'transactions',
        'work_shifts',
        'stock_items',
        'suppliers',
        'settings'
    ];
    t text;
BEGIN 
    FOREACH t IN ARRAY tables LOOP 
        -- Enable RLS (required for policies to work, even permissive ones)
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Emergency Public Access" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow anonymous access" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable insert for all users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable update for all users" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable delete for all users" ON %I', t);
        
        -- Create a blanket policy allowing everything
        EXECUTE format('CREATE POLICY "Emergency Public Access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
        
        -- Grant permissions to roles
        EXECUTE format('GRANT ALL ON %I TO anon', t);
        EXECUTE format('GRANT ALL ON %I TO authenticated', t);
        EXECUTE format('GRANT ALL ON %I TO service_role', t);
    END LOOP; 
END $$;
