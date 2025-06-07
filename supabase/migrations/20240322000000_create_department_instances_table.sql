-- Criar tabela para armazenar instâncias da Evolution API por setor
CREATE TABLE department_instances (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  department_name TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  server_url TEXT NOT NULL,
  apikey TEXT NOT NULL,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'configured', 'connecting', 'connected', 'disconnected', 'error', 'not_found')),
  settings JSONB DEFAULT '{}'::JSONB,
  webhook_url TEXT,
  qr_code TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Criar índices para melhor performance
CREATE INDEX idx_department_instances_department_id ON department_instances(department_id);
CREATE INDEX idx_department_instances_status ON department_instances(status);
CREATE INDEX idx_department_instances_instance_name ON department_instances(instance_name);
CREATE INDEX idx_department_instances_instance_id ON department_instances(instance_id);
CREATE INDEX idx_department_instances_created_at ON department_instances(created_at);

-- Criar índice único para evitar duplicações de instância por setor
CREATE UNIQUE INDEX idx_department_instances_unique_instance ON department_instances(department_id, instance_name);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_department_instances_updated_at
  BEFORE UPDATE ON department_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE department_instances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para department_instances
CREATE POLICY "Instâncias são visíveis para todos os usuários autenticados"
  ON department_instances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas administradores podem inserir instâncias"
  ON department_instances FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Apenas administradores podem atualizar instâncias"
  ON department_instances FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Apenas administradores podem deletar instâncias"
  ON department_instances FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Adicionar comentários para documentação
COMMENT ON TABLE department_instances IS 'Tabela para armazenar instâncias da Evolution API organizadas por setor/departamento';
COMMENT ON COLUMN department_instances.id IS 'ID único da instância (formato: departmentId_instanceId)';
COMMENT ON COLUMN department_instances.department_id IS 'ID do departamento/setor';
COMMENT ON COLUMN department_instances.department_name IS 'Nome do departamento (cache para performance)';
COMMENT ON COLUMN department_instances.instance_name IS 'Nome da instância no Evolution API';
COMMENT ON COLUMN department_instances.instance_id IS 'ID da instância no Evolution API';
COMMENT ON COLUMN department_instances.server_url IS 'URL do servidor Evolution API';
COMMENT ON COLUMN department_instances.apikey IS 'Chave de API para autenticação';
COMMENT ON COLUMN department_instances.phone_number IS 'Número de telefone associado (quando conectado)';
COMMENT ON COLUMN department_instances.status IS 'Status da instância (created, configured, connecting, connected, disconnected, error, not_found)';
COMMENT ON COLUMN department_instances.settings IS 'Configurações específicas da instância';
COMMENT ON COLUMN department_instances.webhook_url IS 'URL do webhook para receber eventos';
COMMENT ON COLUMN department_instances.qr_code IS 'QR Code para conexão (quando disponível)';
COMMENT ON COLUMN department_instances.last_sync IS 'Última sincronização com a Evolution API';
COMMENT ON COLUMN department_instances.metadata IS 'Metadados adicionais e configurações extras'; 