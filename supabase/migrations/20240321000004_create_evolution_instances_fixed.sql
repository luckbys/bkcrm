-- Migração corrigida para criar tabela evolution_instances
-- Compatível com diferentes estruturas da tabela profiles

-- Primeiro, verificar e criar a tabela evolution_instances
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_default_per_department UNIQUE (department_id, is_default) DEFERRABLE INITIALLY DEFERRED
);

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

-- Função para verificar se usuário tem acesso ao departamento
CREATE OR REPLACE FUNCTION user_has_department_access(target_department_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se existe coluna department_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'department_id'
    ) THEN
        -- Usar department_id (UUID)
        RETURN EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND (
                p.department_id = target_department_id
                OR p.role IN ('admin', 'super_admin')
            )
        );
    ELSE
        -- Fallback para department (TEXT) - buscar por nome
        RETURN EXISTS (
            SELECT 1 FROM profiles p 
            JOIN departments d ON d.name = p.department OR p.role IN ('admin', 'super_admin')
            WHERE p.id = auth.uid() 
            AND (d.id = target_department_id OR p.role IN ('admin', 'super_admin'))
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS usando a função auxiliar
CREATE POLICY evolution_instances_select_policy ON evolution_instances
    FOR SELECT
    USING (user_has_department_access(department_id));

CREATE POLICY evolution_instances_insert_policy ON evolution_instances
    FOR INSERT
    WITH CHECK (user_has_department_access(department_id));

CREATE POLICY evolution_instances_update_policy ON evolution_instances
    FOR UPDATE
    USING (user_has_department_access(department_id));

CREATE POLICY evolution_instances_delete_policy ON evolution_instances
    FOR DELETE
    USING (user_has_department_access(department_id));

-- Inserir instâncias exemplo para departamentos existentes
DO $$
DECLARE
    dept RECORD;
    instance_count INTEGER;
BEGIN
    -- Para cada departamento existente, criar uma instância padrão se não existir
    FOR dept IN SELECT id, name FROM departments WHERE is_active = true LOOP
        -- Verificar se já existe alguma instância para este departamento
        SELECT COUNT(*) INTO instance_count 
        FROM evolution_instances 
        WHERE department_id = dept.id;
        
        -- Se não há instâncias, criar uma padrão
        IF instance_count = 0 THEN
            INSERT INTO evolution_instances (
                instance_name,
                department_id,
                department_name,
                is_default,
                status,
                metadata
            ) VALUES (
                LOWER(REPLACE(REGEXP_REPLACE(dept.name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-')) || '-principal',
                dept.id,
                dept.name,
                true,
                'close',
                jsonb_build_object(
                    'auto_created', true,
                    'created_at', NOW(),
                    'description', 'Instância padrão criada automaticamente'
                )
            ) ON CONFLICT (instance_name) DO NOTHING;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Instâncias Evolution criadas para departamentos existentes';
END $$;

-- Comentários para documentação
COMMENT ON TABLE evolution_instances IS 'Gerencia instâncias Evolution API associadas a departamentos';
COMMENT ON COLUMN evolution_instances.instance_name IS 'Nome único da instância na Evolution API';
COMMENT ON COLUMN evolution_instances.department_id IS 'ID do departamento proprietário da instância';
COMMENT ON COLUMN evolution_instances.is_default IS 'Indica se esta é a instância padrão do departamento';
COMMENT ON COLUMN evolution_instances.status IS 'Status da conexão: open, close, connecting, etc';
COMMENT ON COLUMN evolution_instances.phone IS 'Número do WhatsApp conectado';
COMMENT ON COLUMN evolution_instances.metadata IS 'Dados adicionais da instância em formato JSON';

-- Log de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Tabela evolution_instances criada com sucesso!';
    RAISE NOTICE 'Políticas RLS configuradas com compatibilidade para diferentes estruturas de profiles';
    RAISE NOTICE 'Execute: SELECT * FROM evolution_instances; para verificar as instâncias criadas';
END $$; 