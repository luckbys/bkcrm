-- Criar tabela de tickets
CREATE TABLE tickets (
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
  channel TEXT DEFAULT 'chat' CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao')),
  
  -- Metadados
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Flags de controle
  unread BOOLEAN DEFAULT true,
  is_internal BOOLEAN DEFAULT false,
  
  -- Informações adicionais
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  closed_at TIMESTAMP WITH TIME ZONE,
  
  -- Índices e constraints
  CONSTRAINT valid_customer_or_anonymous CHECK (customer_id IS NOT NULL OR metadata->>'anonymous_contact' IS NOT NULL)
);

-- Criar tabela de mensagens
CREATE TABLE messages (
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

-- Criar índices para tickets
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_tickets_agent_id ON tickets(agent_id);
CREATE INDEX idx_tickets_department_id ON tickets(department_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_channel ON tickets(channel);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_updated_at ON tickets(updated_at);
CREATE INDEX idx_tickets_last_message_at ON tickets(last_message_at);
CREATE INDEX idx_tickets_unread ON tickets(unread);

-- Criar índices para mensagens
CREATE INDEX idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_type ON messages(type);
CREATE INDEX idx_messages_is_internal ON messages(is_internal);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Trigger para atualizar updated_at nas duas tabelas
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar last_message_at no ticket quando uma nova mensagem é criada
CREATE OR REPLACE FUNCTION update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ticket_last_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_last_message();

-- Habilitar RLS nas duas tabelas
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tickets
CREATE POLICY "Usuários autenticados podem visualizar tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    -- Customer pode ver apenas seus próprios tickets
    (auth.uid() = customer_id) OR
    -- Agent pode ver tickets atribuídos a ele
    (auth.uid() = agent_id) OR
    -- Admins podem ver todos os tickets
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ))
  );

CREATE POLICY "Usuários autenticados podem criar tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Customer pode criar tickets para si mesmo
    (auth.uid() = customer_id) OR
    -- Agents e admins podem criar tickets para qualquer customer
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('agent', 'admin')
    ))
  );

CREATE POLICY "Apenas agents e admins podem atualizar tickets"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    -- Agent pode atualizar tickets atribuídos a ele
    (auth.uid() = agent_id) OR
    -- Admins podem atualizar qualquer ticket
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ))
  );

CREATE POLICY "Apenas admins podem deletar tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Políticas RLS para mensagens
CREATE POLICY "Usuários podem visualizar mensagens de tickets que têm acesso"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id AND (
        -- Customer pode ver mensagens dos seus tickets
        (auth.uid() = t.customer_id) OR
        -- Agent pode ver mensagens dos tickets atribuídos a ele
        (auth.uid() = t.agent_id) OR
        -- Admins podem ver todas as mensagens
        (EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        ))
      )
    )
  );

CREATE POLICY "Usuários podem criar mensagens em tickets que têm acesso"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id AND (
        -- Customer pode enviar mensagens nos seus tickets
        (auth.uid() = t.customer_id) OR
        -- Agent pode enviar mensagens nos tickets atribuídos a ele
        (auth.uid() = t.agent_id) OR
        -- Admins podem enviar mensagens em qualquer ticket
        (EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        ))
      )
    )
  );

CREATE POLICY "Apenas o remetente ou admins podem atualizar mensagens"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    -- Remetente pode atualizar suas próprias mensagens
    (auth.uid() = sender_id) OR
    -- Admins podem atualizar qualquer mensagem
    (EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    ))
  );

CREATE POLICY "Apenas admins podem deletar mensagens"
  ON messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Inserir tickets de exemplo para teste
INSERT INTO tickets (
  title, 
  subject,
  description, 
  status, 
  priority, 
  channel, 
  tags,
  customer_id,
  department_id,
  metadata
) 
SELECT 
  'Problema com sistema de login',
  'Problema com sistema de login',
  'Cliente não consegue acessar sua conta há 2 dias',
  'pendente',
  'alta',
  'whatsapp',
  ARRAY['login', 'urgente'],
  p.id,
  d.id,
  '{"client_name": "João Silva", "anonymous_contact": "joao.silva@email.com"}'::JSONB
FROM profiles p, departments d
WHERE p.email = 'joao.silva@email.com' AND d.name = 'Suporte Técnico'
LIMIT 1;

INSERT INTO tickets (
  title,
  subject, 
  description, 
  status, 
  priority, 
  channel, 
  tags,
  customer_id,
  department_id,
  metadata
) 
SELECT 
  'Dúvida sobre produto premium',
  'Dúvida sobre produto premium',
  'Quer entender as funcionalidades do plano premium',
  'atendimento',
  'normal',
  'email',
  ARRAY['produto', 'premium'],
  p.id,
  d.id,
  '{"client_name": "Maria Santos"}'::JSONB
FROM profiles p, departments d
WHERE p.email = 'maria.santos@empresa.com.br' AND d.name = 'Vendas'
LIMIT 1;

-- Se não houver profiles, criar tickets com dados anônimos
INSERT INTO tickets (
  title,
  subject,
  description, 
  status, 
  priority, 
  channel, 
  tags,
  department_id,
  metadata
) 
SELECT 
  'Ticket de teste - Integração API',
  'Integração API não funcionando',
  'Erro 500 ao fazer chamadas para a API',
  'pendente',
  'alta',
  'chat',
  ARRAY['api', 'integração', 'técnico'],
  d.id,
  '{"client_name": "Ana Oliveira", "anonymous_contact": "ana.oliveira@empresa.com", "phone": "(11) 99999-0000"}'::JSONB
FROM departments d
WHERE d.name = 'Suporte Técnico'
LIMIT 1; 