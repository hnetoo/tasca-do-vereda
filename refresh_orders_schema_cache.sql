-- This file is intended to be run to force a refresh of the PostgREST schema cache.
-- It does this by adding a harmless comment to the 'orders' table.
-- This can resolve errors like "Could not find the 'createdAt' column of 'orders' in the schema cache"
-- where the application expects a camelCase column name ('createdAt') but the database has a snake_case name ('created_at').

COMMENT ON TABLE orders IS 'Schema cache refresh trigger';

SELECT 'Successfully triggered schema cache refresh for the orders table.' as "status";
