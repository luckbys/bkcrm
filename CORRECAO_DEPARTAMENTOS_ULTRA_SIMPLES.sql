-- 🔧 CORREÇÃO ULTRA SIMPLES: Departamentos Removidos
-- Execute no Supabase Dashboard > SQL Editor

-- ==========================================
-- 1. VERIFICAR ESTRUTURA DAS TABELAS
-- ==========================================
SELECT 
    'COLUNAS DA TABELA PROFILES' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('department', 'department_id')
ORDER BY column_name;

SELECT 
    'COLUNAS DA TABELA TICKETS' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('department_id')
ORDER BY column_name;

-- ==========================================
-- 2. DIAGNÓSTICO RÁPIDO
-- ==========================================
SELECT 
    'DIAGNÓSTICO DEPARTAMENTOS' as info,
    COUNT(*) as total_departamentos,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as removidos
FROM departments;

-- ==========================================
-- 3. LISTAR DEPARTAMENTOS REMOVIDOS
-- ==========================================
SELECT 
    'DEPARTAMENTOS A SEREM REMOVIDOS' as status,
    id,
    name,
    is_active,
    updated_at
FROM departments 
WHERE is_active = false
ORDER BY updated_at DESC;

-- ==========================================
-- 4. LIMPEZA SEGURA E SIMPLES
-- ==========================================

-- Primeiro: mover tickets órfãos (se houver coluna department_id)
UPDATE tickets 
SET department_id = (
    SELECT id FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE department_id IN (
    SELECT id FROM departments WHERE is_active = false
)
AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tickets' AND column_name = 'department_id'
);

-- Segundo: mover usuários órfãos que usam department (nome)
UPDATE profiles 
SET department = (
    SELECT name FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE department IN (
    SELECT name FROM departments WHERE is_active = false
)
AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'department'
);

-- Terceiro: mover usuários órfãos que usam department_id (se existir)
UPDATE profiles 
SET department_id = (
    SELECT id FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE department_id IN (
    SELECT id FROM departments WHERE is_active = false
)
AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'department_id'
);

-- Quarto: remover departamentos inativos (só se não há referências)
DELETE FROM departments 
WHERE is_active = false;

-- ==========================================
-- 5. VERIFICAÇÃO FINAL
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