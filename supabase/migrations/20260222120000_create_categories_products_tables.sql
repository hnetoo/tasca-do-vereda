CREATE TABLE IF NOT EXISTS public.menu_categories (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    icon text,
    sort_order integer,
    parent_id text REFERENCES public.menu_categories(id),
    is_active boolean DEFAULT true,
    is_available_on_digital_menu boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);

-- Add RLS policies for menu_categories
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Enable read access for all users
DROP POLICY IF EXISTS "Enable read access for all users on menu_categories" ON public.menu_categories;
CREATE POLICY "Enable read access for all users on menu_categories" ON public.menu_categories
  FOR SELECT USING (true);

-- Policy: Enable insert for authenticated users only
DROP POLICY IF EXISTS "Enable insert for authenticated users only on menu_categories" ON public.menu_categories;
CREATE POLICY "Enable insert for authenticated users only on menu_categories" ON public.menu_categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Enable update for authenticated users only
DROP POLICY IF EXISTS "Enable update for authenticated users only on menu_categories" ON public.menu_categories;
CREATE POLICY "Enable update for authenticated users only on menu_categories" ON public.menu_categories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Enable delete for authenticated users only
DROP POLICY IF EXISTS "Enable delete for authenticated users only on menu_categories" ON public.menu_categories;
CREATE POLICY "Enable delete for authenticated users only on menu_categories" ON public.menu_categories
  FOR DELETE USING (auth.role() = 'authenticated');


-- Create dishes table
CREATE TABLE IF NOT EXISTS public.dishes (
    id text PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    category_id text REFERENCES public.menu_categories(id),
    image_url text,
    cost_price numeric,
    preparation_time integer,
    track_stock boolean DEFAULT false,
    stock_quantity integer DEFAULT 0,
    min_stock_quantity integer DEFAULT 0,
    max_stock_quantity integer DEFAULT 0,
    unit text,
    supplier_id text REFERENCES public.suppliers(id), -- Assuming a 'suppliers' table exists
    tax_code text,
    tax_percentage numeric,
    is_active boolean DEFAULT true,
    is_available_on_digital_menu boolean DEFAULT true,
    available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);

-- Add RLS policies for dishes
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

-- Policy: Enable read access for all users
DROP POLICY IF EXISTS "Enable read access for all users on dishes" ON public.dishes;
CREATE POLICY "Enable read access for all users on dishes" ON public.dishes
  FOR SELECT USING (true);

-- Policy: Enable insert for authenticated users only
DROP POLICY IF EXISTS "Enable insert for authenticated users only on dishes" ON public.dishes;
CREATE POLICY "Enable insert for authenticated users only on dishes" ON public.dishes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Enable update for authenticated users only
DROP POLICY IF EXISTS "Enable update for authenticated users only on dishes" ON public.dishes;
CREATE POLICY "Enable update for authenticated users only on dishes" ON public.dishes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Enable delete for authenticated users only
DROP POLICY IF EXISTS "Enable delete for authenticated users only on dishes" ON public.dishes;
CREATE POLICY "Enable delete for authenticated users only on dishes" ON public.dishes
  FOR DELETE USING (auth.role() = 'authenticated');

-- Add trigger for updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_menu_categories_updated_at') THEN
        CREATE TRIGGER set_menu_categories_updated_at
        BEFORE UPDATE ON public.menu_categories
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_dishes_updated_at') THEN
        CREATE TRIGGER set_dishes_updated_at
        BEFORE UPDATE ON public.dishes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
