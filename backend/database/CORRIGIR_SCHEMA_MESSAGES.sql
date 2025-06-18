-- 🔧 Corrigir Schema da Tabela Messages
-- Este script corrige os problemas identificados no webhook

-- 1. Verificar estrutura atual da tabela messages
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- 2. Adicionar coluna sender_type se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sender_type'
    ) THEN
        ALTER TABLE messages ADD COLUMN sender_type VARCHAR(50) DEFAULT 'customer';
        RAISE NOTICE 'Coluna sender_type adicionada com sucesso';
    ELSE
        RAISE NOTICE 'Coluna sender_type já existe';
    END IF;
END $$;

-- 3. Verificar e corrigir departamentos com IDs inválidos
SELECT id, name FROM departments WHERE id::text LIKE 'dept-%';

-- 4. Criar departamento padrão com UUID válido se necessário
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Geral') THEN
        INSERT INTO departments (id, name, description, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Geral',
            'Departamento geral para tickets sem departamento específico',
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Departamento Geral criado com sucesso';
    ELSE
        RAISE NOTICE 'Departamento Geral já existe';
    END IF;
END $$;

-- 5. Obter UUID do departamento geral
SELECT id, name FROM departments WHERE name = 'Geral' LIMIT 1;

-- 6. Atualizar tickets com department_id inválido
UPDATE tickets 
SET department_id = (
    SELECT id FROM departments WHERE name = 'Geral' LIMIT 1
)
WHERE department_id::text LIKE 'dept-%' OR department_id IS NULL;

-- 7. Verificar estrutura da tabela tickets
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- 8. Forçar atualização do schema cache
NOTIFY pgrst, 'reload schema';

-- 9. Teste de inserção para validar correções
DO $$
DECLARE
    test_ticket_id UUID;
    dept_id UUID;
BEGIN
    -- Obter ID do departamento geral
    SELECT id INTO dept_id FROM departments WHERE name = 'Geral' LIMIT 1;
    
    -- Criar ticket de teste
    INSERT INTO tickets (
        id,
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
        gen_random_uuid(),
        'Teste Webhook Evolution',
        'Ticket criado automaticamente via webhook',
        'open',
        'medium',
        dept_id,
        NULL,
        'whatsapp',
        jsonb_build_object(
            'phone', '5512981022013',
            'instance', 'atendimento-ao-cliente-sac1',
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
        id,
        ticket_id,
        content,
        sender_id,
        sender_type,
        message_type,
        metadata,
        created_at
    ) VALUES (
        gen_random_uuid(),
        test_ticket_id,
        'Mensagem de teste do webhook Evolution API',
        NULL,
        'customer',
        'text',
        jsonb_build_object(
            'phone', '5512981022013',
            'pushName', 'Lucas Borges',
            'instance', 'atendimento-ao-cliente-sac1'
        ),
        NOW()
    );
    
    RAISE NOTICE 'Teste de inserção realizado com sucesso!';
    RAISE NOTICE 'Ticket ID: %', test_ticket_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro no teste: %', SQLERRM;
END $$;

-- 10. Verificar resultados
SELECT 
    t.id as ticket_id,
    t.subject,
    t.department_id,
    d.name as department_name,
    m.content,
    m.sender_type
FROM tickets t
LEFT JOIN departments d ON t.department_id = d.id
LEFT JOIN messages m ON m.ticket_id = t.id
WHERE t.subject = 'Teste Webhook Evolution'
ORDER BY t.created_at DESC
LIMIT 5; 