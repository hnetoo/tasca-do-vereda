-- Criar tabela users para autenticação do sistema
-- Separada da tabela employees (funcionários do restaurante)

-- Remover tabela users existente se não tiver estrutura correta
DROP TABLE IF EXISTS users CASCADE;

-- Criar tabela users para autenticação
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    pin TEXT NOT NULL, -- PIN para login no sistema
    role TEXT NOT NULL CHECK (role IN ('admin', 'owner', 'caixa', 'cozinha', 'garcom', 'cliente')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Adicionar índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_pin ON users(pin);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuários padrão do sistema
INSERT INTO users (name, email, pin, role, status, permissions) VALUES
('Administrador', 'admin@restaurante.com', '1234', 'admin', 'active', '{"all": true}'),
('Proprietário', 'owner@restaurante.com', '5678', 'owner', 'active', '{"all": true}'),
('Operador de Caixa', 'caixa@restaurante.com', '1111', 'caixa', 'active', '{"orders": true, "payments": true}'),
('Chefe de Cozinha', 'cozinha@restaurante.com', '2222', 'cozinha', 'active', '{"kitchen": true, "inventory": true}'),
('Garçom', 'garcom@restaurante.com', '3333', 'garcom', 'active', '{"orders": true, "tables": true}')
ON CONFLICT (email) DO NOTHING;

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso
CREATE POLICY "Allow login access" ON users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage users" ON users FOR ALL TO authenticated USING (true);

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Verificar dados
SELECT id, name, email, role, status, pin FROM users ORDER BY created_at;
