-- MOSTRAR TODOS OS USUÁRIOS EXISTENTES - PARA VOCÊ GERENCIAR SEUS PRÓPRIOS PINS

-- 1. VERIFICAR SE TABELA USERS EXISTE
SELECT 'TABELA_USERS' as info,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
            THEN 'EXISTS' 
            ELSE 'NOT_EXISTS' 
       END as status;

-- 2. MOSTRAR ESTRUTURA DA TABELA USERS
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public' 
ORDER BY ordinal_position;

-- 3. MOSTRAR TODOS OS USUÁRIOS EXISTENTES
SELECT 'TODOS_USUARIOS' as section, 
       id, name, email, pin, role, status, created_at, updated_at
FROM users 
ORDER BY created_at DESC;

-- 4. CONTAR USUÁRIOS POR ROLE
SELECT 'USUARIOS_POR_ROLE' as section, role, COUNT(*) as total
FROM users 
GROUP BY role 
ORDER BY total DESC;

-- 5. MOSTRAR APENAS USUÁRIOS ATIVOS
SELECT 'USUARIOS_ATIVOS' as section,
       id, name, email, pin, role, status, created_at
FROM users 
WHERE status = 'active' 
ORDER BY created_at DESC;

-- 6. VERIFICAR PINS DUPLICADOS
SELECT 'PINS_DUPLICADOS' as section,
       pin, COUNT(*) as quantidade, 
       STRING_AGG(name, ', ') as usuarios_com_mesmo_pin
FROM users 
WHERE pin IS NOT NULL
GROUP BY pin 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 7. LIMPAR CACHE
NOTIFY pgrst, 'reload_schema';
NOTIFY pgrst, 'reload_config';

-- RESULTADO:
-- ✅ Todos os usuários existentes
-- ✅ Todos os PINs disponíveis
-- ✅ Status de cada usuário
-- ✅ Estrutura da tabela
-- ✅ PINs duplicados (se houver)
