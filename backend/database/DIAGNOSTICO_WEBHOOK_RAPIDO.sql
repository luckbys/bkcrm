-- =====================================================
-- DIAGNÓSTICO RÁPIDO - WEBHOOK EVOLUTION API
-- =====================================================
-- 
-- Execute este script APÓS aplicar todas as correções
-- para verificar se tudo está funcionando corretamente
--
-- Data: 2025-01-17
-- =====================================================

SELECT '🔍 DIAGNÓSTICO WEBHOOK EVOLUTION API' as titulo;

-- 1. VERIFICAR RLS NOTIFICATIONS
SELECT 
    '1️⃣ RLS NOTIFICATIONS' as check_item,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ATIVO (pode causar erro)'
        ELSE '✅ RLS DESABILITADO (OK para webhook)'
    END as status
FROM pg_tables 
WHERE tablename = 'notifications' 
AND schemaname = 'public';

-- 2. VERIFICAR ENUM TICKET_STATUS
SELECT 
    '2️⃣ ENUM TICKET_STATUS' as check_item,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ Valores em português disponíveis (' || COUNT(*)::TEXT || ' valores)'
        ELSE '❌ Faltam valores em português (' || COUNT(*)::TEXT || ' valores)'
    END as status
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ticket_status');

-- 3. VERIFICAR FOREIGN KEY TICKETS → PROFILES
SELECT 
    '3️⃣ FOREIGN KEY' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Constraint correta (tickets → profiles)'
        ELSE '❌ Constraint não encontrada'
    END as status
FROM pg_constraint 
WHERE conrelid = 'tickets'::regclass
AND contype = 'f'
AND pg_get_constraintdef(oid) LIKE '%profiles%';

-- 4. VERIFICAR CLIENTES NA TABELA PROFILES
SELECT 
    '4️⃣ CLIENTES PROFILES' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::TEXT || ' clientes cadastrados'
        ELSE '⚠️ Nenhum cliente cadastrado'
    END as status
FROM profiles 
WHERE role = 'customer';

-- 5. VERIFICAR FUNÇÕES RPC WEBHOOK
SELECT 
    '5️⃣ FUNÇÕES RPC' as check_item,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ Funções webhook criadas (' || COUNT(*)::TEXT || ' funções)'
        ELSE '❌ Faltam funções RPC (' || COUNT(*)::TEXT || ' encontradas)'
    END as status
FROM information_schema.routines 
WHERE routine_name LIKE '%_webhook' 
AND routine_schema = 'public';

-- 6. VERIFICAR TICKETS RECENTES (ÚLTIMAS 24H)
SELECT 
    '6️⃣ TICKETS RECENTES' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::TEXT || ' tickets criados (24h)'
        ELSE '⚠️ Nenhum ticket nas últimas 24h'
    END as status
FROM tickets 
WHERE created_at > NOW() - INTERVAL '24 hours'
AND channel = 'whatsapp';

-- 7. VERIFICAR MENSAGENS RECENTES (ÚLTIMAS 24H)
SELECT 
    '7️⃣ MENSAGENS RECENTES' as check_item,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ ' || COUNT(*)::TEXT || ' mensagens salvas (24h)'
        ELSE '⚠️ Nenhuma mensagem nas últimas 24h'
    END as status
FROM messages 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 8. RESUMO GERAL
SELECT 
    '📊 RESUMO GERAL' as titulo,
    '===================' as separador;

-- Contar problemas
WITH diagnostics AS (
    SELECT 
        CASE WHEN rowsecurity THEN 1 ELSE 0 END as rls_problem
    FROM pg_tables WHERE tablename = 'notifications'
    
    UNION ALL
    
    SELECT 
        CASE WHEN COUNT(*) < 4 THEN 1 ELSE 0 END as enum_problem
    FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ticket_status')
    
    UNION ALL
    
    SELECT 
        CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END as fkey_problem
    FROM pg_constraint 
    WHERE conrelid = 'tickets'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%profiles%'
    
    UNION ALL
    
    SELECT 
        CASE WHEN COUNT(*) < 3 THEN 1 ELSE 0 END as rpc_problem
    FROM information_schema.routines 
    WHERE routine_name LIKE '%_webhook' AND routine_schema = 'public'
)
SELECT 
    'STATUS FINAL' as item,
    CASE 
        WHEN SUM(rls_problem + enum_problem + fkey_problem + rpc_problem) = 0 
        THEN '🎉 WEBHOOK 100% FUNCIONAL - PRONTO PARA USO!'
        ELSE '⚠️ ' || SUM(rls_problem + enum_problem + fkey_problem + rpc_problem)::TEXT || ' problemas encontrados - verificar logs acima'
    END as resultado
FROM diagnostics;

-- 9. PRÓXIMOS PASSOS
SELECT 
    '🚀 PRÓXIMOS PASSOS' as titulo,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM pg_tables 
            WHERE tablename = 'notifications' 
            AND rowsecurity = false
        ) > 0 
        AND (
            SELECT COUNT(*) 
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ticket_status')
        ) >= 4
        AND (
            SELECT COUNT(*) 
            FROM pg_constraint 
            WHERE conrelid = 'tickets'::regclass AND contype = 'f' AND pg_get_constraintdef(oid) LIKE '%profiles%'
        ) > 0
        THEN 
            '1. Reiniciar webhook: node webhook-evolution-complete.js
2. Enviar mensagem WhatsApp de teste
3. Verificar logs sem erros ❌
4. Confirmar tickets aparecendo no CRM
5. Sistema funcionando! 🎉'
        ELSE 
            'Aplicar correções pendentes:
1. Execute CORRECAO_RLS_NOTIFICATIONS.sql
2. Execute CORRECAO_ENUM_TICKET_STATUS_WEBHOOK.sql  
3. Execute CORRECAO_FOREIGN_KEY_CUSTOMERS_PROFILES.sql
4. Execute este diagnóstico novamente'
    END as instrucoes;

-- 10. DETALHES TÉCNICOS (PARA DEBUG)
SELECT '🔧 DETALHES TÉCNICOS' as titulo;

-- Valores do enum disponíveis
SELECT 
    'Enum Values:' as tipo,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as valores
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ticket_status');

-- Constraints da tabela tickets
SELECT 
    'Constraints:' as tipo,
    string_agg(conname, ', ') as constraints
FROM pg_constraint 
WHERE conrelid = 'tickets'::regclass AND contype = 'f';

-- Funções RPC disponíveis
SELECT 
    'RPC Functions:' as tipo,
    string_agg(routine_name, ', ') as funcoes
FROM information_schema.routines 
WHERE routine_name LIKE '%_webhook' AND routine_schema = 'public'; 