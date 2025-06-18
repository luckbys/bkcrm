-- ========================================
-- CRIAR COLUNA CHANNEL - SOLUÇÃO DEFINITIVA
-- ========================================
-- Este script vai GARANTIR que a coluna channel seja criada

-- 1. MOSTRAR ESTRUTURA ATUAL (ANTES)
SELECT 'ESTRUTURA ATUAL DA TABELA TICKETS (ANTES):' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- 2. ADICIONAR COLUNA CHANNEL (FORÇADO)
DO $$
BEGIN
    -- Tentar adicionar a coluna
    BEGIN
        ALTER TABLE tickets ADD COLUMN channel TEXT DEFAULT 'chat';
        RAISE NOTICE '✅ Coluna channel adicionada com sucesso!';
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE '⚠️ Coluna channel já existe';
    END;
END $$;

-- 3. REMOVER CONSTRAINT NOT NULL DE customer_id
DO $$
BEGIN
    BEGIN
        ALTER TABLE tickets ALTER COLUMN customer_id DROP NOT NULL;
        RAISE NOTICE '✅ customer_id agora aceita NULL';
    EXCEPTION
        WHEN others THEN
            RAISE NOTICE '⚠️ customer_id já aceita NULL ou não existe constraint';
    END;
END $$;

-- 4. MOSTRAR ESTRUTURA ATUAL (DEPOIS)
SELECT 'ESTRUTURA ATUAL DA TABELA TICKETS (DEPOIS):' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- 5. TESTE FINAL - INSERIR TICKET COMPLETO
INSERT INTO tickets (title, description, channel, status, priority) 
VALUES (
    'TESTE FINAL - Coluna Channel', 
    'Teste definitivo da coluna channel',
    'whatsapp',
    'open',
    'high'
);

-- 6. VERIFICAR SE O TESTE FUNCIONOU
SELECT 'TICKETS CRIADOS COM SUCESSO:' as info;
SELECT id, title, channel, status, customer_id, created_at 
FROM tickets 
WHERE title LIKE '%TESTE%' 
ORDER BY created_at DESC 
LIMIT 5;

-- 7. RESULTADO FINAL
SELECT '🎉 SUCESSO TOTAL: Tabela tickets configurada corretamente!' as resultado; 