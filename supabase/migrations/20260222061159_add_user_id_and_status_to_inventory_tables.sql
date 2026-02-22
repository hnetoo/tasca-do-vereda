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

-- Create new RLS policies for menu_categories based on user_id
-- Note: Rows with NULL user_id will not be accessible via this policy.
CREATE POLICY "Allow all for authenticated users based on user_id on menu_categories" ON public.menu_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Drop existing RLS policies for dishes
DROP POLICY IF EXISTS "Enable read access for all users on dishes" ON public.dishes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only on dishes" ON public.dishes;
DROP POLICY IF EXISTS "Enable update for authenticated users only on dishes" ON public.dishes;
DROP POLICY IF EXISTS "Enable delete for authenticated users only on dishes" ON public.dishes;

-- Create new RLS policies for dishes based on user_id
-- Note: Rows with NULL user_id will not be accessible via this policy.
CREATE POLICY "Allow all for authenticated users based on user_id on dishes" ON public.dishes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
