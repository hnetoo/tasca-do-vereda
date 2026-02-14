ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_categories ON public.categories;
CREATE POLICY owner_can_select_categories ON public.categories FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');
CREATE POLICY public_can_select_categories_active ON public.categories FOR SELECT TO anon USING (deleted_at IS NULL);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_menu_items ON public.menu_items;
CREATE POLICY owner_can_select_menu_items ON public.menu_items FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');
CREATE POLICY public_can_select_menu_items_available ON public.menu_items FOR SELECT TO anon USING (available = true AND deleted_at IS NULL);

ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_restaurant_tables ON public.restaurant_tables;
CREATE POLICY owner_can_select_restaurant_tables ON public.restaurant_tables FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_employees ON public.employees;
CREATE POLICY owner_can_select_employees ON public.employees FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_attendance_records ON public.attendance_records;
CREATE POLICY owner_can_select_attendance_records ON public.attendance_records FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_payroll_records ON public.payroll_records;
CREATE POLICY owner_can_select_payroll_records ON public.payroll_records FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_revenues ON public.revenues;
CREATE POLICY owner_can_select_revenues ON public.revenues FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_expenses ON public.expenses;
CREATE POLICY owner_can_select_expenses ON public.expenses FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

ALTER TABLE public.dashboard_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_summary FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_dashboard_summary ON public.dashboard_summary;
CREATE POLICY owner_can_select_dashboard_summary ON public.dashboard_summary FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_can_select_users ON public.users;
CREATE POLICY owner_can_select_users ON public.users FOR SELECT TO authenticated USING ((auth.jwt() ->> 'role') = 'owner');
