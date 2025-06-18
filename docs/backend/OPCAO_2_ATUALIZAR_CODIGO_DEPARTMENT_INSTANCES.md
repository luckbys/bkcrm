# 🔄 OPÇÃO 2: Atualizar Código para usar department_instances

## 📋 **Quando Usar Esta Opção**
- Se você prefere manter a tabela `department_instances` como está
- Se já tem dados importantes nesta tabela
- Se quer uma estrutura mais detalhada

## 🛠️ **Mudanças Necessárias no Código**

### **1. Atualizar DepartmentEvolutionManager.tsx**

Substituir todas as ocorrências de:
```typescript
.from('evolution_instances')
```

Por:
```typescript
.from('department_instances')
```

### **2. Mapear Campos Diferentes**

A tabela `department_instances` tem estrutura diferente:

| evolution_instances | department_instances | Ação |
|---------------------|---------------------|------|
| `id` (UUID) | `id` (TEXT) | ✅ Manter |
| `instance_name` | `instance_name` | ✅ Manter |
| `department_id` | `department_id` | ✅ Manter |
| `department_name` | `department_name` | ✅ Manter |
| `status` | `status` | 🔄 Mapear valores |
| `phone` | `phone_number` | 🔄 Renomear campo |
| `is_default` | ❌ Não existe | ➕ Adicionar coluna |
| `is_active` | ❌ Não existe | ➕ Adicionar coluna |

### **3. Adicionar Colunas Faltantes**

Execute no Supabase SQL Editor:
```sql
-- Adicionar colunas necessárias para compatibilidade
ALTER TABLE department_instances 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Criar constraint para apenas uma instância padrão por departamento
CREATE UNIQUE INDEX IF NOT EXISTS idx_department_instances_unique_default 
ON department_instances(department_id) 
WHERE is_default = true;

-- Definir uma instância padrão por departamento
WITH ranked_instances AS (
    SELECT 
        id,
        department_id,
        ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY created_at ASC) as rn
    FROM department_instances
)
UPDATE department_instances 
SET is_default = true
FROM ranked_instances
WHERE department_instances.id = ranked_instances.id 
    AND ranked_instances.rn = 1;
```

### **4. Mapear Status Values**

No código TypeScript, mapear os status:
```typescript
// Mapear status de department_instances para o esperado pelo componente
const mapStatus = (dbStatus: string): 'open' | 'close' | 'connecting' | 'unknown' => {
  switch (dbStatus) {
    case 'connected': return 'open';
    case 'connecting': return 'connecting'; 
    case 'created':
    case 'configured':
    case 'disconnected':
    case 'error':
    case 'not_found':
      return 'close';
    default: return 'unknown';
  }
};
```

## ⚡ **Script Automático**

Se escolher esta opção, execute o script:

```sql
-- SCRIPT: Adaptar department_instances para o código existente

-- 1. Adicionar colunas faltantes
ALTER TABLE department_instances 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Criar constraint única
CREATE UNIQUE INDEX IF NOT EXISTS idx_department_instances_unique_default 
ON department_instances(department_id) 
WHERE is_default = true;

-- 3. Definir instâncias padrão
WITH ranked_instances AS (
    SELECT 
        id,
        department_id,
        ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY created_at ASC) as rn
    FROM department_instances
)
UPDATE department_instances 
SET is_default = true
FROM ranked_instances
WHERE department_instances.id = ranked_instances.id 
    AND ranked_instances.rn = 1;

-- 4. Trigger para prevenir múltiplas instâncias padrão
CREATE OR REPLACE FUNCTION enforce_single_default_department_instance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE department_instances 
        SET is_default = false 
        WHERE department_id = NEW.department_id 
          AND id != NEW.id 
          AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_default_department_instance_trigger
    BEFORE INSERT OR UPDATE ON department_instances
    FOR EACH ROW
    EXECUTE FUNCTION enforce_single_default_department_instance();

-- 5. Verificação
SELECT 
    department_name,
    COUNT(*) as total,
    SUM(CASE WHEN is_default THEN 1 ELSE 0 END) as defaults
FROM department_instances 
GROUP BY department_name, department_id;
```

## 🎯 **Vantagens da Opção 2**
- ✅ Mantém estrutura mais completa
- ✅ Preserva dados existentes  
- ✅ Campos extras para futuras funcionalidades
- ✅ Não perde informações

## 🎯 **Desvantagens**
- ❌ Requer mudanças no código TypeScript
- ❌ Mais complexo de implementar
- ❌ Pode gerar bugs se não for feito corretamente

## 💡 **Recomendação**

**Use a Opção 1** (`CORRECAO_TABELA_DEPARTMENT_INSTANCES.sql`) porque:
- ✅ **Mais rápido** - só executar SQL
- ✅ **Menos risco** - não mexe no código
- ✅ **Compatível** - mantém toda funcionalidade
- ✅ **Migração automática** - preserva dados existentes 