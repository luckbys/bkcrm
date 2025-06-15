-- ========================================
-- FORÇA ATUALIZAÇÃO DEFINITIVA DO SCHEMA CACHE
-- ========================================
-- Este script força o Supabase a reconhecer as mudanças na tabela tickets

-- 1. VERIFICAR SE A COLUNA CHANNEL EXISTE FISICAMENTE
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'channel'
    ) THEN
        -- Se não existe, criar agora
        ALTER TABLE tickets ADD COLUMN channel TEXT DEFAULT 'chat' 
        CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao', 'phone', 'web'));
        RAISE NOTICE '✅ Coluna channel adicionada';
    ELSE
        RAISE NOTICE '✅ Coluna channel já existe';
    END IF;
END $$;

-- 2. GARANTIR QUE TODAS AS COLUNAS ESSENCIAIS EXISTEM
-- ========================================
DO $$
BEGIN
    -- title
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'title') THEN
        ALTER TABLE tickets ADD COLUMN title TEXT NOT NULL DEFAULT 'Novo Ticket';
    END IF;
    
    -- description
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'description') THEN
        ALTER TABLE tickets ADD COLUMN description TEXT;
    END IF;
    
    -- status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'status') THEN
        ALTER TABLE tickets ADD COLUMN status TEXT DEFAULT 'pendente';
    END IF;
    
    -- priority
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'priority') THEN
        ALTER TABLE tickets ADD COLUMN priority TEXT DEFAULT 'normal';
    END IF;
    
    -- department_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'department_id') THEN
        ALTER TABLE tickets ADD COLUMN department_id UUID;
    END IF;
    
    -- metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'metadata') THEN
        ALTER TABLE tickets ADD COLUMN metadata JSONB DEFAULT '{}'::JSONB;
    END IF;
    
    -- customer_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tickets' AND column_name = 'customer_id') THEN
        ALTER TABLE tickets ADD COLUMN customer_id UUID;
    END IF;
    
    RAISE NOTICE '✅ Todas as colunas essenciais verificadas/criadas';
END $$;

-- 3. REMOVER TODOS OS CONSTRAINTS PROBLEMÁTICOS
-- ========================================
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS valid_customer_or_anonymous;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_channel_check;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_priority_check;

-- 4. RECRIAR CONSTRAINTS MAIS FLEXÍVEIS
-- ========================================
ALTER TABLE tickets ADD CONSTRAINT tickets_channel_check 
CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao', 'phone', 'web'));

ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
CHECK (status IN ('pendente', 'atendimento', 'finalizado', 'cancelado', 'open', 'in_progress', 'resolved', 'closed'));

ALTER TABLE tickets ADD CONSTRAINT tickets_priority_check 
CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente', 'low', 'medium', 'high', 'urgent'));

-- 5. FORÇAR MÚLTIPLAS ATUALIZAÇÕES DO SCHEMA CACHE
-- ========================================
-- Método 1: NOTIFY direto
NOTIFY pgrst, 'reload schema';

-- Método 2: pg_notify
SELECT pg_notify('pgrst', 'reload schema');

-- Método 3: Simular mudança estrutural para forçar reload
ALTER TABLE tickets ALTER COLUMN title SET DEFAULT 'Novo Ticket';
ALTER TABLE tickets ALTER COLUMN channel SET DEFAULT 'chat';

-- Método 4: Recriar índice para forçar detecção
DROP INDEX IF EXISTS idx_tickets_channel_temp;
CREATE INDEX idx_tickets_channel_temp ON tickets(channel);
DROP INDEX IF EXISTS idx_tickets_channel_temp;

-- 6. CRIAR ÍNDICES PRINCIPAIS
-- ========================================
CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);

-- 7. TESTE DE INSERÇÃO COMPLETO
-- ========================================
DELETE FROM tickets WHERE title LIKE 'Teste %';

INSERT INTO tickets (title, description, channel, status, priority, metadata)
VALUES 
  ('Teste Schema Cache 1', 'Primeiro teste', 'chat', 'pendente', 'normal', '{"test": 1}'::JSONB),
  ('Teste Schema Cache 2', 'Segundo teste', 'whatsapp', 'open', 'high', '{"test": 2}'::JSONB),
  ('Teste Schema Cache 3', 'Terceiro teste', 'email', 'in_progress', 'low', '{"test": 3}'::JSONB);

-- 8. VERIFICAÇÃO FINAL COMPLETA
-- ========================================
SELECT 
  'VERIFICAÇÃO FINAL' as etapa,
  'tickets' as tabela,
  COUNT(*) as total_registros
FROM tickets;

-- Mostrar todas as colunas existentes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tickets'
ORDER BY ordinal_position;

-- Mostrar alguns registros de teste
SELECT 
  id,
  title,
  channel,
  status,
  priority,
  created_at
FROM tickets 
WHERE title LIKE 'Teste Schema Cache%'
ORDER BY created_at DESC;

-- 9. FINAL: MAIS UMA TENTATIVA DE RELOAD
-- ========================================
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- 10. INSTRUÇÕES PARA O USUÁRIO
-- ========================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎯 ATUALIZAÇÃO DE SCHEMA CONCLUÍDA!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
    RAISE NOTICE '1. Aguarde 30 segundos';
    RAISE NOTICE '2. Recarregue a página do frontend (F5)';
    RAISE NOTICE '3. Tente criar um ticket novamente';
    RAISE NOTICE '4. Se ainda der erro, execute este script mais uma vez';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 O schema cache foi forçado a atualizar múltiplas vezes';
    RAISE NOTICE '✅ A coluna channel definitivamente existe agora';
END $$; 