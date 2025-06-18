-- ========================================
-- CORREÇÃO: sender_id NULL na tabela messages
-- ========================================
-- Erro: null value in column "sender_id" violates not-null constraint

-- 1. VERIFICAR CONSTRAINT ATUAL
SELECT 'Verificando constraints da tabela messages...' as info;
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('sender_id', 'sender_name', 'sender_email')
ORDER BY column_name;

-- 2. REMOVER CONSTRAINT NOT NULL DA COLUNA sender_id
ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;

-- 3. VERIFICAR SE A MUDANÇA FOI APLICADA
SELECT 'Verificando se sender_id agora aceita NULL...' as info;
SELECT 
    column_name,
    is_nullable,
    column_default,
    data_type
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'sender_id';

-- 4. TESTE: INSERIR MENSAGEM SEM sender_id
DO $$
DECLARE
    test_ticket_id UUID;
BEGIN
    -- Pegar qualquer ticket existente para teste
    SELECT id INTO test_ticket_id 
    FROM tickets 
    LIMIT 1;
    
    -- Se não há tickets, criar um
    IF test_ticket_id IS NULL THEN
        INSERT INTO tickets (title, description, channel, status, priority) 
        VALUES (
            'Ticket para Teste de Mensagem', 
            'Ticket criado para testar mensagens',
            'chat',
            'open',
            'medium'
        ) 
        RETURNING id INTO test_ticket_id;
    END IF;
    
    -- Inserir mensagem sem sender_id
    INSERT INTO messages (
        ticket_id, 
        content, 
        sender_name, 
        sender_email, 
        type, 
        is_internal, 
        metadata
    ) 
    VALUES (
        test_ticket_id,
        'Teste mensagem sem sender_id',
        'Sistema Teste',
        'teste@sistema.com',
        'text',
        false,
        '{"teste_sender_id": true}'::jsonb
    );
    
    RAISE NOTICE '✅ Mensagem criada com sucesso sem sender_id!';
END $$;

-- 5. VERIFICAR SE O TESTE FUNCIONOU
SELECT 'Verificando mensagens criadas...' as info;
SELECT 
    id, 
    ticket_id, 
    sender_id, 
    sender_name, 
    sender_email, 
    content,
    created_at 
FROM messages 
WHERE content LIKE '%Teste%' 
ORDER BY created_at DESC 
LIMIT 3;

-- 6. MOSTRAR ESTRUTURA FINAL DA TABELA MESSAGES
SELECT 'ESTRUTURA FINAL DA TABELA MESSAGES:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

SELECT 'SUCESSO: sender_id agora aceita NULL!' as resultado; 