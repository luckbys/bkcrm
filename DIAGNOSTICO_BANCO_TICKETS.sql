-- ========================================
-- DIAGNÓSTICO COMPLETO: Estado do Banco de Dados
-- ========================================
-- Execute este script para diagnosticar problemas

-- 1. VERIFICAR SE AS TABELAS EXISTEM
-- ========================================
SELECT 'VERIFICANDO TABELAS EXISTENTES' as step;

SELECT 
    table_name,
    CASE WHEN table_name IS NOT NULL THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tickets', 'messages', 'profiles', 'departments')
ORDER BY table_name;

-- 2. VERIFICAR COLUNAS DA TABELA TICKETS (SE EXISTIR)
-- ========================================
SELECT 'VERIFICANDO COLUNAS DA TABELA TICKETS' as step;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tickets'
ORDER BY ordinal_position;

-- 3. CONTAR REGISTROS NAS TABELAS
-- ========================================
SELECT 'CONTANDO REGISTROS' as step;

DO $$
DECLARE
    tickets_count INTEGER := 0;
    messages_count INTEGER := 0;
    profiles_count INTEGER := 0;
    departments_count INTEGER := 0;
BEGIN
    -- Contar tickets (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
        SELECT COUNT(*) INTO tickets_count FROM tickets;
    END IF;
    
    -- Contar messages (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        SELECT COUNT(*) INTO messages_count FROM messages;
    END IF;
    
    -- Contar profiles (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        SELECT COUNT(*) INTO profiles_count FROM profiles;
    END IF;
    
    -- Contar departments (se existir)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        SELECT COUNT(*) INTO departments_count FROM departments;
    END IF;
    
    RAISE NOTICE '📊 CONTADORES:';
    RAISE NOTICE '   - Tickets: %', tickets_count;
    RAISE NOTICE '   - Messages: %', messages_count;
    RAISE NOTICE '   - Profiles: %', profiles_count;
    RAISE NOTICE '   - Departments: %', departments_count;
END $$;

-- 4. TESTAR INSERÇÃO SIMPLES
-- ========================================
SELECT 'TESTANDO INSERÇÃO SIMPLES' as step;

DO $$
DECLARE
    test_result TEXT := 'FALHOU';
BEGIN
    -- Tentar criar tabela tickets básica se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tickets') THEN
        CREATE TABLE tickets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            title TEXT NOT NULL DEFAULT 'Titulo padrão',
            channel TEXT DEFAULT 'chat'
        );
        RAISE NOTICE '✅ TABELA TICKETS CRIADA';
    END IF;
    
    -- Tentar inserir um registro de teste
    INSERT INTO tickets (title, channel) 
    VALUES ('Teste Diagnóstico', 'chat');
    
    -- Se chegou aqui, funcionou
    test_result := 'SUCESSO';
    
    -- Limpar teste
    DELETE FROM tickets WHERE title = 'Teste Diagnóstico';
    
    RAISE NOTICE '✅ TESTE DE INSERÇÃO: %', test_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TESTE DE INSERÇÃO FALHOU: %', SQLERRM;
END $$;

-- 5. VERIFICAR EXTENSÕES NECESSÁRIAS
-- ========================================
SELECT 'VERIFICANDO EXTENSÕES' as step;

SELECT 
    extname as extension_name,
    '✅ INSTALADA' as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto')
ORDER BY extname;

-- 6. VERIFICAR PERMISSÕES
-- ========================================
SELECT 'VERIFICANDO PERMISSÕES' as step;

SELECT 
    schemaname,
    tablename,
    tableowner,
    hasinserts,
    hasselects,
    hasupdates,
    hasdeletes
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tickets', 'messages', 'profiles', 'departments')
ORDER BY tablename;

-- 7. RESULTADO FINAL
-- ========================================
DO $$
DECLARE
    tickets_exists BOOLEAN;
    channel_exists BOOLEAN;
    final_status TEXT := '❌ PROBLEMAS ENCONTRADOS';
BEGIN
    -- Verificar se tickets existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tickets'
    ) INTO tickets_exists;
    
    -- Verificar se coluna channel existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'channel'
    ) INTO channel_exists;
    
    RAISE NOTICE '🎯 DIAGNÓSTICO FINAL:';
    RAISE NOTICE '   - Tabela tickets existe: %', CASE WHEN tickets_exists THEN 'SIM' ELSE 'NÃO' END;
    RAISE NOTICE '   - Coluna channel existe: %', CASE WHEN channel_exists THEN 'SIM' ELSE 'NÃO' END;
    
    IF tickets_exists AND channel_exists THEN
        final_status := '✅ TUDO OK - PODE USAR O SISTEMA';
    ELSIF tickets_exists AND NOT channel_exists THEN
        final_status := '⚠️ PRECISA ADICIONAR COLUNA CHANNEL';
    ELSIF NOT tickets_exists THEN
        final_status := '❌ PRECISA CRIAR TABELA TICKETS';
    END IF;
    
    RAISE NOTICE '🏆 STATUS: %', final_status;
    
    -- Recomendações
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
    
    IF NOT tickets_exists THEN
        RAISE NOTICE '   1. Execute: SOLUCAO_TICKETS_400_COMPLETA.sql';
    ELSIF NOT channel_exists THEN
        RAISE NOTICE '   1. Execute: ALTER TABLE tickets ADD COLUMN channel TEXT DEFAULT ''chat'';';
    ELSE
        RAISE NOTICE '   1. Sistema está pronto para uso!';
        RAISE NOTICE '   2. Teste criar um ticket no frontend';
    END IF;
    
END $$; 