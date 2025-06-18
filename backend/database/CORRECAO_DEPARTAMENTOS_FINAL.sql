-- 🔧 CORREÇÃO FINAL: Departamentos Removidos
-- Execute no Supabase Dashboard > SQL Editor

-- ==========================================
-- 1. DIAGNÓSTICO RÁPIDO
-- ==========================================
SELECT 
    'ANTES DA CORREÇÃO' as momento,
    COUNT(*) as total_departamentos,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as removidos_para_limpar
FROM departments;

-- ==========================================
-- 2. MOVER USUÁRIOS ÓRFÃOS (USANDO DEPARTMENT)
-- ==========================================
-- Mover usuários de departamentos inativos para o primeiro ativo
UPDATE profiles 
SET department = (
    SELECT name FROM departments 
    WHERE is_active = true 
    ORDER BY name
    LIMIT 1
)
WHERE department IN (
    SELECT name FROM departments 
    WHERE is_active = false
);

-- ==========================================
-- 3. MOVER TICKETS ÓRFÃOS (SE HOUVER)
-- ==========================================
-- Só executará se a coluna department_id existir na tabela tickets
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'department_id'
    ) THEN
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
    END IF;
END $$;

-- ==========================================
-- 4. REMOVER DEPARTAMENTOS INATIVOS
-- ==========================================
DELETE FROM departments 
WHERE is_active = false;

-- ==========================================
-- 5. VERIFICAÇÃO FINAL
-- ==========================================
SELECT 
    'APÓS A CORREÇÃO' as momento,
    COUNT(*) as total_departamentos,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as removidos_restantes
FROM departments;

-- ==========================================
-- MENSAGEM DE SUCESSO
-- ==========================================
SELECT '✅ CORREÇÃO CONCLUÍDA! Recarregue o frontend (Ctrl+F5)' as resultado; 