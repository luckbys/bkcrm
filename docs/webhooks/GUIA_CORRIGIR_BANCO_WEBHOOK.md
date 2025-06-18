# 🔧 Guia: Corrigir Banco de Dados para Webhook

## 📋 **PROBLEMAS IDENTIFICADOS**

1. ❌ **UUID inválido:** `"dept-geral"` não é um UUID válido
2. ❌ **Coluna ausente:** `sender_type` não existe na tabela `messages`

## 🎯 **SOLUÇÕES IMPLEMENTADAS**

### **1. Correções no Webhook:**
- ✅ Busca departamento por UUID válido
- ✅ Cria departamento automaticamente se não existir
- ✅ Usa campos corretos da tabela (subject, status, priority)
- ✅ Adiciona sender_type e message_type nas mensagens

### **2. Script SQL de Correção:**
- ✅ `CORRIGIR_SCHEMA_MESSAGES.sql` criado

## 🚀 **PASSOS PARA CORRIGIR**

### **PASSO 1: Executar Script SQL**

1. **Acesse o Supabase:**
   - Vá para: https://supabase.com/dashboard
   - Projeto: ajlgjjjvuglwgfnyqqvb

2. **Abra o SQL Editor:**
   - Menu lateral → SQL Editor
   - Clique em "New query"

3. **Execute o script:**
   - Copie todo o conteúdo de `CORRIGIR_SCHEMA_MESSAGES.sql`
   - Cole no editor
   - Clique em "Run"

### **PASSO 2: Verificar Correções**

Após executar o script, você deve ver:

```
✅ Coluna sender_type adicionada com sucesso
✅ Departamento 'Geral' criado
✅ Tickets com department_id inválido corrigidos
✅ Teste de inserção realizado com sucesso!
```

### **PASSO 3: Testar Webhook Corrigido**

1. **Reiniciar webhook local:**
   ```bash
   # Parar webhook atual (Ctrl+C)
   node webhook-evolution-complete.js
   ```

2. **Enviar mensagem de teste:**
   - WhatsApp para: **5512981022013**
   - Mensagem: "Teste após correção"

3. **Verificar logs:**
   ```
   ✅ Departamento encontrado/criado: [UUID]
   ✅ Ticket criado com sucesso: [UUID]
   ✅ Mensagem salva com sucesso: [UUID]
   ```

## 🔍 **VERIFICAÇÃO DE SUCESSO**

### **Logs Esperados:**
```
📥 POST /webhook/evolution/messages-upsert
📊 Dados recebidos: { ... }
📨 Processando mensagem: { ... }
✅ Departamento criado: [UUID válido]
🎫 Criando ticket real: { ... }
✅ Ticket criado com sucesso: [UUID válido]
💾 Salvando mensagem real no banco: { ... }
✅ Mensagem salva com sucesso: [UUID válido]
✅ Mensagem processada com sucesso
```

### **No Frontend:**
- ✅ Ticket aparece na lista
- ✅ Mensagem visível no chat
- ✅ Dados do cliente corretos

## 🚨 **SOLUÇÃO DE PROBLEMAS**

### **Se ainda der erro de UUID:**
```sql
-- Verificar departamentos existentes
SELECT id, name FROM departments;

-- Criar departamento manualmente se necessário
INSERT INTO departments (name, description) 
VALUES ('Geral', 'Departamento padrão');
```

### **Se ainda der erro de coluna:**
```sql
-- Verificar estrutura da tabela messages
\d messages;

-- Adicionar coluna manualmente se necessário
ALTER TABLE messages ADD COLUMN sender_type VARCHAR(50) DEFAULT 'customer';
```

## 📞 **TESTE FINAL**

Após todas as correções:

1. **Envie mensagem WhatsApp para:** 5512981022013
2. **Verifique no CRM:** Ticket deve aparecer automaticamente
3. **Logs devem mostrar:** Sucesso em todas as etapas

---

**🎯 RESULTADO:** Sistema funcionando 100% - mensagens chegam, tickets são criados, dados salvos corretamente! 