-- Drop foreign key constraint from dishes table
-- This will allow the migration to proceed without foreign key errors

-- Drop the foreign key constraint
ALTER TABLE dishes DROP CONSTRAINT IF EXISTS dishes_category_id_fkey;

-- Add a notice for debugging
DO $$
BEGIN
    RAISE NOTICE 'Dropped dishes foreign key constraint to allow migration';
END $$;