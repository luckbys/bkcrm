-- Criação da tabela para instâncias WhatsApp dos departamentos
CREATE TABLE IF NOT EXISTS whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL,
  instance_name VARCHAR(255) NOT NULL UNIQUE,
  integration VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP-BAILEYS',
  status VARCHAR(50) NOT NULL DEFAULT 'inactive',
  phone_number VARCHAR(20),
  profile_name VARCHAR(255),
  profile_picture_url TEXT,
  last_connection TIMESTAMPTZ,
  auto_reply BOOLEAN DEFAULT false,
  business_hours JSONB DEFAULT '{"enabled": false, "days": [1,2,3,4,5], "timezone": "America/Sao_Paulo"}',
  welcome_message TEXT,
  away_message TEXT,
  webhook_url TEXT,
  settings JSONB DEFAULT '{
    "reject_call": false,
    "groups_ignore": false,
    "always_online": true,
    "read_messages": true,
    "read_status": false,
    "sync_full_history": false
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key constraint
  CONSTRAINT fk_whatsapp_instances_department_id 
    FOREIGN KEY (department_id) 
    REFERENCES departments(id) 
    ON DELETE CASCADE
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_department_id ON whatsapp_instances(department_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_instance_name ON whatsapp_instances(instance_name);

-- Comentários para documentação
COMMENT ON TABLE whatsapp_instances IS 'Instâncias WhatsApp configuradas para cada departamento';
COMMENT ON COLUMN whatsapp_instances.id IS 'Identificador único da instância';
COMMENT ON COLUMN whatsapp_instances.department_id IS 'ID do departamento ao qual a instância pertence';
COMMENT ON COLUMN whatsapp_instances.instance_name IS 'Nome único da instância na Evolution API';
COMMENT ON COLUMN whatsapp_instances.integration IS 'Tipo de integração: WHATSAPP-BAILEYS ou WHATSAPP-BUSINESS';
COMMENT ON COLUMN whatsapp_instances.status IS 'Status da instância: active, inactive, connecting, error';
COMMENT ON COLUMN whatsapp_instances.phone_number IS 'Número do WhatsApp conectado';
COMMENT ON COLUMN whatsapp_instances.profile_name IS 'Nome do perfil WhatsApp';
COMMENT ON COLUMN whatsapp_instances.profile_picture_url IS 'URL da foto do perfil';
COMMENT ON COLUMN whatsapp_instances.last_connection IS 'Última conexão bem-sucedida';
COMMENT ON COLUMN whatsapp_instances.auto_reply IS 'Se deve enviar respostas automáticas';
COMMENT ON COLUMN whatsapp_instances.business_hours IS 'Configurações de horário comercial em JSON';
COMMENT ON COLUMN whatsapp_instances.welcome_message IS 'Mensagem de boas-vindas';
COMMENT ON COLUMN whatsapp_instances.away_message IS 'Mensagem para fora do horário';
COMMENT ON COLUMN whatsapp_instances.webhook_url IS 'URL do webhook para receber eventos';
COMMENT ON COLUMN whatsapp_instances.settings IS 'Configurações específicas da instância em JSON';

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_whatsapp_instances_updated_at
  BEFORE UPDATE ON whatsapp_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_instances_updated_at();

-- Política RLS (Row Level Security) - ajustar conforme necessário
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajustar conforme suas regras de segurança)
CREATE POLICY "Enable all operations for whatsapp_instances" ON whatsapp_instances
  FOR ALL USING (true) WITH CHECK (true);

-- Exemplo de política mais restritiva baseada em usuário autenticado
-- CREATE POLICY "Enable operations for authenticated users" ON whatsapp_instances
--   FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated'); 