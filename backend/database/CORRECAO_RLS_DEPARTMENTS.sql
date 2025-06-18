-- CORREÇÃO: Políticas RLS para Departments
-- Execute no Supabase Dashboard > SQL Editor

-- 1. VERIFICAR POLÍTICAS ATUAIS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'departments' 
ORDER BY policyname;

-- 2. REMOVER POLÍTICAS PROBLEMÁTICAS (SE EXISTIREM)
DROP POLICY IF EXISTS "departments_select_policy" ON departments;
DROP POLICY IF EXISTS "departments_insert_policy" ON departments;  
DROP POLICY IF EXISTS "departments_update_policy" ON departments;
DROP POLICY IF EXISTS "departments_delete_policy" ON departments;

-- Políticas antigas que podem estar causando problemas
DROP POLICY IF EXISTS "Departamentos são visíveis para todos os usuários autenticados" ON departments;
DROP POLICY IF EXISTS "Apenas administradores podem inserir departamentos" ON departments;
DROP POLICY IF EXISTS "Apenas administradores podem atualizar departamentos" ON departments;
DROP POLICY IF EXISTS "Apenas administradores podem deletar departamentos" ON departments;

-- 3. RECRIAR POLÍTICAS RLS CORRETAS

-- SELECT: Todos usuários autenticados podem ver departamentos
CREATE POLICY "departments_can_select" ON departments
FOR SELECT TO authenticated
USING (true);

-- INSERT: Apenas admins podem criar departamentos  
CREATE POLICY "departments_can_insert" ON departments
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- UPDATE: Apenas admins podem atualizar departamentos
CREATE POLICY "departments_can_update" ON departments  
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- DELETE: Apenas admins podem deletar departamentos (hard delete)
CREATE POLICY "departments_can_delete" ON departments
FOR DELETE TO authenticated  
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- 4. VERIFICAR SE RLS ESTÁ HABILITADO
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- 5. TESTAR PERMISSÕES (Execute como admin)
-- Esta query deve funcionar se você for admin
SELECT 'Teste de SELECT' as tipo, count(*) as resultado FROM departments;

-- Esta query deve funcionar se você for admin  
UPDATE departments 
SET updated_at = NOW() 
WHERE id = (SELECT id FROM departments LIMIT 1);

-- 6. VERIFICAR USUÁRIO ATUAL E SEU PERFIL
SELECT 
    auth.uid() as current_user_id,
    p.email,
    p.role,
    p.name
FROM profiles p 
WHERE p.id = auth.uid();

-- 7. VERIFICAR SE EXISTEM ADMINS NO SISTEMA
SELECT 
    id,
    email, 
    role,
    name,
    created_at
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at;

-- 8. FORÇAR UM USUÁRIO COMO ADMIN (SE NECESSÁRIO)
-- DESCOMENTE E SUBSTITUA O EMAIL ABAIXO SE PRECISAR FORÇAR ADMIN
/*
UPDATE profiles 
SET role = 'admin'
WHERE email = 'SEU_EMAIL_AQUI@exemplo.com';
*/

-- 9. LOG DE SUCESSO
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS de departments recriadas com sucesso!';
    RAISE NOTICE '📋 Execute o script de debug no browser para testar a remoção';
END $$; 