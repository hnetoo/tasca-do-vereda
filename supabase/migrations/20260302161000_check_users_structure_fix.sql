-- Verificar estrutura atual da tabela users
-- Execute: psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f check_users_structure.sql

-- Verificar se a tabela users existe
SELECT 'users' as table_name, 
       COUNT(*) as record_count
FROM information_schema.tables 
WHERE table_name = 'users' 
  AND table_schema = 'public';

-- Verificar colunas da tabela users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar dados existentes (se houver)
SELECT 'Sample Data' as section, * FROM users LIMIT 5;

-- Verificar se a coluna pin existe especificamente
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND table_schema = 'public' 
            AND column_name = 'pin'
        ) THEN 'PIN column exists'
        ELSE 'PIN column missing'
    END as pin_status;

-- Verificar se a coluna role existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND table_schema = 'public' 
            AND column_name = 'role'
        ) THEN 'ROLE column exists'
        ELSE 'ROLE column missing'
    END as role_status;

-- Verificar se a coluna status existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND table_schema = 'public' 
            AND column_name = 'status'
        ) THEN 'STATUS column exists'
        ELSE 'STATUS column missing'
    END as status_status;
