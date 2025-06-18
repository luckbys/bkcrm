-- 🛠️ CORREÇÃO DEFINITIVA: Remover e Recriar Funções RPC
-- Execute este script no SQL Editor do Supabase Dashboard

-- =============================================================================
-- 1. REMOVER FUNÇÕES EXISTENTES (se existirem)
-- =============================================================================

-- Remover função create_customer_webhook (todas as versões)
DROP FUNCTION IF EXISTS create_customer_webhook(text);
DROP FUNCTION IF EXISTS create_customer_webhook(text, text);
DROP FUNCTION IF EXISTS create_customer_webhook(text, text, text);
DROP FUNCTION IF EXISTS create_customer_webhook CASCADE;

-- Remover função find_existing_ticket_webhook (todas as versões)
DROP FUNCTION IF EXISTS find_existing_ticket_webhook(text);
DROP FUNCTION IF EXISTS find_existing_ticket_webhook(text, uuid);
DROP FUNCTION IF EXISTS find_existing_ticket_webhook CASCADE;

-- Remover função create_ticket_webhook (todas as versões)
DROP FUNCTION IF EXISTS create_ticket_webhook CASCADE;

RAISE NOTICE '✅ Funções antigas removidas';

-- =============================================================================
-- 2. ADICIONAR COLUNA PHONE NA TABELA PROFILES (se não existir)
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
-- 3. CRIAR FUNÇÃO RPC: create_customer_webhook (VERSÃO CORRIGIDA)
-- =============================================================================

CREATE OR REPLACE FUNCTION create_customer_webhook(
    p_phone TEXT,
    p_name TEXT DEFAULT NULL,
    p_instance_name TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_customer_id UUID;
    v_name TEXT;
    v_email TEXT;
    v_metadata JSONB;
    v_result JSON;
BEGIN
    RAISE NOTICE '👤 [RPC] Criando/buscando cliente: % com telefone: %', p_name, p_phone;
    
    -- Definir nome
    v_name := COALESCE(p_name, 'Cliente WhatsApp ' || RIGHT(p_phone, 4));
    
    -- Gerar email único
    v_email := 'whatsapp-' || p_phone || '@auto-generated.com';
    
    -- Verificar se cliente já existe
    SELECT id INTO v_customer_id 
    FROM profiles 
    WHERE phone = p_phone OR email = v_email
    LIMIT 1;
    
    IF v_customer_id IS NOT NULL THEN
        -- Cliente existe, atualizar dados
        UPDATE profiles 
        SET 
            name = v_name,
            phone = p_phone,
            updated_at = NOW()
        WHERE id = v_customer_id;
        
        RAISE NOTICE '✅ [RPC] Cliente existente atualizado: %', v_customer_id;
    ELSE
        -- Criar novo cliente
        v_customer_id := gen_random_uuid();
        
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
        
        -- Inserir novo profile
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
        );
        
        RAISE NOTICE '✅ [RPC] Novo cliente criado: %', v_customer_id;
    END IF;
    
    -- Preparar resultado JSON
    v_result := json_build_object(
        'id', v_customer_id,
        'name', v_name,
        'email', v_email,
        'phone', p_phone
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ [RPC] Erro ao criar cliente: %', SQLERRM;
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- =============================================================================
-- 4. CRIAR FUNÇÃO RPC: find_existing_ticket_webhook (VERSÃO CORRIGIDA)
-- =============================================================================

CREATE OR REPLACE FUNCTION find_existing_ticket_webhook(
    p_client_phone TEXT,
    p_department_id UUID DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket RECORD;
    v_result JSON;
BEGIN
    RAISE NOTICE '🔍 [RPC] Buscando ticket para telefone: % no departamento: %', p_client_phone, p_department_id;
    
    -- Buscar ticket existente
    SELECT 
        id,
        title,
        status,
        channel,
        metadata,
        created_at,
        updated_at
    INTO v_ticket
    FROM tickets 
    WHERE 
        -- Buscar por telefone nos metadados ou coluna phone
        (
            metadata->>'client_phone' = p_client_phone OR
            metadata->>'whatsapp_phone' = p_client_phone OR
            phone = p_client_phone
        )
        -- Status abertos (não buscar tickets finalizados)
        AND status IN ('open', 'atendimento', 'in_progress', 'pending')
        -- Filtrar por departamento se especificado
        AND (p_department_id IS NULL OR department_id = p_department_id)
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_ticket.id IS NOT NULL THEN
        -- Ticket encontrado
        v_result := json_build_object(
            'id', v_ticket.id,
            'title', v_ticket.title,
            'status', v_ticket.status,
            'channel', v_ticket.channel,
            'metadata', v_ticket.metadata,
            'created_at', v_ticket.created_at,
            'updated_at', v_ticket.updated_at
        );
        
        RAISE NOTICE '✅ [RPC] Ticket encontrado: %', v_ticket.id;
    ELSE
        -- Nenhum ticket encontrado
        v_result := json_build_object('found', false);
        RAISE NOTICE '📭 [RPC] Nenhum ticket encontrado para telefone: %', p_client_phone;
    END IF;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ [RPC] Erro ao buscar ticket: %', SQLERRM;
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- =============================================================================
-- 5. CRIAR FUNÇÃO RPC: create_ticket_webhook (VERSÃO CORRIGIDA)
-- =============================================================================

CREATE OR REPLACE FUNCTION create_ticket_webhook(
    p_client_name TEXT,
    p_client_phone TEXT,
    p_customer_id UUID DEFAULT NULL,
    p_department_id UUID DEFAULT NULL,
    p_instance_name TEXT DEFAULT NULL,
    p_message_content TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ticket_id UUID;
    v_title TEXT;
    v_metadata JSONB;
    v_result JSON;
BEGIN
    RAISE NOTICE '🎫 [RPC] Criando ticket: % para cliente: %', p_title, p_client_name;
    
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
        'can_reply', true,
        'created_at', NOW()
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
    
    -- Preparar resultado
    v_result := json_build_object(
        'id', v_ticket_id,
        'title', v_title,
        'status', 'open',
        'channel', 'whatsapp',
        'metadata', v_metadata
    );
    
    RAISE NOTICE '✅ [RPC] Ticket criado com sucesso: %', v_ticket_id;
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ [RPC] Erro ao criar ticket: %', SQLERRM;
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- =============================================================================
-- 6. ATUALIZAR SCHEMA CACHE (IMPORTANTE!)
-- =============================================================================

-- Forçar atualização do cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- 7. TESTE DAS FUNÇÕES CRIADAS
-- =============================================================================

-- Teste 1: Criar cliente
SELECT 'TESTE 1: Criar cliente' as teste;
SELECT create_customer_webhook('5511999999999', 'Cliente Teste RPC', 'test-instance');

-- Teste 2: Buscar ticket (deve retornar not found)
SELECT 'TESTE 2: Buscar ticket' as teste;
SELECT find_existing_ticket_webhook('5511999999999', NULL);

-- Teste 3: Criar ticket
SELECT 'TESTE 3: Criar ticket' as teste;
SELECT create_ticket_webhook(
    'Cliente Teste RPC',
    '5511999999999', 
    NULL,
    NULL,
    'test-instance',
    'Mensagem de teste RPC',
    'Ticket Teste RPC'
);

-- Teste 4: Buscar ticket novamente (deve encontrar)
SELECT 'TESTE 4: Buscar ticket criado' as teste;
SELECT find_existing_ticket_webhook('5511999999999', NULL);

-- =============================================================================
-- 8. VERIFICAÇÃO FINAL
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

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_customer_webhook'
        )
        THEN '✅ Função create_customer_webhook: EXISTE'
        ELSE '❌ Função create_customer_webhook: NÃO EXISTE'
    END as status_func3;

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
-- ✅ Este script corrige o erro de tipo de retorno das funções!
-- ============================================================================= 