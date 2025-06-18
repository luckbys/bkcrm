-- =====================================================
-- CORREÇÃO FOREIGN KEY CUSTOMERS → PROFILES
-- =====================================================
-- 
-- Este script resolve o erro:
-- "insert or update on table tickets violates foreign key constraint tickets_customer_id_fkey"
-- 
-- Problema: tickets.customer_id referencia tabela 'customers' que não existe,
-- mas o sistema usa 'profiles' com role='customer'
--
-- Data: 2025-01-17
-- =====================================================

-- 1. VERIFICAR CONSTRAINTS ATUAIS DA TABELA TICKETS
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tickets'::regclass
AND contype = 'f' -- foreign keys apenas
ORDER BY conname;

-- 2. VERIFICAR SE TABELA CUSTOMERS EXISTE
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('customers', 'profiles')
AND table_schema = 'public';

-- 3. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. REMOVER CONSTRAINT INCORRETA TICKETS → CUSTOMERS
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Verificar se constraint existe e removê-la
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'tickets_customer_id_fkey' 
        AND conrelid = 'tickets'::regclass
    ) THEN
        EXECUTE 'ALTER TABLE tickets DROP CONSTRAINT tickets_customer_id_fkey';
        RAISE NOTICE 'Constraint tickets_customer_id_fkey removida';
    ELSE
        RAISE NOTICE 'Constraint tickets_customer_id_fkey não existe';
    END IF;
    
    -- Verificar outras possíveis constraints problemáticas
    FOR rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'tickets'::regclass 
        AND contype = 'f'
        AND pg_get_constraintdef(oid) LIKE '%customers%'
    LOOP
        EXECUTE 'ALTER TABLE tickets DROP CONSTRAINT ' || rec.conname;
        RAISE NOTICE 'Constraint problemática removida: %', rec.conname;
    END LOOP;
END $$;

-- 5. CRIAR CONSTRAINT CORRETA TICKETS → PROFILES
DO $$
BEGIN
    -- Verificar se já existe constraint correta
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'tickets_customer_id_profiles_fkey' 
        AND conrelid = 'tickets'::regclass
    ) THEN
        -- Criar nova constraint referenciando profiles
        ALTER TABLE tickets 
        ADD CONSTRAINT tickets_customer_id_profiles_fkey 
        FOREIGN KEY (customer_id) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE 'Nova constraint tickets_customer_id_profiles_fkey criada';
    ELSE
        RAISE NOTICE 'Constraint tickets_customer_id_profiles_fkey já existe';
    END IF;
END $$;

-- 6. VERIFICAR E LIMPAR DADOS ÓRFÃOS
-- Contar tickets com customer_id inválido
SELECT 
    'Tickets órfãos:' as tipo,
    COUNT(*) as quantidade
FROM tickets t
LEFT JOIN profiles p ON t.customer_id = p.id
WHERE t.customer_id IS NOT NULL 
AND p.id IS NULL;

-- 7. LIMPAR DADOS ÓRFÃOS (DEFINIR customer_id COMO NULL)
UPDATE tickets 
SET customer_id = NULL 
WHERE customer_id IS NOT NULL 
AND customer_id NOT IN (
    SELECT id FROM profiles WHERE role = 'customer'
);

-- 8. VERIFICAR SE EXISTEM PROFILES COM ROLE CUSTOMER
SELECT 
    'Profiles customers:' as tipo,
    COUNT(*) as quantidade
FROM profiles 
WHERE role = 'customer';

-- 9. CRIAR ALGUNS CLIENTES DE TESTE SE NÃO EXISTIR NENHUM
DO $$
DECLARE
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO customer_count 
    FROM profiles 
    WHERE role = 'customer';
    
    IF customer_count = 0 THEN
        -- Criar 3 clientes de teste
        INSERT INTO profiles (
            id,
            name,
            email,
            role,
            metadata,
            created_at,
            updated_at
        ) VALUES 
        (
            gen_random_uuid(),
            'Cliente WhatsApp Teste 1',
            'cliente1@whatsapp-auto.com',
            'customer',
            '{"phone": "5511999887766", "source": "test", "category": "standard"}',
            now(),
            now()
        ),
        (
            gen_random_uuid(),
            'Cliente WhatsApp Teste 2', 
            'cliente2@whatsapp-auto.com',
            'customer',
            '{"phone": "5511888776655", "source": "test", "category": "standard"}',
            now(),
            now()
        ),
        (
            gen_random_uuid(),
            'Cliente WhatsApp Teste 3',
            'cliente3@whatsapp-auto.com', 
            'customer',
            '{"phone": "5511777665544", "source": "test", "category": "standard"}',
            now(),
            now()
        );
        
        RAISE NOTICE 'Criados 3 clientes de teste na tabela profiles';
    ELSE
        RAISE NOTICE 'Já existem % clientes na tabela profiles', customer_count;
    END IF;
END $$;

-- 10. VERIFICAR CONSTRAINTS FINAIS
SELECT 
    'Constraint:' || conname as info,
    pg_get_constraintdef(oid) as definicao
FROM pg_constraint 
WHERE conrelid = 'tickets'::regclass
AND contype = 'f'
ORDER BY conname;

-- 11. TESTE DE INSERÇÃO PARA VALIDAR CORREÇÃO
-- Criar função de teste
CREATE OR REPLACE FUNCTION test_ticket_insert_with_customer()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    test_customer_id UUID;
    test_ticket_id UUID;
    result TEXT;
BEGIN
    -- Buscar um cliente de teste
    SELECT id INTO test_customer_id 
    FROM profiles 
    WHERE role = 'customer' 
    LIMIT 1;
    
    IF test_customer_id IS NULL THEN
        RETURN 'ERROR: Nenhum cliente encontrado para teste';
    END IF;
    
    -- Tentar inserir ticket
    BEGIN
        INSERT INTO tickets (
            id,
            title,
            description,
            status,
            priority,
            customer_id,
            channel,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            'Teste Foreign Key',
            'Teste de criação de ticket com customer_id válido',
            'open',
            'medium',
            test_customer_id,
            'whatsapp',
            '{"source": "foreign_key_test"}',
            now(),
            now()
        ) RETURNING id INTO test_ticket_id;
        
        result := 'SUCCESS: Ticket criado com ID ' || test_ticket_id::TEXT;
        
        -- Limpar teste
        DELETE FROM tickets WHERE id = test_ticket_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            result := 'ERROR: ' || SQLERRM;
    END;
    
    RETURN result;
END;
$$;

-- 12. EXECUTAR TESTE
SELECT test_ticket_insert_with_customer() as resultado_teste;

-- 13. LIMPEZA DA FUNÇÃO DE TESTE
DROP FUNCTION IF EXISTS test_ticket_insert_with_customer();

-- 14. VERIFICAÇÃO FINAL COMPLETA
SELECT 
    'Foreign Keys Status' as check_type,
    COUNT(*)::TEXT || ' constraints válidas' as status
FROM pg_constraint 
WHERE conrelid = 'tickets'::regclass
AND contype = 'f'
AND pg_get_constraintdef(oid) LIKE '%profiles%'

UNION ALL

SELECT 
    'Customers Count' as check_type,
    COUNT(*)::TEXT || ' clientes' as status
FROM profiles 
WHERE role = 'customer'

UNION ALL

SELECT 
    'Orphan Tickets' as check_type,
    COUNT(*)::TEXT || ' tickets órfãos' as status
FROM tickets t
LEFT JOIN profiles p ON t.customer_id = p.id
WHERE t.customer_id IS NOT NULL 
AND p.id IS NULL;

NOTIFY pgrst, 'reload schema'; 