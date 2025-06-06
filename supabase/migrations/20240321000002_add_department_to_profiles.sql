-- Adicionar department_id à tabela profiles
ALTER TABLE profiles 
ADD COLUMN department_id UUID REFERENCES departments(id);

-- Criar índice para performance
CREATE INDEX idx_profiles_department_id ON profiles(department_id);

-- Atualizar usuários existentes para ter um departamento padrão
-- (atribuir ao primeiro departamento ativo)
UPDATE profiles 
SET department_id = (
  SELECT id FROM departments 
  WHERE is_active = true 
  ORDER BY created_at 
  LIMIT 1
)
WHERE department_id IS NULL AND role IN ('agent', 'admin');

-- Remover as políticas antigas de tickets
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar tickets" ON tickets;
DROP POLICY IF EXISTS "Usuários autenticados podem criar tickets" ON tickets;
DROP POLICY IF EXISTS "Apenas agents e admins podem atualizar tickets" ON tickets;

-- Criar novas políticas RLS para tickets baseadas em departamento
CREATE POLICY "Usuários podem ver tickets do seu departamento"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    -- Customer pode ver apenas seus próprios tickets
    (auth.uid() = customer_id) OR
    -- Agent/Admin pode ver tickets do seu departamento
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('agent', 'admin')
      AND (
        -- Mesmo departamento
        p.department_id = tickets.department_id OR
        -- Admin pode ver todos se não tiver departamento específico
        (p.role = 'admin' AND p.department_id IS NULL)
      )
    ))
  );

CREATE POLICY "Usuários podem criar tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Customer pode criar tickets
    (auth.uid() = customer_id) OR
    -- Agent/Admin podem criar tickets para seu departamento
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('agent', 'admin')
      AND (
        -- Para seu departamento
        p.department_id = tickets.department_id OR
        -- Admin pode criar para qualquer departamento se não tiver departamento específico
        (p.role = 'admin' AND p.department_id IS NULL)
      )
    ))
  );

CREATE POLICY "Usuários podem atualizar tickets do seu departamento"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    -- Agent atribuído pode atualizar
    (auth.uid() = agent_id) OR
    -- Agent/Admin do mesmo departamento pode atualizar
    (EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('agent', 'admin')
      AND (
        -- Mesmo departamento
        p.department_id = tickets.department_id OR
        -- Admin sem departamento pode atualizar qualquer ticket
        (p.role = 'admin' AND p.department_id IS NULL)
      )
    ))
  );

-- Política para mensagens também baseada em departamento
DROP POLICY IF EXISTS "Usuários podem visualizar mensagens de tickets que têm acesso" ON messages;

CREATE POLICY "Usuários podem ver mensagens de tickets do seu departamento"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      JOIN profiles p ON p.id = auth.uid()
      WHERE t.id = messages.ticket_id AND (
        -- Customer pode ver mensagens dos seus tickets
        (auth.uid() = t.customer_id) OR
        -- Agent/Admin pode ver mensagens do seu departamento
        (p.role IN ('agent', 'admin') AND (
          p.department_id = t.department_id OR
          (p.role = 'admin' AND p.department_id IS NULL)
        ))
      )
    )
  );

-- Criar uma view para facilitar consultas de tickets com informações completas
CREATE OR REPLACE VIEW tickets_with_details AS
SELECT 
  t.*,
  c.name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
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

-- Comentários para documentação
COMMENT ON COLUMN profiles.department_id IS 'Departamento ao qual o usuário pertence (para agents e admins)';
COMMENT ON POLICY "Usuários podem ver tickets do seu departamento" ON tickets IS 'Usuários só veem tickets do seu departamento, exceto admins sem departamento';
COMMENT ON VIEW tickets_with_details IS 'View com informações completas dos tickets, respeitando RLS por departamento'; 