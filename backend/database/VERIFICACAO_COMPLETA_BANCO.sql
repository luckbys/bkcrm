-- 🔍 VERIFICAÇÃO COMPLETA DO BANCO DE DADOS
-- Este script verifica todos os problemas conhecidos que podem impedir o salvamento

-- ===== 1. VERIFICAR ENUM USER_ROLE =====
DO $$
BEGIN
    -- Verificar se o enum user_role aceita 'super_admin'
    IF EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'super_admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        RAISE NOTICE '✅ Enum user_role aceita super_admin';
    ELSE
        RAISE NOTICE '❌ Enum user_role NÃO aceita super_admin - CORRIGIR!';
        -- Adicionar super_admin ao enum
        ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';
        RAISE NOTICE '✅ super_admin adicionado ao enum user_role';
    END IF;
END $$;

-- ===== 2. VERIFICAR TABELA EVOLUTION_INSTANCES =====
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evolution_instances') THEN
        RAISE NOTICE '✅ Tabela evolution_instances existe';
        
        -- Verificar colunas essenciais
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evolution_instances' AND column_name = 'instance_name') THEN
            RAISE NOTICE '✅ Coluna instance_name existe';
        ELSE
            RAISE NOTICE '❌ Coluna instance_name não existe';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'evolution_instances' AND column_name = 'department_id') THEN
            RAISE NOTICE '✅ Coluna department_id existe';
        ELSE
            RAISE NOTICE '❌ Coluna department_id não existe';
        END IF;
        
    ELSE
        RAISE NOTICE '❌ Tabela evolution_instances NÃO existe - CRIAR!';
    END IF;
END $$;

-- ===== 3. VERIFICAR CONSTRAINT UNIQUE_DEFAULT_PER_DEPARTMENT =====
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Contar departamentos com múltiplas instâncias padrão
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT department_id 
        FROM evolution_instances 
        WHERE is_default = true
        GROUP BY department_id
        HAVING COUNT(*) > 1
    ) sub;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE '❌ % departamentos têm múltiplas instâncias padrão - CORRIGIR!', duplicate_count;
        
        -- Corrigir automaticamente
        UPDATE evolution_instances SET is_default = false WHERE is_default = true;
        
        WITH ranked_instances AS (
            SELECT 
                id,
                department_id,
                ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY created_at DESC) as rn
            FROM evolution_instances
            WHERE is_active = true
        )
        UPDATE evolution_instances 
        SET is_default = true
        FROM ranked_instances
        WHERE evolution_instances.id = ranked_instances.id 
            AND ranked_instances.rn = 1;
        
        RAISE NOTICE '✅ Instâncias padrão corrigidas';
    ELSE
        RAISE NOTICE '✅ Constraint unique_default_per_department OK';
    END IF;
END $$;

-- ===== 4. VERIFICAR TABELA DEPARTMENTS =====
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'departments') THEN
        RAISE NOTICE '✅ Tabela departments existe';
    ELSE
        RAISE NOTICE '❌ Tabela departments NÃO existe - CRIAR!';
    END IF;
END $$;

-- ===== 5. VERIFICAR ESTRUTURA PROFILES =====
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department_id') THEN
        RAISE NOTICE '✅ Coluna profiles.department_id existe';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
        RAISE NOTICE '⚠️ Usando coluna profiles.department (legacy)';
    ELSE
        RAISE NOTICE '❌ Nenhuma coluna de departamento em profiles';
    END IF;
END $$;

-- ===== 6. VERIFICAR RLS (ROW LEVEL SECURITY) =====
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'evolution_instances' 
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✅ RLS habilitado em evolution_instances';
        
        -- Verificar políticas
        IF EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'evolution_instances' 
            AND policyname = 'evolution_instances_insert_policy'
        ) THEN
            RAISE NOTICE '✅ Política de INSERT existe';
        ELSE
            RAISE NOTICE '❌ Política de INSERT não existe';
        END IF;
        
    ELSE
        RAISE NOTICE '⚠️ RLS não habilitado em evolution_instances';
    END IF;
END $$;

-- ===== 7. TESTAR OPERAÇÃO DE INSERT =====
DO $$
DECLARE
    test_dept_id UUID;
    test_result RECORD;
BEGIN
    -- Pegar um departamento para teste
    SELECT id INTO test_dept_id FROM departments WHERE is_active = true LIMIT 1;
    
    IF test_dept_id IS NOT NULL THEN
        RAISE NOTICE '🧪 Testando INSERT com department_id: %', test_dept_id;
        
        -- Tentar inserir uma instância de teste
        BEGIN
            INSERT INTO evolution_instances (
                instance_name,
                department_id,
                department_name,
                is_default,
                status,
                metadata
            ) VALUES (
                'teste-verificacao-' || extract(epoch from now()),
                test_dept_id,
                'Teste',
                false,
                'close',
                '{"test": true}'::jsonb
            ) RETURNING id INTO test_result;
            
            RAISE NOTICE '✅ INSERT funcionou - ID: %', test_result.id;
            
            -- Remover registro de teste
            DELETE FROM evolution_instances WHERE id = test_result.id;
            RAISE NOTICE '🧹 Registro de teste removido';
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '❌ Erro no INSERT: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE '❌ Nenhum departamento encontrado para teste';
    END IF;
END $$;

-- ===== RESUMO FINAL =====
SELECT 
    't1_enum_check' as verificacao,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'super_admin' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
        ) THEN '✅ OK'
        ELSE '❌ FALHOU'
    END as status,
    'Enum user_role aceita super_admin' as descricao

UNION ALL

SELECT 
    't2_table_check' as verificacao,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evolution_instances')
        THEN '✅ OK'
        ELSE '❌ FALHOU'
    END as status,
    'Tabela evolution_instances existe' as descricao

UNION ALL

SELECT 
    't3_constraint_check' as verificacao,
    CASE 
        WHEN (
            SELECT COUNT(*) 
            FROM (
                SELECT department_id 
                FROM evolution_instances 
                WHERE is_default = true
                GROUP BY department_id
                HAVING COUNT(*) > 1
            ) sub
        ) = 0 THEN '✅ OK'
        ELSE '❌ FALHOU'
    END as status,
    'Sem duplicação de instâncias padrão' as descricao

ORDER BY verificacao; 