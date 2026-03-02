-- Verificar estrutura atual da tabela users
-- Para entender quais colunas existem

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_users FROM users;

-- Mostrar dados existentes (se houver)
SELECT * FROM users LIMIT 5;
