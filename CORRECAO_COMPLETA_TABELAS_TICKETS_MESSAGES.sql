-- ========================================
-- CORREÇÃO COMPLETA: Tabelas tickets e messages
-- ========================================
-- Este script corrige TODOS os problemas de schema das tabelas

-- PARTE 1: CORRIGIR TABELA TICKETS
-- ========================================
SELECT '🎫 CORRIGINDO TABELA TICKETS...' as info;

-- Verificar estrutura atual da tabela tickets
SELECT 'Estrutura atual da tabela tickets:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- Adicionar coluna channel se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'channel'
    ) THEN
        ALTER TABLE tickets ADD COLUMN channel TEXT DEFAULT 'chat';
        RAISE NOTICE '✅ Coluna channel adicionada à tabela tickets';
    ELSE
        RAISE NOTICE '⚠️ Coluna channel já existe na tabela tickets';
    END IF;
END $$;

-- Permitir customer_id NULL
DO $$
BEGIN
    ALTER TABLE tickets ALTER COLUMN customer_id DROP NOT NULL;
    RAISE NOTICE '✅ customer_id agora aceita NULL na tabela tickets';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠️ customer_id já aceita NULL na tabela tickets';
END $$;

-- PARTE 2: CORRIGIR TABELA MESSAGES
-- ========================================
SELECT '💬 CORRIGINDO TABELA MESSAGES...' as info;

-- Verificar se a tabela messages existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'messages'
    ) THEN
        RAISE EXCEPTION 'ERRO: Tabela messages não existe!';
    END IF;
END $$;

-- Verificar estrutura atual da tabela messages
SELECT 'Estrutura atual da tabela messages:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- Adicionar colunas faltantes na tabela messages
DO $$
BEGIN
    -- sender_email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sender_email'
    ) THEN
        ALTER TABLE messages ADD COLUMN sender_email TEXT;
        RAISE NOTICE '✅ Coluna sender_email adicionada à tabela messages';
    ELSE
        RAISE NOTICE '⚠️ Coluna sender_email já existe na tabela messages';
    END IF;

    -- sender_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE messages ADD COLUMN sender_name TEXT;
        RAISE NOTICE '✅ Coluna sender_name adicionada à tabela messages';
    ELSE
        RAISE NOTICE '⚠️ Coluna sender_name já existe na tabela messages';
    END IF;

    -- type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'type'
    ) THEN
        ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text';
        RAISE NOTICE '✅ Coluna type adicionada à tabela messages';
    ELSE
        RAISE NOTICE '⚠️ Coluna type já existe na tabela messages';
    END IF;

    -- is_internal
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'is_internal'
    ) THEN
        ALTER TABLE messages ADD COLUMN is_internal BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Coluna is_internal adicionada à tabela messages';
    ELSE
        RAISE NOTICE '⚠️ Coluna is_internal já existe na tabela messages';
    END IF;

    -- metadata
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE '✅ Coluna metadata adicionada à tabela messages';
    ELSE
        RAISE NOTICE '⚠️ Coluna metadata já existe na tabela messages';
    END IF;
END $$;

-- PARTE 3: VERIFICAÇÃO FINAL
-- ========================================
SELECT '🔍 VERIFICAÇÃO FINAL...' as info;

-- Estrutura final da tabela tickets
SELECT 'ESTRUTURA FINAL - TABELA TICKETS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- Estrutura final da tabela messages
SELECT 'ESTRUTURA FINAL - TABELA MESSAGES:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- PARTE 4: TESTES
-- ========================================
SELECT '🧪 EXECUTANDO TESTES...' as info;

-- Teste 1: Criar ticket
INSERT INTO tickets (title, description, channel, status, priority) 
VALUES (
    'TESTE COMPLETO - Ticket', 
    'Teste após correção completa',
    'whatsapp',
    'open',
    'high'
) 
ON CONFLICT (id) DO NOTHING;

-- Teste 2: Criar mensagem (usando o último ticket criado)
DO $$
DECLARE
    test_ticket_id UUID;
BEGIN
    -- Pegar o ID do último ticket criado
    SELECT id INTO test_ticket_id 
    FROM tickets 
    WHERE title LIKE 'TESTE%' 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Inserir mensagem de teste
    IF test_ticket_id IS NOT NULL THEN
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
            'Mensagem de teste após correção',
            'Sistema de Teste',
            'teste@sistema.com',
            'text',
            false,
            '{"teste": true}'::jsonb
        );
        RAISE NOTICE '✅ Mensagem de teste criada com sucesso!';
    END IF;
END $$;

-- RESULTADO FINAL
SELECT '🎉 CORREÇÃO COMPLETA FINALIZADA!' as resultado;
SELECT 'Tabelas tickets e messages configuradas corretamente!' as status; 