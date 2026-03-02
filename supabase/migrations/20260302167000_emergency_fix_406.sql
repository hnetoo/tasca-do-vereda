-- SOLUÇÃO EMERGENCIAL - CORRIGIR ERRO 406 SEM PERDER DADOS
-- Execute: psql -h [SEU_HOST] -U [SEU_USER] -d [SEU_DATABASE] -f emergency_fix_406.sql

-- =====================================================
-- VERIFICAÇÃO RÁPIDA
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=== CORREÇÃO EMERGENCIAL ERRO 406 ===';
    RAISE NOTICE 'Data: %', NOW();
    RAISE NOTICE 'Database: %', current_database();
END $$;

-- Verificar se tabela users existe
SELECT '=== VERIFICAÇÃO TABELA USERS ===' as section;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
        THEN '✅ Tabela users existe'
        ELSE '❌ Tabela users não existe'
    END as status;

-- Se tabela não existe, criar imediatamente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela users emergencialmente...';
        
        EXECUTE '
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                pin VARCHAR(10) NOT NULL DEFAULT ''1234'',
                role VARCHAR(20) NOT NULL DEFAULT ''ADMIN'',
                status VARCHAR(20) NOT NULL DEFAULT ''active'',
                permissions JSONB DEFAULT ''{}'',
                last_login TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela users criada com sucesso';
    END IF;
END $$;

-- Inserir usuário administrador se não existir
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin' AND status = 'active';
    
    IF admin_count = 0 THEN
        RAISE NOTICE '👤 Inserindo usuário administrador padrão...';
        
        INSERT INTO users (name, email, pin, role, status, permissions) VALUES
        ('Administrador', 'admin@tasca.com', '1234', 'admin', 'active', '{"all": true}')
        ON CONFLICT (email) DO NOTHING;
        
        RAISE NOTICE '✅ Usuário admin@tasca.com criado (PIN: 1234)';
    ELSE
        RAISE NOTICE '✅ Usuário ADMIN já existe';
    END IF;
END $$;

-- Verificar usuário admin
SELECT '=== USUÁRIO ADMIN ===' as section;
SELECT 
    id,
    name,
    email,
    pin,
    role,
    status,
    created_at
FROM users 
WHERE role = 'ADMIN' AND status = 'active';

-- Contar todos os usuários
SELECT '=== CONTAGEM DE USUÁRIOS ===' as section;
SELECT COUNT(*) as total_users FROM users;

-- Testar query específica do login
DO $$
DECLARE
    test_user RECORD;
    query_text TEXT;
BEGIN
    query_text := 'SELECT * FROM users WHERE pin = ''1234'' AND role = ''admin'' AND status = ''active''';
    
    RAISE NOTICE '🔍 Testando query: %', query_text;
    
    BEGIN
        EXECUTE query_text INTO test_user;
        
        IF test_user IS NOT NULL THEN
            RAISE NOTICE '✅ Query funcionou! Usuário: % (%)', test_user.name, test_user.email;
            RAISE NOTICE '🔑 PIN: % | Role: % | Status: %', test_user.pin, test_user.role, test_user.status;
        ELSE
            RAISE NOTICE '❌ Query não retornou resultados';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro na query: %', SQLERRM;
    END;
END $$;

-- Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
    RAISE NOTICE '✅ Trigger updated_at criado';
EXCEPTION
    WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Trigger já existe ou erro: %', SQLERRM;
END $$;

-- Verificar estrutura final
SELECT '=== ESTRUTURA FINAL ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CORREÇÃO CONCLUÍDA ===';
    RAISE NOTICE '✅ Tabela users verificada/corrigida';
    RAISE NOTICE '✅ Usuário admin criado/verificado';
    RAISE NOTICE '✅ Query de login testada';
    RAISE NOTICE '';
    RAISE NOTICE 'CREDENCIAIS PARA TESTE:';
    RAISE NOTICE '📧 Email: admin@tasca.com';
    RAISE NOTICE '🔑 PIN: 1234';
    RAISE NOTICE '👤 Role: ADMIN';
    RAISE NOTICE '📊 Status: active';
    RAISE NOTICE '';
    RAISE NOTICE 'Se ainda tiver erro 406, o problema está no frontend/headers, não no banco!';
END $$;
