-- ========================================
-- CORREÇÃO: Permitir customer_id NULL na tabela tickets
-- ========================================
-- Erro: null value in column "customer_id" violates not-null constraint

-- 1. VERIFICAR CONSTRAINT ATUAL
SELECT 'Verificando constraints da tabela tickets...' as info;
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name = 'customer_id';

-- 2. REMOVER CONSTRAINT NOT NULL DA COLUNA customer_id
ALTER TABLE tickets ALTER COLUMN customer_id DROP NOT NULL;

-- 3. VERIFICAR SE A MUDANÇA FOI APLICADA
SELECT 'Verificando se customer_id agora aceita NULL...' as info;
SELECT 
    column_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name = 'customer_id';

-- 4. TESTE: INSERIR TICKET SEM customer_id
INSERT INTO tickets (title, description, channel, status, priority) 
VALUES (
    'Teste Sem Customer ID', 
    'Ticket de teste sem customer_id',
    'chat',
    'open',
    'medium'
) 
ON CONFLICT (id) DO NOTHING;

-- 5. VERIFICAR SE O TESTE FUNCIONOU
SELECT 'Verificando tickets criados...' as info;
SELECT id, title, customer_id, channel, status 
FROM tickets 
WHERE title LIKE 'Teste%' 
ORDER BY created_at DESC 
LIMIT 3;

SELECT 'SUCESSO: customer_id agora aceita NULL!' as resultado; 