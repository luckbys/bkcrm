-- DIAGNÓSTICO: Verificar Setores Removidos
-- Execute no Supabase Dashboard > SQL Editor

-- 1. LISTAR TODOS OS DEPARTAMENTOS (ATIVOS E INATIVOS)
SELECT 
    id,
    name,
    description,
    is_active,
    created_at,
    updated_at,
    CASE 
        WHEN is_active = true THEN '✅ ATIVO'
        ELSE '❌ INATIVO (REMOVIDO)'
    END as status
FROM departments
ORDER BY is_active DESC, name ASC;

-- 2. CONTAR DEPARTAMENTOS POR STATUS
SELECT 
    CASE 
        WHEN is_active = true THEN 'Ativos'
        ELSE 'Removidos'
    END as status,
    COUNT(*) as quantidade
FROM departments
GROUP BY is_active
ORDER BY is_active DESC;

-- 3. ÚLTIMOS DEPARTAMENTOS REMOVIDOS
SELECT 
    name,
    description,
    updated_at as removido_em,
    created_at as criado_em
FROM departments
WHERE is_active = false
ORDER BY updated_at DESC
LIMIT 10;

-- 4. VERIFICAR SE HÁ TICKETS VINCULADOS A SETORES REMOVIDOS
SELECT 
    d.name as departamento_removido,
    COUNT(t.id) as tickets_vinculados
FROM departments d
LEFT JOIN tickets t ON t.department_id = d.id
WHERE d.is_active = false
GROUP BY d.id, d.name
HAVING COUNT(t.id) > 0;

-- 5. FUNÇÃO PARA REATIVAR SETOR (CASO NECESSÁRIO)
/*
Para reativar um setor removido, execute:

UPDATE departments 
SET is_active = true, updated_at = NOW()
WHERE name = 'NOME_DO_SETOR_AQUI';
*/ 