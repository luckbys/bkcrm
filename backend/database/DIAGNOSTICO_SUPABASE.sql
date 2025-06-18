-- ================================================================
-- DIAGNÓSTICO COMPLETO DO SUPABASE
-- ================================================================
-- Execute este script primeiro para identificar todos os problemas

-- ================================================================
-- VERIFICAR EXISTÊNCIA DAS TABELAS
-- ================================================================

DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNÓSTICO SUPABASE - VERIFICANDO ESTRUTURA';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    
    -- Verificar tabela profiles
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabela profiles: EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabela profiles: NÃO EXISTE';
    END IF;
    
    -- Verificar tabela tickets
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabela tickets: EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabela tickets: NÃO EXISTE';
    END IF;
    
    -- Verificar tabela messages
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ Tabela messages: EXISTE';
    ELSE
        RAISE NOTICE '❌ Tabela messages: NÃO EXISTE';
    END IF;
    
END $$;

-- ================================================================
-- VERIFICAR POLÍTICAS RLS
-- ================================================================

DO $$
DECLARE
    policies_record RECORD;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 VERIFICANDO POLÍTICAS RLS';
    RAISE NOTICE '============================';
    
    -- Contar políticas por tabela
    FOR policies_record IN
        SELECT 
            tablename,
            COUNT(*) as policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'tickets', 'messages')
        GROUP BY tablename
        ORDER BY tablename
    LOOP
        RAISE NOTICE '📋 Tabela %: % política(s)', policies_record.tablename, policies_record.policy_count;
    END LOOP;
    
    -- Listar políticas problemáticas (podem causar recursão)
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ POLÍTICAS QUE PODEM CAUSAR RECURSÃO:';
    
    FOR policies_record IN
        SELECT tablename, policyname, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
        AND (
            policyname ILIKE '%recursive%' OR
            policyname ILIKE '%Users can%' OR
            policyname ILIKE '%Allow%'
        )
    LOOP
        RAISE NOTICE '  🚨 %: % (%)', policies_record.tablename, policies_record.policyname, policies_record.cmd;
    END LOOP;
    
END $$;

-- ================================================================
-- VERIFICAR USUÁRIOS E PERFIS
-- ================================================================

DO $$
DECLARE
    auth_users_count INTEGER;
    profiles_count INTEGER;
    orphan_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '👥 VERIFICANDO USUÁRIOS E PERFIS';
    RAISE NOTICE '================================';
    
    -- Contar usuários na auth.users
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    RAISE NOTICE '📊 Usuários em auth.users: %', auth_users_count;
    
    -- Contar perfis (se tabela existe)
    BEGIN
        SELECT COUNT(*) INTO profiles_count FROM profiles;
        RAISE NOTICE '📊 Perfis em profiles: %', profiles_count;
        
        -- Verificar usuários órfãos (sem perfil)
        SELECT COUNT(*) INTO orphan_count 
        FROM auth.users u 
        LEFT JOIN profiles p ON u.id = p.id 
        WHERE p.id IS NULL;
        
        IF orphan_count > 0 THEN
            RAISE NOTICE '⚠️ Usuários sem perfil: %', orphan_count;
        ELSE
            RAISE NOTICE '✅ Todos os usuários têm perfil';
        END IF;
        
    EXCEPTION
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Tabela profiles não existe - não é possível verificar';
    END;
    
END $$;

-- ================================================================
-- VERIFICAR TRIGGERS
-- ================================================================

DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ VERIFICANDO TRIGGERS';
    RAISE NOTICE '======================';
    
    -- Verificar trigger de criação de perfil
    SELECT EXISTS (
        SELECT FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    IF trigger_exists THEN
        RAISE NOTICE '✅ Trigger on_auth_user_created: EXISTE';
    ELSE
        RAISE NOTICE '❌ Trigger on_auth_user_created: NÃO EXISTE';
    END IF;
    
END $$;

-- ================================================================
-- VERIFICAR ERROS ESPECÍFICOS
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 TESTANDO ACESSOS BÁSICOS';
    RAISE NOTICE '===========================';
    
    -- Testar acesso básico à profiles
    BEGIN
        PERFORM COUNT(*) FROM profiles LIMIT 1;
        RAISE NOTICE '✅ Acesso à tabela profiles: OK';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ Acesso à profiles: ERRO DE PERMISSÃO (RLS)';
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Acesso à profiles: TABELA NÃO EXISTE';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Acesso à profiles: ERRO - %', SQLERRM;
    END;
    
    -- Testar acesso básico à tickets
    BEGIN
        PERFORM COUNT(*) FROM tickets LIMIT 1;
        RAISE NOTICE '✅ Acesso à tabela tickets: OK';
    EXCEPTION
        WHEN insufficient_privilege THEN
            RAISE NOTICE '❌ Acesso à tickets: ERRO DE PERMISSÃO (RLS)';
        WHEN undefined_table THEN
            RAISE NOTICE '❌ Acesso à tickets: TABELA NÃO EXISTE';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Acesso à tickets: ERRO - %', SQLERRM;
    END;
    
END $$;

-- ================================================================
-- RESUMO DO DIAGNÓSTICO
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 RESUMO E RECOMENDAÇÕES';
    RAISE NOTICE '==========================';
    RAISE NOTICE '';
    RAISE NOTICE '1. Se houver tabelas faltando: Execute CORRECAO_URGENTE_RLS_SUPABASE.sql';
    RAISE NOTICE '2. Se houver erro de recursão RLS: Execute CORRECAO_URGENTE_RLS_SUPABASE.sql';
    RAISE NOTICE '3. Se houver usuários órfãos: Execute CORRECAO_URGENTE_RLS_SUPABASE.sql';
    RAISE NOTICE '4. Se houver trigger faltando: Execute CORRECAO_URGENTE_RLS_SUPABASE.sql';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 O script de correção resolve todos os problemas identificados!';
    RAISE NOTICE '';
END $$; 