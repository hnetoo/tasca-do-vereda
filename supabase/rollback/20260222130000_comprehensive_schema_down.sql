
-- Rollback script for 20260222130000_comprehensive_schema.sql

-- Disable Realtime (if needed, but usually dropping tables handles it)
-- ALTER PUBLICATION supabase_realtime DROP TABLE ...;

-- Drop Triggers and Functions
DROP TRIGGER IF EXISTS on_order_completion ON public.orders;
DROP FUNCTION IF EXISTS public.handle_order_completion();

DROP TRIGGER IF EXISTS on_payroll_insert ON public.payroll_records;
DROP FUNCTION IF EXISTS public.handle_new_payroll();

DROP TRIGGER IF EXISTS on_revenue_insert ON public.revenues;
DROP FUNCTION IF EXISTS public.handle_new_revenue();

DROP TRIGGER IF EXISTS on_expense_insert ON public.expenses;
DROP FUNCTION IF EXISTS public.handle_new_expense();

-- Drop Tables (in reverse order of dependencies)
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.daily_analytics;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.deliveries;
DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.payroll_records;
DROP TABLE IF EXISTS public.revenues;
DROP TABLE IF EXISTS public.expenses;
DROP TABLE IF EXISTS public.order_items;
DROP TABLE IF EXISTS public.orders;
DROP TABLE IF EXISTS public.cash_shifts;
DROP TABLE IF EXISTS public.restaurant_tables;
DROP TABLE IF EXISTS public.stock_items;
DROP TABLE IF EXISTS public.dishes;
DROP TABLE IF EXISTS public.suppliers;
DROP TABLE IF EXISTS public.menu_categories;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.employees;

-- Drop RLS Helper Functions
DROP FUNCTION IF EXISTS public.is_admin_or_owner();
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- Drop Extensions (Optional, usually kept)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";
