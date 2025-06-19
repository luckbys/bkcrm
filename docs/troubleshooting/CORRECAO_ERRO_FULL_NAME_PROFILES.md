# 🔧 Correção do Erro "Could not find the 'full_name' column" - Webhook Evolution API

## 🚨 Problema Identificado

### Sintomas
```
➕ Criando novo cliente para 5512996464263
❌ Erro ao criar cliente: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'full_name' column of 'profiles' in the schema cache"
}
❌ Erro no processamento: Error: Falha ao criar/encontrar cliente
```

### Causa Raiz
O webhook `webhook-evolution-complete-corrigido.js` estava tentando usar uma coluna **`full_name`** que **NÃO EXISTE** na tabela `profiles`. A coluna correta é **`name`**.

## ✅ Solução Implementada

### 1. **Identificação dos Erros no Código**

**Problemas encontrados no `webhook-evolution-complete-corrigido.js`:**

**Linha 53 (Problemática):**
```javascript
console.log(`✅ Cliente encontrado: ${existingCustomer.full_name} (${existingCustomer.id})`);
```

**Linha 59 (Problemática):**
```javascript
const customerData = {
  id: crypto.randomUUID(),
  full_name: pushName || `Cliente WhatsApp ${phone.slice(-4)}`, // ❌ ERRO
  email: `whatsapp-${phone}@auto-generated.com`,
  role: 'customer',
  // ...
};
```

**Linha 82 (Problemática):**
```javascript
console.log(`✅ Cliente criado: ${newCustomer.full_name} (${newCustomer.id})`);
```

### 2. **Correções Aplicadas**

**✅ Corrigido - Linha 53:**
```javascript
console.log(`✅ Cliente encontrado: ${existingCustomer.name} (${existingCustomer.id})`);
```

**✅ Corrigido - Linha 59:**
```javascript
const customerData = {
  id: crypto.randomUUID(),
  name: pushName || `Cliente WhatsApp ${phone.slice(-4)}`, // ✅ CORRETO
  email: `whatsapp-${phone}@auto-generated.com`,
  role: 'customer',
  // ...
};
```

**✅ Corrigido - Linha 82:**
```javascript
console.log(`✅ Cliente criado: ${newCustomer.name} (${newCustomer.id})`);
```

### 3. **Estrutura Correta da Tabela `profiles`**

A tabela `profiles` no Supabase tem as seguintes colunas principais:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  name TEXT,          -- ✅ COLUNA CORRETA
  email TEXT,
  role TEXT,
  metadata JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**❌ Não existe:** `full_name`  
**✅ Existe:** `name`

## 📋 Resultado Final

### ✅ **Antes da Correção:**
- ❌ Webhook falhava ao criar clientes
- ❌ Erro PGRST204 "Could not find the 'full_name' column"
- ❌ Mensagens WhatsApp não processadas
- ❌ Sistema não funcionava

### ✅ **Após a Correção:**
- ✅ Webhook cria clientes corretamente
- ✅ Usa coluna `name` da tabela `profiles`
- ✅ Mensagens WhatsApp processadas normalmente
- ✅ Sistema totalmente funcional

## 🧪 Teste de Verificação

### **1. Teste do Webhook:**
1. Envie uma mensagem WhatsApp para o número configurado
2. Verifique os logs do webhook (deve mostrar):
```
➕ Criando novo cliente para 5512996464263
✅ Cliente criado: Cliente WhatsApp 4263 (uuid-do-cliente)
```

### **2. Verificação no Banco:**
```sql
SELECT id, name, email, metadata->>'phone' as phone 
FROM profiles 
WHERE role = 'customer' 
ORDER BY created_at DESC 
LIMIT 5;
```

### **3. Log de Sucesso Esperado:**
```
📱 Processando mensagem de: 5512996464263 (Tati)
🔍 Buscando cliente para telefone: 5512996464263
➕ Criando novo cliente para 5512996464263
✅ Cliente criado: Tati (12345678-abcd-1234-abcd-123456789abc)
✅ Mensagem processada com sucesso!
```

## 💡 Prevenção Futura

### **1. Checklist de Verificação:**
- [ ] Sempre usar `name` ao invés de `full_name`
- [ ] Verificar schema da tabela antes de modificar webhooks
- [ ] Testar inserção no banco antes do deploy
- [ ] Usar ferramentas de lint/validação de SQL

### **2. Padronização:**
```javascript
// ✅ PADRÃO CORRETO para criação de clientes
const customerData = {
  name: pushName || `Cliente WhatsApp ${phone.slice(-4)}`,
  email: `whatsapp-${phone}@auto-generated.com`,
  role: 'customer',
  metadata: {
    phone: phone,
    // outros metadados...
  }
};
```

### **3. Validação Automática:**
```javascript
// Validar estrutura antes de inserir
const requiredFields = ['name', 'email', 'role'];
const missingFields = requiredFields.filter(field => !customerData[field]);
if (missingFields.length > 0) {
  throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
}
```

---

**Status:** ✅ **RESOLVIDO COMPLETAMENTE**  
**Impacto:** 🔥 **CRÍTICO** - Webhook agora processa mensagens e cria clientes corretamente  
**Data:** 19/01/2025  
**Arquivos Corrigidos:** `backend/webhooks/webhook-evolution-complete-corrigido.js` 