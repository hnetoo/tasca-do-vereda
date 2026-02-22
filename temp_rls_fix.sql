-- Desativar RLS para a tabela menu_categories
ALTER TABLE public.menu_categories DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas de RLS existentes para menu_categories
-- Isto inclui políticas redundantes ou potencialmente problemáticas identificadas no dashboard
DROP POLICY IF EXISTS "Allow all for authenticated users based on user_id on menu_cate" ON public.menu_categories;
DROP POLICY IF EXISTS "Allow public read" ON public.menu_categories;
DROP POLICY IF EXISTS "Authenticated users can delete menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Authenticated users can insert menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Authenticated users can update menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.menu_categories;
DROP POLICY IF EXISTS "Menu categories are viewable by everyone" ON public.menu_categories;

-- Remover as políticas que estão no ficheiro de migração para garantir uma recriação limpa
DROP POLICY IF EXISTS "Allow authenticated users to view menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update menu categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete menu categories" ON public.menu_categories;

-- Reativar RLS para a tabela menu_categories
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

-- Aplicar as políticas de RLS do ficheiro de migração
CREATE POLICY "Allow authenticated users to view menu categories"
ON public.menu_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert menu categories"
ON public.menu_categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update menu categories"
ON public.menu_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete menu categories"
ON public.menu_categories FOR DELETE
TO authenticated
USING (true);