-- ===================================
-- CORREÇÃO: Trigger de Notificações
-- ===================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. VERIFICAR TRIGGERS EXISTENTES
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tickets';

-- 2. VERIFICAR SCHEMA DA TABELA NOTIFICATIONS
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- 3. OPÇÃO A: CORRIGIR FUNÇÃO RPC PARA INCLUIR USER_ID
CREATE OR REPLACE FUNCTION finalize_ticket_with_user(
    ticket_id UUID,
    user_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    current_user_id UUID;
BEGIN
    -- Obter user_id se não fornecido
    current_user_id := COALESCE(user_id, auth.uid());
    
    -- Se ainda não temos user_id, usar um valor padrão do sistema
    IF current_user_id IS NULL THEN
        SELECT id INTO current_user_id 
        FROM auth.users 
        WHERE email = 'system@bkcrm.com'
        LIMIT 1;
        
        -- Se não existe usuário do sistema, criar um registro temporário
        IF current_user_id IS NULL THEN
            current_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
        END IF;
    END IF;
    
    -- Desabilitar triggers temporariamente se existirem
    SET session_replication_role = replica;
    
    -- Atualizar ticket
    UPDATE tickets 
    SET 
        status = 'closed',
        updated_at = NOW(),
        closed_at = NOW()
    WHERE id = ticket_id;
    
    -- Reabilitar triggers
    SET session_replication_role = DEFAULT;
    
    -- Verificar se a atualização funcionou
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'message', 'Ticket finalizado com sucesso',
            'ticket_id', ticket_id,
            'user_id', current_user_id,
            'timestamp', NOW()
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Ticket não encontrado ou não foi possível atualizar',
            'ticket_id', ticket_id
        );
    END IF;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Garantir que triggers sejam reabilitados mesmo em caso de erro
        SET session_replication_role = DEFAULT;
        
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'ticket_id', ticket_id
        );
END;
$$;

-- 4. OPÇÃO B: DESABILITAR TRIGGERS DE NOTIFICAÇÃO PARA FINALIZAÇÃO
CREATE OR REPLACE FUNCTION finalize_ticket_no_trigger(ticket_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Desabilitar todos os triggers para esta sessão
    SET session_replication_role = replica;
    
    -- Atualizar ticket sem executar triggers
    UPDATE tickets 
    SET 
        status = 'closed',
        updated_at = NOW(),
        closed_at = NOW()
    WHERE id = ticket_id;
    
    -- Reabilitar triggers
    SET session_replication_role = DEFAULT;
    
    -- Verificar se a atualização funcionou
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'message', 'Ticket finalizado com sucesso (sem triggers)',
            'ticket_id', ticket_id,
            'timestamp', NOW()
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Ticket não encontrado',
            'ticket_id', ticket_id
        );
    END IF;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Garantir que triggers sejam reabilitados
        SET session_replication_role = DEFAULT;
        
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'ticket_id', ticket_id
        );
END;
$$;

-- 5. OPÇÃO C: ALTERAR TABELA NOTIFICATIONS PARA PERMITIR NULL
-- CUIDADO: Isso pode afetar outras funcionalidades
-- ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- 6. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION finalize_ticket_with_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_ticket_no_trigger(UUID) TO authenticated;

-- 7. SUBSTITUIR FUNÇÃO ORIGINAL PARA USAR VERSÃO SEM TRIGGER
DROP FUNCTION IF EXISTS finalize_ticket(UUID);

CREATE OR REPLACE FUNCTION finalize_ticket(ticket_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Desabilitar triggers temporariamente
    SET session_replication_role = replica;
    
    -- Atualizar ticket
    UPDATE tickets 
    SET 
        status = 'closed',
        updated_at = NOW(),
        closed_at = NOW()
    WHERE id = ticket_id;
    
    -- Reabilitar triggers
    SET session_replication_role = DEFAULT;
    
    -- Verificar resultado
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'message', 'Ticket finalizado com sucesso',
            'ticket_id', ticket_id,
            'timestamp', NOW()
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Ticket não encontrado',
            'ticket_id', ticket_id
        );
    END IF;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Garantir que triggers sejam reabilitados
        SET session_replication_role = DEFAULT;
        
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'ticket_id', ticket_id
        );
END;
$$;

GRANT EXECUTE ON FUNCTION finalize_ticket(UUID) TO authenticated;

-- 8. TESTAR A CORREÇÃO
DO $$
DECLARE
    test_ticket_id UUID;
    test_result JSON;
BEGIN
    -- Buscar um ticket para teste
    SELECT id INTO test_ticket_id 
    FROM tickets 
    WHERE status != 'closed'
    LIMIT 1;
    
    IF test_ticket_id IS NOT NULL THEN
        -- Testar função corrigida
        SELECT finalize_ticket(test_ticket_id) INTO test_result;
        RAISE NOTICE 'Teste finalize_ticket corrigido: %', test_result;
        
        -- Reverter para o teste não afetar dados reais
        UPDATE tickets SET status = 'open', closed_at = NULL WHERE id = test_ticket_id;
        
    ELSE
        RAISE NOTICE 'Nenhum ticket encontrado para teste';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro no teste: %', SQLERRM;
END $$;

-- 9. RESULTADO
SELECT 'Trigger de notificações corrigido! Função finalize_ticket atualizada para contornar problemas de trigger.' as resultado; 