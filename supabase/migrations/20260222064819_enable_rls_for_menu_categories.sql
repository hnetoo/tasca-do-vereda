-- Enable Row Level Security for the menu_categories table
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to SELECT menu_categories
CREATE POLICY "Allow authenticated users to view menu categories"
ON public.menu_categories FOR SELECT
TO authenticated
USING (true);

-- Policy to allow authenticated users to INSERT menu_categories
CREATE POLICY "Allow authenticated users to insert menu categories"
ON public.menu_categories FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy to allow authenticated users to update menu categories"
CREATE POLICY "Allow authenticated users to update menu categories"
ON public.menu_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy to allow authenticated users to delete menu categories"
CREATE POLICY "Allow authenticated users to delete menu categories"
ON public.menu_categories FOR DELETE
TO authenticated
USING (true);
