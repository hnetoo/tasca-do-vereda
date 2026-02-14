-- Migration to enable RLS and add basic security policies
-- This script should be run in the Supabase SQL Editor

-- 1. Enable RLS on all tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_orders_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies (Simplified for Service Role/Anon Key usage in this stage)
-- Note: In a production environment with authenticated users, 
-- these should be more restrictive (e.g., auth.uid() checks).

-- Public read-only policies for Digital Menu
DROP POLICY IF EXISTS "Allow full access to anon for categories" ON public.categories;
DROP POLICY IF EXISTS "Allow full access to anon for menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow full access to anon for restaurant_settings" ON public.restaurant_settings;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Public read restaurant_settings" ON public.restaurant_settings;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Public read menu_items" ON public.menu_items FOR SELECT TO public USING (true);
CREATE POLICY "Public read restaurant_settings" ON public.restaurant_settings FOR SELECT TO public USING (true);

-- Restrict audit logs to service role only
DROP POLICY IF EXISTS "Allow full access to anon for audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Service role write audit_logs" ON public.audit_logs;
CREATE POLICY "Service role write audit_logs" ON public.audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Storage Policies
-- Note: storage.objects table is in the 'storage' schema
-- These policies allow the anon key used by the app to manage its files.

-- Enable RLS on storage.objects (usually enabled by default in Supabase)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for 'menu-images' bucket
DROP POLICY IF EXISTS "Public Read Access to menu-images" ON storage.objects;
CREATE POLICY "Public Read Access to menu-images" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id = 'menu-images');

DROP POLICY IF EXISTS "Anon Full Access to menu-images" ON storage.objects;
CREATE POLICY "Anon Full Access to menu-images" 
ON storage.objects FOR ALL 
TO anon 
USING (bucket_id = 'menu-images') 
WITH CHECK (bucket_id = 'menu-images');

-- Policy for 'backups' bucket
DROP POLICY IF EXISTS "Anon Full Access to backups" ON storage.objects;
CREATE POLICY "Anon Full Access to backups" 
ON storage.objects FOR ALL 
TO anon 
USING (bucket_id = 'backups') 
WITH CHECK (bucket_id = 'backups');
