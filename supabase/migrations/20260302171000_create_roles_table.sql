-- MIGRAÇÃO: Criar tabela roles para cargos
-- Garante que a tabela roles exista para persistência de cargos

-- =====================================================
-- TABELA ROLES
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public') THEN
        RAISE NOTICE '🔧 Criando tabela roles...';
        
        EXECUTE '
            CREATE TABLE roles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                permissions JSONB DEFAULT ''[]'',
                color VARCHAR(50) DEFAULT ''blue'',
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        ';
        
        RAISE NOTICE '✅ Tabela roles criada';
    ELSE
        RAISE NOTICE '✅ Tabela roles já existe';
    END IF;
END $$;

-- =====================================================
-- INSERIR CARGOS PADRÃO (se tabela estiver vazia)
-- =====================================================

DO $$
BEGIN
    DECLARE role_count INTEGER;
    SELECT COUNT(*) INTO role_count FROM roles;
    
    IF role_count = 0 THEN
        RAISE NOTICE '📝 Inserindo cargos padrão...';
        
        EXECUTE '
            INSERT INTO roles (name, description, permissions, color) VALUES
            (''Administrador'', ''Acesso completo ao sistema'', ''["all"]'', ''red''),
            (''Gerente'', ''Gerenciamento de pedidos, relatórios e configurações'', ''["orders", "menu", "reports", "settings"]'', ''yellow''),
            (''Garçom'', ''Acesso a pedidos e menu'', ''["orders", "menu"]'', ''blue''),
            (''Caixa'', ''Acesso a pedidos e fechamento de caixa'', ''["orders", "payments"]'', ''green''),
            (''Cozinheiro'', ''Acesso a pedidos da cozinha'', ''["kitchen", "orders"]'', ''orange'')
        ';
        
        RAISE NOTICE '✅ Cargos padrão inseridos';
    END IF;
END $$;

-- =====================================================
-- CRIAR TRIGGER updated_at
-- =====================================================

DO $$
BEGIN
    -- Verificar se trigger existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = ''update_roles_updated_at''
          AND event_object_table = ''roles''
          AND trigger_schema = ''public''
    ) THEN
        EXECUTE ''
            CREATE TRIGGER update_roles_updated_at 
                BEFORE UPDATE ON roles 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column()
        '';
        
        RAISE NOTICE ''✅ Trigger para roles criado'';
    END IF;
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    role_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICAÇÃO FINAL DA TABELA ROLES ===';
    
    -- Contar registros
    SELECT COUNT(*) INTO role_count FROM roles;
    
    RAISE NOTICE '📊 Cargos registrados: %', role_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ TABELA roles CRIADA E CONFIGURADA!';
    RAISE NOTICE '✅ CARGOS PERSISTEM NO SUPABASE!';
    RAISE NOTICE '✅ PRONTO PARA GESTÃO DE CARGOS!';
END $$;
