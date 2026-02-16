-- Fix Daily Analytics Timezone to Africa/Luanda
-- This migration updates the update_daily_analytics function to use the correct timezone
-- so that Vercel Dashboard (Angola time) matches Supabase data.

-- Ensure table exists first (if not already)
-- We use 'date' as PRIMARY KEY to ensure one record per day
CREATE TABLE IF NOT EXISTS daily_analytics (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    total_product_cost DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    net_profit DECIMAL(12,2) DEFAULT 0,
    average_ticket DECIMAL(12,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON daily_analytics;
CREATE POLICY "Enable read access for all users" ON daily_analytics FOR SELECT USING (true);

-- Function to calculate product cost for a specific date
CREATE OR REPLACE FUNCTION calculate_daily_product_cost(target_date DATE)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    cost DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(mi.preco_custo * oi.quantity), 0)
    INTO cost
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN menu_items mi ON oi.dish_id = mi.id
    WHERE DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date
    AND o.status = 'FECHADO';
    
    RETURN cost;
EXCEPTION WHEN OTHERS THEN
    RETURN 0;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
    daily_revenue DECIMAL(12,2);
    daily_expenses DECIMAL(12,2);
    daily_cost DECIMAL(12,2);
    daily_orders INTEGER;
    avg_ticket DECIMAL(12,2);
BEGIN
    -- Determine the date to update using Africa/Luanda timezone
    -- We assume inputs are in UTC (standard for Supabase timestamps)
    -- Converting to Africa/Luanda ensures the 'day' boundary is correct for Angola
    IF TG_TABLE_NAME = 'orders' THEN
        target_date := DATE(COALESCE(NEW.created_at, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda');
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        target_date := DATE(COALESCE(NEW.date, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda');
    ELSIF TG_TABLE_NAME = 'revenues' THEN
        target_date := DATE(COALESCE(NEW.date, NOW()) AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda');
    ELSE
        target_date := DATE(NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda');
    END IF;

    -- Calculate Totals for that Date (using Africa/Luanda timezone for queries too)
    
    -- 1. Revenue (Orders + Revenues table)
    SELECT 
        (
            SELECT COALESCE(SUM(total), 0) 
            FROM orders 
            WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date 
            AND status = 'FECHADO'
        ) + (
            SELECT COALESCE(SUM(amount), 0) 
            FROM revenues 
            WHERE DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date
        )
    INTO daily_revenue;

    -- 2. Expenses
    SELECT COALESCE(SUM(amount), 0)
    INTO daily_expenses
    FROM expenses
    WHERE DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date;

    -- 3. Product Cost
    daily_cost := calculate_daily_product_cost(target_date);

    -- 4. Order Count
    SELECT COUNT(*)
    INTO daily_orders
    FROM orders
    WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date;

    -- 5. Average Ticket
    IF daily_orders > 0 THEN
        avg_ticket := daily_revenue / daily_orders;
    ELSE
        avg_ticket := 0;
    END IF;

    -- Update or Insert
    INSERT INTO daily_analytics (date, total_revenue, total_expenses, total_product_cost, total_orders, net_profit, average_ticket, last_updated)
    VALUES (
        target_date, 
        daily_revenue, 
        daily_expenses, 
        daily_cost, 
        daily_orders, 
        (daily_revenue - daily_expenses - daily_cost),
        avg_ticket,
        NOW()
    )
    ON CONFLICT (date) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        total_product_cost = EXCLUDED.total_product_cost,
        total_orders = EXCLUDED.total_orders,
        net_profit = EXCLUDED.net_profit,
        average_ticket = EXCLUDED.average_ticket,
        last_updated = NOW();
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Ensure triggers exist (re-applying them is safe)
DROP TRIGGER IF EXISTS update_daily_analytics_orders ON orders;
CREATE TRIGGER update_daily_analytics_orders
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics();

DROP TRIGGER IF EXISTS update_daily_analytics_expenses ON expenses;
CREATE TRIGGER update_daily_analytics_expenses
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics();

DROP TRIGGER IF EXISTS update_daily_analytics_revenues ON revenues;
CREATE TRIGGER update_daily_analytics_revenues
AFTER INSERT OR UPDATE OR DELETE ON revenues
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics();
