-- ==========================================
-- SOLUÇÃO DEFINITIVA PARA FINALIZAR TICKETS
-- ==========================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- Passo 1: Remover trigger que está causando problema
DROP TRIGGER IF EXISTS notify_ticket_update ON tickets;

-- Passo 2: Remover função do trigger se existir
DROP FUNCTION IF EXISTS notify_ticket_update();

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

-- Passo 5: Função para atualizar ticket diretamente sem complicações
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

-- Passo 6: Atualizar schema cache
NOTIFY pgrst, 'reload schema';

-- Passo 7: Teste rápido
DO $$
DECLARE
    test_ticket UUID;
    test_result JSON;
BEGIN
    -- Buscar ticket para teste
    SELECT id INTO test_ticket FROM tickets WHERE status != 'closed' LIMIT 1;
    
    IF test_ticket IS NOT NULL THEN
        RAISE NOTICE 'Funções criadas! Teste com: SELECT finalize_ticket_simple(''%'');', test_ticket;
    ELSE
        RAISE NOTICE 'Funções criadas! Nenhum ticket disponível para teste.';
    END IF;
END;
$$;

-- Verificar se funções foram criadas
SELECT 
    proname as function_name,
    proargtypes,
    'Criada com sucesso' as status
FROM pg_proc 
WHERE proname IN ('finalize_ticket_simple', 'update_ticket_status_simple', 'update_ticket_direct')
ORDER BY proname;

SELECT '✅ SOLUÇÃO IMPLEMENTADA - Triggers removidos, funções criadas!' as resultado; 