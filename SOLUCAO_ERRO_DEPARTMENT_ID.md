# ❌ Solucionando Erro: "column p.department_id does not exist"

## 🔍 Problema Identificado

O erro indica que a tabela `profiles` não possui a coluna `department_id` que a migração `evolution_instances` está tentando usar.

## 📋 Diagnóstico Rápido

Execute no console do navegador (F12):
```javascript
checkProfilesStructure()
```

Este comando mostrará qual estrutura de departamento está configurada.

## 🛠️ Soluções por Cenário

### **Cenário 1: Estrutura Legacy (department TEXT)**

Se o resultado mostrar:
```
⚠️ Estrutura legacy detectada - usando department
```

**Solução:** Execute no Supabase SQL Editor:
```sql
-- Migração: supabase/migrations/20240321000002_add_department_to_profiles.sql
ALTER TABLE profiles 
ADD COLUMN department_id UUID REFERENCES departments(id);

CREATE INDEX idx_profiles_department_id ON profiles(department_id);

-- Atualizar usuários existentes para ter um departamento padrão
UPDATE profiles 
SET department_id = (
  SELECT id FROM departments 
  WHERE is_active = true 
  ORDER BY created_at 
  LIMIT 1
)
WHERE department_id IS NULL AND role IN ('agent', 'admin');
```

### **Cenário 2: Nenhuma Estrutura de Departamento**

Se o resultado mostrar:
```
❌ Nenhuma coluna de departamento encontrada
```

**Solução:** Execute as migrações na ordem:

1. **Primeiro:** Criar tabela departments
```sql
-- supabase/migrations/20240321000000_create_departments_table.sql
```

2. **Segundo:** Adicionar department_id à profiles  
```sql
-- supabase/migrations/20240321000002_add_department_to_profiles.sql
```

3. **Terceiro:** Criar tabela evolution_instances
```sql
-- supabase/migrations/20240321000005_evolution_instances_simple.sql
```

### **Cenário 3: Estrutura Atualizada**

Se o resultado mostrar:
```
✅ Estrutura atualizada detectada - usando department_id
```

**Solução:** Execute apenas a migração evolution_instances:
```sql
-- supabase/migrations/20240321000005_evolution_instances_simple.sql
```

## 🔧 Comando de Teste

Após executar as migrações, teste:
```javascript
testEvolutionInstancesMigration()
```

## 📂 Arquivos de Migração Disponíveis

### 1. **Departamentos** (se não existir)
- `supabase/migrations/20240321000000_create_departments_table.sql`

### 2. **Adicionar department_id** (se usando TEXT)
- `supabase/migrations/20240321000002_add_department_to_profiles.sql`

### 3. **Evolution Instances** (versão corrigida)
- `supabase/migrations/20240321000005_evolution_instances_simple.sql`

## ⚡ Solução Rápida

**Execute no console para diagnóstico completo:**
```javascript
// 1. Verificar estrutura atual
checkProfilesStructure()

// 2. Após executar migrações necessárias, testar:
testEvolutionInstancesMigration()
```

## 📝 Ordem de Execução Recomendada

1. **Diagnóstico:**
   ```javascript
   checkProfilesStructure()
   ```

2. **Executar migrações** conforme cenário identificado

3. **Verificar resultado:**
   ```javascript
   testEvolutionInstancesMigration()
   ```

4. **Acessar interface:** 
   - Selecionar setor → Aba "WhatsApp"

## 🚨 Problemas Comuns

### **Erro: "relation departments does not exist"**
- Execute primeiro: `20240321000000_create_departments_table.sql`

### **Erro: "policies exist"**
- Normal, a migração trata isso com `DROP POLICY IF EXISTS`

### **Instâncias não aparecem na interface**
- Verifique se usuário tem departamento atribuído
- Execute `testEvolutionInstancesMigration()` para debug

## ✅ Verificação Final

Após tudo configurado:

1. **No console:**
   ```javascript
   testEvolutionInstancesMigration()
   ```

2. **Na interface:**
   - Selecionar um setor
   - Clicar em "WhatsApp" no menu
   - Deve aparecer a central de instâncias

3. **Teste funcional:**
   - "Nova Instância" → Criar
   - "Conectar" → QR Code deve aparecer

---

**💡 Dica:** Execute sempre o diagnóstico primeiro para identificar o cenário exato do seu banco de dados. 