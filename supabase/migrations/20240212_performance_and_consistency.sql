ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_orders_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_select_categories ON public.categories;
CREATE POLICY public_select_categories ON public.categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS public_select_menu_items ON public.menu_items;
CREATE POLICY public_select_menu_items ON public.menu_items FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS public_select_restaurant_settings ON public.restaurant_settings;
CREATE POLICY public_select_restaurant_settings ON public.restaurant_settings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS owner_select_revenues ON public.revenues;
CREATE POLICY owner_select_revenues ON public.revenues FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_expenses ON public.expenses;
CREATE POLICY owner_select_expenses ON public.expenses FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_dashboard_summary ON public.dashboard_summary;
CREATE POLICY owner_select_dashboard_summary ON public.dashboard_summary FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_employees ON public.employees;
CREATE POLICY owner_select_employees ON public.employees FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_attendance_records ON public.attendance_records;
CREATE POLICY owner_select_attendance_records ON public.attendance_records FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_payroll_records ON public.payroll_records;
CREATE POLICY owner_select_payroll_records ON public.payroll_records FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_audit_logs ON public.audit_logs;
CREATE POLICY owner_select_audit_logs ON public.audit_logs FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_users ON public.users;
CREATE POLICY owner_select_users ON public.users FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_active_orders_snapshot ON public.active_orders_snapshot;
CREATE POLICY owner_select_active_orders_snapshot ON public.active_orders_snapshot FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_stock_items ON public.stock_items;
CREATE POLICY owner_select_stock_items ON public.stock_items FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_suppliers ON public.suppliers;
CREATE POLICY owner_select_suppliers ON public.suppliers FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

DROP POLICY IF EXISTS owner_select_backups ON public.backups;
CREATE POLICY owner_select_backups ON public.backups FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

CREATE OR REPLACE FUNCTION public.update_dashboard_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.dashboard_summary (id, total_revenue, total_expenses, last_updated)
    VALUES (
        1, 
        (SELECT COALESCE(SUM(amount), 0) FROM public.revenues),
        (SELECT COALESCE(SUM(amount), 0) FROM public.expenses),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        last_updated = EXCLUDED.last_updated;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_summary_on_revenue ON public.revenues;
CREATE TRIGGER trg_update_summary_on_revenue AFTER INSERT OR UPDATE OR DELETE ON public.revenues FOR EACH STATEMENT EXECUTE FUNCTION public.update_dashboard_summary();

DROP TRIGGER IF EXISTS trg_update_summary_on_expense ON public.expenses;
CREATE TRIGGER trg_update_summary_on_expense AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH STATEMENT EXECUTE FUNCTION public.update_dashboard_summary();

CREATE INDEX IF NOT EXISTS idx_revenues_date_amount ON public.revenues (date DESC, amount);
CREATE INDEX IF NOT EXISTS idx_expenses_date_amount ON public.expenses (date DESC, amount);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_availability ON public.menu_items (category_id, available);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records (employee_id, date DESC);
