-- =============================================================================
-- 📱 TESTE DO CAMPO NUNMSG NA TABELA TICKETS
-- =============================================================================
-- Este script testa se o campo nunmsg está funcionando corretamente
-- para salvar números de telefone dos clientes que mandam mensagens

BEGIN;

-- 1. VERIFICAR SE O CAMPO NUNMSG EXISTE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' 
        AND column_name = 'nunmsg'
    ) THEN
        RAISE NOTICE '✅ Campo nunmsg encontrado na tabela tickets';
    ELSE
        RAISE NOTICE '❌ Campo nunmsg NÃO encontrado na tabela tickets';
        RAISE EXCEPTION 'Campo nunmsg não existe na tabela tickets';
    END IF;
END $$;

-- 2. VERIFICAR TICKETS EXISTENTES COM NUNMSG
SELECT 
    id,
    title,
    nunmsg,
    channel,
    metadata->>'client_phone' as metadata_phone,
    metadata->>'whatsapp_phone' as whatsapp_phone,
    created_at
FROM tickets 
WHERE nunmsg IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- 3. CRIAR TICKET DE TESTE COM NUNMSG
INSERT INTO tickets (
    id,
    title,
    description,
    status,
    priority,
    channel,
    nunmsg,
    metadata,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Teste Campo nunmsg',
    'Ticket criado para testar o campo nunmsg',
    'open',
    'medium',
    'whatsapp',
    '+5511999998888', -- 📱 NÚMERO SALVO NO CAMPO NUNMSG
    jsonb_build_object(
        'test_ticket', true,
        'client_phone', '+5511999998888',
        'created_via', 'test_nunmsg',
        'purpose', 'teste_campo_nunmsg'
    ),
    NOW(),
    NOW()
) RETURNING id, title, nunmsg;

-- 4. VERIFICAR SE O TICKET DE TESTE FOI CRIADO
SELECT 
    'Ticket de teste criado com sucesso' as status,
    id,
    title,
    nunmsg,
    metadata->>'test_ticket' as is_test
FROM tickets 
WHERE metadata->>'test_ticket' = 'true'
AND metadata->>'purpose' = 'teste_campo_nunmsg'
ORDER BY created_at DESC
LIMIT 1;

-- 5. TESTAR CONSULTA POR NUNMSG
SELECT 
    id,
    title,
    nunmsg,
    channel,
    created_at
FROM tickets 
WHERE nunmsg = '+5511999998888';

-- 6. ESTATÍSTICAS DO CAMPO NUNMSG
SELECT 
    COUNT(*) as total_tickets,
    COUNT(nunmsg) as tickets_com_nunmsg,
    COUNT(CASE WHEN nunmsg IS NOT NULL THEN 1 END) as nunmsg_preenchido,
    ROUND(
        (COUNT(nunmsg)::float / COUNT(*)) * 100, 2
    ) as percentual_com_nunmsg
FROM tickets;

-- 7. LIMPAR TICKET DE TESTE (opcional - descomente para limpar)
-- DELETE FROM tickets 
-- WHERE metadata->>'test_ticket' = 'true' 
-- AND metadata->>'purpose' = 'teste_campo_nunmsg';

COMMIT;

-- =============================================================================
-- 📋 COMO USAR ESTE SCRIPT:
-- =============================================================================
-- 1. Execute no SQL Editor do Supabase
-- 2. Verifique se todas as consultas retornam resultados esperados
-- 3. Se quiser limpar o ticket de teste, descomente a última linha
-- 
-- ✅ RESULTADO ESPERADO:
-- - Campo nunmsg deve existir
-- - Ticket de teste deve ser criado com nunmsg = '+5511999998888'
-- - Consulta por nunmsg deve encontrar o ticket
-- - Estatísticas devem mostrar quantos tickets têm nunmsg preenchido
-- ============================================================================= 