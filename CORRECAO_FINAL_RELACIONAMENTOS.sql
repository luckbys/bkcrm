-- =========================================
-- CORREÇÃO DEFINITIVA: Todos os Relacionamentos
-- =========================================
-- Este script resolve TODOS os erros de relacionamento do sistema

-- ETAPA 1: Habilitar extensões necessárias
-- =========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ETAPA 2: Verificar e criar tabela departments
-- =========================================
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

-- Inserir departamentos padrão se não existem
INSERT INTO departments (name, description, color, icon) 
VALUES 
    ('Atendimento Geral', 'Departamento padrão para tickets gerais', '#3B82F6', 'headphones'),
    ('Suporte Técnico', 'Departamento para problemas técnicos', '#EF4444', 'wrench'),
    ('Financeiro', 'Departamento para questões financeiras', '#10B981', 'dollar-sign'),
    ('Comercial', 'Departamento para vendas e parcerias', '#8B5CF6', 'briefcase')
ON CONFLICT (name) DO NOTHING;

-- ETAPA 3: Corrigir tabela tickets
-- =========================================

-- 3.1 Verificar se coluna department_id existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'department_id'
    ) THEN
        ALTER TABLE tickets ADD COLUMN department_id UUID;
    END IF;
END $$;

-- 3.2 Verificar se coluna customer_id existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'customer_id'
    ) THEN
        ALTER TABLE tickets ADD COLUMN customer_id UUID;
    END IF;
END $$;

-- 3.3 Verificar se coluna agent_id existe (pode estar como assigned_to)
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
            -- Renomear assigned_to para agent_id
            ALTER TABLE tickets RENAME COLUMN assigned_to TO agent_id;
        ELSE
            -- Criar nova coluna agent_id
            ALTER TABLE tickets ADD COLUMN agent_id UUID;
        END IF;
    END IF;
END $$;

-- ETAPA 4: Remover foreign keys antigas (se existem)
-- =========================================
DO $$
BEGIN
    -- Remover constraint de customer_id se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' 
        AND constraint_name = 'tickets_customer_id_fkey'
    ) THEN
        ALTER TABLE tickets DROP CONSTRAINT tickets_customer_id_fkey;
    END IF;

    -- Remover constraint de department_id se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' 
        AND constraint_name = 'tickets_department_id_fkey'
    ) THEN
        ALTER TABLE tickets DROP CONSTRAINT tickets_department_id_fkey;
    END IF;

    -- Remover constraint de agent_id se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'tickets' 
        AND constraint_name = 'tickets_agent_id_fkey'
    ) THEN
        ALTER TABLE tickets DROP CONSTRAINT tickets_agent_id_fkey;
    END IF;
END $$;

-- ETAPA 5: Criar foreign keys corretas
-- =========================================

-- 5.1 Foreign key para customer_id → profiles(id)
ALTER TABLE tickets 
ADD CONSTRAINT tickets_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5.2 Foreign key para agent_id → profiles(id)
ALTER TABLE tickets 
ADD CONSTRAINT tickets_agent_id_fkey 
FOREIGN KEY (agent_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- 5.3 Foreign key para department_id → departments(id)
ALTER TABLE tickets 
ADD CONSTRAINT tickets_department_id_fkey 
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- ETAPA 6: Atribuir departamento padrão a tickets sem departamento
-- =========================================
DO $$
DECLARE
    default_dept_id UUID;
BEGIN
    -- Buscar primeiro departamento ativo
    SELECT id INTO default_dept_id 
    FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1;
    
    -- Atualizar tickets sem departamento
    IF default_dept_id IS NOT NULL THEN
        UPDATE tickets 
        SET department_id = default_dept_id 
        WHERE department_id IS NULL;
    END IF;
END $$;

-- ETAPA 7: Criar índices para performance
-- =========================================
CREATE INDEX IF NOT EXISTS idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_agent_id ON tickets(agent_id);
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- ETAPA 8: Forçar atualização do cache do Supabase
-- =========================================
NOTIFY pgrst, 'reload schema';

-- ETAPA 9: Verificação final e relatório
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
    -- Contar registros
    SELECT COUNT(*) INTO ticket_count FROM tickets;
    SELECT COUNT(*) INTO dept_count FROM departments WHERE is_active = true;
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE role = 'customer';
    
    -- Verificar foreign keys
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
    
    -- Relatório final
    RAISE NOTICE '=== RELATÓRIO FINAL ===';
    RAISE NOTICE 'Tickets na base: %', ticket_count;
    RAISE NOTICE 'Departamentos ativos: %', dept_count;
    RAISE NOTICE 'Clientes (profiles): %', profile_count;
    RAISE NOTICE 'FK customer_id: %', CASE WHEN customer_fk_exists THEN 'OK' ELSE 'FALHOU' END;
    RAISE NOTICE 'FK agent_id: %', CASE WHEN agent_fk_exists THEN 'OK' ELSE 'FALHOU' END;
    RAISE NOTICE 'FK department_id: %', CASE WHEN dept_fk_exists THEN 'OK' ELSE 'FALHOU' END;
    
    IF customer_fk_exists AND agent_fk_exists AND dept_fk_exists THEN
        RAISE NOTICE '✅ TODOS OS RELACIONAMENTOS CORRIGIDOS COM SUCESSO!';
    ELSE
        RAISE NOTICE '❌ ALGUNS RELACIONAMENTOS AINDA TÊM PROBLEMAS';
    END IF;
END $$;

-- ETAPA 10: Teste final dos relacionamentos
-- =========================================
DO $$
BEGIN
    -- Teste de JOIN entre tickets, profiles e departments
    PERFORM t.id, t.title, 
            c.name as customer_name,
            a.name as agent_name,
            d.name as department_name
    FROM tickets t
    LEFT JOIN profiles c ON t.customer_id = c.id
    LEFT JOIN profiles a ON t.agent_id = a.id
    LEFT JOIN departments d ON t.department_id = d.id
    LIMIT 1;
    
    RAISE NOTICE '✅ TESTE DE RELACIONAMENTOS: Passou sem erros!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TESTE DE RELACIONAMENTOS: Falhou - %', SQLERRM;
END $$;

SELECT '🎉 CORREÇÃO COMPLETA FINALIZADA!' as resultado; 