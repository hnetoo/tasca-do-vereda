-- MIGRAÇÃO: Criar tabela roles (versão final)

-- Criar tabela roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    permissions JSONB DEFAULT '[]',
    color VARCHAR(50) DEFAULT 'blue',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir cargos padrão (se tabela estiver vazia)
INSERT INTO roles (name, description, permissions, color)
SELECT 'Administrador', 'Acesso completo ao sistema', '["all"]', 'red'
WHERE NOT EXISTS (SELECT 1 FROM roles LIMIT 1);

INSERT INTO roles (name, description, permissions, color)
SELECT 'Gerente', 'Gerenciamento de pedidos, relatórios e configurações', '["orders", "menu", "reports", "settings"]', 'yellow'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Gerente');

INSERT INTO roles (name, description, permissions, color)
SELECT 'Garçom', 'Acesso a pedidos e menu', '["orders", "menu"]', 'blue'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Garçom');

INSERT INTO roles (name, description, permissions, color)
SELECT 'Caixa', 'Acesso a pedidos e fechamento de caixa', '["orders", "payments"]', 'green'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Caixa');

INSERT INTO roles (name, description, permissions, color)
SELECT 'Cozinheiro', 'Acesso a pedidos da cozinha', '["kitchen", "orders"]', 'orange'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Cozinheiro');
