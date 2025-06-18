-- ===============================================================
-- CORREÇÃO ENUM TICKET_STATUS - WEBHOOK EVOLUTION API
-- ===============================================================
-- 
-- Este script resolve o erro:
-- "invalid input value for enum ticket_status: 'pendente'"
-- 
-- Problema: Webhook usa valores em português ('pendente', 'atendimento', 
-- 'finalizado') mas enum só aceita valores em inglês
--
-- Data: 2025-01-17
-- ===============================================================

-- 1. VERIFICAR VALORES ATUAIS DO ENUM
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'ticket_status'
);

-- 2. VERIFICAR SE ENUM EXISTE
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'ticket_status'
GROUP BY t.typname;

-- 3. ADICIONAR VALORES EM PORTUGUÊS AO ENUM EXISTENTE
-- Isso permite compatibilidade com webhook e frontend
DO $$
BEGIN
    -- Adicionar valores em português se não existirem
    BEGIN
        ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'pendente';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Valor "pendente" já existe no enum';
    END;
    
    BEGIN
        ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'atendimento';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Valor "atendimento" já existe no enum';
    END;
    
    BEGIN
        ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'finalizado';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Valor "finalizado" já existe no enum';
    END;
    
    BEGIN
        ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'cancelado';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Valor "cancelado" já existe no enum';
    END;
    
    RAISE NOTICE 'Valores em português adicionados ao enum ticket_status';
END $$;

-- 4. VERIFICAR VALORES APÓS ADIÇÃO
SELECT 
    'Valores do enum ticket_status:' as info,
    string_agg(enumlabel, ', ' ORDER BY enumsortorder) as valores
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'ticket_status'
);

-- 5. CRIAR FUNÇÃO DE MAPEAMENTO PARA COMPATIBILIDADE
-- Esta função converte valores entre português e inglês
CREATE OR REPLACE FUNCTION map_ticket_status(status_input TEXT)
RETURNS ticket_status
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Mapeamento português -> inglês (se necessário)
    CASE LOWER(status_input)
        WHEN 'pendente' THEN RETURN 'pendente'::ticket_status;
        WHEN 'atendimento' THEN RETURN 'atendimento'::ticket_status;
        WHEN 'em atendimento' THEN RETURN 'atendimento'::ticket_status;
        WHEN 'finalizado' THEN RETURN 'finalizado'::ticket_status;
        WHEN 'cancelado' THEN RETURN 'cancelado'::ticket_status;
        
        -- Mapeamento inglês -> português (compatibilidade reversa)
        WHEN 'pending' THEN RETURN 'pendente'::ticket_status;
        WHEN 'in_progress' THEN RETURN 'atendimento'::ticket_status;
        WHEN 'open' THEN RETURN 'pendente'::ticket_status;
        WHEN 'resolved' THEN RETURN 'finalizado'::ticket_status;
        WHEN 'closed' THEN RETURN 'finalizado'::ticket_status;
        WHEN 'cancelled' THEN RETURN 'cancelado'::ticket_status;
        
        -- Valor padrão
        ELSE RETURN 'pendente'::ticket_status;
    END CASE;
END;
$$;

-- 6. CRIAR FUNÇÃO DE BUSCA DE TICKETS COMPATÍVEL COM WEBHOOK
CREATE OR REPLACE FUNCTION find_existing_ticket_webhook(
    p_client_phone TEXT,
    p_department_id UUID DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    status ticket_status,
    client_phone TEXT,
    whatsapp_phone TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.status,
        (t.metadata->>'client_phone')::TEXT as client_phone,
        (t.metadata->>'whatsapp_phone')::TEXT as whatsapp_phone
    FROM tickets t
    WHERE 
        -- Buscar por telefone em diferentes campos
        (
            (t.metadata->>'client_phone') = p_client_phone OR
            (t.metadata->>'whatsapp_phone') = p_client_phone OR
            t.phone = p_client_phone
        )
        -- Apenas tickets ativos (não finalizados ou cancelados)
        AND t.status IN ('pendente', 'atendimento', 'open', 'in_progress')
        -- Filtro de departamento opcional
        AND (p_department_id IS NULL OR t.department_id = p_department_id)
    ORDER BY t.created_at DESC
    LIMIT 1;
END;
$$;

-- 7. CRIAR FUNÇÃO DE CRIAÇÃO DE TICKET COMPATÍVEL COM WEBHOOK
CREATE OR REPLACE FUNCTION create_ticket_webhook(
    p_title TEXT,
    p_customer_id UUID DEFAULT NULL,
    p_department_id UUID DEFAULT NULL,
    p_client_phone TEXT DEFAULT NULL,
    p_client_name TEXT DEFAULT NULL,
    p_instance_name TEXT DEFAULT NULL,
    p_message_content TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    status ticket_status,
    channel TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    ticket_id UUID;
    ticket_metadata JSONB;
BEGIN
    -- Preparar metadata
    ticket_metadata := jsonb_build_object(
        'client_phone', p_client_phone,
        'whatsapp_phone', p_client_phone,
        'client_name', p_client_name,
        'instance_name', p_instance_name,
        'initial_message', p_message_content,
        'source', 'webhook_evolution',
        'created_via', 'whatsapp'
    );
    
    -- Inserir ticket
    INSERT INTO tickets (
        id,
        title,
        description,
        status,
        priority,
        customer_id,
        department_id,
        channel,
        phone,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        p_title,
        COALESCE(p_message_content, 'Mensagem via WhatsApp'),
        'pendente'::ticket_status, -- Usar valor em português
        'medium',
        p_customer_id,
        p_department_id,
        'whatsapp',
        p_client_phone,
        ticket_metadata,
        now(),
        now()
    ) RETURNING tickets.id INTO ticket_id;
    
    -- Retornar dados do ticket criado
    RETURN QUERY
    SELECT 
        tickets.id,
        tickets.title,
        tickets.status,
        tickets.channel
    FROM tickets 
    WHERE tickets.id = ticket_id;
END;
$$;

-- 8. TESTE DAS FUNÇÕES
-- Teste de mapeamento de status
SELECT 
    'Teste mapeamento:' as tipo,
    map_ticket_status('pendente') as resultado_pendente,
    map_ticket_status('atendimento') as resultado_atendimento,
    map_ticket_status('open') as resultado_open;

-- 9. TESTE DE BUSCA DE TICKET
SELECT 'Testando busca de ticket...' as info;
SELECT * FROM find_existing_ticket_webhook('5511999887766', NULL);

-- 10. GRANTS NECESSÁRIOS
GRANT EXECUTE ON FUNCTION map_ticket_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION find_existing_ticket_webhook TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_ticket_webhook TO anon, authenticated;

-- 11. VERIFICAÇÃO FINAL
SELECT 
    'Status do enum:' as check_type,
    COUNT(*)::TEXT || ' valores disponíveis' as status
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ticket_status')

UNION ALL

SELECT 
    'Funções criadas:' as check_type,
    COUNT(*)::TEXT || ' funções webhook' as status
FROM information_schema.routines 
WHERE routine_name LIKE '%_webhook' 
AND routine_schema = 'public';

-- 12. MOSTRAR TODOS OS VALORES DO ENUM
SELECT 
    enumlabel as valor_disponivel,
    enumsortorder as ordem
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ticket_status')
ORDER BY enumsortorder;

NOTIFY pgrst, 'reload schema'; 