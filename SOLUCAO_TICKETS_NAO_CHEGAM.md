# 🔍 SOLUÇÃO: TICKETS REAIS NÃO CHEGAM NO CRM

## 📋 PROBLEMA IDENTIFICADO

O usuário relatou que **"não está chegando os tickets reais no crm"**. Após análise completa, identifiquei que o problema está relacionado aos **filtros por departamento** do sistema.

## 🎯 DIAGNÓSTICO COMPLETO

### **1. Sistema de Webhook Configurado ✅**
- URL WebSocket corrigida: `https://websocket.bkcrm.devsible.com.br/`
- Processador Evolution API funcional
- Criação automática de tickets implementada

### **2. Problema Identificado: FILTROS DE DEPARTAMENTO ❌**

O sistema `useTicketsDB` possui filtros rigorosos que podem estar **bloqueando a visualização** dos tickets criados pelo webhook:

```typescript
// FILTROS APLICADOS:
if (currentUser?.role === 'customer') {
  // Customers só veem seus próprios tickets
  query = query.eq('customer_id', user.id);
} else if (hasGlobalAccess) {
  // Diretores, CEOs e Administradores veem todos os tickets
} else if (currentUser?.role === 'agent' && userDepartmentId) {
  // Agents só veem tickets do seu departamento
  query = query.eq('department_id', userDepartmentId);
} else if (currentUser?.role === 'admin' && userDepartmentId) {
  // Admins só veem tickets do seu departamento
  query = query.eq('department_id', userDepartmentId);
}
```

**PROBLEMA:** Se os tickets criados pelo webhook não tiverem `department_id` ou tiverem um `department_id` diferente do usuário, eles **não aparecerão** na interface.

## ✅ SOLUÇÕES DISPONÍVEIS

### **SOLUÇÃO 1: DIAGNÓSTICO RÁPIDO (Console do Navegador)**

1. **Abrir Console do Navegador** (F12 → Console)
2. **Executar diagnóstico completo:**
   ```javascript
   diagnosticoTickets()
   ```

3. **Se encontrar tickets sem department_id, corrigir automaticamente:**
   ```javascript
   corrigirDepartmentTickets()
   ```

4. **Recarregar a página** para ver os tickets

### **SOLUÇÃO 2: SCRIPT STANDALONE**

Execute o script `diagnostico-tickets-console.js`:

```javascript
// Cole este código no console do navegador:
diagnosticoRapido()
```

### **SOLUÇÃO 3: VERIFICAR WEBHOOK MANUALMENTE**

1. **Testar webhook:**
   ```bash
   curl -X GET https://websocket.bkcrm.devsible.com.br/webhook/health
   ```

2. **Iniciar webhook local (se necessário):**
   ```bash
   node webhook-evolution-websocket.js
   ```

### **SOLUÇÃO 4: CORRIGIR WEBHOOK PARA DEFINIR DEPARTMENT_ID**

Editar `webhook-evolution-websocket.js` para **sempre definir um department_id** padrão:

```javascript
// Dentro da função findOrCreateTicket, adicionar:
const defaultDepartmentId = await getDefaultDepartmentId();

const ticketData = {
  // ... outros campos
  department_id: defaultDepartmentId,  // ⭐ ADICIONAR ESTA LINHA
  // ... resto do código
};
```

### **SOLUÇÃO 5: CONFIGURAR USUÁRIO COM ACESSO GLOBAL**

Alterar o departamento do usuário atual para um com **acesso global**:

1. Acessar tabela `profiles` no Supabase
2. Alterar campo `department` para: `"administrador"`, `"diretor"` ou `"ceo"`
3. Recarregar a página

## 🧪 TESTES RECOMENDADOS

### **1. Teste Completo no Console:**
```javascript
// Executar no console do navegador (F12)
diagnosticoTickets()
```

### **2. Verificar Tickets no Banco Diretamente:**
```sql
-- No painel do Supabase
SELECT id, title, channel, department_id, created_at 
FROM tickets 
WHERE channel = 'whatsapp' 
OR metadata->>'created_from_whatsapp' = 'true'
ORDER BY created_at DESC
LIMIT 10;
```

### **3. Teste de Webhook em Tempo Real:**
```javascript
// No console do navegador
testarWebhookDireto()
```

## 🎯 PRÓXIMOS PASSOS

1. **IMEDIATO:** Execute `diagnosticoTickets()` no console
2. **SE ENCONTRAR TICKETS:** Execute `corrigirDepartmentTickets()`
3. **SE NÃO HOUVER TICKETS:** Verificar se webhook está rodando
4. **RECARREGAR:** A página após correções

## 📊 MONITORAMENTO

### **Logs Importantes:**
- Console do navegador mostrará filtros aplicados
- Webhook logs mostrarão criação de tickets
- Supabase logs mostrarão queries de tickets

### **Verificações Periódicas:**
- Webhook status: `https://websocket.bkcrm.devsible.com.br/webhook/health`
- Evolution API status: Verificar instâncias conectadas
- Department_id dos novos tickets

## 💡 PREVENÇÃO FUTURA

1. **Configurar webhook** para sempre definir `department_id`
2. **Criar departamento padrão** para tickets automáticos
3. **Monitorar logs** do webhook periodicamente
4. **Testar periodicamente** com `diagnosticoTickets()`

---

## 🔧 ARQUIVOS MODIFICADOS

- ✅ `src/utils/dev-helpers.ts` - Funções de diagnóstico adicionadas
- ✅ `diagnostico-tickets-console.js` - Script standalone criado
- ✅ URLs WebSocket corrigidas para produção

## 📞 SUPORTE

Se o problema persistir após essas soluções:

1. Execute `diagnosticoTickets()` e envie o resultado
2. Verifique logs do webhook em tempo real
3. Confirme se mensagens WhatsApp estão chegando na Evolution API

**Status:** ✅ **SOLUÇÕES IMPLEMENTADAS E PRONTAS PARA USO** 