-- SQL SIMPLES E DIRETOS - SEM VERIFICAÇÕES COMPLEXAS
-- Execute estes comandos um por um no painel SQL do Supabase

-- COMANDO 1: VERIFICAR QUAIS TABELAS EXISTEM
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('categories', 'menu_categories', 'dishes')
ORDER BY table_name;

-- COMANDO 2: SE menu_categories EXISTE, APAGAR ELA
DROP TABLE IF EXISTS menu_categories CASCADE;

-- COMANDO 3: CRIAR TABELA categories (SE NÃO EXISTIR)
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- COMANDO 4: ATUALIZAR dishes PARA USAR categories
ALTER TABLE dishes 
DROP CONSTRAINT IF EXISTS dishes_category_id_fkey;

ALTER TABLE dishes 
ADD CONSTRAINT dishes_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES categories(id);

-- COMANDO 5: INSERIR CATEGORIAS PADRÃO
INSERT INTO categories (name, description) VALUES
('Bebidas', 'Refrigerantes e bebidas variadas'),
('Pratos', 'Pratos principais e petiscos'),
('Sobremesas', 'Doces e sobremesas')
ON CONFLICT DO NOTHING;

-- COMANDO 6: VERIFICAR SE TUDO FUNCIONOU
SELECT 
    'CATEGORIES' as table_name,
    COUNT(*) as total_records
FROM categories;

SELECT 
    'DISHES' as table_name,
    COUNT(*) as total_records
FROM dishes;

-- COMANDO 7: TESTAR INSERÇÃO EM dishes
INSERT INTO dishes (name, description, price, category_id, available)
SELECT 
    'Coca-Cola' as name,
    'Refrigerante 350ml' as description,
    250.00 as price,
    id as category_id,
    true as available
FROM categories 
WHERE name = 'Bebidas'
LIMIT 1;

-- RESULTADO: Sistema deve funcionar sem erros de foreign key
