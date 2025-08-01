-- SOLUÇÃO RÁPIDA: Criar tabela tickets no Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar tabela tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Relacionamentos
  customer_id UUID REFERENCES profiles(id),
  agent_id UUID REFERENCES profiles(id),
  department_id UUID REFERENCES departments(id),
  
  -- Dados básicos
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  
  -- Status e prioridade
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendimento', 'finalizado', 'cancelado')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
  
  -- Canal
  channel TEXT DEFAULT 'chat' CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao')),
  
  -- WhatsApp
  client_phone TEXT,
  evolution_instance_name TEXT,
  
  -- Metadados
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Controle
  unread BOOLEAN DEFAULT true,
  is_internal BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Constraint para clientes anônimos
  CONSTRAINT valid_customer_or_anonymous CHECK (customer_id IS NOT NULL OR metadata->>'anonymous_contact' IS NOT NULL)
);

-- 4. Criar tabela messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'internal', 'system')),
  
  is_internal BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}'::JSONB,
  sender_name TEXT,
  sender_email TEXT
);

-- 5. Índices importantes
CREATE INDEX IF NOT EXISTS idx_tickets_last_message_at ON tickets(last_message_at);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);

-- 6. Triggers
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. RLS básico
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política simples para tickets
CREATE POLICY "Allow authenticated users to read tickets" ON tickets
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert tickets" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update tickets" ON tickets
  FOR UPDATE TO authenticated
  USING (true);

-- Política simples para messages
CREATE POLICY "Allow authenticated users to read messages" ON messages
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 8. Dados de teste
INSERT INTO tickets (
  title, 
  subject,
  description, 
  status, 
  priority, 
  channel, 
  tags,
  metadata
) VALUES (
  'Problema com sistema de login',
  'Problema com sistema de login',
  'Cliente não consegue acessar sua conta há 2 dias',
  'pendente',
  'alta',
  'whatsapp',
  ARRAY['login', 'urgente'],
  '{"client_name": "João Silva", "anonymous_contact": "joao.silva@email.com"}'::JSONB
), (
  'Dúvida sobre produto premium',
  'Dúvida sobre produto premium',
  'Quer entender as funcionalidades do plano premium',
  'atendimento',
  'normal',
  'email',
  ARRAY['produto', 'premium'],
  '{"client_name": "Maria Santos", "anonymous_contact": "maria.santos@empresa.com"}'::JSONB
), (
  'Integração API não funcionando',
  'Integração API não funcionando',
  'Erro 500 ao fazer chamadas para a API',
  'pendente',
  'alta',
  'chat',
  ARRAY['api', 'integração', 'técnico'],
  '{"client_name": "Ana Oliveira", "anonymous_contact": "ana.oliveira@empresa.com"}'::JSONB
);

-- Verificação final
SELECT 'Tabela tickets criada com sucesso!' as resultado,
       COUNT(*) as total_tickets 
FROM tickets;
