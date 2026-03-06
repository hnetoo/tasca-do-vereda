-- SQL PARA CRIAR TODAS AS TABELAS FALTANTES
-- Execute este SQL no painel SQL do Supabase

-- 1. CRIAR TABELA CATEGORIES SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA DISHES SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS dishes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES categories(id),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA TRANSACTIONS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(15,2) NOT NULL,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. VERIFICAR E CRIAR TABELA PROFILES SE NECESSÁRIO
CREATE TABLE IF NOT EXISTS profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT,
    email TEXT,
    role TEXT DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DESABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE payroll DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE revenues DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- 6. GARANTIR PERMISSÕES COMPLETAS
GRANT ALL ON TABLE profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE staff TO anon, authenticated, service_role;
GRANT ALL ON TABLE payroll TO anon, authenticated, service_role;
GRANT ALL ON TABLE orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE restaurant_tables TO anon, authenticated, service_role;
GRANT ALL ON TABLE transactions TO anon, authenticated, service_role;
GRANT ALL ON TABLE revenues TO anon, authenticated, service_role;
GRANT ALL ON TABLE expenses TO anon, authenticated, service_role;
GRANT ALL ON TABLE dishes TO anon, authenticated, service_role;
GRANT ALL ON TABLE categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE reservations TO anon, authenticated, service_role;

-- 7. INSERIR DADOS INICIAIS SE TABELAS VAZIAS
-- Inserir categorias padrão
INSERT INTO categories (name, description)
SELECT 
    'Bebidas' as name,
    'Todas as bebidas e refrigerantes' as description
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

INSERT INTO categories (name, description)
SELECT 
    'Pratos' as name,
    'Pratos principais e petiscos' as description
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Pratos' LIMIT 1);

INSERT INTO categories (name, description)
SELECT 
    'Sobremesas' as name,
    'Doces e sobremesas' as description
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Sobremesas' LIMIT 1);

-- Inserir pratos de exemplo
INSERT INTO dishes (name, description, price, category_id, available)
SELECT 
    'Coca-Cola' as name,
    'Refrigerante tradicional 350ml' as description,
    250.00 as price,
    (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1) as category_id,
    true as available
WHERE NOT EXISTS (SELECT 1 FROM dishes LIMIT 1);

INSERT INTO dishes (name, description, price, category_id, available)
SELECT 
    'Água Mineral' as name,
    'Água sem gás 500ml' as description,
    100.00 as price,
    (SELECT id FROM categories WHERE name = 'Bebidas' LIMIT 1) as category_id,
    true as available
WHERE NOT EXISTS (SELECT 1 FROM dishes WHERE name = 'Água Mineral' LIMIT 1);

-- 8. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_available ON dishes(available);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);

-- 9. CRIAR TRIGGERS PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at 
    BEFORE UPDATE ON dishes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. VERIFICAÇÃO FINAL
SELECT 
    'CATEGORIES' as table_name,
    COUNT(*) as record_count
FROM categories;

SELECT 
    'DISHES' as table_name,
    COUNT(*) as record_count
FROM dishes;

SELECT 
    'TRANSACTIONS' as table_name,
    COUNT(*) as record_count
FROM transactions;

-- RESULTADO ESPERADO: Todas as tabelas criadas e acessíveis
