-- Correcao relacionamento tickets departments

-- 1. Criar tabela departments se nao existir
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'building',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- 2. Inserir departamentos padrao se nao existirem
INSERT INTO departments (name, description, color, icon)
SELECT * FROM (VALUES
    ('Atendimento Geral', 'Departamento padrao para tickets gerais', '#3B82F6', 'headphones'),
    ('Suporte Tecnico', 'Departamento para problemas tecnicos', '#EF4444', 'wrench'),
    ('Financeiro', 'Departamento para questoes financeiras', '#10B981', 'dollar-sign'),
    ('Comercial', 'Departamento para vendas e parcerias', '#8B5CF6', 'briefcase')
) AS t(name, description, color, icon)
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE departments.name = t.name);

-- 3. Adicionar coluna department_id na tabela tickets se nao existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'department_id'
    ) THEN
        ALTER TABLE tickets ADD COLUMN department_id UUID;
    END IF;
END $$;

-- 4. Remover constraint antiga se existir
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_department_id_fkey;

-- 5. Criar nova foreign key
ALTER TABLE tickets 
ADD CONSTRAINT tickets_department_id_fkey 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- 6. Atribuir departamento padrao a tickets sem departamento
UPDATE tickets 
SET department_id = (
    SELECT id FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE department_id IS NULL;

-- 7. Criar indices para performance
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- 8. Recarregar schema do Supabase
NOTIFY pgrst, 'reload schema';
UPDATE tickets SET department_id = (SELECT id FROM departments WHERE is_active = true ORDER BY created_at LIMIT 1) WHERE department_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);
NOTIFY pgrst, 'reload schema';
