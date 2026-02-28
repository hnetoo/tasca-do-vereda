-- Criar tabela orders se não existir com estrutura completa
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  customer_name TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso total (anon + authenticated)
DROP POLICY IF EXISTS "Enable full access for all users" ON orders;
CREATE POLICY "Enable full access for all users" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Conceder permissões
GRANT ALL ON orders TO anon, authenticated;