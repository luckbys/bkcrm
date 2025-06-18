-- 🔧 Correção Final do Schema - Webhook Evolution API
-- Execute este script no SQL Editor do Supabase

-- PASSO 1: Adicionar coluna sender_type na tabela messages
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sender_type'
    ) THEN
        ALTER TABLE messages ADD COLUMN sender_type VARCHAR(50) DEFAULT 'customer';
        RAISE NOTICE '✅ Coluna sender_type adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna sender_type já existe';
    END IF;
END $$;

-- PASSO 2: Adicionar coluna message_type na tabela messages
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'message_type'
    ) THEN
        ALTER TABLE messages ADD COLUMN message_type VARCHAR(50) DEFAULT 'text';
        RAISE NOTICE '✅ Coluna message_type adicionada com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna message_type já existe';
    END IF;
END $$;

-- PASSO 3: Criar departamento Geral se não existir
DO $$
DECLARE
    dept_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dept_count FROM departments WHERE name = 'Geral';
    
    IF dept_count = 0 THEN
        INSERT INTO departments (name, description, created_at, updated_at)
        VALUES (
            'Geral',
            'Departamento geral para tickets automáticos',
            NOW(),
            NOW()
        );
        RAISE NOTICE '✅ Departamento Geral criado com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Departamento Geral já existe';
    END IF;
END $$;

-- PASSO 4: Forçar atualização do schema cache
NOTIFY pgrst, 'reload schema';

-- PASSO 5: Teste simples de inserção
DO $$
DECLARE
    test_ticket_id UUID;
    dept_id UUID;
    test_message_id UUID;
    ticket_title_column TEXT;
BEGIN
    -- Verificar se a tabela tickets usa 'title' ou 'subject'
    SELECT column_name INTO ticket_title_column
    FROM information_schema.columns 
    WHERE table_name = 'tickets' 
      AND column_name IN ('title', 'subject')
    LIMIT 1;
    
    -- Obter ID do departamento geral
    SELECT id INTO dept_id FROM departments WHERE name = 'Geral' LIMIT 1;
    
    -- Criar ticket de teste usando a coluna correta
    IF ticket_title_column = 'title' THEN
        INSERT INTO tickets (
            title,
            description,
            status,
            priority,
            department_id,
            customer_id,
            channel,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            'Teste Webhook Evolution - ' || NOW()::text,
            'Ticket criado para testar correções do webhook',
            'open',
            'medium',
            dept_id,
            NULL,
            'whatsapp',
            jsonb_build_object(
                'whatsapp_phone', '5512981022013',
                'whatsapp_name', 'Lucas Borges',
                'instance_name', 'atendimento-ao-cliente-sac1',
                'created_via', 'test_script'
            ),
            NOW(),
            NOW()
        ) RETURNING id INTO test_ticket_id;
    ELSE
        INSERT INTO tickets (
            subject,
            description,
            status,
            priority,
            department_id,
            customer_id,
            channel,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            'Teste Webhook Evolution - ' || NOW()::text,
            'Ticket criado para testar correções do webhook',
            'open',
            'medium',
            dept_id,
            NULL,
            'whatsapp',
            jsonb_build_object(
                'whatsapp_phone', '5512981022013',
                'whatsapp_name', 'Lucas Borges',
                'instance_name', 'atendimento-ao-cliente-sac1',
                'created_via', 'test_script'
            ),
            NOW(),
            NOW()
        ) RETURNING id INTO test_ticket_id;
    END IF;
    
    -- Criar mensagem de teste
    INSERT INTO messages (
        ticket_id,
        content,
        sender_id,
        sender_type,
        message_type,
        metadata,
        created_at
    ) VALUES (
        test_ticket_id,
        'Mensagem de teste após correções do schema',
        NULL,
        'customer',
        'text',
        jsonb_build_object(
            'whatsapp_phone', '5512981022013',
            'sender_name', 'Lucas Borges',
            'instance_name', 'atendimento-ao-cliente-sac1',
            'source', 'test_script'
        ),
        NOW()
    ) RETURNING id INTO test_message_id;
    
    RAISE NOTICE '✅ Teste de inserção realizado com sucesso!';
    RAISE NOTICE 'Ticket ID: %', test_ticket_id;
    RAISE NOTICE 'Message ID: %', test_message_id;
    RAISE NOTICE 'Coluna usada para título: %', ticket_title_column;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro no teste: %', SQLERRM;
END $$;

-- PASSO 6: Mostrar resultados
SELECT 'Schema corrigido com sucesso!' as status; 