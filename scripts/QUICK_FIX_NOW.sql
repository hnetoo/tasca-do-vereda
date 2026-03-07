-- QUICK FIX NOW - RESOLVER LOGIN IMEDIATO
-- Execute ESTE SCRIPT AGORA - SEM COMPLICAÇÕES

-- 1. VERIFICAR TABELA USERS
SELECT 'CHECK_USERS' as step, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
            THEN 'EXISTS' 
            ELSE 'NOT_EXISTS' 
       END as status;

-- 2. MOSTRAR DADOS DA TABELA USERS (SE EXISTIR)
SELECT * FROM users ORDER BY created_at DESC LIMIT 10;

-- 3. CONTAR USUÁRIOS COM PIN 1234
SELECT 'COUNT_PIN_1234' as step, COUNT(*) as count 
FROM users 
WHERE pin = '1234' AND role = 'admin' AND status = 'active';

-- 4. SE NÃO TIVER ADMIN, CRIAR UM AGORA
INSERT INTO users (id, name, email, pin, role, status, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'Admin Sistema',
    'admin@system.com',
    '1234',
    'admin',
    'active',
    NOW,
    NOW
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE pin = '1234' AND role = 'admin' AND status = 'active'
);

-- 5. VERIFICAR SE ADMIN FOI CRIADO
SELECT 'VERIFY_ADMIN' as step, COUNT(*) as count,
       CASE WHEN COUNT(*) > 0 THEN 'LOGIN_READY' ELSE 'FAILED' END as status
FROM users 
WHERE pin = '1234' AND role = 'admin' AND status = 'active';

-- 6. LIMPAR CACHE
NOTIFY pgrst, 'reload_schema';
NOTIFY pgrst, 'reload_config';

-- 7. RESULTADO FINAL
SELECT 'FINAL_RESULT' as step, 
       'EXECUTE_THIS_NOW' as action,
       'PIN_1234_ADMIN' as login_info;
