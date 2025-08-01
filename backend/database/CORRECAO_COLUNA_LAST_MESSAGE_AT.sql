-- CORRECAO: Adicionar coluna last_message_at faltante
-- ========================================
-- CORREÇÃO: Adicionar coluna last_message_at faltante
-- ========================================
-- Este script corrige o erro: column "last_message_at" does not exist
-- Execute no SQL Editor do Supabase

-- 1. Adicionar a coluna last_message_at à tabela tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Comentar a coluna para documentação
COMMENT ON COLUMN tickets.last_message_at IS 'Timestamp da última mensagem do ticket';

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_last_message_at 
ON tickets (last_message_at DESC);

-- 4. Atualizar registros existentes para ter um valor válido
UPDATE tickets 
SET last_message_at = updated_at 
WHERE last_message_at IS NULL;

-- 5. Criar ou atualizar trigger para manter last_message_at automático
CREATE OR REPLACE FUNCTION update_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando uma nova mensagem é inserida
  IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'messages' THEN
    UPDATE tickets 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
  END IF;
  
  -- Quando uma mensagem é atualizada
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'messages' THEN
    UPDATE tickets 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.ticket_id;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Criar triggers na tabela messages
DROP TRIGGER IF EXISTS trigger_update_last_message_at_insert ON messages;
CREATE TRIGGER trigger_update_last_message_at_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_message_at();

DROP TRIGGER IF EXISTS trigger_update_last_message_at_update ON messages;
CREATE TRIGGER trigger_update_last_message_at_update
  AFTER UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_message_at();

-- 7. Verificar se a coluna foi criada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'tickets' 
  AND column_name = 'last_message_at';

-- 8. Teste: Verificar registros
SELECT 
  id, 
  title, 
  last_message_at, 
  created_at, 
  updated_at 
FROM tickets 
LIMIT 5;

-- ========================================
-- INSTRUÇÕES DE USO:
-- ========================================
-- 1. Copie este script completo
-- 2. Cole no SQL Editor do Supabase
-- 3. Execute o script
-- 4. Verifique se não há erros
-- 5. Teste o sistema CRM novamente
-- ========================================

NOTIFY pgrst, 'reload schema';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Coluna last_message_at adicionada com sucesso!';
  RAISE NOTICE '✅ Triggers configurados para atualização automática';
  RAISE NOTICE '✅ Índices criados para performance';
  RAISE NOTICE '✅ Registros existentes atualizados';
  RAISE NOTICE '🔄 Execute agora no CRM para testar';
END
$$;
