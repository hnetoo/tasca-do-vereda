-- Create summary table if not exists
CREATE TABLE IF NOT EXISTS dashboard_summary (
    id TEXT PRIMARY KEY DEFAULT 'current',
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    active_orders_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default row
INSERT INTO dashboard_summary (id, total_revenue, total_expenses, total_orders, active_orders_count)
VALUES ('current', 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Function to update summary
CREATE OR REPLACE FUNCTION update_dashboard_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total revenue, expenses and order counts
    UPDATE dashboard_summary
    SET 
        total_revenue = (
            SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'FECHADO'
        ) + (
            SELECT COALESCE(SUM(amount), 0) FROM revenues
        ),
        total_expenses = (
            SELECT COALESCE(SUM(amount), 0) FROM expenses
        ),
        total_orders = (SELECT COUNT(*) FROM orders),
        active_orders_count = (SELECT COUNT(*) FROM orders WHERE status = 'ABERTO'),
        last_updated = NOW()
    WHERE id = 'current';
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_summary_on_order ON orders;
CREATE TRIGGER update_summary_on_order
AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH STATEMENT
EXECUTE FUNCTION update_dashboard_summary();

DROP TRIGGER IF EXISTS update_summary_on_revenue ON revenues;
CREATE TRIGGER update_summary_on_revenue
AFTER INSERT OR UPDATE OR DELETE ON revenues
FOR EACH STATEMENT
EXECUTE FUNCTION update_dashboard_summary();

DROP TRIGGER IF EXISTS update_summary_on_expense ON expenses;
CREATE TRIGGER update_summary_on_expense
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH STATEMENT
EXECUTE FUNCTION update_dashboard_summary();
