-- Fix Currency: Update all settings to use 'AKZ'
UPDATE settings SET currency = 'AKZ' WHERE currency != 'AKZ';
ALTER TABLE settings ALTER COLUMN currency SET DEFAULT 'AKZ';

-- Fix Typo in Categories: Change 'grelhoe' to 'Grelhados'
UPDATE menu_categories SET name = 'Grelhados' WHERE name ILIKE 'grelhoe';

-- Ensure Public Access for Digital Menu (Cloud Pratos)
-- Enable RLS on tables if not already enabled
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON dishes;
DROP POLICY IF EXISTS "Enable read access for all users" ON menu_categories;
DROP POLICY IF EXISTS "Public read access" ON dishes;
DROP POLICY IF EXISTS "Public read access" ON menu_categories;

-- Create policies allowing public read access (anon role)
CREATE POLICY "Public read access" ON dishes FOR SELECT TO anon USING (true);
CREATE POLICY "Public read access" ON menu_categories FOR SELECT TO anon USING (true);

-- Also ensure authenticated users can read
CREATE POLICY "Authenticated read access" ON dishes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON menu_categories FOR SELECT TO authenticated USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'dishes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dishes;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'menu_categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE menu_categories;
  END IF;
END $$;
