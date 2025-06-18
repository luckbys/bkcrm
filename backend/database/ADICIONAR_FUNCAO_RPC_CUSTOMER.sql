-- ===================================
-- FUNÇÃO RPC: Criar Cliente (Contorna RLS)
-- ===================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. VERIFICAR SE A TABELA CUSTOMERS EXISTE
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- 2. CRIAR FUNÇÃO PARA CRIAR CLIENTE (CONTORNA RLS)
CREATE OR REPLACE FUNCTION create_customer_webhook(
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do proprietário da função
AS $$
DECLARE
    new_customer_id UUID;
    result JSON;
    final_email TEXT;
BEGIN
    -- Determinar email final
    final_email := COALESCE(customer_email, 'whatsapp-' || customer_phone || '@auto-generated.com');
    
    -- Verificar se já existe cliente com este telefone
    SELECT id INTO new_customer_id 
    FROM customers 
    WHERE phone = customer_phone 
    LIMIT 1;
    
    IF new_customer_id IS NOT NULL THEN
        -- Cliente já existe, apenas atualizar last_interaction
        UPDATE customers 
        SET 
            last_interaction = NOW(),
            updated_at = NOW()
        WHERE id = new_customer_id;
        
        result := json_build_object(
            'success', true,
            'customer_id', new_customer_id,
            'message', 'Cliente já existia - atualizado last_interaction',
            'action', 'updated'
        );
        
        RETURN result;
    END IF;
    
    -- Criar novo cliente (contorna RLS porque usa SECURITY DEFINER)
    INSERT INTO customers (
        name, 
        phone, 
        email, 
        status, 
        category, 
        tags, 
        notes,
        created_at,
        updated_at,
        last_interaction,
        metadata
    )
    VALUES (
        customer_name,
        customer_phone,
        final_email,
        'prospect',
        'bronze',
        ARRAY['auto-criado', 'whatsapp'],
        'Cliente criado automaticamente via WhatsApp',
        NOW(),
        NOW(),
        NOW(),
        json_build_object(
            'auto_created', true,
            'created_via', 'webhook_evolution',
            'original_contact', customer_phone,
            'creation_source', 'whatsapp_message'
        )
    )
    RETURNING id INTO new_customer_id;
    
    result := json_build_object(
        'success', true,
        'customer_id', new_customer_id,
        'message', 'Cliente criado com sucesso',
        'action', 'created'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN unique_violation THEN
        -- Se houve violação de unicidade (email duplicado), tentar com timestamp
        final_email := 'whatsapp-' || customer_phone || '-' || extract(epoch from now()) || '@auto-generated.com';
        
        INSERT INTO customers (
            name, phone, email, status, category, tags, notes,
            created_at, updated_at, last_interaction, metadata
        )
        VALUES (
            customer_name, customer_phone, final_email, 'prospect', 'bronze',
            ARRAY['auto-criado', 'whatsapp'],
            'Cliente criado automaticamente via WhatsApp (email com timestamp)',
            NOW(), NOW(), NOW(),
            json_build_object(
                'auto_created', true,
                'created_via', 'webhook_evolution',
                'original_contact', customer_phone,
                'creation_source', 'whatsapp_message',
                'email_conflict_resolved', true
            )
        )
        RETURNING id INTO new_customer_id;
        
        result := json_build_object(
            'success', true,
            'customer_id', new_customer_id,
            'message', 'Cliente criado com email alternativo',
            'action', 'created_with_alt_email'
        );
        
        RETURN result;
        
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'customer_name', customer_name,
            'customer_phone', customer_phone
        );
END;
$$;

-- 3. CONCEDER PERMISSÕES PARA USUÁRIOS AUTENTICADOS
GRANT EXECUTE ON FUNCTION create_customer_webhook(TEXT, TEXT, TEXT) TO authenticated;

-- 4. TESTAR A FUNÇÃO
DO $$
DECLARE
    test_result JSON;
BEGIN
    -- Testar criação de cliente
    SELECT create_customer_webhook(
        'Cliente Teste Webhook',
        '11999999999',
        'teste@webhook.com'
    ) INTO test_result;
    
    RAISE NOTICE 'Teste create_customer_webhook: %', test_result;
    
    -- Limpar teste
    DELETE FROM customers WHERE phone = '11999999999' AND name = 'Cliente Teste Webhook';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro no teste: %', SQLERRM;
END $$;

-- 5. RESULTADO
SELECT 'Função create_customer_webhook criada com sucesso! Webhook pode criar clientes contornando RLS.' as resultado; 