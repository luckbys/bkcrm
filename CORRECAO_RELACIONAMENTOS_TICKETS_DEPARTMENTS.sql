-- ========================================
-- CORREÇÃO URGENTE: Relacionamentos tickets ↔ departments
-- ========================================
-- Este script corrige o erro PGRST200: "Could not find a relationship between 'tickets' and 'departments'"

-- 1. VERIFICAR SE A TABELA DEPARTMENTS EXISTE
-- ========================================
DO $$
BEGIN
    -- Verificar se a tabela departments existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'departments'
    ) THEN
        -- Criar tabela departments se não existir
        CREATE TABLE departments (
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
        
        -- Inserir departamento padrão
        INSERT INTO departments (name, description, color, icon) VALUES
        ('Atendimento Geral', 'Departamento padrão para tickets gerais', '#3B82F6', 'headphones'),
        ('Suporte Técnico', 'Departamento para problemas técnicos', '#EF4444', 'wrench'),
        ('Financeiro', 'Departamento para questões financeiras', '#10B981', 'dollar-sign'),
        ('Comercial', 'Departamento para vendas e parcerias', '#8B5CF6', 'briefcase');
        
        RAISE NOTICE '✅ Tabela departments criada e populada com departamentos padrão';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela departments já existe';
    END IF;
END $$;

-- 2. VERIFICAR E CORRIGIR COLUNA department_id NA TABELA TICKETS
-- ========================================
DO $$
BEGIN
    -- Verificar se a coluna department_id existe na tabela tickets
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'department_id'
    ) THEN
        -- Adicionar coluna department_id
        ALTER TABLE tickets ADD COLUMN department_id UUID;
        RAISE NOTICE '✅ Coluna department_id adicionada à tabela tickets';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna department_id já existe na tabela tickets';
    END IF;
END $$;

-- 3. REMOVER FOREIGN KEY ANTIGA (SE EXISTIR) E CRIAR NOVA
-- ========================================
DO $$
BEGIN
    -- Remover constraint antiga se existir
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND constraint_name = 'tickets_department_id_fkey'
    ) THEN
        ALTER TABLE tickets DROP CONSTRAINT tickets_department_id_fkey;
        RAISE NOTICE '🗑️ Constraint antiga tickets_department_id_fkey removida';
    END IF;
    
    -- Criar nova foreign key
    ALTER TABLE tickets 
    ADD CONSTRAINT tickets_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Nova foreign key tickets_department_id_fkey criada';
END $$;

-- 4. ATRIBUIR DEPARTAMENTO PADRÃO A TICKETS SEM DEPARTAMENTO
-- ========================================
DO $$
DECLARE
    default_dept_id UUID;
    updated_count INTEGER;
BEGIN
    -- Buscar o primeiro departamento ativo
    SELECT id INTO default_dept_id 
    FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1;
    
    IF default_dept_id IS NOT NULL THEN
        -- Atualizar tickets sem departamento
        UPDATE tickets 
        SET department_id = default_dept_id 
        WHERE department_id IS NULL;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE '✅ % tickets sem departamento foram atribuídos ao departamento padrão', updated_count;
    ELSE
        RAISE NOTICE '⚠️ Nenhum departamento ativo encontrado';
    END IF;
END $$;

-- 5. ATUALIZAR SCHEMA CACHE DO SUPABASE
-- ========================================
-- Forçar atualização do cache de relacionamentos
NOTIFY pgrst, 'reload schema';

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_tickets_department_id ON tickets(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- 7. VERIFICAÇÃO FINAL
-- ========================================
DO $$
DECLARE
    ticket_count INTEGER;
    dept_count INTEGER;
    fk_exists BOOLEAN;
BEGIN
    -- Contar tickets
    SELECT COUNT(*) INTO ticket_count FROM tickets;
    
    -- Contar departamentos
    SELECT COUNT(*) INTO dept_count FROM departments WHERE is_active = true;
    
    -- Verificar se FK existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND constraint_name = 'tickets_department_id_fkey'
    ) INTO fk_exists;
    
    RAISE NOTICE '📊 RESUMO DA CORREÇÃO:';
    RAISE NOTICE '   - Tickets na base: %', ticket_count;
    RAISE NOTICE '   - Departamentos ativos: %', dept_count;
    RAISE NOTICE '   - Foreign key criada: %', CASE WHEN fk_exists THEN 'SIM' ELSE 'NÃO' END;
    
    IF fk_exists AND dept_count > 0 THEN
        RAISE NOTICE '✅ CORREÇÃO CONCLUÍDA COM SUCESSO!';
        RAISE NOTICE '   Relacionamento tickets ↔ departments está funcionando';
    ELSE
        RAISE NOTICE '❌ PROBLEMA AINDA EXISTE - verifique as etapas anteriores';
    END IF;
END $$;

-- 8. TESTAR RELACIONAMENTO
-- ========================================
-- Teste simples para verificar se o relacionamento funciona
DO $$
DECLARE
    test_result RECORD;
BEGIN
    -- Tentar fazer uma consulta com JOIN
    SELECT t.id, t.title, d.name as department_name
    INTO test_result
    FROM tickets t
    LEFT JOIN departments d ON t.department_id = d.id
    LIMIT 1;
    
    IF FOUND THEN
        RAISE NOTICE '✅ TESTE DE RELACIONAMENTO: OK';
        RAISE NOTICE '   Ticket: % | Departamento: %', test_result.title, COALESCE(test_result.department_name, 'SEM DEPARTAMENTO');
    ELSE
        RAISE NOTICE '⚠️ TESTE DE RELACIONAMENTO: Nenhum ticket encontrado para testar';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ TESTE DE RELACIONAMENTO: FALHOU - %', SQLERRM;
END $$;
