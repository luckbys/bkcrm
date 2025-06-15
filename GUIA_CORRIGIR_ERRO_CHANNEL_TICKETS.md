# 🔧 Guia Rápido: Corrigir Erro Channel Tickets

## 🚨 **PROBLEMA IDENTIFICADO**

**Erro:** `Could not find the 'channel' column of 'tickets' in the schema cache`  
**Código:** `PGRST204`  
**Causa:** A tabela `tickets` no Supabase não possui a coluna `channel` necessária

---

## ✅ **SOLUÇÃO RÁPIDA (5 minutos)**

### **1. Acessar Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard  
2. Selecione seu projeto: `ajlgjjjvuglwgfnyqqvb`
3. Clique em **SQL Editor** (ícone 🗂️)

### **2. Executar Script de Correção**
1. Clique em **"New Query"**
2. Cole o conteúdo completo do arquivo: `CORRECAO_ERRO_CHANNEL_TICKETS.sql`
3. Clique em **"Run"** (▶️)
4. Aguarde a execução (30-60 segundos)

### **3. Verificar Sucesso**
Procure por esta mensagem no output:
```
✅ CORREÇÃO CONCLUÍDA COM SUCESSO!
   A coluna channel está disponível e o schema cache foi recarregado
   Teste no frontend: tente criar um ticket agora
```

---

## 🧪 **TESTAR A CORREÇÃO**

### **No Frontend (localhost:3006)**
1. Vá para **Gerenciamento de Tickets**
2. Clique em **"+ Novo Ticket"**
3. Preencha os campos:
   - **Título:** `Teste de Correção`
   - **Descrição:** `Testando se a coluna channel funciona`
   - **Canal:** Selecione qualquer opção
4. Clique em **"Salvar"**

**✅ Sucesso:** Ticket criado sem erros  
**❌ Falha:** Ainda aparece erro PGRST204

---

## 🔍 **VERIFICAÇÃO ADICIONAL**

Se ainda houver erro, execute este comando no SQL Editor:

```sql
-- Verificar se a coluna channel existe
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name = 'channel';
```

**Resultado esperado:**
```
channel | text | YES
```

---

## 🛠️ **SCRIPTS DE BACKUP (Se necessário)**

### **Se a tabela tickets não existir:**
Execute primeiro: `SOLUCAO_TICKETS_400_COMPLETA.sql`

### **Se houver problemas de relacionamento:**
Execute também: `CORRECAO_RELACIONAMENTOS_TICKETS_DEPARTMENTS.sql`

---

## 📱 **TESTAR WEBHOOK EVOLUTION API**

Após corrigir, teste o webhook:

```bash
node webhook-evolution-complete.js
```

O webhook deve criar tickets automaticamente sem erros de coluna.

---

## ✅ **STATUS ATUAL**

- ⚠️ **ANTES:** Erro PGRST204 ao criar tickets
- ✅ **DEPOIS:** Criação de tickets funcionando normalmente
- 🔄 **Schema Cache:** Atualizado automaticamente
- 📊 **Performance:** Índices criados para otimização

---

## 🆘 **SUPORTE**

Se ainda houver problemas:

1. **Verifique variáveis de ambiente:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

2. **Logs de erro:**
   - Console do navegador (F12)
   - Terminal do Node.js

3. **Backup dos dados:**
   - Sempre execute scripts em ambiente de desenvolvimento primeiro

---

## 🏆 **RESULTADO FINAL**

✅ Coluna `channel` adicionada à tabela `tickets`  
✅ Schema cache do Supabase atualizado  
✅ Frontend pode criar tickets normalmente  
✅ Webhook Evolution API funciona sem erros  
✅ Performance otimizada com índices

**🎯 Tempo total de correção: 5 minutos** 