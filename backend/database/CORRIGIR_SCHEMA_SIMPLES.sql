-- 🔧 Correção Simplificada do Schema - Webhook Evolution API
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna sender_type se não existir
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

-- 2. Adicionar coluna message_type se não existir
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

-- 3. Criar departamento Geral se não existir
DO $$
DECLARE
    dept_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO dept_count FROM departments WHERE name = 'Geral';
    
    IF dept_count = 0 THEN
        INSERT INTO departments (id, name, description, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
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

-- 4. Verificar se há tickets com department_id inválido
DO $$
DECLARE
    invalid_count INTEGER;
    dept_id UUID;
BEGIN
    -- Contar tickets com department_id inválido
    SELECT COUNT(*) INTO invalid_count 
    FROM tickets 
    WHERE department_id IS NULL 
       OR department_id::text LIKE 'dept-%'
       OR NOT EXISTS (SELECT 1 FROM departments WHERE id = tickets.department_id);
    
    IF invalid_count > 0 THEN
        -- Obter ID do departamento Geral
        SELECT id INTO dept_id FROM departments WHERE name = 'Geral' LIMIT 1;
        
        -- Atualizar tickets inválidos
        UPDATE tickets 
        SET department_id = dept_id,
            updated_at = NOW()
        WHERE department_id IS NULL 
           OR department_id::text LIKE 'dept-%'
           OR NOT EXISTS (SELECT 1 FROM departments WHERE id = tickets.department_id);
        
        RAISE NOTICE '✅ % tickets corrigidos com department_id válido', invalid_count;
    ELSE
        RAISE NOTICE 'ℹ️ Todos os tickets já têm department_id válido';
    END IF;
END $$;

-- 5. Forçar atualização do schema cache
NOTIFY pgrst, 'reload schema';

-- 6. Teste simples de inserção
DO $$
DECLARE
    test_ticket_id UUID;
    dept_id UUID;
    test_message_id UUID;
BEGIN
    -- Obter ID do departamento geral
    SELECT id INTO dept_id FROM departments WHERE name = 'Geral' LIMIT 1;
    
    -- Criar ticket de teste
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
            'created_via', 'test_script',
            'anonymous_contact', jsonb_build_object(
                'name', 'Lucas Borges',
                'phone', '5512981022013'
            )
        ),
        NOW(),
        NOW()
    ) RETURNING id INTO test_ticket_id;
    
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
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro no teste: %', SQLERRM;
END $$;

-- 7. Verificar resultados finais
SELECT 
    'Estrutura da tabela messages' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
  AND column_name IN ('sender_type', 'message_type')
ORDER BY column_name;

SELECT 
    'Departamentos disponíveis' as info,
    id,
    name,
    description
FROM departments 
ORDER BY name;

SELECT 
    'Tickets de teste criados' as info,
    t.id,
    t.title,
    d.name as department_name,
    COUNT(m.id) as message_count
FROM tickets t
LEFT JOIN departments d ON t.department_id = d.id
LEFT JOIN messages m ON m.ticket_id = t.id
WHERE t.title LIKE 'Teste Webhook Evolution%'
GROUP BY t.id, t.title, d.name
ORDER BY t.created_at DESC
LIMIT 3; 