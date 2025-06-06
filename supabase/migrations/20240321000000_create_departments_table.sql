-- Criar tabela de departamentos/setores
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT 'Building',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Criar índices
CREATE INDEX idx_departments_active ON departments(is_active);
CREATE INDEX idx_departments_name ON departments(name);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para departments
CREATE POLICY "Departamentos são visíveis para todos os usuários autenticados"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Apenas administradores podem inserir departamentos"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Apenas administradores podem atualizar departamentos"
  ON departments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Apenas administradores podem deletar departamentos"
  ON departments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Inserir departamentos padrão
INSERT INTO departments (name, description, color, icon, is_active) VALUES
  ('Vendas', 'Equipe responsável por vendas e prospecção de clientes', 'blue', 'TrendingUp', true),
  ('Suporte Técnico', 'Atendimento técnico e resolução de problemas', 'green', 'Headphones', true),
  ('Atendimento ao Cliente', 'Atendimento geral e informações', 'purple', 'Users', true),
  ('Financeiro', 'Cobrança, pagamentos e questões financeiras', 'amber', 'CreditCard', true),
  ('Recursos Humanos', 'Gestão de pessoas e recursos humanos', 'pink', 'UserCheck', false),
  ('Marketing', 'Campanhas, divulgação e relacionamento', 'orange', 'Megaphone', true); 