-- Disable RLS and drop all policies for all public tables
DO $$ 
DECLARE 
  r RECORD;
  p RECORD;
BEGIN
  -- Drop all policies in public schema
  FOR p IN 
    SELECT schemaname, tablename, polname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', p.polname, p.schemaname, p.tablename);
  END LOOP;

  -- Disable RLS for all tables in public schema
  FOR r IN 
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY;', r.table_schema, r.table_name);
  END LOOP;
END $$;

-- Enable realtime for all tables
CREATE PUBLICATION IF NOT EXISTS supabase_realtime FOR ALL TABLES;
