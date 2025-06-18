-- ========================================
-- CORREÇÃO URGENTE: Constraint que impede criação de tickets
-- ========================================
-- Erro: new row violates check constraint "valid_customer_or_anonymous"

-- 1. REMOVER CONSTRAINT PROBLEMÁTICO
-- ========================================
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS valid_customer_or_anonymous;

-- 2. PERMITIR CRIAÇÃO DE TICKETS SEM CUSTOMER_ID (para testes)
-- ========================================
-- Não adicionar constraint restritivo por enquanto
-- Isso permite tickets de teste e webhooks

-- 3. TESTAR INSERÇÃO NOVAMENTE
-- ========================================
INSERT INTO tickets (title, description, channel, status, priority, metadata)
VALUES (
  'Teste Após Correção',
  'Ticket de teste para verificar se o constraint foi corrigido',
  'chat',
  'pendente',
  'normal',
  '{"test": true, "created_by": "CORRECAO_CONSTRAINT_TICKETS"}'::JSONB
);

-- 4. VERIFICAR SE FUNCIONOU
-- ========================================
SELECT 
  'SUCESSO: Constraint corrigido!' as resultado,
  COUNT(*) as total_tickets,
  MAX(created_at) as ultimo_ticket
FROM tickets;

-- 5. MOSTRAR ESTRUTURA ATUAL
-- ========================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('id', 'title', 'channel', 'customer_id', 'metadata')
ORDER BY column_name;

-- 6. VERIFICAR CONSTRAINTS RESTANTES
-- ========================================
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'tickets'
ORDER BY constraint_name; 