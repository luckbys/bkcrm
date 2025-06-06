-- Criar enum para status do cliente se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_status') THEN
    CREATE TYPE customer_status AS ENUM ('prospect', 'active', 'inactive', 'blocked');
  END IF;
END $$;

-- Criar enum para categoria do cliente se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'customer_category') THEN
    CREATE TYPE customer_category AS ENUM ('bronze', 'silver', 'gold', 'platinum');
  END IF;
END $$;

-- Criar enum para tipo de documento se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE document_type AS ENUM ('cpf', 'cnpj', 'passport', 'other');
  END IF;
END $$;

-- Criar tabela de clientes se não existir
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Dados básicos
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  document TEXT,
  document_type document_type DEFAULT 'cpf',
  
  -- Dados comerciais
  company TEXT,
  position TEXT,
  
  -- Endereço
  address JSONB DEFAULT '{
    "street": "",
    "number": "",
    "complement": "",
    "neighborhood": "",
    "city": "",
    "state": "",
    "zipCode": ""
  }'::JSONB,
  
  -- Classificação e status
  status customer_status DEFAULT 'prospect',
  category customer_category DEFAULT 'bronze',
  channel TEXT DEFAULT 'site',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Métricas
  total_orders INTEGER DEFAULT 0,
  total_value DECIMAL(10,2) DEFAULT 0,
  average_ticket DECIMAL(10,2) DEFAULT 0,
  
  -- Relacionamentos
  responsible_agent_id UUID REFERENCES profiles(id),
  
  -- Outros
  notes TEXT,
  last_interaction TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::JSONB,
  
  -- Restrições
  CONSTRAINT customers_email_unique UNIQUE (email)
);

-- Criar índices se não existirem
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_profile') THEN
    CREATE INDEX idx_customers_profile ON customers(profile_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_email') THEN
    CREATE INDEX idx_customers_email ON customers(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_document') THEN
    CREATE INDEX idx_customers_document ON customers(document);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_status') THEN
    CREATE INDEX idx_customers_status ON customers(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_category') THEN
    CREATE INDEX idx_customers_category ON customers(category);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_customers_responsible_agent') THEN
    CREATE INDEX idx_customers_responsible_agent ON customers(responsible_agent_id);
  END IF;
END $$;

-- Criar trigger para atualizar updated_at se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_customers_updated_at') THEN
    CREATE TRIGGER update_customers_updated_at
      BEFORE UPDATE ON customers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Migrar dados existentes apenas se a tabela estiver vazia
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM customers LIMIT 1) THEN
    INSERT INTO customers (
      profile_id,
      name,
      email,
      phone,
      document,
      document_type,
      company,
      position,
      address,
      status,
      category,
      channel,
      tags,
      total_orders,
      total_value,
      average_ticket,
      responsible_agent_id,
      notes,
      last_interaction,
      is_active,
      created_at,
      updated_at
    )
    SELECT 
      id as profile_id,
      name,
      email,
      metadata->>'phone' as phone,
      metadata->>'document' as document,
      COALESCE((metadata->>'documentType')::document_type, 'cpf') as document_type,
      metadata->>'company' as company,
      metadata->>'position' as position,
      COALESCE(metadata->'address', '{"street":"","number":"","complement":"","neighborhood":"","city":"","state":"","zipCode":""}'::jsonb) as address,
      COALESCE((metadata->>'status')::customer_status, 'prospect') as status,
      COALESCE((metadata->>'category')::customer_category, 'bronze') as category,
      COALESCE(metadata->>'channel', 'site') as channel,
      CASE 
        WHEN metadata->'tags' IS NOT NULL AND jsonb_typeof(metadata->'tags') = 'array'
        THEN ARRAY(SELECT jsonb_array_elements_text(metadata->'tags'))
        ELSE ARRAY[]::TEXT[]
      END as tags,
      COALESCE((metadata->>'totalOrders')::INTEGER, 0) as total_orders,
      COALESCE((metadata->>'totalValue')::DECIMAL, 0) as total_value,
      COALESCE((metadata->>'averageTicket')::DECIMAL, 0) as average_ticket,
      (metadata->>'responsibleAgent')::UUID as responsible_agent_id,
      metadata->>'notes' as notes,
      COALESCE((metadata->>'lastInteraction')::TIMESTAMP WITH TIME ZONE, created_at) as last_interaction,
      is_active,
      created_at,
      updated_at
    FROM profiles
    WHERE role = 'customer';
  END IF;
END $$;

-- Habilitar RLS se ainda não estiver habilitado
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Clientes são visíveis para admin e agentes" ON customers;
DROP POLICY IF EXISTS "Apenas admin e agentes podem criar clientes" ON customers;
DROP POLICY IF EXISTS "Apenas admin e agentes podem atualizar clientes" ON customers;
DROP POLICY IF EXISTS "Apenas admin pode deletar clientes" ON customers;

-- Criar novas políticas mais permissivas
CREATE POLICY "Clientes são visíveis para usuários autenticados"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar clientes"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar clientes"
  ON customers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar clientes"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Comentários da tabela
COMMENT ON TABLE customers IS 'Tabela de clientes do sistema CRM';
COMMENT ON COLUMN customers.profile_id IS 'Referência ao perfil do usuário associado (se houver)';
COMMENT ON COLUMN customers.document_type IS 'Tipo de documento (CPF, CNPJ, etc)';
COMMENT ON COLUMN customers.status IS 'Status do cliente no funil de vendas';
COMMENT ON COLUMN customers.category IS 'Categoria/nível do cliente';
COMMENT ON COLUMN customers.channel IS 'Canal de origem do cliente';
COMMENT ON COLUMN customers.total_orders IS 'Número total de pedidos do cliente';
COMMENT ON COLUMN customers.total_value IS 'Valor total gasto pelo cliente';
COMMENT ON COLUMN customers.average_ticket IS 'Ticket médio do cliente';
COMMENT ON COLUMN customers.last_interaction IS 'Data da última interação com o cliente'; 