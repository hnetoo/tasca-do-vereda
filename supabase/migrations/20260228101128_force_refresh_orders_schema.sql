-- Forçar refresh completo do schema da tabela orders
-- Isso força o PostgREST a reconhecer todas as colunas
SELECT 'Forcing complete schema refresh for orders table' AS status;

-- Invalidar cache do PostgREST para forçar reload
-- Esta é uma técnica para forçar o PostgREST a recarregar o schema
DO $$
BEGIN
    -- Forçar invalidação do cache
    PERFORM pg_notify('postgrest_invalidate', 'orders_schema');
    
    -- Pequena pausa para garantir processamento
    PERFORM pg_sleep(0.1);
END $$;