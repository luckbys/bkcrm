-- Migração simplificada para criar tabela evolution_instances
-- Funciona independentemente da estrutura atual da tabela profiles

-- Criar a tabela evolution_instances se não existir
CREATE TABLE IF NOT EXISTS evolution_instances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Informações da instância
    instance_name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'close',
    phone VARCHAR(20),
    
    -- Relacionamento com departamento
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    department_name VARCHAR(255) NOT NULL,
    
    -- Configurações
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Auditoria
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar constraint apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_default_per_department'
    ) THEN
        ALTER TABLE evolution_instances 
        ADD CONSTRAINT unique_default_per_department 
        UNIQUE (department_id, is_default) DEFERRABLE INITIALLY DEFERRED;
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_evolution_instances_department_id ON evolution_instances(department_id);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_status ON evolution_instances(status);
CREATE INDEX IF NOT EXISTS idx_evolution_instances_default ON evolution_instances(department_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_evolution_instances_active ON evolution_instances(is_active) WHERE is_active = true;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_evolution_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evolution_instances_updated_at ON evolution_instances;
CREATE TRIGGER evolution_instances_updated_at
    BEFORE UPDATE ON evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_evolution_instances_updated_at();

-- Trigger para garantir apenas uma instância padrão por departamento
CREATE OR REPLACE FUNCTION enforce_single_default_instance()
RETURNS TRIGGER AS $$
BEGIN
    -- Se estamos definindo uma instância como padrão
    IF NEW.is_default = true THEN
        -- Remover padrão de outras instâncias do mesmo departamento
        UPDATE evolution_instances 
        SET is_default = false 
        WHERE department_id = NEW.department_id 
          AND id != NEW.id 
          AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_single_default_instance_trigger ON evolution_instances;
CREATE TRIGGER enforce_single_default_instance_trigger
    BEFORE INSERT OR UPDATE ON evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_default_instance();

-- RLS (Row Level Security)
ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS evolution_instances_select_policy ON evolution_instances;
DROP POLICY IF EXISTS evolution_instances_insert_policy ON evolution_instances;
DROP POLICY IF EXISTS evolution_instances_update_policy ON evolution_instances;
DROP POLICY IF EXISTS evolution_instances_delete_policy ON evolution_instances;

-- Políticas RLS simplificadas - permitir acesso a todos usuários autenticados por agora
-- Isso pode ser refinado depois quando a estrutura estiver estabilizada
CREATE POLICY evolution_instances_select_policy ON evolution_instances
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY evolution_instances_insert_policy ON evolution_instances
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY evolution_instances_update_policy ON evolution_instances
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY evolution_instances_delete_policy ON evolution_instances
    FOR DELETE
    TO authenticated
    USING (true);

-- Inserir instâncias exemplo para departamentos existentes
DO $$
DECLARE
    dept RECORD;
    instance_count INTEGER;
    safe_name TEXT;
BEGIN
    -- Para cada departamento existente, criar uma instância padrão se não existir
    FOR dept IN SELECT id, name FROM departments WHERE is_active = true LOOP
        -- Verificar se já existe alguma instância para este departamento
        SELECT COUNT(*) INTO instance_count 
        FROM evolution_instances 
        WHERE department_id = dept.id;
        
        -- Se não há instâncias, criar uma padrão
        IF instance_count = 0 THEN
            -- Gerar nome seguro para a instância
            safe_name := LOWER(REGEXP_REPLACE(dept.name, '[^a-zA-Z0-9\s]', '', 'g'));
            safe_name := REPLACE(safe_name, ' ', '-');
            safe_name := safe_name || '-principal';
            
            BEGIN
                INSERT INTO evolution_instances (
                    instance_name,
                    department_id,
                    department_name,
                    is_default,
                    status,
                    metadata
                ) VALUES (
                    safe_name,
                    dept.id,
                    dept.name,
                    true,
                    'close',
                    jsonb_build_object(
                        'auto_created', true,
                        'created_at', NOW(),
                        'description', 'Instância padrão criada automaticamente'
                    )
                );
                
                RAISE NOTICE 'Instância % criada para departamento %', safe_name, dept.name;
                
            EXCEPTION WHEN unique_violation THEN
                RAISE NOTICE 'Instância % já existe, pulando...', safe_name;
            END;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Processo de criação de instâncias Evolution concluído';
END $$;

-- Comentários para documentação
COMMENT ON TABLE evolution_instances IS 'Gerencia instâncias Evolution API associadas a departamentos';
COMMENT ON COLUMN evolution_instances.instance_name IS 'Nome único da instância na Evolution API';
COMMENT ON COLUMN evolution_instances.department_id IS 'ID do departamento proprietário da instância';
COMMENT ON COLUMN evolution_instances.is_default IS 'Indica se esta é a instância padrão do departamento';
COMMENT ON COLUMN evolution_instances.status IS 'Status da conexão: open, close, connecting, etc';
COMMENT ON COLUMN evolution_instances.phone IS 'Número do WhatsApp conectado';
COMMENT ON COLUMN evolution_instances.metadata IS 'Dados adicionais da instância em formato JSON';

-- Verificar resultado
DO $$
DECLARE
    instance_count INTEGER;
    dept_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO instance_count FROM evolution_instances;
    SELECT COUNT(*) INTO dept_count FROM departments WHERE is_active = true;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MIGRAÇÃO EVOLUTION_INSTANCES CONCLUÍDA';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Instâncias criadas: %', instance_count;
    RAISE NOTICE 'Departamentos ativos: %', dept_count;
    RAISE NOTICE 'Execute: SELECT * FROM evolution_instances; para verificar';
    RAISE NOTICE '============================================';
END $$; 