-- Create daily_analytics table
CREATE TABLE IF NOT EXISTS daily_analytics (
    date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    total_product_cost DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    net_profit DECIMAL(12,2) DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON daily_analytics
  FOR SELECT USING (true);

-- Function to calculate product cost for a specific date
CREATE OR REPLACE FUNCTION calculate_daily_product_cost(target_date DATE)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    cost DECIMAL(12,2);
BEGIN
    SELECT COALESCE(SUM(d.cost_price * oi.quantity), 0)
    INTO cost
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN dishes d ON oi.dish_id = d.id
    WHERE DATE(o.created_at) = target_date
    AND o.status = 'FECHADO'; -- Only count cost for closed orders? Or all? Usually cost is incurred when made.
    -- Assuming cost is incurred when order is made/delivered. But revenue is when closed.
    -- To match Revenue (which is usually FECHADO), let's use FECHADO for now to align Profit.
    
    RETURN cost;
EXCEPTION WHEN OTHERS THEN
    RETURN 0; -- Fallback if tables don't exist or other error
END;
$$ LANGUAGE plpgsql;

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS TRIGGER AS $$
DECLARE
    target_date DATE;
    daily_revenue DECIMAL(12,2);
    daily_expenses DECIMAL(12,2);
    daily_cost DECIMAL(12,2);
    daily_orders INTEGER;
BEGIN
    -- Determine the date to update
    IF TG_TABLE_NAME = 'orders' THEN
        target_date := DATE(COALESCE(NEW.created_at, NOW()));
    ELSIF TG_TABLE_NAME = 'expenses' THEN
        target_date := DATE(COALESCE(NEW.date, NOW()));
    ELSIF TG_TABLE_NAME = 'revenues' THEN
        target_date := DATE(COALESCE(NEW.date, NOW()));
    ELSE
        target_date := CURRENT_DATE;
    END IF;

    -- Calculate Totals for that Date
    
    -- 1. Revenue (Orders + Revenues table)
    SELECT 
        (
            SELECT COALESCE(SUM(total), 0) 
            FROM orders 
            WHERE DATE(created_at) = target_date 
            AND status = 'FECHADO'
        ) + (
            SELECT COALESCE(SUM(amount), 0) 
            FROM revenues 
            WHERE DATE(date) = target_date
        )
    INTO daily_revenue;

    -- 2. Expenses
    SELECT COALESCE(SUM(amount), 0)
    INTO daily_expenses
    FROM expenses
    WHERE DATE(date) = target_date;

    -- 3. Product Cost (Calculated via helper or join)
    -- If order_items/menu_items logic is too complex for trigger, we can approximate or use the function.
    -- We'll try to use the function, but handle failure gracefully.
    daily_cost := calculate_daily_product_cost(target_date);

    -- 4. Order Count
    SELECT COUNT(*)
    INTO daily_orders
    FROM orders
    WHERE DATE(created_at) = target_date;

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

-- Triggers
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
