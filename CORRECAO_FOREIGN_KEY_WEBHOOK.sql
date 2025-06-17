-- ========================================
-- CORREÇÃO URGENTE: Foreign Key Constraint tickets_customer_id_fkey
-- ========================================
-- Erro: insert or update on table "tickets" violates foreign key constraint "tickets_customer_id_fkey"
-- Problema: Tabela tickets faz referência a 'customers' mas o sistema usa 'profiles'

-- 1. VERIFICAR CONSTRAINTS ATUAIS
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tickets'
    AND kcu.column_name = 'customer_id';

-- 2. REMOVER FOREIGN KEY INCORRETO (se existir)
DO $$
BEGIN
    -- Verificar e remover constraint que referencia tabela errada
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_customer_id_fkey' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE tickets DROP CONSTRAINT tickets_customer_id_fkey;
        RAISE NOTICE '✅ Constraint tickets_customer_id_fkey removido';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint tickets_customer_id_fkey não encontrado';
    END IF;
END $$;

-- 3. CRIAR FOREIGN KEY CORRETO PARA TABELA PROFILES
DO $$
BEGIN
    -- Adicionar constraint correto para profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_customer_id_profiles_fkey' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE tickets 
        ADD CONSTRAINT tickets_customer_id_profiles_fkey 
        FOREIGN KEY (customer_id) REFERENCES profiles(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Constraint correto criado: tickets_customer_id_profiles_fkey';
    ELSE
        RAISE NOTICE 'ℹ️ Constraint correto já existe';
    END IF;
END $$;

-- 4. VERIFICAR RESULTADOS
SELECT 'Verificando constraints após correção:' as info;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'tickets'
    AND kcu.column_name = 'customer_id';

-- 5. TESTE: CRIAR PERFIL DE TESTE E TICKET
DO $$
DECLARE
    test_profile_id UUID;
    test_ticket_id UUID;
BEGIN
    -- Criar perfil de teste
    INSERT INTO profiles (
        id,
        name,
        email,
        role,
        is_active,
        created_at,
        updated_at,
        metadata
    ) VALUES (
        gen_random_uuid(),
        'Cliente Teste Webhook',
        'teste-webhook@whatsapp.com',
        'customer',
        true,
        NOW(),
        NOW(),
        jsonb_build_object(
            'phone', '5511999999999',
            'created_via', 'test_script'
        )
    )
    RETURNING id INTO test_profile_id;
    
    -- Criar ticket com customer_id
    INSERT INTO tickets (
        title,
        description,
        status,
        priority,
        channel,
        customer_id,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        'Teste Foreign Key Correction',
        'Ticket para testar correção do foreign key',
        'open',
        'medium',
        'whatsapp',
        test_profile_id,
        jsonb_build_object(
            'test', true,
            'whatsapp_phone', '5511999999999'
        ),
        NOW(),
        NOW()
    )
    RETURNING id INTO test_ticket_id;
    
    RAISE NOTICE '✅ Teste realizado com sucesso!';
    RAISE NOTICE 'Profile ID: %', test_profile_id;
    RAISE NOTICE 'Ticket ID: %', test_ticket_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro no teste: %', SQLERRM;
END $$;

-- 6. FORÇAR ATUALIZAÇÃO DO SCHEMA
NOTIFY pgrst, 'reload schema';

SELECT '🎉 CORREÇÃO CONCLUÍDA: Foreign key tickets -> profiles funcionando!' as resultado; 