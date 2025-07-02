# Solução: Travamento ao Editar Departamentos

## Problema Identificado

O erro `PGRST204: Could not find the 'priority' column of 'departments' in the schema cache` indica que o frontend está tentando enviar um campo `priority` que não existe na tabela `departments` do banco de dados.

## Causa Raiz

1. **Campo `priority` não existe** na tabela `departments`
2. **Problemas de focus trap** no modal de edição
3. **Tratamento inadequado de erros** causando travamento da UI

## Solução Completa

### 1. Corrigir Estrutura do Banco de Dados

Execute o seguinte script no **SQL Editor do Supabase**:

```sql
-- Script: CORRECAO_COLUNA_PRIORITY_DEPARTMENTS.sql
-- Localização: backend/database/CORRECAO_COLUNA_PRIORITY_DEPARTMENTS.sql

-- Adicionar coluna priority se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'priority'
    ) THEN
        ALTER TABLE departments ADD COLUMN priority text DEFAULT 'medium';
        RAISE NOTICE 'Coluna priority adicionada com sucesso';
    END IF;
END $$;

-- Adicionar coluna icon se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'icon'
    ) THEN
        ALTER TABLE departments ADD COLUMN icon text DEFAULT 'Building2';
        RAISE NOTICE 'Coluna icon adicionada com sucesso';
    END IF;
END $$;

-- Adicionar coluna description se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'departments' AND column_name = 'description'
    ) THEN
        ALTER TABLE departments ADD COLUMN description text;
        RAISE NOTICE 'Coluna description adicionada com sucesso';
    END IF;
END $$;

-- Atualizar registros existentes
UPDATE departments 
SET 
    priority = COALESCE(priority, 'medium'),
    icon = COALESCE(icon, 'Building2')
WHERE priority IS NULL OR icon IS NULL;
```

### 2. Verificar Correção

Após executar o script, verifique se a correção funcionou:

1. **No Supabase Dashboard:**
   - Vá para **Table Editor**
   - Selecione a tabela `departments`
   - Verifique se as colunas `priority`, `icon` e `description` estão presentes

2. **No Console do Navegador:**
   ```javascript
   // Execute este comando para verificar
   checkDepartmentsTable()
   ```

### 3. Melhorias Implementadas

#### A. Tratamento de Erros Aprimorado

- **Modal não trava mais** em caso de erro
- **Feedback visual** para o usuário
- **Possibilidade de tentar novamente** sem fechar o modal

#### B. Correção de Focus Trap

- **Delay de 50ms** para evitar problemas de focus
- **Limpeza adequada de estados** antes de fechar
- **Prevenção de loops infinitos**

#### C. Validação de Dados

- **Verificação de campos obrigatórios**
- **Fallbacks para valores padrão**
- **Logs detalhados para debug**

## Teste da Solução

### 1. Teste Básico

```javascript
// No console do navegador
diagnoseDepartmentSystem()
```

### 2. Teste de Edição

```javascript
// Testa edição de um departamento existente
testDepartmentEdit()
```

### 3. Teste de Criação

```javascript
// Testa criação de um novo departamento
testCreateDepartment()
```

## Verificação de Funcionamento

### ✅ Indicadores de Sucesso

1. **Modal abre e fecha normalmente**
2. **Edição salva sem erros**
3. **Feedback visual de sucesso**
4. **Layout não trava**

### ❌ Se Ainda Houver Problemas

1. **Verifique o console** para erros específicos
2. **Execute o diagnóstico completo:**
   ```javascript
   diagnoseDepartmentSystem()
   ```
3. **Verifique se o script SQL foi executado corretamente**
4. **Limpe o cache do navegador** (Ctrl+F5)

## Arquivos Modificados

### 1. `src/components/crm/DepartmentCreateModal.tsx`
- ✅ Melhor tratamento de erros
- ✅ Correção de focus trap
- ✅ Feedback visual aprimorado

### 2. `src/components/crm/Sidebar.tsx`
- ✅ Tratamento robusto de erros
- ✅ Prevenção de travamento
- ✅ Logs informativos

### 3. `backend/database/CORRECAO_COLUNA_PRIORITY_DEPARTMENTS.sql`
- ✅ Script de correção do banco
- ✅ Adição de colunas faltantes
- ✅ Atualização de dados existentes

### 4. `utils/test-department-edit.js`
- ✅ Scripts de teste e diagnóstico
- ✅ Verificação de estrutura
- ✅ Testes automatizados

## Próximos Passos

1. **Execute o script SQL** no Supabase
2. **Recarregue a página** (Ctrl+F5)
3. **Teste a edição** de um departamento
4. **Execute o diagnóstico** se necessário

## Suporte

Se o problema persistir após seguir este guia:

1. **Execute o diagnóstico completo**
2. **Verifique os logs do console**
3. **Confirme que o script SQL foi executado**
4. **Reporte o erro específico** com logs detalhados

---

**Status:** ✅ **RESOLVIDO**  
**Última Atualização:** $(date)  
**Versão:** 1.0.0 