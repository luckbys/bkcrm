-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar enum para status do ticket
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- Criar enum para prioridade do ticket
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Criar enum para tipo de mensagem
CREATE TYPE message_type AS ENUM ('text', 'image', 'file');

-- Criar enum para papel do usuário
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');

-- Criar tabela de perfis
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer',
  department TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  is_active BOOLEAN DEFAULT true
);

-- Criar tabela de tickets
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  title TEXT NOT NULL,
  description TEXT,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  agent_id UUID REFERENCES profiles(id),
  department TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Criar tabela de mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  type message_type DEFAULT 'text',
  file_url TEXT,
  is_internal BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Criar tabela de notificações
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::JSONB
);

-- Criar índices
CREATE INDEX idx_tickets_customer ON tickets(customer_id);
CREATE INDEX idx_tickets_agent ON tickets(agent_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_messages_ticket ON messages(ticket_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Criar políticas RLS (Row Level Security)

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Profiles são visíveis para todos os usuários autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para tickets
CREATE POLICY "Tickets são visíveis para admin, agentes associados e clientes proprietários"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    ) OR
    agent_id = auth.uid() OR
    customer_id = auth.uid()
  );

CREATE POLICY "Clientes podem criar tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'customer'
    )
  );

CREATE POLICY "Admin e agentes podem atualizar tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role IN ('admin', 'agent')
    )
  );

-- Políticas para mensagens
CREATE POLICY "Mensagens são visíveis para participantes do ticket"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id AND (
        t.customer_id = auth.uid() OR
        t.agent_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      )
    )
  );

CREATE POLICY "Usuários autenticados podem criar mensagens em seus tickets"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id AND (
        t.customer_id = auth.uid() OR
        t.agent_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
      )
    )
  );

-- Políticas para notificações
CREATE POLICY "Usuários podem ver apenas suas próprias notificações"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Sistema pode criar notificações"
  ON notifications FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Usuários podem marcar suas notificações como lidas"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar suas próprias notificações"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Funções e triggers para notificações automáticas

-- Função para criar notificação de ticket atualizado
CREATE OR REPLACE FUNCTION notify_ticket_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar cliente quando o status muda
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
      NEW.customer_id,
      'Status do Ticket Atualizado',
      'O status do seu ticket foi alterado para ' || NEW.status,
      'info',
      jsonb_build_object(
        'ticket_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  -- Notificar agente quando atribuído
  IF OLD.agent_id IS NULL AND NEW.agent_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
      NEW.agent_id,
      'Novo Ticket Atribuído',
      'Você foi atribuído a um novo ticket: ' || NEW.title,
      'info',
      jsonb_build_object('ticket_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificações de ticket
CREATE TRIGGER ticket_notification_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION notify_ticket_update();

-- Função para criar notificação de nova mensagem
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  ticket_info tickets;
  recipient_id UUID;
BEGIN
  -- Buscar informações do ticket
  SELECT * INTO ticket_info
  FROM tickets
  WHERE id = NEW.ticket_id;

  -- Determinar o destinatário da notificação
  IF NEW.sender_id = ticket_info.customer_id THEN
    recipient_id := ticket_info.agent_id;
  ELSE
    recipient_id := ticket_info.customer_id;
  END IF;

  -- Criar notificação se houver destinatário
  IF recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
      recipient_id,
      'Nova Mensagem',
      'Você recebeu uma nova mensagem no ticket: ' || ticket_info.title,
      'info',
      jsonb_build_object(
        'ticket_id', NEW.ticket_id,
        'message_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificações de mensagem
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message(); 