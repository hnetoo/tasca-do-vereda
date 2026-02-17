-- Fix Daily Analytics Timezone to Africa/Luanda
-- This migration updates the update_daily_analytics function to use the correct timezone
-- so that Vercel Dashboard (Angola time) matches Supabase data.

CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
    daily_revenue DECIMAL(12,2);
    daily_expenses DECIMAL(12,2);
    daily_cost DECIMAL(12,2);
    daily_orders INTEGER;
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
    -- We'll use the existing function but we should check if it needs timezone adjustment.
    -- For now, let's assume we can just pass the target_date and it works if it compares dates.
    -- However, calculate_daily_product_cost uses DATE(o.created_at) which might default to UTC date.
    -- We should probably update that function too or inline the logic.
    -- Let's inline a simple cost calculation here to be safe and consistent.
    SELECT COALESCE(SUM(mi.preco_custo * oi.quantity), 0)
    INTO daily_cost
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN menu_items mi ON oi.dish_id = mi.id
    WHERE DATE(o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date
    AND o.status = 'FECHADO';

    -- 4. Order Count
    SELECT COUNT(*)
    INTO daily_orders
    FROM orders
    WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Luanda') = target_date;

    -- Update or Insert
    INSERT INTO daily_analytics (date, total_revenue, total_expenses, total_product_cost, total_orders, net_profit, last_updated)
    VALUES (
        target_date, 
        daily_revenue, 
        daily_expenses, 
        daily_cost, 
        daily_orders, 
        (daily_revenue - daily_expenses - daily_cost),
        NOW()
    )
    ON CONFLICT (date) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        total_product_cost = EXCLUDED.total_product_cost,
        total_orders = EXCLUDED.total_orders,
        net_profit = EXCLUDED.net_profit,
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
