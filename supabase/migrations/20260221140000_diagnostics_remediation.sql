-- Diagnostics & Remediation Migration
-- 1. Foreign Key Indexes (Performance Optimization)
CREATE INDEX IF NOT EXISTS idx_menu_categories_parent_id ON menu_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_group_id ON restaurant_tables(group_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_user_id ON restaurant_tables(user_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_supplier_id ON dishes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cash_shifts_user_id ON cash_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_shift_id ON orders(shift_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_dish_id ON order_items(dish_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);

-- 2. Additional Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- 3. Ensure RLS is enabled (Idempotent)
DO $$ 
BEGIN
    EXECUTE 'ALTER TABLE employees ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE customers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE transactions ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE dishes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE orders ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE order_items ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE expenses ENABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY';
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Ensure Realtime is enabled for critical tables
DO $$ 
BEGIN
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE orders; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE order_items; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE restaurant_tables; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE cash_shifts; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE dishes; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records; EXCEPTION WHEN OTHERS THEN NULL; END;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
