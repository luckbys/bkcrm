-- SOLUÇÃO COMPLETA PARA ERRO 400: Tabela tickets não existe
-- Execute este script no Supabase Dashboard > SQL Editor

-- ===================================
-- 1. VERIFICAÇÃO DE DEPENDÊNCIAS
-- ===================================

-- Verificar se a extensão uuid-ossp está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar e criar função update_updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- 2. CRIAR TABELA TICKETS
-- ===================================

-- Criar tabela de tickets (se não existir)
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Identificação e relacionamentos
  customer_id UUID REFERENCES profiles(id),
  agent_id UUID REFERENCES profiles(id),
  department_id UUID REFERENCES departments(id),
  
  -- Informações básicas
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT, -- Para compatibilidade com interface existente
  
  -- Status e prioridade
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'atendimento', 'finalizado', 'cancelado', 'open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente', 'low', 'medium', 'high', 'urgent')),
  
  -- Canais e comunicação
  channel TEXT DEFAULT 'chat' CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao', 'phone', 'web')),
  
  -- Campos WhatsApp/Evolution API
  client_phone TEXT,
  client_whatsapp_id TEXT,
  evolution_instance_name TEXT,
  evolution_instance_id TEXT,
  whatsapp_contact_name TEXT,
  
  -- Metadados
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Flags de controle
  unread BOOLEAN DEFAULT true,
  is_internal BOOLEAN DEFAULT false,
  
  -- Informações adicionais
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraint importante para clientes anônimos
  CONSTRAINT valid_customer_or_anonymous CHECK (customer_id IS NOT NULL OR metadata->>'anonymous_contact' IS NOT NULL)
);

-- ===================================
-- 3. CRIAR TABELA MESSAGES
-- ===================================

-- Criar tabela de mensagens (se não existir)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Relacionamentos
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  
  -- Conteúdo da mensagem
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'audio', 'internal', 'system')),
  
  -- Arquivos e anexos
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  
  -- Flags de controle
  is_internal BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Informações do remetente para casos anônimos
  sender_name TEXT,
  sender_email TEXT
);

-- ===================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- ===================================

-- Índices para tickets
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_id ON tickets(agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_channel ON tickets(channel);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_tickets_updated_at ON tickets(updated_at);
CREATE INDEX IF NOT EXISTS idx_tickets_last_message_at ON tickets(last_message_at);
CREATE INDEX IF NOT EXISTS idx_tickets_unread ON tickets(unread);

-- Índices para campos WhatsApp
CREATE INDEX IF NOT EXISTS idx_tickets_client_phone ON tickets(client_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_client_whatsapp_id ON tickets(client_whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_tickets_evolution_instance_name ON tickets(evolution_instance_name);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
CREATE INDEX IF NOT EXISTS idx_messages_is_internal ON messages(is_internal);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- ===================================
-- 5. CRIAR TRIGGERS AUTOMATIZADOS
-- ===================================

-- Trigger para atualizar updated_at
DO $$
BEGIN
  -- Tickets
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tickets_updated_at') THEN
    CREATE TRIGGER update_tickets_updated_at
      BEFORE UPDATE ON tickets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Messages
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_messages_updated_at') THEN
    CREATE TRIGGER update_messages_updated_at
      BEFORE UPDATE ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END
$$;

-- Função para atualizar last_message_at no ticket
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para last_message_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ticket_last_message_trigger') THEN
    CREATE TRIGGER update_ticket_last_message_trigger
      AFTER INSERT ON messages
      FOR EACH ROW
      EXECUTE FUNCTION update_ticket_last_message();
  END IF;
END
$$;

-- ===================================
-- 6. CONFIGURAR RLS (Row Level Security)
-- ===================================

-- Habilitar RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (para evitar conflitos)
DROP POLICY IF EXISTS "tickets_select_policy" ON tickets;
DROP POLICY IF EXISTS "tickets_insert_policy" ON tickets;
DROP POLICY IF EXISTS "tickets_update_policy" ON tickets;
DROP POLICY IF EXISTS "tickets_delete_policy" ON tickets;

DROP POLICY IF EXISTS "messages_select_policy" ON messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
DROP POLICY IF EXISTS "messages_delete_policy" ON messages;

-- Criar políticas simples e funcionais para tickets
CREATE POLICY "tickets_select_policy" ON tickets
  FOR SELECT TO authenticated
  USING (
    -- Customer pode ver seus tickets
    auth.uid() = customer_id OR
    -- Agent pode ver tickets atribuídos
    auth.uid() = agent_id OR
    -- Admin pode ver todos
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') OR
    -- Agent pode ver tickets do seu departamento
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'agent' 
      AND (department_id IS NULL OR p.department = (SELECT d.name FROM departments d WHERE d.id = department_id))
    )
  );

CREATE POLICY "tickets_insert_policy" ON tickets
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Customer pode criar para si
    auth.uid() = customer_id OR
    -- Agents e admins podem criar
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('agent', 'admin'))
  );

CREATE POLICY "tickets_update_policy" ON tickets
  FOR UPDATE TO authenticated
  USING (
    -- Agent atribuído pode atualizar
    auth.uid() = agent_id OR
    -- Admin pode atualizar todos
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "tickets_delete_policy" ON tickets
  FOR DELETE TO authenticated
  USING (
    -- Apenas admin pode deletar
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Criar políticas para messages
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id AND (
        auth.uid() = t.customer_id OR
        auth.uid() = t.agent_id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id AND (
        auth.uid() = t.customer_id OR
        auth.uid() = t.agent_id OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      )
    )
  );

CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = sender_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "messages_delete_policy" ON messages
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ===================================
-- 7. CRIAR DADOS DE TESTE
-- ===================================

-- Inserir tickets de exemplo (apenas se não existirem tickets)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM tickets) = 0 THEN
    -- Ticket 1: Cliente anônimo do WhatsApp
    INSERT INTO tickets (
      title, 
      subject,
      description, 
      status, 
      priority, 
      channel, 
      tags,
      client_phone,
      evolution_instance_name,
      metadata
    ) VALUES (
      'Problema com sistema de login',
      'Problema com sistema de login',
      'Cliente não consegue acessar sua conta há 2 dias',
      'pendente',
      'alta',
      'whatsapp',
      ARRAY['login', 'urgente'],
      '5511999998888',
      'suporte-principal',
      '{"client_name": "João Silva", "anonymous_contact": "joao.silva@email.com", "created_from_whatsapp": true}'::JSONB
    );

    -- Ticket 2: Cliente do email
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
      'Dúvida sobre produto premium',
      'Dúvida sobre produto premium',
      'Quer entender as funcionalidades do plano premium',
      'atendimento',
      'normal',
      'email',
      ARRAY['produto', 'premium'],
      '{"client_name": "Maria Santos", "anonymous_contact": "maria.santos@empresa.com"}'::JSONB
    );

    -- Ticket 3: API Integration
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
      'Integração API não funcionando',
      'Integração API não funcionando',
      'Erro 500 ao fazer chamadas para a API',
      'pendente',
      'alta',
      'chat',
      ARRAY['api', 'integração', 'técnico'],
      '{"client_name": "Ana Oliveira", "anonymous_contact": "ana.oliveira@empresa.com", "phone": "(11) 99999-0000"}'::JSONB
    );

    RAISE NOTICE '✅ Tickets de exemplo criados com sucesso!';
  ELSE
    RAISE NOTICE '📋 Tickets já existem no banco - não criando exemplos';
  END IF;
END
$$;

-- ===================================
-- 8. VERIFICAÇÃO FINAL
-- ===================================

-- Mostrar estatísticas finais
DO $$
DECLARE
  ticket_count INTEGER;
  message_count INTEGER;
  profile_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ticket_count FROM tickets;
  SELECT COUNT(*) INTO message_count FROM messages;
  SELECT COUNT(*) INTO profile_count FROM profiles;
  
  RAISE NOTICE '🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '📊 Estatísticas:';
  RAISE NOTICE '   • Tickets: %', ticket_count;
  RAISE NOTICE '   • Messages: %', message_count;
  RAISE NOTICE '   • Profiles: %', profile_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ Estrutura completa criada:';
  RAISE NOTICE '   • Tabelas: tickets, messages';
  RAISE NOTICE '   • Índices: criados para performance';
  RAISE NOTICE '   • Triggers: updated_at, last_message_at';
  RAISE NOTICE '   • RLS: políticas de segurança configuradas';
  RAISE NOTICE '   • WhatsApp: campos Evolution API prontos';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Sistema pronto para uso!';
END
$$; 