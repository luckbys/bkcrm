-- ========================================
-- CORREÇÃO SIMPLES: Criar tabela tickets completa
-- ========================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover tabela se existir (CUIDADO: isso apaga dados!)
-- DROP TABLE IF EXISTS tickets CASCADE;

-- Criar tabela tickets completa
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Informações básicas OBRIGATÓRIAS
  title TEXT NOT NULL DEFAULT 'Novo Ticket',
  description TEXT,
  subject TEXT,
  
  -- Status e prioridade OBRIGATÓRIOS
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendimento', 'finalizado', 'cancelado', 'open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente', 'low', 'medium', 'high', 'urgent')),
  
  -- Canal OBRIGATÓRIO (isso resolve o erro PGRST204)
  channel TEXT NOT NULL DEFAULT 'chat' CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao', 'phone', 'web')),
  
  -- Relacionamentos
  customer_id UUID,
  agent_id UUID,
  department_id UUID,
  
  -- Metadados
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Controle
  unread BOOLEAN DEFAULT true,
  is_internal BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_id ON tickets(agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Política simples para permitir tudo (pode ajustar depois)
DROP POLICY IF EXISTS "allow_all_tickets" ON tickets;
CREATE POLICY "allow_all_tickets" ON tickets
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Forçar atualização do schema
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- Teste de inserção
INSERT INTO tickets (title, description, channel, status, priority)
VALUES ('Teste de Correção', 'Ticket de teste para verificar se funciona', 'chat', 'pendente', 'normal')
ON CONFLICT (id) DO NOTHING;

-- Verificar se funcionou
SELECT 
  'SUCESSO: Tabela tickets criada e funcionando!' as resultado,
  COUNT(*) as total_tickets
FROM tickets;

-- Verificar colunas
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('id', 'title', 'channel', 'status', 'priority')
ORDER BY column_name; 