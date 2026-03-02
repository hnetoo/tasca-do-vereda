-- Safe check migration: inspect existing tables/columns without modifying data
-- Avoids GROUP BY/ORDER issues and unknown tables

-- List public tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Show columns for dishes if exists
SELECT column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'dishes'
ORDER BY ordinal_position;

-- Show columns for menu_categories if exists
SELECT column_name, data_type, is_nullable, ordinal_position
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'menu_categories'
ORDER BY ordinal_position;

-- Show counts if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='dishes') THEN
    RAISE NOTICE 'Dishes count: %', (SELECT COUNT(*) FROM dishes);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='menu_categories') THEN
    RAISE NOTICE 'Menu categories count: %', (SELECT COUNT(*) FROM menu_categories);
  END IF;
END $$;

-- Final check complete
SELECT 'Final Check Completed' as info;
