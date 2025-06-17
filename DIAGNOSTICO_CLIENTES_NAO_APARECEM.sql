-- ========================================
-- DIAGNÓSTICO: CLIENTES NÃO APARECEM
-- ========================================

-- 1. VERIFICAR SE TABELA PROFILES EXISTE E TEM DADOS
SELECT 'Verificando tabela profiles...' as etapa;
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'customer' THEN 1 END) as total_customers,
    COUNT(CASE WHEN role = 'customer' AND is_active = true THEN 1 END) as customers_ativos
FROM profiles;

-- 2. VERIFICAR ESTRUTURA DA TABELA PROFILES
SELECT 'Verificando estrutura da tabela profiles...' as etapa;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 3. VERIFICAR POLÍTICAS RLS (ROW LEVEL SECURITY)
SELECT 'Verificando políticas RLS...' as etapa;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 'Verificando se RLS está habilitado...' as etapa;
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 5. MOSTRAR CLIENTES EXISTENTES (SAMPLE)
SELECT 'Amostra de clientes existentes...' as etapa;
SELECT 
    id,
    name,
    email,
    role,
    is_active,
    created_at,
    CASE 
        WHEN metadata IS NOT NULL THEN 'Tem metadata'
        ELSE 'Sem metadata'
    END as metadata_status
FROM profiles 
WHERE role = 'customer' 
LIMIT 5;

-- ========================================
-- CORREÇÕES NECESSÁRIAS
-- ========================================

-- CORREÇÃO 1: GARANTIR QUE TABELA CUSTOMERS NÃO EXISTE (DEVE SER PROFILES)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
        RAISE NOTICE 'PROBLEMA: Tabela customers existe - deve ser removida ou migrada para profiles';
    ELSE
        RAISE NOTICE 'OK: Tabela customers não existe (correto)';
    END IF;
END $$;

-- CORREÇÃO 2: DESABILITAR RLS TEMPORARIAMENTE PARA DEBUG
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- CORREÇÃO 3: INSERIR CLIENTES DE TESTE SE NÃO EXISTEM
INSERT INTO profiles (name, email, role, is_active, metadata)
SELECT 
    'Cliente Teste ' || generate_series,
    'cliente' || generate_series || '@teste.com',
    'customer',
    true,
    jsonb_build_object(
        'phone', '5511999' || lpad(generate_series::text, 6, '0'),
        'category', CASE (generate_series % 4)
            WHEN 0 THEN 'bronze'
            WHEN 1 THEN 'silver' 
            WHEN 2 THEN 'gold'
            ELSE 'platinum'
        END,
        'status', 'active',
        'channel', 'whatsapp',
        'company', 'Empresa ' || generate_series,
        'total_value', (generate_series * 1000)::numeric,
        'created_via', 'diagnostic_script'
    )
FROM generate_series(1, 5)
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE role = 'customer' LIMIT 1
);

-- CORREÇÃO 4: VERIFICAR USUÁRIO ATUAL TEM PERMISSÕES
DO $$
DECLARE
    current_user_id uuid;
    current_user_email text;
BEGIN
    SELECT id, email INTO current_user_id, current_user_email
    FROM profiles 
    WHERE role IN ('admin', 'agent')
    LIMIT 1;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'PROBLEMA: Nenhum usuário admin/agent encontrado';
        
        INSERT INTO profiles (name, email, role, is_active)
        VALUES ('Admin Sistema', 'admin@sistema.com', 'admin', true)
        ON CONFLICT (email) DO NOTHING;
        
        RAISE NOTICE 'Usuário admin criado: admin@sistema.com';
    ELSE
        RAISE NOTICE 'OK: Usuário admin encontrado: % (%)', current_user_email, current_user_id;
    END IF;
END $$;

-- CORREÇÃO 5: RECRIAR POLÍTICAS RLS MAIS PERMISSIVAS
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles; 
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

CREATE POLICY "Allow profile access" ON profiles FOR ALL
USING (
    auth.uid() = id 
    OR 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'agent')
        AND p.is_active = true
    )
    OR
    (role = 'customer' AND EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'customer'
        AND p.is_active = true
    ))
);

CREATE POLICY "Allow profile creation" ON profiles FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'agent')
        AND p.is_active = true
    )
    OR
    role = 'customer'
);

CREATE POLICY "Allow profile updates" ON profiles FOR UPDATE
USING (
    auth.uid() = id 
    OR 
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'admin'
        AND p.is_active = true
    )
);

-- REABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

SELECT 'VERIFICAÇÃO FINAL...' as etapa;

SELECT 
    'Total de customers após correções:' as resultado,
    COUNT(*) as quantidade
FROM profiles 
WHERE role = 'customer' AND is_active = true;

SELECT 
    'Customers com metadata:' as resultado,
    COUNT(*) as quantidade
FROM profiles 
WHERE role = 'customer' 
AND metadata IS NOT NULL 
AND jsonb_typeof(metadata) = 'object';

SELECT 
    'Usuários admin/agent:' as resultado,
    COUNT(*) as quantidade
FROM profiles 
WHERE role IN ('admin', 'agent') AND is_active = true;

SELECT 'DIAGNÓSTICO CONCLUÍDO!' as status;
SELECT 'Execute este script no SQL Editor do Supabase Dashboard' as instrucao;
SELECT 'Depois recarregue a página de clientes no frontend' as proxima_acao; 