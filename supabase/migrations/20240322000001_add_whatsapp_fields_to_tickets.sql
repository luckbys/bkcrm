-- Adicionar campos para integração WhatsApp/Evolution API à tabela tickets
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS client_phone TEXT,
ADD COLUMN IF NOT EXISTS client_whatsapp_id TEXT,
ADD COLUMN IF NOT EXISTS evolution_instance_name TEXT,
ADD COLUMN IF NOT EXISTS evolution_instance_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_contact_name TEXT;

-- Atualizar o constraint de channel para incluir 'whatsapp' se ainda não estiver
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_channel_check;

ALTER TABLE tickets 
ADD CONSTRAINT tickets_channel_check 
CHECK (channel IN ('whatsapp', 'email', 'telefone', 'chat', 'site', 'indicacao', 'phone', 'web'));

-- Criar índices para os novos campos para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_client_phone ON tickets(client_phone);
CREATE INDEX IF NOT EXISTS idx_tickets_client_whatsapp_id ON tickets(client_whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_tickets_evolution_instance_name ON tickets(evolution_instance_name);

-- Comentários para documentação
COMMENT ON COLUMN tickets.client_phone IS 'Número de telefone do cliente para WhatsApp (formato: 5511999999999)';
COMMENT ON COLUMN tickets.client_whatsapp_id IS 'ID completo do WhatsApp (formato: 5511999999999@s.whatsapp.net)';
COMMENT ON COLUMN tickets.evolution_instance_name IS 'Nome da instância Evolution API responsável por este ticket';
COMMENT ON COLUMN tickets.evolution_instance_id IS 'ID da instância Evolution API';
COMMENT ON COLUMN tickets.whatsapp_contact_name IS 'Nome do contato no WhatsApp (pushName)';

-- Atualizar a view tickets_with_details para incluir os novos campos
DROP VIEW IF EXISTS tickets_with_details;

CREATE OR REPLACE VIEW tickets_with_details AS
SELECT 
  t.*,
  c.name as customer_name,
  c.email as customer_email,
  a.name as agent_name,
  a.email as agent_email,
  d.name as department_name,
  d.color as department_color,
  d.icon as department_icon
FROM tickets t
LEFT JOIN profiles c ON t.customer_id = c.id
LEFT JOIN profiles a ON t.agent_id = a.id  
LEFT JOIN departments d ON t.department_id = d.id;

-- Habilitar RLS na view
ALTER VIEW tickets_with_details SET (security_invoker = true);

-- Comentário na view atualizada
COMMENT ON VIEW tickets_with_details IS 'View com informações completas dos tickets incluindo campos WhatsApp, respeitando RLS por departamento'; 