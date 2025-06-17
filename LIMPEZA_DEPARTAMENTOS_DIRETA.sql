-- 🧹 LIMPEZA DIRETA: Departamentos Inativos
-- Execute no Supabase Dashboard > SQL Editor

-- ==========================================
-- 1. VERIFICAÇÃO ANTES DA LIMPEZA
-- ==========================================
SELECT 
    '🔍 ANTES DA LIMPEZA' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inativos
FROM departments;

-- ==========================================
-- 2. LISTAR DEPARTAMENTOS INATIVOS
-- ==========================================
SELECT 
    '📋 DEPARTAMENTOS INATIVOS ENCONTRADOS' as info,
    id,
    name,
    description,
    is_active,
    updated_at
FROM departments 
WHERE is_active = false
ORDER BY name;

-- ==========================================
-- 3. LIMPEZA DIRETA (SEM CONDIÇÕES)
-- ==========================================

-- Passo 1: Remover departamentos inativos permanentemente
DELETE FROM departments 
WHERE is_active = false;

-- ==========================================
-- 4. VERIFICAÇÃO APÓS LIMPEZA
-- ==========================================
SELECT 
    '✅ APÓS A LIMPEZA' as status,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inativos_restantes
FROM departments;

-- ==========================================
-- 5. LISTAR DEPARTAMENTOS RESTANTES
-- ==========================================
SELECT 
    '📊 DEPARTAMENTOS ATIVOS RESTANTES' as info,
    id,
    name,
    description,
    is_active,
    created_at
FROM departments 
WHERE is_active = true
ORDER BY name;

-- ==========================================
-- 6. FORÇA REFRESH DO CACHE SUPABASE
-- ==========================================
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================
-- Após executar este script:
-- 1. Não deve haver departamentos com is_active = false
-- 2. Sidebar deve mostrar apenas departamentos ativos
-- 3. Cache do Supabase será limpo automaticamente
-- 
-- Se ainda não funcionar após este script:
-- 1. Pressione Ctrl+F5 no navegador
-- 2. Execute testSidebarDepartments() no console
-- 3. Execute forceSidebarRefresh() se necessário
-- ========================================== 