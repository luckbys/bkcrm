-- 🔧 CORREÇÃO - Renomear department_instances para evolution_instances
-- O código usa 'evolution_instances' mas foi criada 'department_instances'

-- ===== 1. VERIFICAR SE TABELAS EXISTEM =====
DO $$
BEGIN
    -- Verificar se department_instances existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_instances') THEN
        RAISE NOTICE '✅ Tabela department_instances encontrada';
    ELSE
        RAISE NOTICE '❌ Tabela department_instances NÃO encontrada';
    END IF;
    
    -- Verificar se evolution_instances existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evolution_instances') THEN
        RAISE NOTICE '⚠️ Tabela evolution_instances já existe - será atualizada';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela evolution_instances será criada';
    END IF;
END $$;

-- ===== 2. BACKUP DOS DADOS (se department_instances existe) =====
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_instances') THEN
        -- Criar tabela temporária para backup
        CREATE TABLE IF NOT EXISTS department_instances_backup AS 
        SELECT * FROM department_instances;
        
        RAISE NOTICE '📦 Backup criado: department_instances_backup';
    END IF;
END $$;

-- ===== 3. REMOVER TABELA EVOLUTION_INSTANCES SE EXISTIR =====
DROP TABLE IF EXISTS evolution_instances CASCADE;

-- ===== 4. CRIAR TABELA EVOLUTION_INSTANCES COM ESTRUTURA CORRETA =====
CREATE TABLE evolution_instances (
    -- Usar UUID como ID (padrão do Supabase)
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    -- Campos essenciais que o código espera
    instance_name TEXT NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    department_name TEXT NOT NULL,
    
    -- Status simplificado que o código usa
    status TEXT NOT NULL DEFAULT 'close' CHECK (status IN ('open', 'close', 'connecting', 'unknown')),
    
    -- Campos opcionais
    phone TEXT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    
    -- Campos extras da structure original (compatibilidade)
    instance_id TEXT,
    server_url TEXT,
    apikey TEXT,
    settings JSONB DEFAULT '{}',
    webhook_url TEXT,
    qr_code TEXT,
    last_sync TIMESTAMP WITH TIME ZONE
);

-- ===== 5. CRIAR ÍNDICES =====
CREATE INDEX idx_evolution_instances_department_id ON evolution_instances(department_id);
CREATE INDEX idx_evolution_instances_status ON evolution_instances(status);
CREATE INDEX idx_evolution_instances_instance_name ON evolution_instances(instance_name);
CREATE INDEX idx_evolution_instances_default ON evolution_instances(department_id, is_default) WHERE is_default = true;
CREATE INDEX idx_evolution_instances_active ON evolution_instances(is_active) WHERE is_active = true;

-- Índice único para evitar múltiplas instâncias padrão por departamento
CREATE UNIQUE INDEX idx_evolution_instances_unique_default 
ON evolution_instances(department_id) 
WHERE is_default = true;

-- ===== 6. MIGRAR DADOS (se existem) =====
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'department_instances_backup') THEN
        -- Migrar dados de department_instances para evolution_instances
        INSERT INTO evolution_instances (
            instance_name,
            department_id,
            department_name,
            status,
            phone,
            is_default,
            is_active,
            metadata,
            instance_id,
            server_url,
            apikey,
            settings,
            webhook_url,
            qr_code,
            last_sync,
            created_at,
            updated_at
        )
        SELECT 
            instance_name,
            department_id,
            department_name,
            -- Mapear status do department_instances para evolution_instances
            CASE 
                WHEN status IN ('connected') THEN 'open'
                WHEN status IN ('connecting') THEN 'connecting'
                WHEN status IN ('created', 'configured', 'disconnected', 'error', 'not_found') THEN 'close'
                ELSE 'unknown'
            END as status,
            phone_number as phone,
            false as is_default,  -- Será ajustado depois
            true as is_active,
            COALESCE(metadata, '{}') as metadata,
            instance_id,
            server_url,
            apikey,
            COALESCE(settings, '{}') as settings,
            webhook_url,
            qr_code,
            last_sync,
            created_at,
            updated_at
        FROM department_instances_backup;
        
        -- Definir uma instância padrão por departamento
        WITH ranked_instances AS (
            SELECT 
                id,
                department_id,
                ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY created_at ASC) as rn
            FROM evolution_instances
        )
        UPDATE evolution_instances 
        SET is_default = true
        FROM ranked_instances
        WHERE evolution_instances.id = ranked_instances.id 
            AND ranked_instances.rn = 1;
        
        RAISE NOTICE '✅ Dados migrados de department_instances para evolution_instances';
    ELSE
        -- Criar instâncias padrão para departamentos existentes
        INSERT INTO evolution_instances (
            instance_name,
            department_id,
            department_name,
            is_default,
            status,
            metadata
        )
        SELECT 
            LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g')) || '-principal',
            id,
            name,
            true,
            'close',
            jsonb_build_object(
                'auto_created', true,
                'created_at', NOW(),
                'description', 'Instância padrão criada automaticamente'
            )
        FROM departments 
        WHERE is_active = true
        ON CONFLICT (instance_name) DO NOTHING;
        
        RAISE NOTICE '✅ Instâncias padrão criadas para departamentos existentes';
    END IF;
END $$;

-- ===== 7. TRIGGERS =====
-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_evolution_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evolution_instances_updated_at
    BEFORE UPDATE ON evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_evolution_instances_updated_at();

-- Trigger para garantir apenas uma instância padrão por departamento
CREATE OR REPLACE FUNCTION enforce_single_default_evolution_instance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE evolution_instances 
        SET is_default = false 
        WHERE department_id = NEW.department_id 
          AND id != NEW.id 
          AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default_evolution_instance_trigger
    BEFORE INSERT OR UPDATE ON evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_default_evolution_instance();

-- ===== 8. RLS (ROW LEVEL SECURITY) =====
ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY evolution_instances_select_policy ON evolution_instances
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY evolution_instances_insert_policy ON evolution_instances
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY evolution_instances_update_policy ON evolution_instances
    FOR UPDATE TO authenticated
    USING (true);

CREATE POLICY evolution_instances_delete_policy ON evolution_instances
    FOR DELETE TO authenticated
    USING (true);

-- ===== 9. LIMPEZA =====
-- Remover tabela department_instances (dados já migrados)
DROP TABLE IF EXISTS department_instances CASCADE;

-- Manter backup por segurança (remover depois se tudo estiver OK)
-- DROP TABLE IF EXISTS department_instances_backup;

-- ===== 10. VERIFICAÇÃO FINAL =====
DO $$
DECLARE
    instance_count INTEGER;
    dept_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO instance_count FROM evolution_instances;
    SELECT COUNT(*) INTO dept_count FROM departments WHERE is_active = true;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ MIGRAÇÃO DEPARTMENT_INSTANCES → EVOLUTION_INSTANCES CONCLUÍDA';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Instâncias criadas: %', instance_count;
    RAISE NOTICE 'Departamentos ativos: %', dept_count;
    RAISE NOTICE 'Estrutura: Compatível com DepartmentEvolutionManager.tsx';
    RAISE NOTICE 'Backup: department_instances_backup (remover depois)';
    RAISE NOTICE '============================================';
    RAISE NOTICE '🔄 Reinicie a aplicação para aplicar as mudanças';
    RAISE NOTICE '🧪 Teste: Criar nova instância no CRM';
    RAISE NOTICE '============================================';
END $$; 