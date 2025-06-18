-- 🗑️ REMOÇÃO SIMPLES: Departamento Problemático
-- Execute no Supabase Dashboard > SQL Editor

-- ==========================================
-- 1. VERIFICAR SE O DEPARTAMENTO EXISTE
-- ==========================================
SELECT 
    '🔍 DEPARTAMENTO PROBLEMÁTICO' as status,
    COUNT(*) as existe
FROM departments 
WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- ==========================================
-- 2. MOSTRAR DADOS DO DEPARTAMENTO
-- ==========================================
SELECT 
    '📋 DADOS DO DEPARTAMENTO' as info,
    id,
    name,
    is_active,
    updated_at
FROM departments 
WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- ==========================================
-- 3. VERIFICAR TICKETS VINCULADOS
-- ==========================================
SELECT 
    '📋 TICKETS VINCULADOS' as info,
    COUNT(*) as total
FROM tickets 
WHERE department_id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- ==========================================
-- 4. MOVER TICKETS PARA DEPARTAMENTO ATIVO
-- ==========================================
UPDATE tickets 
SET department_id = (
    SELECT id FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE department_id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- ==========================================
-- 5. MOVER USUÁRIOS POR NOME DE DEPARTAMENTO
-- ==========================================
UPDATE profiles 
SET department = (
    SELECT name FROM departments 
    WHERE is_active = true 
    ORDER BY created_at 
    LIMIT 1
)
WHERE department = (
    SELECT name FROM departments 
    WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260'
);

-- ==========================================
-- 6. REMOVER O DEPARTAMENTO DEFINITIVAMENTE
-- ==========================================
DELETE FROM departments 
WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- ==========================================
-- 7. CONFIRMAR REMOÇÃO
-- ==========================================
SELECT 
    '✅ CONFIRMAÇÃO' as resultado,
    COUNT(*) as departamento_ainda_existe
FROM departments 
WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- ==========================================
-- 8. LISTAR DEPARTAMENTOS RESTANTES
-- ==========================================
SELECT 
    '📊 DEPARTAMENTOS ATIVOS' as info,
    id,
    name,
    is_active
FROM departments 
WHERE is_active = true
ORDER BY name;

-- ==========================================
-- RESULTADO ESPERADO: 0 (zero) na confirmação
-- Isso significa que o departamento foi removido
-- ========================================== 