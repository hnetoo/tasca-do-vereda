-- Add user_id to menu_categories
ALTER TABLE public.menu_categories
ADD COLUMN user_id uuid REFERENCES auth.users(id); -- user_id is nullable initially

-- Add user_id to dishes
ALTER TABLE public.dishes
ADD COLUMN user_id uuid REFERENCES auth.users(id); -- user_id is nullable initially

-- Add status to dishes
ALTER TABLE public.dishes
ADD COLUMN status text DEFAULT 'active';

-- Drop existing RLS policies for menu_categories
DROP POLICY IF EXISTS "Enable read access for all users on menu_categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only on menu_categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Enable update for authenticated users only on menu_categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users only on menu_categories" ON public.menu_categories;

-- Policies will be managed in dedicated migration files to avoid conflicts

-- Drop existing RLS policies for dishes
DROP POLICY IF EXISTS "Enable read access for all users on dishes" ON public.dishes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only on dishes" ON public.dishes;
DROP POLICY IF EXISTS "Enable update for authenticated users only on dishes" ON public.dishes;
DROP POLICY IF EXISTS "Enable delete for authenticated users only on dishes" ON public.dishes;

-- Policies will be managed in dedicated migration files to avoid conflicts
