-- VERIFICAR E CORRIGIR TABELAS PARA CRIAÇÃO AUTOMÁTICA DE TICKETS
-- Execute este script no SQL Editor do Supabase

-- 1. VERIFICAR SE TABELAS EXISTEM
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('tickets', 'messages', 'departments')
ORDER BY table_name;

-- 2. CRIAR TABELA DEPARTMENTS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INSERIR DEPARTAMENTO PADRÃO
INSERT INTO departments (name, description) 
VALUES ('Atendimento Geral', 'Departamento padrão para tickets criados automaticamente')
ON CONFLICT DO NOTHING;

-- 4. VERIFICAR/CORRIGIR ESTRUTURA DA TABELA TICKETS
-- Adicionar colunas que podem estar faltando
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'novo',
ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'media',
ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'whatsapp',
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS customer_id UUID,
ADD COLUMN IF NOT EXISTS assigned_to UUID,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. VERIFICAR/CORRIGIR ESTRUTURA DA TABELA MESSAGES
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender_type VARCHAR(50) NOT NULL, -- 'customer', 'agent', 'system'
  sender_name VARCHAR(255),
  sender_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 7. RLS (Row Level Security) - IMPORTANTE PARA SUPABASE
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS RLS BÁSICAS (PERMITIR TUDO PARA TESTES)
-- ATENÇÃO: Em produção, configure políticas mais restritivas

-- Departments
DROP POLICY IF EXISTS "allow_all_departments" ON departments;
CREATE POLICY "allow_all_departments" ON departments
FOR ALL USING (true) WITH CHECK (true);

-- Tickets
DROP POLICY IF EXISTS "allow_all_tickets" ON tickets;
CREATE POLICY "allow_all_tickets" ON tickets
FOR ALL USING (true) WITH CHECK (true);

-- Messages
DROP POLICY IF EXISTS "allow_all_messages" ON messages;
CREATE POLICY "allow_all_messages" ON messages
FOR ALL USING (true) WITH CHECK (true);

-- 9. FUNÇÃO PARA ATUALIZAR UPDATED_AT AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. TRIGGERS PARA UPDATED_AT
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 11. VERIFICAÇÃO FINAL
SELECT 
  'departments' as tabela,
  COUNT(*) as registros
FROM departments
UNION ALL
SELECT 
  'tickets' as tabela,
  COUNT(*) as registros
FROM tickets
UNION ALL
SELECT 
  'messages' as tabela,
  COUNT(*) as registros
FROM messages;

-- 12. MOSTRAR ESTRUTURA DAS TABELAS
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('tickets', 'messages', 'departments')
ORDER BY table_name, ordinal_position; 