-- MOSTRAR USUÁRIOS SIMPLES - SEM ERROS
-- Execute este script para ver todos os seus usuários

-- 1. VERIFICAR TABELA USERS
SELECT 'TABELA_USERS' as info,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
            THEN 'EXISTS' 
            ELSE 'NOT_EXISTS' 
       END as status;

-- 2. MOSTRAR TODOS OS USUÁRIOS
SELECT 'TODOS_USUARIOS' as section, 
       id, name, email, pin, role, status, created_at
FROM users 
ORDER BY created_at DESC;

-- 3. MOSTRAR APENAS ATIVOS
SELECT 'USUARIOS_ATIVOS' as section,
       id, name, email, pin, role, status
FROM users 
WHERE status = 'active' 
ORDER BY created_at DESC;

-- 4. CONTAR POR PIN
SELECT 'PINS_DISPONIVEIS' as section,
       pin, COUNT(*) as total, STRING_AGG(name, ', ') as usuarios
FROM users 
WHERE pin IS NOT NULL AND status = 'active'
GROUP BY pin 
ORDER BY total DESC;

-- 5. LIMPAR CACHE
NOTIFY pgrst, 'reload_schema';
