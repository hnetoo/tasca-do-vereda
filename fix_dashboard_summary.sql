-- Fix dashboard_summary function and orders table dependency
-- This resolves the error: column "id" does not exist in dashboard_summary

-- Step 1: Drop the problematic function if it exists
DROP FUNCTION IF EXISTS update_dashboard_summary();

-- Step 2: Create dashboard_summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS dashboard_summary (
    id TEXT PRIMARY KEY DEFAULT 'current',
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    active_orders_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create the corrected function
CREATE OR REPLACE FUNCTION update_dashboard_summary()
RETURNS VOID AS $$
BEGIN
    -- First ensure orders table exists and has the right structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'orders'
    ) THEN
        -- Create orders table if it doesn't exist
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number TEXT NOT NULL,
            table_id TEXT,
            status TEXT DEFAULT 'pending',
            total DECIMAL(12,2) DEFAULT 0,
            tax_total DECIMAL(12,2) DEFAULT 0,
            customer_name TEXT DEFAULT '',
            customer_nif TEXT,
            payment_method TEXT,
            sub_account_name TEXT,
            shift_id TEXT,
            closed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            items JSONB DEFAULT '[]'::jsonb
        );
    END IF;
    
    -- Now update dashboard_summary safely
    INSERT INTO dashboard_summary (
        id,
        total_revenue,
        total_expenses,
        total_orders,
        active_orders_count,
        last_updated
    ) VALUES (
        'current',
        COALESCE((SELECT SUM(total) FROM orders WHERE status = 'FECHADO'), 0),
        COALESCE((SELECT SUM(amount) FROM revenues), 0),
        (SELECT COUNT(*) FROM orders),
        (SELECT COUNT(*) FROM orders WHERE status = 'ABERTO'),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        total_orders = EXCLUDED.total_orders,
        active_orders_count = EXCLUDED.active_orders_count,
        last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Test the function
SELECT update_dashboard_summary();

-- Step 5: Show the result
SELECT 
    id,
    total_revenue,
    total_expenses,
    total_orders,
    active_orders_count,
    last_updated
FROM dashboard_summary 
WHERE id = 'current';

-- Step 6: Show orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
