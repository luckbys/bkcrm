-- 🔧 CORREÇÃO SIMPLES: Departamentos Removidos
-- Execute no Supabase Dashboard > SQL Editor

-- ==========================================
-- 1. DIAGNÓSTICO RÁPIDO
-- ==========================================
SELECT 
    'DIAGNÓSTICO' as info,
    COUNT(*) as total_departamentos,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as removidos
FROM departments;

-- ==========================================
-- 2. LISTAR DEPARTAMENTOS REMOVIDOS
-- ==========================================
SELECT 
    'DEPARTAMENTOS REMOVIDOS' as status,
    id,
    name,
    is_active,
    updated_at
FROM departments 
WHERE is_active = false
ORDER BY updated_at DESC;

-- ==========================================
-- 3. LIMPEZA AUTOMÁTICA E SEGURA
-- ==========================================

-- Mover tickets órfãos para o primeiro departamento ativo
UPDATE tickets 
SET department_id = (
    SELECT id FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE department_id IN (
    SELECT id FROM departments WHERE is_active = false
);

-- Mover usuários órfãos para o primeiro departamento ativo
UPDATE profiles 
SET department = (
    SELECT name FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE department IN (
    SELECT name FROM departments WHERE is_active = false
);

-- Remover departamentos inativos permanentemente
DELETE FROM departments WHERE is_active = false;

-- ==========================================
-- 4. VERIFICAÇÃO FINAL
-- ==========================================
SELECT 
    'RESULTADO FINAL' as info,
    COUNT(*) as total_departamentos,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as removidos
FROM departments;

-- ==========================================
-- INSTRUÇÕES FINAIS
-- ==========================================
-- 1. Execute este script no Supabase Dashboard
-- 2. Recarregue o frontend (Ctrl+F5)
-- 3. Departamentos removidos não aparecerão mais na lista
-- ========================================== 