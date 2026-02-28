-- Verificar se coluna items existe e adicionar se não existir
DO $$
BEGIN
    -- Verificar se coluna existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'items'
    ) THEN
        -- Adicionar coluna items
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
        
        -- Forçar refresh do schema
        PERFORM pg_notify('schema_refresh', 'orders.items column added');
    END IF;
END $$;