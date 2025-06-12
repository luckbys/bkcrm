-- ================================================================
-- SCRIPT PARA FORÇAR CONFIRMAÇÃO DE EMAILS - DESENVOLVIMENTO
-- ================================================================
-- ⚠️ ATENÇÃO: Use apenas em ambiente de desenvolvimento!
-- Este script força a confirmação de todos os emails não confirmados

DO $$
DECLARE
    affected_users INTEGER;
    user_record RECORD;
BEGIN
    -- Contar usuários não confirmados
    SELECT COUNT(*) INTO affected_users 
    FROM auth.users 
    WHERE email_confirmed_at IS NULL;
    
    RAISE NOTICE '🔍 Encontrados % usuário(s) com email não confirmado', affected_users;
    
    IF affected_users = 0 THEN
        RAISE NOTICE '✅ Todos os emails já estão confirmados!';
        RETURN;
    END IF;
    
    -- Mostrar usuários que serão afetados
    RAISE NOTICE '📋 Usuários que serão confirmados:';
    FOR user_record IN 
        SELECT id, email, created_at 
        FROM auth.users 
        WHERE email_confirmed_at IS NULL 
        ORDER BY created_at DESC
    LOOP
        RAISE NOTICE '  - %: % (criado em %)', 
            user_record.id, 
            user_record.email, 
            user_record.created_at;
    END LOOP;
    
    -- Forçar confirmação de todos os emails não confirmados
    UPDATE auth.users 
    SET 
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE email_confirmed_at IS NULL;
    
    GET DIAGNOSTICS affected_users = ROW_COUNT;
    
    RAISE NOTICE '✅ Confirmação forçada para % usuário(s)', affected_users;
    RAISE NOTICE '🎉 Todos os usuários agora podem fazer login!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Erro ao forçar confirmação: % - %', SQLSTATE, SQLERRM;
END $$;

-- Verificação final
DO $$
DECLARE
    total_users INTEGER;
    confirmed_users INTEGER;
    pending_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_users FROM auth.users;
    SELECT COUNT(*) INTO confirmed_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
    SELECT COUNT(*) INTO pending_users FROM auth.users WHERE email_confirmed_at IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 RELATÓRIO FINAL:';
    RAISE NOTICE '  Total de usuários: %', total_users;
    RAISE NOTICE '  Emails confirmados: %', confirmed_users;
    RAISE NOTICE '  Emails pendentes: %', pending_users;
    
    IF pending_users = 0 THEN
        RAISE NOTICE '🎉 Todos os emails estão confirmados!';
    ELSE
        RAISE NOTICE '⚠️ Ainda há % email(s) pendente(s)', pending_users;
    END IF;
END $$;

-- ================================================================
-- COMANDOS ADICIONAIS PARA DEBUG
-- ================================================================

-- 1. Ver todos os usuários e status de confirmação
-- SELECT 
--     id,
--     email,
--     email_confirmed_at,
--     created_at,
--     CASE 
--         WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado'
--         ELSE '❌ Pendente'
--     END as status
-- FROM auth.users
-- ORDER BY created_at DESC;

-- 2. Confirmar um usuário específico (substitua o email)
-- UPDATE auth.users 
-- SET email_confirmed_at = NOW() 
-- WHERE email = 'seu-email@exemplo.com';

-- 3. Ver configurações de autenticação
-- SELECT * FROM auth.config;

-- ================================================================
-- INSTRUÇÕES DE USO:
-- ================================================================
-- 1. Copie todo este script
-- 2. Cole no SQL Editor do Supabase Dashboard
-- 3. Execute o script
-- 4. Verifique os logs para confirmação
-- 5. Teste o login no sistema
-- ================================================================ 