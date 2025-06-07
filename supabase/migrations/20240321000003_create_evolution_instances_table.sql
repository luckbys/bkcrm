-- Criação da tabela para gerenciar instâncias Evolution API por departamento
-- Esta tabela permite que cada setor tenha suas próprias instâncias WhatsApp

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

CREATE TRIGGER enforce_single_default_instance_trigger
    BEFORE INSERT OR UPDATE ON evolution_instances
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_default_instance();

-- RLS (Row Level Security)
ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;

-- Política para leitura: usuários podem ver instâncias do seu departamento ou se forem admin
CREATE POLICY evolution_instances_select_policy ON evolution_instances
    FOR SELECT
    USING (
        department_id IN (
            SELECT p.department_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Política para inserção: usuários podem criar instâncias para seu departamento ou se forem admin
CREATE POLICY evolution_instances_insert_policy ON evolution_instances
    FOR INSERT
    WITH CHECK (
        department_id IN (
            SELECT p.department_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Política para atualização: usuários podem atualizar instâncias do seu departamento ou se forem admin
CREATE POLICY evolution_instances_update_policy ON evolution_instances
    FOR UPDATE
    USING (
        department_id IN (
            SELECT p.department_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Política para exclusão: usuários podem deletar instâncias do seu departamento ou se forem admin
CREATE POLICY evolution_instances_delete_policy ON evolution_instances
    FOR DELETE
    USING (
        department_id IN (
            SELECT p.department_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
        OR 
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'super_admin')
        )
    );

-- Inserir instâncias exemplo para departamentos existentes
DO $$
DECLARE
    dept RECORD;
BEGIN
    -- Para cada departamento existente, criar uma instância padrão
    FOR dept IN SELECT id, name FROM departments WHERE is_active = true LOOP
        INSERT INTO evolution_instances (
            instance_name,
            department_id,
            department_name,
            is_default,
            status,
            metadata
        ) VALUES (
            LOWER(REPLACE(dept.name, ' ', '-')) || '-principal',
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
    END LOOP;
END $$;

-- Comentários para documentação
COMMENT ON TABLE evolution_instances IS 'Gerencia instâncias Evolution API associadas a departamentos';
COMMENT ON COLUMN evolution_instances.instance_name IS 'Nome único da instância na Evolution API';
COMMENT ON COLUMN evolution_instances.department_id IS 'ID do departamento proprietário da instância';
COMMENT ON COLUMN evolution_instances.is_default IS 'Indica se esta é a instância padrão do departamento';
COMMENT ON COLUMN evolution_instances.status IS 'Status da conexão: open, close, connecting, etc';
COMMENT ON COLUMN evolution_instances.phone IS 'Número do WhatsApp conectado';
COMMENT ON COLUMN evolution_instances.metadata IS 'Dados adicionais da instância em formato JSON'; 