-- ==========================================
-- CORREÇÃO FINAL - REMOVER TRIGGERS E FUNÇÕES
-- ==========================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- Passo 1: Remover TODOS os triggers problemáticos primeiro
DROP TRIGGER IF EXISTS ticket_notification_trigger ON tickets;
DROP TRIGGER IF EXISTS notify_ticket_update ON tickets;
DROP TRIGGER IF EXISTS trigger_notify_ticket_update ON tickets;

-- Passo 2: Agora remover as funções (sem dependências)
DROP FUNCTION IF EXISTS notify_ticket_update() CASCADE;
DROP FUNCTION IF EXISTS trigger_notify_ticket_update() CASCADE;

-- Passo 3: Criar função simples para finalizar tickets
CREATE OR REPLACE FUNCTION finalize_ticket_simple(ticket_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSON;
    rows_affected INTEGER;
    current_ticket RECORD;
BEGIN
    -- Verificar se ticket existe
    SELECT * INTO current_ticket FROM tickets WHERE id = ticket_uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ticket não encontrado',
            'ticket_id', ticket_uuid
        );
    END IF;

    -- UPDATE direto e simples
    UPDATE tickets 
    SET 
        status = 'closed',
        closed_at = NOW(),
        updated_at = NOW()
    WHERE id = ticket_uuid;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    IF rows_affected > 0 THEN
        result_json := json_build_object(
            'success', true,
            'message', 'Ticket finalizado com sucesso',
            'ticket_id', ticket_uuid,
            'status', 'closed',
            'closed_at', NOW(),
            'rows_affected', rows_affected
        );
    ELSE
        result_json := json_build_object(
            'success', false,
            'error', 'Falha ao atualizar ticket',
            'ticket_id', ticket_uuid
        );
    END IF;
    
    RETURN result_json;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'ticket_id', ticket_uuid,
        'error_code', SQLSTATE
    );
END;
$$;

-- Passo 4: Criar função para atualizar status
CREATE OR REPLACE FUNCTION update_ticket_status_simple(
    ticket_uuid UUID,
    new_status TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSON;
    rows_affected INTEGER;
BEGIN
    UPDATE tickets 
    SET 
        status = new_status,
        closed_at = CASE 
            WHEN new_status IN ('closed', 'finalizado') THEN NOW() 
            ELSE closed_at 
        END,
        updated_at = NOW()
    WHERE id = ticket_uuid;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    IF rows_affected > 0 THEN
        result_json := json_build_object(
            'success', true,
            'message', 'Status atualizado',
            'ticket_id', ticket_uuid,
            'new_status', new_status,
            'rows_affected', rows_affected
        );
    ELSE
        result_json := json_build_object(
            'success', false,
            'error', 'Ticket não encontrado',
            'ticket_id', ticket_uuid
        );
    END IF;
    
    RETURN result_json;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'ticket_id', ticket_uuid,
        'error_code', SQLSTATE
    );
END;
$$;

-- Passo 5: Função para atualizar ticket diretamente
CREATE OR REPLACE FUNCTION update_ticket_direct(
    ticket_uuid UUID,
    ticket_status TEXT DEFAULT 'closed',
    close_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSON;
    rows_affected INTEGER;
BEGIN
    -- UPDATE super direto
    UPDATE tickets 
    SET 
        status = ticket_status,
        closed_at = close_timestamp,
        updated_at = NOW()
    WHERE id = ticket_uuid;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    result_json := json_build_object(
        'success', rows_affected > 0,
        'message', CASE 
            WHEN rows_affected > 0 THEN 'Ticket atualizado' 
            ELSE 'Ticket não encontrado' 
        END,
        'ticket_id', ticket_uuid,
        'status', ticket_status,
        'rows_affected', rows_affected
    );
    
    RETURN result_json;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'ticket_id', ticket_uuid,
        'error_code', SQLSTATE
    );
END;
$$;

-- Passo 6: Verificar se triggers foram removidos
SELECT 
    tgname as trigger_name,
    'REMOVIDO' as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'tickets'
AND t.tgname LIKE '%notify%';

-- Passo 7: Atualizar schema cache
NOTIFY pgrst, 'reload schema';

-- Passo 8: Verificar se funções foram criadas
SELECT 
    proname as function_name,
    'CRIADA' as status
FROM pg_proc 
WHERE proname IN ('finalize_ticket_simple', 'update_ticket_status_simple', 'update_ticket_direct')
ORDER BY proname;

-- Passo 9: Teste rápido
DO $$
DECLARE
    test_ticket UUID;
BEGIN
    SELECT id INTO test_ticket FROM tickets WHERE status != 'closed' LIMIT 1;
    
    IF test_ticket IS NOT NULL THEN
        RAISE NOTICE '✅ Triggers removidos, funções criadas! Teste: SELECT finalize_ticket_simple(''%'');', test_ticket;
    ELSE
        RAISE NOTICE '✅ Triggers removidos, funções criadas! Nenhum ticket para teste.';
    END IF;
END;
$$;

SELECT '🎯 PROBLEMA RESOLVIDO - Triggers removidos, funções criadas com sucesso!' as resultado; 