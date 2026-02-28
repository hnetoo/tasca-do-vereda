-- Criar tabela expenses se não existir
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Criar políticas para acesso total (anon + authenticated)
DROP POLICY IF EXISTS "Enable full access for all users" ON expenses;
CREATE POLICY "Enable full access for all users" ON expenses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Conceder permissões
GRANT ALL ON expenses TO anon, authenticated;