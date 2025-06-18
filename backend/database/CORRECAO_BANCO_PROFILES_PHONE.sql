-- 🛠️ CORREÇÃO COMPLETA: Estrutura do Banco para Webhook Evolution API
-- Execute este script no SQL Editor do Supabase Dashboard

-- =============================================================================
-- 1. ADICIONAR COLUNA PHONE NA TABELA PROFILES (se não existir)
-- =============================================================================

DO $$
BEGIN
    -- Verificar se a coluna phone existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) THEN
        -- Adicionar coluna phone
        ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE '✅ Coluna phone adicionada à tabela profiles';
    ELSE
        RAISE NOTICE '✅ Coluna phone já existe na tabela profiles';
    END IF;
END $$;

-- =============================================================================
-- 2. CRIAR FUNÇÃO RPC: find_existing_ticket_webhook
-- =============================================================================

CREATE OR REPLACE FUNCTION find_existing_ticket_webhook(
    p_client_phone TEXT,
    p_department_id UUID DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    channel TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE NOTICE '🔍 Buscando ticket para telefone: % no departamento: %', p_client_phone, p_department_id;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.status,
        t.channel,
        t.metadata,
        t.created_at,
        t.updated_at
    FROM tickets t
    WHERE 
        -- Buscar por telefone nos metadados
        (
            t.metadata->>'client_phone' = p_client_phone OR
            t.metadata->>'whatsapp_phone' = p_client_phone OR
            t.phone = p_client_phone
        )
        -- Status abertos (não buscar tickets finalizados)
        AND t.status IN ('open', 'atendimento', 'in_progress', 'pending')
        -- Filtrar por departamento se especificado
        AND (p_department_id IS NULL OR t.department_id = p_department_id)
        -- Tickets mais recentes primeiro
    ORDER BY t.created_at DESC
    LIMIT 1;
    
    RAISE NOTICE '✅ Busca de ticket concluída';
END;
$$;

-- =============================================================================
-- 3. CRIAR FUNÇÃO RPC: create_ticket_webhook
-- =============================================================================

CREATE OR REPLACE FUNCTION create_ticket_webhook(
    p_client_name TEXT,
    p_client_phone TEXT,
    p_customer_id UUID DEFAULT NULL,
    p_department_id UUID DEFAULT NULL,
    p_instance_name TEXT DEFAULT NULL,
    p_message_content TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    title TEXT,
    status TEXT,
    channel TEXT,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket_id UUID;
    v_title TEXT;
    v_metadata JSONB;
BEGIN
    -- Gerar UUID único
    v_ticket_id := gen_random_uuid();
    
    -- Definir título
    v_title := COALESCE(p_title, 'WhatsApp: ' || p_client_name);
    
    -- Preparar metadata
    v_metadata := jsonb_build_object(
        'client_name', p_client_name,
        'client_phone', p_client_phone,
        'whatsapp_phone', p_client_phone,
        'instance_name', p_instance_name,
        'initial_message', p_message_content,
        'source', 'webhook_evolution',
        'created_via', 'whatsapp',
        'is_whatsapp', true,
        'created_at', NOW()
    );
    
    RAISE NOTICE '🎫 Criando ticket: % para cliente: %', v_title, p_client_name;
    
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
        v_ticket_id,
        v_title,
        COALESCE(p_message_content, 'Mensagem via WhatsApp'),
        'open',
        'medium',
        p_customer_id,
        p_department_id,
        'whatsapp',
        p_client_phone,
        v_metadata,
        NOW(),
        NOW()
    );
    
    -- Retornar dados do ticket criado
    RETURN QUERY
    SELECT 
        v_ticket_id,
        v_title,
        'open'::TEXT,
        'whatsapp'::TEXT,
        v_metadata;
    
    RAISE NOTICE '✅ Ticket criado com sucesso: %', v_ticket_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar ticket: %', SQLERRM;
        RAISE;
END;
$$;

-- =============================================================================
-- 4. CRIAR FUNÇÃO RPC: create_customer_webhook (se não existir)
-- =============================================================================

CREATE OR REPLACE FUNCTION create_customer_webhook(
    p_phone TEXT,
    p_name TEXT DEFAULT NULL,
    p_instance_name TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_name TEXT;
    v_email TEXT;
    v_metadata JSONB;
BEGIN
    -- Gerar UUID único
    v_customer_id := gen_random_uuid();
    
    -- Definir nome
    v_name := COALESCE(p_name, 'Cliente WhatsApp ' || RIGHT(p_phone, 4));
    
    -- Gerar email único
    v_email := 'whatsapp-' || p_phone || '@auto-generated.com';
    
    -- Preparar metadata
    v_metadata := jsonb_build_object(
        'phone', p_phone,
        'source', 'whatsapp_webhook',
        'instance_name', p_instance_name,
        'created_via', 'evolution_api',
        'first_contact', NOW(),
        'status', 'active',
        'category', 'standard',
        'tags', jsonb_build_array('whatsapp', 'auto-created')
    );
    
    RAISE NOTICE '👤 Criando cliente: % com telefone: %', v_name, p_phone;
    
    -- Inserir ou atualizar profile
    INSERT INTO profiles (
        id,
        name,
        email,
        phone,
        role,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        v_customer_id,
        v_name,
        v_email,
        p_phone,
        'customer',
        v_metadata,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = EXCLUDED.phone,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
    
    -- Retornar dados do cliente
    RETURN QUERY
    SELECT 
        v_customer_id,
        v_name,
        v_email,
        p_phone;
    
    RAISE NOTICE '✅ Cliente criado/atualizado: %', v_customer_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao criar cliente: %', SQLERRM;
        RAISE;
END;
$$;

-- =============================================================================
-- 5. ATUALIZAR SCHEMA CACHE (IMPORTANTE!)
-- =============================================================================

-- Forçar atualização do cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- 6. TESTE DAS FUNÇÕES CRIADAS
-- =============================================================================

-- Teste 1: Buscar ticket (deve retornar vazio)
SELECT 'TESTE 1: Buscar ticket' as teste;
SELECT * FROM find_existing_ticket_webhook('5511999999999', NULL);

-- Teste 2: Criar cliente
SELECT 'TESTE 2: Criar cliente' as teste;
SELECT * FROM create_customer_webhook('5511999999999', 'Cliente Teste', 'test-instance');

-- Teste 3: Criar ticket
SELECT 'TESTE 3: Criar ticket' as teste;
SELECT * FROM create_ticket_webhook(
    'Cliente Teste',
    '5511999999999', 
    NULL,
    NULL,
    'test-instance',
    'Mensagem de teste',
    'Ticket Teste'
);

-- =============================================================================
-- 7. VERIFICAÇÃO FINAL
-- =============================================================================

-- Verificar se coluna phone existe
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'phone'
        )
        THEN '✅ Coluna profiles.phone: EXISTE'
        ELSE '❌ Coluna profiles.phone: NÃO EXISTE'
    END as status_phone;

-- Verificar se funções RPC existem
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'find_existing_ticket_webhook'
        )
        THEN '✅ Função find_existing_ticket_webhook: EXISTE'
        ELSE '❌ Função find_existing_ticket_webhook: NÃO EXISTE'
    END as status_func1;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_ticket_webhook'
        )
        THEN '✅ Função create_ticket_webhook: EXISTE'
        ELSE '❌ Função create_ticket_webhook: NÃO EXISTE'
    END as status_func2;

-- =============================================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- 
-- 1. Copie este script COMPLETO
-- 2. Cole no SQL Editor do Supabase Dashboard
-- 3. Execute (clique em Run)
-- 4. Aguarde todas as mensagens de sucesso
-- 5. Reinicie o webhook: node webhook-evolution-complete-corrigido.js
-- 6. Teste enviando uma mensagem WhatsApp
-- 
-- ✅ Após executar este script, todos os erros de schema serão corrigidos!
-- ============================================================================= 