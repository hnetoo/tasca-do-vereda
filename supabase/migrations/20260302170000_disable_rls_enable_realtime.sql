-- Disable RLS and drop all policies for all public tables
DO $$ 
DECLARE 
  r RECORD;
  p RECORD;
BEGIN
  -- Drop all policies in public schema
  FOR p IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', p.policyname, p.schemaname, p.tablename);
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
DO $$
DECLARE
  tbl RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    BEGIN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.' || quote_ident(tbl.tablename) || ';';
      RAISE NOTICE 'Realtime enabled for table: %', tbl.tablename;
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'Table % is already in publication, skipping.', tbl.tablename;
    END;
  END LOOP;
END $$;
