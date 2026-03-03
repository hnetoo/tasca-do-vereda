-- Adicionar colunas de ambiente e posição à tabela restaurant_tables
-- Executar este SQL no Supabase Editor SQL

-- 1. Adicionar coluna ambiente (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name = 'ambiente'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE restaurant_tables 
        ADD COLUMN ambiente VARCHAR(20) CHECK (ambiente IN ('INTERIOR', 'EXTERIOR', 'BALCAO')) DEFAULT 'INTERIOR';
        
        -- Atualizar registros existentes para 'INTERIOR' como padrão
        UPDATE restaurant_tables 
        SET ambiente = 'INTERIOR' 
        WHERE ambiente IS NULL;
        
        RAISE NOTICE 'Coluna "ambiente" adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna "ambiente" já existe';
    END IF;
END $$;

-- 2. Adicionar colunas posicao_x e posicao_y (se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name = 'posicao_x'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE restaurant_tables 
        ADD COLUMN posicao_x FLOAT DEFAULT 0;
        
        -- Atualizar registros existentes para valores padrão
        UPDATE restaurant_tables 
        SET posicao_x = COALESCE(x, 0) 
        WHERE posicao_x IS NULL;
        
        RAISE NOTICE 'Coluna "posicao_x" adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna "posicao_x" já existe';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurant_tables' 
        AND column_name = 'posicao_y'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE restaurant_tables 
        ADD COLUMN posicao_y FLOAT DEFAULT 0;
        
        -- Atualizar registros existentes para valores padrão
        UPDATE restaurant_tables 
        SET posicao_y = COALESCE(y, 0) 
        WHERE posicao_y IS NULL;
        
        RAISE NOTICE 'Coluna "posicao_y" adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna "posicao_y" já existe';
    END IF;
END $$;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_ambiente ON restaurant_tables(ambiente);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_posicao ON restaurant_tables(posicao_x, posicao_y);

-- 4. Verificar estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'restaurant_tables' 
AND table_schema = 'public'
AND column_name IN ('ambiente', 'posicao_x', 'posicao_y')
ORDER BY column_name;
