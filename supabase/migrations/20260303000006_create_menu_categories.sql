-- Criar tabela menu_categories para categorias de produtos
CREATE TABLE IF NOT EXISTS menu_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT menu_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES menu_categories(id) ON DELETE SET NULL
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_menu_categories_sort_order ON menu_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_menu_categories_is_active ON menu_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_categories_parent_id ON menu_categories(parent_id);

-- Dar permissões totais
GRANT ALL ON menu_categories TO anon;
GRANT ALL ON menu_categories TO authenticated;
GRANT ALL ON menu_categories TO service_role;
