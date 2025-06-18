-- ===================================
-- CORREÇÃO URGENTE: Schema Cache - closed_at
-- ===================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se a coluna closed_at existe fisicamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'tickets' 
        AND column_name = 'closed_at'
    ) THEN
        -- Se não existe, criar agora
        ALTER TABLE tickets ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE '✅ Coluna closed_at adicionada à tabela tickets';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna closed_at já existe na tabela tickets';
    END IF;
END $$;

-- 2. Verificar se a coluna updated_at existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'tickets' 
        AND column_name = 'updated_at'
    ) THEN
        -- Se não existe, criar agora
        ALTER TABLE tickets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());
        RAISE NOTICE '✅ Coluna updated_at adicionada à tabela tickets';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna updated_at já existe na tabela tickets';
    END IF;
END $$;

-- 3. Forçar reload do schema cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 4. Aguardar um momento e recarregar novamente
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';

-- 5. Verificar se as colunas estão acessíveis
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tickets' 
AND column_name IN ('closed_at', 'updated_at')
ORDER BY column_name;

-- 6. Testar UPDATE simples para validar
DO $$
DECLARE
    test_ticket_id UUID;
BEGIN
    -- Buscar um ticket existente para teste
    SELECT id INTO test_ticket_id 
    FROM tickets 
    LIMIT 1;
    
    IF test_ticket_id IS NOT NULL THEN
        -- Testar se consegue atualizar closed_at
        UPDATE tickets 
        SET closed_at = TIMEZONE('utc', NOW())
        WHERE id = test_ticket_id;
        
        RAISE NOTICE '✅ Teste de UPDATE na coluna closed_at: SUCESSO';
        
        -- Reverter o teste
        UPDATE tickets 
        SET closed_at = NULL
        WHERE id = test_ticket_id;
        
    ELSE
        RAISE NOTICE 'ℹ️ Nenhum ticket encontrado para teste';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro no teste de UPDATE: %', SQLERRM;
END $$;

-- 7. Notificação final
SELECT 'Schema cache recarregado. Aguarde 10-15 segundos e teste o botão Finalizar no frontend.' as resultado; 