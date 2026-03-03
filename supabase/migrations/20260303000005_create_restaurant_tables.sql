-- Criar tabela restaurant_tables para mesas
CREATE TABLE IF NOT EXISTS restaurant_tables (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL,
    name TEXT,
    capacity INTEGER DEFAULT 4,
    status TEXT DEFAULT 'AVAILABLE', -- AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE
    color TEXT,
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0,
    zone TEXT DEFAULT 'main',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_number ON restaurant_tables(number);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_zone ON restaurant_tables(zone);

-- Dar permissões totais
GRANT ALL ON restaurant_tables TO anon;
GRANT ALL ON restaurant_tables TO authenticated;
GRANT ALL ON restaurant_tables TO service_role;
