-- RPC function to truncate a table safely
CREATE OR REPLACE FUNCTION truncate_table(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Execute TRUNCATE with CASCADE to handle dependencies
    EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
END;
$$;
