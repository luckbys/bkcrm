-- ===================================
-- FUNÇÃO RPC: Finalizar Ticket (Contorna RLS)
-- ===================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. CRIAR FUNÇÃO PARA ATUALIZAR STATUS DO TICKET
CREATE OR REPLACE FUNCTION update_ticket_status(
    ticket_id UUID,
    new_status TEXT,
    closed_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do proprietário da função
AS $$
DECLARE
    updated_ticket_record tickets%ROWTYPE;
    result JSON;
BEGIN
    -- Verificar se o ticket existe
    IF NOT EXISTS (SELECT 1 FROM tickets WHERE id = ticket_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ticket não encontrado',
            'ticket_id', ticket_id
        );
    END IF;
    
    -- Atualizar o ticket (contorna RLS porque usa SECURITY DEFINER)
    UPDATE tickets 
    SET 
        status = new_status,
        updated_at = NOW(),
        closed_at = CASE 
            WHEN new_status IN ('closed', 'finalizado', 'resolved') 
            THEN closed_timestamp 
            ELSE closed_at 
        END
    WHERE id = ticket_id
    RETURNING * INTO updated_ticket_record;
    
    -- Construir resposta JSON
    result := json_build_object(
        'success', true,
        'ticket_id', updated_ticket_record.id,
        'old_status', 'unknown',
        'new_status', updated_ticket_record.status,
        'updated_at', updated_ticket_record.updated_at,
        'closed_at', updated_ticket_record.closed_at
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'ticket_id', ticket_id
        );
END;
$$;

-- 2. CRIAR FUNÇÃO SIMPLIFICADA APENAS PARA STATUS
CREATE OR REPLACE FUNCTION finalize_ticket(ticket_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Atualizar ticket para status fechado
    UPDATE tickets 
    SET 
        status = 'closed',
        updated_at = NOW(),
        closed_at = NOW()
    WHERE id = ticket_id;
    
    -- Verificar se a atualização funcionou
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
            'error', 'Ticket não encontrado ou não foi possível atualizar',
            'ticket_id', ticket_id
        );
    END IF;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'ticket_id', ticket_id
        );
END;
$$;

-- 3. CONCEDER PERMISSÕES PARA USUÁRIOS AUTENTICADOS
GRANT EXECUTE ON FUNCTION update_ticket_status(UUID, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_ticket(UUID) TO authenticated;

-- 4. TESTAR AS FUNÇÕES
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
        -- Testar função finalize_ticket
        SELECT finalize_ticket(test_ticket_id) INTO test_result;
        RAISE NOTICE 'Teste finalize_ticket: %', test_result;
        
        -- Reverter para o teste não afetar dados reais
        UPDATE tickets SET status = 'open', closed_at = NULL WHERE id = test_ticket_id;
        
    ELSE
        RAISE NOTICE 'Nenhum ticket encontrado para teste';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro no teste: %', SQLERRM;
END $$;

-- 5. COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON FUNCTION update_ticket_status(UUID, TEXT, TIMESTAMPTZ) IS 
'Atualiza o status de um ticket, contornando políticas RLS. Usado pelo frontend para finalizar tickets.';

COMMENT ON FUNCTION finalize_ticket(UUID) IS 
'Finaliza um ticket específico definindo status como closed e timestamp de fechamento.';

-- 6. RESULTADO
SELECT 'Funções RPC criadas com sucesso! Use supabase.rpc("finalize_ticket", {ticket_id: "uuid"}) no frontend.' as resultado; 