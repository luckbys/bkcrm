# 🚨 SOLUÇÃO RÁPIDA: Erro "column assigned_to does not exist"

## ⚠️ **Problema**
```
ERROR: 42703: column "assigned_to" does not exist
```

## ✅ **Solução Imediata (2 minutos)**

### **OPÇÃO 1: Script Rápido (Recomendado)**

1. **Acesse o Supabase Dashboard** → SQL Editor
2. **Execute este comando simples:**

```sql
ALTER TABLE tickets ADD COLUMN assigned_to UUID;
```

3. **Se der erro, tente a versão completa:**

```sql
-- Adicionar coluna se não existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tickets' AND column_name = 'assigned_to'
    ) THEN
        ALTER TABLE tickets ADD COLUMN assigned_to UUID;
        RAISE NOTICE '✅ Coluna assigned_to adicionada!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna já existe';
    END IF;
END $$;
```

### **OPÇÃO 2: Script Completo**

1. **Execute o arquivo:** `CORRECAO_ASSIGNED_TO.sql`
2. **Este script:**
   - ✅ Verifica se a coluna existe
   - ✅ Adiciona se não existir
   - ✅ Configura foreign key
   - ✅ Mostra resultado

### **OPÇÃO 3: Solução Robusta Completa**

1. **Se ainda tiver problemas, execute:** `CORRECAO_ROBUSTA_SUPABASE.sql`
2. **Este script resolve TUDO:**
   - ✅ Cria todas as colunas que faltam
   - ✅ Corrige estrutura completa
   - ✅ Configura RLS
   - ✅ Resolve recursão infinita

## 🎯 **Resultado Esperado**

Após executar qualquer uma das opções acima:

```
✅ Coluna assigned_to adicionada com sucesso
✅ Erro "column assigned_to does not exist" resolvido
✅ Sistema funcionando normalmente
```

## 🧪 **Testar se Funcionou**

Execute no SQL Editor:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tickets' AND column_name = 'assigned_to';
```

**Se retornar "assigned_to" = SUCESSO! ✅**

## 📋 **Próximos Passos**

1. **Teste o login** no seu sistema
2. **Verifique se os erros 500/400 sumiram**
3. **Teste criar/editar tickets**
4. **Se ainda houver problemas, execute o script completo**

---

💡 **Dica:** Use a **OPÇÃO 1** primeiro. Se não resolver, passe para as outras opções progressivamente. 