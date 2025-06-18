-- 🔥 FORÇAR EXCLUSÃO: Departamento Problemático
-- Execute no Supabase Dashboard > SQL Editor

-- ==========================================
-- 1. VERIFICAR O DEPARTAMENTO PROBLEMÁTICO
-- ==========================================
SELECT 
    '🔍 DEPARTAMENTO PROBLEMÁTICO' as info,
    id,
    name,
    description,
    is_active,
    created_at,
    updated_at
FROM departments 
WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- ==========================================
-- 2. VERIFICAR DEPENDÊNCIAS (TICKETS/USUÁRIOS)
-- ==========================================
-- Tickets vinculados
SELECT 
    '📋 TICKETS VINCULADOS' as info,
    COUNT(*) as total_tickets
FROM tickets 
WHERE department_id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- Usuários vinculados (verificando se existe coluna department_id)
SELECT 
    '👥 USUÁRIOS VINCULADOS (department_id)' as info,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'department_id'
        ) THEN (
            SELECT COUNT(*) FROM profiles 
            WHERE department_id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260'
        )
        ELSE 0
    END as total_usuarios;

-- Usuários vinculados por nome (se houver coluna department)
SELECT 
    '👥 USUÁRIOS VINCULADOS (department name)' as info,
    COUNT(*) as total_usuarios,
    string_agg(DISTINCT department, ', ') as nomes_departamentos
FROM profiles 
WHERE department IN (
    SELECT name FROM departments 
    WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260'
);

-- ==========================================
-- 3. MOVER DEPENDÊNCIAS PARA DEPARTAMENTO ATIVO
-- ==========================================

-- Mover tickets para o primeiro departamento ativo
UPDATE tickets 
SET department_id = (
    SELECT id FROM departments 
    WHERE is_active = true 
    AND id != '5ddc3a64-b4ae-4389-b7e3-46caefbf0260'
    ORDER BY created_at 
    LIMIT 1
)
WHERE department_id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- Mover usuários (somente se existir coluna department_id)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'department_id'
    ) THEN
        UPDATE profiles 
        SET department_id = (
            SELECT id FROM departments 
            WHERE is_active = true 
            AND id != '5ddc3a64-b4ae-4389-b7e3-46caefbf0260'
            ORDER BY created_at 
            LIMIT 1
        )
        WHERE department_id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';
    END IF;
END $$;

-- Mover usuários (se houver department por nome)
UPDATE profiles 
SET department = (
    SELECT name FROM departments 
    WHERE is_active = true 
    AND id != '5ddc3a64-b4ae-4389-b7e3-46caefbf0260'
    ORDER BY created_at 
    LIMIT 1
)
WHERE department IN (
    SELECT name FROM departments 
    WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260'
);

-- ==========================================
-- 4. FORÇAR EXCLUSÃO DEFINITIVA
-- ==========================================

-- Deletar permanentemente o departamento problemático
DELETE FROM departments 
WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- ==========================================
-- 5. VERIFICAÇÃO FINAL
-- ==========================================

-- Confirmar que foi removido
SELECT 
    '✅ VERIFICAÇÃO PÓS-EXCLUSÃO' as info,
    COUNT(*) as departamento_ainda_existe
FROM departments 
WHERE id = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';

-- Listar departamentos restantes
SELECT 
    '📊 DEPARTAMENTOS RESTANTES' as info,
    id,
    name,
    is_active,
    created_at
FROM departments 
ORDER BY is_active DESC, name ASC;

-- ==========================================
-- 6. LIMPAR CACHE E FORÇAR REFRESH
-- ==========================================

-- Notificar Supabase para recarregar schema
NOTIFY pgrst, 'reload schema';

-- ==========================================
-- RESULTADO ESPERADO
-- ==========================================
/*
Após executar este script:

1. ✅ O departamento 5ddc3a64-b4ae-4389-b7e3-46caefbf0260 será removido
2. ✅ Todas as dependências serão movidas para departamentos ativos
3. ✅ Cache do Supabase será limpo
4. ✅ Erro "Departamento não encontrado no mapeamento" desaparecerá
5. ✅ Sidebar mostrará apenas departamentos válidos

IMPORTANTE: Após executar, faça:
- Pressione Ctrl+F5 no browser
- Execute debugProblematicDepartment() no console
- Verifique se o erro desapareceu
*/ 