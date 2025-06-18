-- 🔍 DIAGNÓSTICO: Departamentos Removidos Não Saindo da Lista
-- Este script irá identificar o problema com departamentos removidos

-- ========================================
-- 1. VERIFICAR TODOS OS DEPARTAMENTOS
-- ========================================
SELECT 
    'TODOS OS DEPARTAMENTOS' as categoria,
    id,
    name,
    description,
    is_active,
    created_at,
    updated_at,
    CASE 
        WHEN is_active = true THEN '✅ ATIVO'
        ELSE '❌ INATIVO (REMOVIDO)'
    END as status_visual
FROM departments
ORDER BY is_active DESC, name ASC;

-- ========================================
-- 2. CONTAR DEPARTAMENTOS POR STATUS
-- ========================================
SELECT 
    'CONTAGEM POR STATUS' as categoria,
    CASE 
        WHEN is_active = true THEN 'Ativos'
        ELSE 'Removidos/Inativos'
    END as status,
    COUNT(*) as quantidade
FROM departments
GROUP BY is_active
ORDER BY is_active DESC;

-- ========================================
-- 3. ÚLTIMOS DEPARTAMENTOS MODIFICADOS
-- ========================================
SELECT 
    'ÚLTIMAS MODIFICAÇÕES' as categoria,
    name,
    is_active,
    updated_at as ultima_modificacao,
    created_at as criado_em,
    CASE 
        WHEN is_active = false AND updated_at > created_at THEN 'REMOVIDO RECENTEMENTE'
        WHEN is_active = true THEN 'ATIVO'
        ELSE 'STATUS INDEFINIDO'
    END as acao_recente
FROM departments
ORDER BY updated_at DESC
LIMIT 10;

-- ========================================
-- 4. VERIFICAR PROBLEMA: SOFT DELETE vs HARD DELETE
-- ========================================
-- O sistema está usando soft delete (is_active = false) mas a lista ainda mostra?

SELECT 
    'ANÁLISE SOFT DELETE' as categoria,
    COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as removidos_soft_delete,
    COUNT(*) as total,
    CASE 
        WHEN COUNT(CASE WHEN is_active = false THEN 1 END) > 0 THEN 
            'SOFT DELETE FUNCIONANDO - Verificar filtro frontend'
        ELSE 
            'NENHUM DEPARTAMENTO REMOVIDO ENCONTRADO'
    END as diagnostico
FROM departments;

-- ========================================
-- 5. VERIFICAR TICKETS VINCULADOS A DEPARTAMENTOS REMOVIDOS
-- ========================================
SELECT 
    'TICKETS ÓRFÃOS' as categoria,
    d.name as departamento_removido,
    d.is_active as departamento_ativo,
    COUNT(t.id) as tickets_vinculados
FROM departments d
LEFT JOIN tickets t ON t.department_id = d.id
WHERE d.is_active = false
GROUP BY d.id, d.name, d.is_active
HAVING COUNT(t.id) > 0;

-- ========================================
-- 6. VERIFICAR USUÁRIOS VINCULADOS A DEPARTAMENTOS REMOVIDOS
-- ========================================
SELECT 
    'USUÁRIOS ÓRFÃOS' as categoria,
    d.name as departamento_removido,
    d.is_active as departamento_ativo,
    COUNT(p.id) as usuarios_vinculados
FROM departments d
LEFT JOIN profiles p ON p.department = d.name OR p.department_id = d.id
WHERE d.is_active = false
GROUP BY d.id, d.name, d.is_active
HAVING COUNT(p.id) > 0;

-- ========================================
-- 7. FUNÇÃO PARA REATIVAR DEPARTAMENTO (EMERGÊNCIA)
-- ========================================
/*
SE PRECISA REATIVAR UM DEPARTAMENTO REMOVIDO POR ENGANO:

UPDATE departments 
SET is_active = true, updated_at = NOW()
WHERE name = 'NOME_DO_DEPARTAMENTO_AQUI';

*/

-- ========================================
-- 8. FORÇAR HARD DELETE (USAR APENAS SE NECESSÁRIO)
-- ========================================
/*
ATENÇÃO: Isso irá DELETAR PERMANENTEMENTE o departamento e quebrar referências!
Use apenas se tiver certeza e após mover tickets/usuários para outros departamentos.

DELETE FROM departments 
WHERE is_active = false 
AND name = 'NOME_DO_DEPARTAMENTO_AQUI';

*/

-- ========================================
-- 9. LIMPEZA RECOMENDADA (APENAS SE CONFIRMADO QUE DEVE SER REMOVIDO)
-- ========================================
/*
1. Primeiro mover tickets para outro departamento:
UPDATE tickets 
SET department_id = 'ID_DEPARTAMENTO_DESTINO'
WHERE department_id IN (
    SELECT id FROM departments WHERE is_active = false
);

2. Depois mover usuários:
UPDATE profiles 
SET department_id = 'ID_DEPARTAMENTO_DESTINO'
WHERE department_id IN (
    SELECT id FROM departments WHERE is_active = false
);

3. Por último, fazer hard delete:
DELETE FROM departments WHERE is_active = false;
*/

-- ========================================
-- 10. VERIFICAÇÃO FINAL
-- ========================================
SELECT 
    'RESUMO FINAL' as categoria,
    'Departamentos ativos na lista: ' || COUNT(CASE WHEN is_active = true THEN 1 END) as ativos,
    'Departamentos removidos (soft delete): ' || COUNT(CASE WHEN is_active = false THEN 1 END) as removidos,
    CASE 
        WHEN COUNT(CASE WHEN is_active = false THEN 1 END) > 0 THEN
            '⚠️ PROBLEMA: Frontend não está filtrando is_active = true corretamente'
        ELSE
            '✅ OK: Nenhum departamento removido encontrado'
    END as diagnostico_final
FROM departments; 