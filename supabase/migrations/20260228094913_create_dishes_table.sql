-- Criar tabela dishes se não existir
CREATE TABLE IF NOT EXISTS dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  category_id TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  track_stock BOOLEAN NOT NULL DEFAULT false,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso total (anon + authenticated)
DROP POLICY IF EXISTS "Enable full access for all users" ON dishes;
CREATE POLICY "Enable full access for all users" ON dishes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Conceder permissões
GRANT ALL ON dishes TO anon, authenticated;