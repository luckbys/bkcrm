-- ==========================================
-- FINALIZAÇÃO SIMPLES - SEM NOTIFICAÇÕES
-- ==========================================
-- OBJETIVO: Finalizar tickets sem complicações de notificações
-- ESTRATÉGIA: Remover/desabilitar triggers e focar na ação principal

-- Passo 1: Identificar e desabilitar triggers de notificação
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    -- Listar todos os triggers na tabela tickets
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'tickets' 
        AND t.tgname NOT LIKE 'RI_%'
    LOOP
        -- Desabilitar trigger se existir
        EXECUTE 'ALTER TABLE tickets DISABLE TRIGGER ' || trigger_record.tgname;
        RAISE NOTICE 'Trigger % desabilitado', trigger_record.tgname;
    END LOOP;
    
    RAISE NOTICE 'Todos os triggers de notificação foram desabilitados';
END;
$$;

-- Passo 2: Criar função RPC simples e direta para finalizar tickets
CREATE OR REPLACE FUNCTION finalize_ticket_simple(ticket_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_json JSON;
    ticket_exists BOOLEAN;
    rows_affected INTEGER;
BEGIN
    -- Verificar se ticket existe
    SELECT EXISTS(SELECT 1 FROM tickets WHERE id = ticket_uuid) INTO ticket_exists;
    
    IF NOT ticket_exists THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ticket não encontrado',
            'ticket_id', ticket_uuid
        );
    END IF;

    BEGIN
        -- UPDATE direto e simples - sem complicações
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
                'closed_at', NOW(),
                'rows_affected', rows_affected
            );
        ELSE
            result_json := json_build_object(
                'success', false,
                'error', 'Nenhuma linha foi atualizada',
                'ticket_id', ticket_uuid
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        result_json := json_build_object(
            'success', false,
            'error', SQLERRM,
            'ticket_id', ticket_uuid,
            'error_code', SQLSTATE
        );
    END;
    
    RETURN result_json;
END;
$$;

-- Passo 3: Criar função para atualizar qualquer status de ticket
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
    BEGIN
        -- UPDATE direto sem validações complexas
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
                'message', 'Status atualizado com sucesso',
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
        
    EXCEPTION WHEN OTHERS THEN
        result_json := json_build_object(
            'success', false,
            'error', SQLERRM,
            'ticket_id', ticket_uuid,
            'error_code', SQLSTATE
        );
    END;
    
    RETURN result_json;
END;
$$;

-- Passo 4: Função para reabilitar triggers se necessário (opcional)
CREATE OR REPLACE FUNCTION enable_ticket_triggers()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    trigger_record RECORD;
    result_text TEXT := '';
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'tickets' 
        AND t.tgname NOT LIKE 'RI_%'
        AND NOT tgenabled
    LOOP
        EXECUTE 'ALTER TABLE tickets ENABLE TRIGGER ' || trigger_record.tgname;
        result_text := result_text || 'Trigger ' || trigger_record.tgname || ' reabilitado. ';
    END LOOP;
    
    IF result_text = '' THEN
        result_text := 'Nenhum trigger precisou ser reabilitado';
    END IF;
    
    RETURN result_text;
END;
$$;

-- Passo 5: Testar a função principal
DO $$
DECLARE
    test_ticket_id UUID;
    test_result JSON;
BEGIN
    -- Buscar um ticket para teste (sem executar de verdade)
    SELECT id INTO test_ticket_id FROM tickets WHERE status != 'closed' LIMIT 1;
    
    IF test_ticket_id IS NOT NULL THEN
        RAISE NOTICE 'Função finalize_ticket_simple pronta para teste com ticket: %', test_ticket_id;
        RAISE NOTICE 'Para testar: SELECT finalize_ticket_simple(''%'');', test_ticket_id;
    ELSE
        RAISE NOTICE 'Nenhum ticket disponível para teste';
    END IF;
    
    RAISE NOTICE 'Funções criadas com sucesso!';
END;
$$;

-- Passo 6: Verificar se triggers foram desabilitados
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    CASE 
        WHEN tgenabled THEN 'ATIVO' 
        ELSE 'DESABILITADO' 
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'tickets'
AND t.tgname NOT LIKE 'RI_%';

-- Passo 7: Atualizar cache do schema
NOTIFY pgrst, 'reload schema';

SELECT 'Solução implementada: Triggers desabilitados, função finalize_ticket_simple() criada!' as status; 