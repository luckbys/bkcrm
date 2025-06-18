-- ========================================
-- ADICIONAR COLUNAS FALTANTES - TABELA MESSAGES
-- ========================================
-- Este script adiciona TODAS as colunas necessárias na tabela messages

-- 1. VERIFICAR ESTRUTURA ATUAL
SELECT 'ESTRUTURA ATUAL DA TABELA MESSAGES:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- 2. ADICIONAR TODAS AS COLUNAS NECESSÁRIAS
DO $$
BEGIN
    -- sender_name
    BEGIN
        ALTER TABLE messages ADD COLUMN sender_name TEXT;
        RAISE NOTICE '✅ Coluna sender_name adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE '⚠️ Coluna sender_name já existe';
    END;

    -- sender_email
    BEGIN
        ALTER TABLE messages ADD COLUMN sender_email TEXT;
        RAISE NOTICE '✅ Coluna sender_email adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE '⚠️ Coluna sender_email já existe';
    END;

    -- type
    BEGIN
        ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text';
        RAISE NOTICE '✅ Coluna type adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE '⚠️ Coluna type já existe';
    END;

    -- is_internal
    BEGIN
        ALTER TABLE messages ADD COLUMN is_internal BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Coluna is_internal adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE '⚠️ Coluna is_internal já existe';
    END;

    -- metadata
    BEGIN
        ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Coluna metadata adicionada';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE '⚠️ Coluna metadata já existe';
    END;
END $$;

-- 3. REMOVER CONSTRAINT NOT NULL DE sender_id
DO $$
BEGIN
    ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
    RAISE NOTICE '✅ sender_id agora aceita NULL';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠️ sender_id já aceita NULL ou constraint não existe';
END $$;

-- 4. VERIFICAR ESTRUTURA APÓS MUDANÇAS
SELECT 'ESTRUTURA APÓS MUDANÇAS:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- 5. TESTE SIMPLES - INSERIR MENSAGEM
DO $$
DECLARE
    test_ticket_id UUID;
BEGIN
    -- Pegar qualquer ticket existente
    SELECT id INTO test_ticket_id FROM tickets LIMIT 1;
    
    -- Se não há tickets, criar um
    IF test_ticket_id IS NULL THEN
        INSERT INTO tickets (title, description, channel, status, priority) 
        VALUES ('Ticket Teste Messages', 'Para testar mensagens', 'chat', 'open', 'medium') 
        RETURNING id INTO test_ticket_id;
    END IF;
    
    -- Inserir mensagem de teste
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
        'TESTE FINAL - Mensagem com todas as colunas',
        'Sistema Teste Final',
        'teste.final@sistema.com',
        'text',
        false,
        '{"teste_final": true, "todas_colunas": "ok"}'::jsonb
    );
    
    RAISE NOTICE '✅ TESTE FINAL: Mensagem criada com sucesso!';
END $$;

-- 6. VERIFICAR MENSAGENS CRIADAS
SELECT 'MENSAGENS DE TESTE CRIADAS:' as info;
SELECT 
    id,
    ticket_id,
    sender_id,
    sender_name,
    sender_email,
    content,
    type,
    is_internal,
    metadata,
    created_at
FROM messages 
WHERE content LIKE '%TESTE%' 
ORDER BY created_at DESC 
LIMIT 3;

SELECT '🎉 SUCESSO: Tabela messages configurada completamente!' as resultado; 