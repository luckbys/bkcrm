-- Script para corrigir a coluna 'priority' na tabela departments
-- Executar no SQL Editor do Supabase

-- 1. Verificar se a tabela departments existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'departments') THEN
        RAISE EXCEPTION 'Tabela departments não existe. Execute primeiro a migração de criação da tabela.';
    END IF;
END $$;

-- 2. Verificar se a coluna priority já existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'priority'
    ) THEN
        -- Adicionar a coluna priority se ela não existir
        ALTER TABLE departments ADD COLUMN priority text DEFAULT 'medium';
        
        -- Criar um ENUM para prioridades (opcional, mas recomendado)
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'department_priority') THEN
                CREATE TYPE department_priority AS ENUM ('high', 'medium', 'low');
            END IF;
        END $$;
        
        -- Atualizar a coluna para usar o ENUM (opcional)
        -- ALTER TABLE departments ALTER COLUMN priority TYPE department_priority USING priority::department_priority;
        
        RAISE NOTICE 'Coluna priority adicionada com sucesso na tabela departments';
    ELSE
        RAISE NOTICE 'Coluna priority já existe na tabela departments';
    END IF;
END $$;

-- 3. Verificar se a coluna icon existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'icon'
    ) THEN
        -- Adicionar a coluna icon se ela não existir
        ALTER TABLE departments ADD COLUMN icon text DEFAULT 'Building2';
        RAISE NOTICE 'Coluna icon adicionada com sucesso na tabela departments';
    ELSE
        RAISE NOTICE 'Coluna icon já existe na tabela departments';
    END IF;
END $$;

-- 4. Verificar se a coluna description existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'description'
    ) THEN
        -- Adicionar a coluna description se ela não existir
        ALTER TABLE departments ADD COLUMN description text;
        RAISE NOTICE 'Coluna description adicionada com sucesso na tabela departments';
    ELSE
        RAISE NOTICE 'Coluna description já existe na tabela departments';
    END IF;
END $$;

-- 5. Atualizar registros existentes com valores padrão
UPDATE departments 
SET 
    priority = COALESCE(priority, 'medium'),
    icon = COALESCE(icon, 'Building2')
WHERE priority IS NULL OR icon IS NULL;

-- 6. Verificar a estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'departments' 
ORDER BY ordinal_position;

-- 7. Teste de inserção para verificar se tudo está funcionando
DO $$
DECLARE
    test_id uuid;
BEGIN
    INSERT INTO departments (name, priority, description, icon)
    VALUES ('Teste Priority', 'high', 'Departamento de teste', 'TestTube')
    RETURNING id INTO test_id;
    
    RAISE NOTICE 'Teste de inserção bem-sucedido. ID: %', test_id;
    
    -- Limpar o teste
    DELETE FROM departments WHERE id = test_id;
    
    RAISE NOTICE 'Correção concluída com sucesso!';
END $$; 