-- Verificar estrutura atual da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar dados existentes
SELECT * FROM users LIMIT 5;
