-- =========================================
-- CORREÇÃO DEFINITIVA SIMPLIFICADA: Relacionamentos
-- =========================================
-- Versão corrigida sem ON CONFLICT

-- ETAPA 1: Habilitar extensões
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ETAPA 2: Criar tabela departments (sem ON CONFLICT)
-- =========================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'building',
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Inserir departamentos apenas se não existem (sem ON CONFLICT)
DO $$
BEGIN
    -- Verificar se já existem departamentos
    IF NOT EXISTS (SELECT 1 FROM departments LIMIT 1) THEN
        INSERT INTO departments (name, description, color, icon) VALUES
        ('Atendimento Geral', 'Departamento padrão para tickets gerais', '#3B82F6', 'headphones'),
        ('Suporte Técnico', 'Departamento para problemas técnicos', '#EF4444', 'wrench'),
        ('Financeiro', 'Departamento para questões financeiras', '#10B981', 'dollar-sign'),
        ('Comercial', 'Departamento para vendas e parcerias', '#8B5CF6', 'briefcase');
        
        RAISE NOTICE '✅ Departamentos criados com sucesso';
    ELSE
        RAISE NOTICE 'ℹ️ Departamentos já existem';
    END IF;
END $$;

-- Criar constraint UNIQUE para name se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'departments' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name = 'departments_name_key'
    ) THEN
        ALTER TABLE departments ADD CONSTRAINT departments_name_key UNIQUE (name);
        RAISE NOTICE '✅ Constraint UNIQUE criada para departments.name';
    END IF;
END $$;

-- ETAPA 3: Corrigir colunas da tabela tickets
-- =========================================

-- Adicionar department_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE tickets ADD COLUMN department_id UUID;
        RAISE NOTICE '✅ Coluna department_id adicionada';
    END IF;
END $$;

-- Adicionar customer_id se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE tickets ADD COLUMN customer_id UUID;
        RAISE NOTICE '✅ Coluna customer_id adicionada';
    END IF;
END $$;

-- Adicionar agent_id se não existir (renomear assigned_to se necessário)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'agent_id'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'tickets' AND column_name = 'assigned_to'
        ) THEN
            ALTER TABLE tickets RENAME COLUMN assigned_to TO agent_id;
            RAISE NOTICE '✅ Coluna assigned_to renomeada para agent_id';
        ELSE
            ALTER TABLE tickets ADD COLUMN agent_id UUID;
            RAISE NOTICE '✅ Coluna agent_id criada';
        END IF;
    END IF;
END $$;

-- ETAPA 4: Remover foreign keys antigas
-- =========================================
DO $$
BEGIN
    -- Remover tickets_customer_id_fkey se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' AND constraint_name = 'tickets_customer_id_fkey'
    ) THEN
        ALTER TABLE tickets DROP CONSTRAINT tickets_customer_id_fkey;
        RAISE NOTICE '🗑️ Constraint tickets_customer_id_fkey removida';
    END IF;

    -- Remover tickets_department_id_fkey se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' AND constraint_name = 'tickets_department_id_fkey'
    ) THEN
        ALTER TABLE tickets DROP CONSTRAINT tickets_department_id_fkey;
        RAISE NOTICE '🗑️ Constraint tickets_department_id_fkey removida';
    END IF;

    -- Remover tickets_agent_id_fkey se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' AND constraint_name = 'tickets_agent_id_fkey'
    ) THEN
        ALTER TABLE tickets DROP CONSTRAINT tickets_agent_id_fkey;
        RAISE NOTICE '🗑️ Constraint tickets_agent_id_fkey removida';
    END IF;
END $$;

-- ETAPA 5: Criar foreign keys corretas
-- =========================================

-- customer_id → profiles(id)
ALTER TABLE tickets 
ADD CONSTRAINT tickets_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- agent_id → profiles(id)
ALTER TABLE tickets 
ADD CONSTRAINT tickets_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- department_id → departments(id)
ALTER TABLE tickets 
ADD CONSTRAINT tickets_department_id_fkey 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- ETAPA 6: Atribuir departamento padrão
-- =========================================
DO $$
DECLARE
    default_dept_id UUID;
    updated_count INTEGER;
BEGIN
    SELECT id INTO default_dept_id 
    FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1;
    
    IF default_dept_id IS NOT NULL THEN
        UPDATE tickets 
        SET department_id = default_dept_id 
        WHERE department_id IS NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✅ % tickets atribuídos ao departamento padrão', updated_count;
    END IF;
END $$;

-- ETAPA 7: Criar índices
-- =========================================
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_id ON tickets(agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- ETAPA 8: Atualizar cache Supabase
-- =========================================
NOTIFY pgrst, 'reload schema';

-- ETAPA 9: Relatório final
-- =========================================
DO $$
DECLARE
    ticket_count INTEGER;
    dept_count INTEGER;
    profile_count INTEGER;
    customer_fk_exists BOOLEAN;
    agent_fk_exists BOOLEAN;
    dept_fk_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO ticket_count FROM tickets;
    SELECT COUNT(*) INTO dept_count FROM departments WHERE is_active = true;
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE role = 'customer';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' AND constraint_name = 'tickets_customer_id_fkey'
    ) INTO customer_fk_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' AND constraint_name = 'tickets_agent_id_fkey'
    ) INTO agent_fk_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' AND constraint_name = 'tickets_department_id_fkey'
    ) INTO dept_fk_exists;
    
    RAISE NOTICE '=== RELATÓRIO FINAL ===';
    RAISE NOTICE 'Tickets: % | Departamentos: % | Clientes: %', ticket_count, dept_count, profile_count;
    RAISE NOTICE 'FK customer_id: % | FK agent_id: % | FK department_id: %', 
        CASE WHEN customer_fk_exists THEN 'OK' ELSE 'FALHOU' END,
        CASE WHEN agent_fk_exists THEN 'OK' ELSE 'FALHOU' END,
        CASE WHEN dept_fk_exists THEN 'OK' ELSE 'FALHOU' END;
    
    IF customer_fk_exists AND agent_fk_exists AND dept_fk_exists THEN
        RAISE NOTICE '✅ TODOS OS RELACIONAMENTOS CORRIGIDOS!';
    ELSE
        RAISE NOTICE '❌ ALGUNS RELACIONAMENTOS FALHARAM';
    END IF;
END $$;

-- ETAPA 10: Teste final
-- =========================================
DO $$
BEGIN
    PERFORM t.id 
    FROM tickets t
    LEFT JOIN profiles c ON t.customer_id = c.id
    LEFT JOIN profiles a ON t.agent_id = a.id
    LEFT JOIN departments d ON t.department_id = d.id
    LIMIT 1;
    
    RAISE NOTICE '✅ TESTE DE RELACIONAMENTOS: PASSOU!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TESTE FALHOU: %', SQLERRM;
END $$;

SELECT '🎉 CORREÇÃO SIMPLIFICADA CONCLUÍDA!' as resultado; 