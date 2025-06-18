-- ========================================
-- ADICIONAR COLUNA CHANNEL - ULTRA SIMPLES
-- ========================================
-- Execute este script no Supabase Dashboard → SQL Editor

-- 1. VERIFICAR SE A TABELA TICKETS EXISTE
SELECT 'Verificando tabela tickets...' as info;
SELECT COUNT(*) as tickets_existem FROM information_schema.tables WHERE table_name = 'tickets';

-- 2. ADICIONAR COLUNA CHANNEL DIRETAMENTE
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'chat';

-- 3. VERIFICAR SE A COLUNA FOI CRIADA
SELECT 'Verificando coluna channel...' as info;
SELECT COUNT(*) as channel_existe FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'channel';

-- 4. MOSTRAR ESTRUTURA ATUAL DA TABELA
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
ORDER BY ordinal_position;

-- 5. TESTE SIMPLES
INSERT INTO tickets (title, channel) 
VALUES ('Teste Coluna Channel', 'chat') 
ON CONFLICT (id) DO NOTHING;

SELECT 'SUCESSO: Coluna channel adicionada!' as resultado; 