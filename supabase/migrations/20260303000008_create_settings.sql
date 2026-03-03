-- Criar tabela settings para configurações do sistema
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    restaurant_name TEXT NOT NULL DEFAULT 'Tasca Do Vereda',
    nif TEXT NOT NULL DEFAULT '000000000',
    address TEXT,
    phone TEXT,
    email TEXT,
    currency TEXT DEFAULT 'AOA',
    tax_rate DECIMAL(5,2) DEFAULT 6.5,
    admin_pin TEXT DEFAULT '1234',
    logo_url TEXT,
    footer_text TEXT,
    printer_ip TEXT,
    printer_port INTEGER DEFAULT 9100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dar permissões totais
GRANT ALL ON settings TO anon;
GRANT ALL ON settings TO authenticated;
GRANT ALL ON settings TO service_role;
