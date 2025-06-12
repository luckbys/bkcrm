-- ================================================================
-- CORREÇÃO ESPECÍFICA: Adicionar coluna assigned_to
-- ================================================================
-- Este script adiciona a coluna assigned_to que está faltando

DO $$
BEGIN
    -- Verificar se a coluna assigned_to existe na tabela tickets
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'assigned_to'
    ) THEN
        -- Adicionar a coluna assigned_to
        ALTER TABLE tickets ADD COLUMN assigned_to UUID;
        
        -- Adicionar foreign key se a tabela auth.users existe
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'auth' 
            AND table_name = 'users'
        ) THEN
            ALTER TABLE tickets ADD CONSTRAINT tickets_assigned_to_fkey 
            FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;
        
        RAISE NOTICE '✅ Coluna assigned_to adicionada com sucesso à tabela tickets';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna assigned_to já existe na tabela tickets';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro ao adicionar coluna assigned_to: %', SQLERRM;
        -- Tentar apenas adicionar a coluna sem foreign key
        BEGIN
            ALTER TABLE tickets ADD COLUMN assigned_to UUID;
            RAISE NOTICE '✅ Coluna assigned_to adicionada (sem foreign key)';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Não foi possível adicionar a coluna: %', SQLERRM;
        END;
END $$;

-- Verificar se foi criada corretamente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tickets' 
        AND column_name = 'assigned_to'
    ) THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUCESSO!';
        RAISE NOTICE '✅ Coluna assigned_to agora existe na tabela tickets';
        RAISE NOTICE '✅ Erro "column assigned_to does not exist" resolvido';
        RAISE NOTICE '';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ FALHA!';
        RAISE NOTICE '❌ Coluna assigned_to ainda não existe';
        RAISE NOTICE '';
    END IF;
END $$; 