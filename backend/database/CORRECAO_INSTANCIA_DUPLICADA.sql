-- 🛠️ CORREÇÃO - Erro duplicate key value violates unique constraint "unique_default_per_department"
-- Este erro ocorre quando tentamos criar uma instância padrão mas já existe uma para o departamento

-- ===== DIAGNÓSTICO =====
-- Ver quantas instâncias padrão cada departamento tem
SELECT 
    department_id,
    department_name,
    COUNT(*) as instancias_padrao,
    array_agg(instance_name) as nomes_instancias
FROM evolution_instances 
WHERE is_default = true
GROUP BY department_id, department_name
HAVING COUNT(*) > 1;

-- Ver todas as instâncias por departamento
SELECT 
    department_name,
    instance_name,
    is_default,
    created_at
FROM evolution_instances 
ORDER BY department_name, created_at;

-- ===== SOLUÇÃO RÁPIDA =====
-- Remover flag padrão de todas as instâncias existentes
UPDATE evolution_instances 
SET is_default = false 
WHERE is_default = true;

-- Definir apenas a instância mais recente de cada departamento como padrão
WITH ranked_instances AS (
    SELECT 
        id,
        department_id,
        instance_name,
        ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY created_at DESC) as rn
    FROM evolution_instances
    WHERE is_active = true
)
UPDATE evolution_instances 
SET is_default = true
FROM ranked_instances
WHERE evolution_instances.id = ranked_instances.id 
    AND ranked_instances.rn = 1;

-- ===== VERIFICAÇÃO =====
-- Confirmar que agora cada departamento tem apenas uma instância padrão
SELECT 
    department_name,
    COUNT(*) as total_instancias,
    SUM(CASE WHEN is_default THEN 1 ELSE 0 END) as instancias_padrao
FROM evolution_instances 
GROUP BY department_name, department_id
ORDER BY department_name;

-- ===== PREVENÇÃO FUTURA =====
-- Criar função para garantir apenas uma instância padrão por departamento
CREATE OR REPLACE FUNCTION prevent_multiple_default_instances()
RETURNS TRIGGER AS $$
BEGIN
    -- Se estamos marcando como padrão
    IF NEW.is_default = true THEN
        -- Remover padrão de outras instâncias do mesmo departamento
        UPDATE evolution_instances 
        SET is_default = false 
        WHERE department_id = NEW.department_id 
          AND id != NEW.id 
          AND is_default = true;
    END IF;
    
    -- Se estamos removendo a última instância padrão do departamento
    IF OLD.is_default = true AND NEW.is_default = false THEN
        -- Verificar se há outras instâncias no departamento
        IF EXISTS (
            SELECT 1 FROM evolution_instances 
            WHERE department_id = NEW.department_id 
              AND id != NEW.id 
              AND is_active = true
        ) THEN
            -- Definir a mais antiga como padrão
            UPDATE evolution_instances 
            SET is_default = true 
            WHERE id = (
                SELECT id FROM evolution_instances 
                WHERE department_id = NEW.department_id 
                  AND id != NEW.id 
                  AND is_active = true
                ORDER BY created_at ASC 
                LIMIT 1
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar trigger atualizado
DROP TRIGGER IF EXISTS prevent_multiple_default_instances_trigger ON evolution_instances;
CREATE TRIGGER prevent_multiple_default_instances_trigger
    BEFORE INSERT OR UPDATE ON evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION prevent_multiple_default_instances();

-- ===== LOG DE SUCESSO =====
DO $$
DECLARE
    total_depts INTEGER;
    fixed_depts INTEGER;
BEGIN
    SELECT COUNT(DISTINCT department_id) INTO total_depts FROM evolution_instances;
    SELECT COUNT(*) INTO fixed_depts FROM (
        SELECT department_id 
        FROM evolution_instances 
        WHERE is_default = true
        GROUP BY department_id
    ) sub;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ CORREÇÃO DE INSTÂNCIAS PADRÃO CONCLUÍDA';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Departamentos com instâncias: %', total_depts;
    RAISE NOTICE 'Departamentos com padrão definido: %', fixed_depts;
    RAISE NOTICE 'Status: % departamentos corrigidos', fixed_depts;
    RAISE NOTICE '============================================';
    RAISE NOTICE '🔄 Agora você pode criar novas instâncias normalmente';
    RAISE NOTICE '🛡️ Trigger ativo para prevenir duplicações futuras';
    RAISE NOTICE '============================================';
END $$; 