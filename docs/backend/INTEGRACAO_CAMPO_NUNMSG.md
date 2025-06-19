# 📱 Integração do Campo `nunmsg` para Números WhatsApp

## 🎯 **Objetivo**
O campo `nunmsg` foi criado na tabela `tickets` para armazenar especificamente o número de telefone do cliente que enviou mensagem via WhatsApp, facilitando a resposta automática no mesmo número.

## 📋 **Schema da Tabela**
```sql
CREATE TABLE public.tickets (
  -- ... outros campos ...
  nunmsg character varying null,
  -- ... outros campos ...
);
```

## 🔧 **Implementações Realizadas**

### 1. **Webhook Evolution API** 
📁 `backend/webhooks/webhook-evolution-complete-corrigido.js`

#### Função `findOrCreateTicket()` Atualizada:
```javascript
const ticketData = {
  // ... outros campos ...
  nunmsg: phoneFormatted, // 📱 CAMPO PRINCIPAL PARA NÚMERO DA MENSAGEM
  // ... campos de compatibilidade mantidos ...
};
```

**Benefícios:**
- ✅ Telefone salvo diretamente no campo dedicado
- ✅ Acesso rápido sem necessidade de buscar nos metadados
- ✅ Compatibilidade mantida com campos existentes

### 2. **Frontend - Hook useTicketChat.ts**
📁 `src/hooks/useTicketChat.ts`

#### Função `extractClientInfo()` Aprimorada:
```typescript
// 📱 PRIORIZAR CAMPO NUNMSG PARA EXTRAÇÃO DE TELEFONE
if (ticket.nunmsg) {
  // Usar campo nunmsg como fonte principal
  clientPhoneRaw = ticket.nunmsg;
  clientPhoneFormatted = ticket.nunmsg;
  clientPhone = ticket.nunmsg;
  canReply = true; // Se tem nunmsg, pode responder
  
  console.log('✅ [EXTRAÇÃO] Telefone extraído do campo nunmsg:', {
    nunmsg: ticket.nunmsg,
    canReply: true
  });
}
```

### 3. **Hook useEvolutionSender.ts**
📁 `src/hooks/useEvolutionSender.ts`

#### Nova Função `extractPhoneFromTicket()`:
```typescript
const extractPhoneFromTicket = (ticket: any): string | null => {
  // 🎯 PRIORIDADE 1: Campo nunmsg (novo campo específico)
  if (ticket.nunmsg) {
    console.log('✅ [EXTRAÇÃO] Telefone encontrado no campo nunmsg:', ticket.nunmsg);
    return ticket.nunmsg;
  }
  
  // 🎯 PRIORIDADES 2-5: Fallbacks para compatibilidade
  // metadata.whatsapp_phone, metadata.client_phone, etc.
};
```

## 🧪 **Testes Implementados**

### 1. **Script SQL de Teste**
📁 `backend/database/TESTE_CAMPO_NUNMSG.sql`

**Como usar:**
```sql
-- Execute no SQL Editor do Supabase
-- Verifica se campo existe, cria ticket de teste, valida funcionamento
```

### 2. **Script JavaScript de Teste**
📁 `src/utils/test-nunmsg-integration.ts`

**Funções disponíveis no console:**
```javascript
// Testar extração de telefone com diferentes cenários
testPhoneExtraction()

// Criar ticket real com nunmsg no banco
await testCreateTicketWithNunmsg()

// Limpar tickets de teste
await cleanupTestTickets()
```

## 🚀 **Fluxo Completo de Funcionamento**

### 1. **Mensagem WhatsApp Chega**
```
Cliente envia mensagem → Evolution API → Webhook
```

### 2. **Webhook Processa**
```javascript
// Extrair telefone
const phone = extractPhoneFromJid(messageData.key.remoteJid);

// Criar/atualizar ticket
const ticketData = {
  nunmsg: phoneFormatted, // 📱 SALVAR NO CAMPO NUNMSG
  // ... outros dados
};
```

### 3. **Frontend Extrai Telefone**
```typescript
// Prioridade para campo nunmsg
const phone = ticket.nunmsg || fallbackSources...
```

### 4. **Resposta Automática**
```typescript
// Usar telefone extraído para responder
await sendMessage({
  phone: extractedPhone,
  text: responseText
});
```

## ✅ **Vantagens da Implementação**

### **Performance**
- 🚀 Acesso direto ao telefone sem buscar nos metadados
- 🚀 Consultas SQL mais eficientes
- 🚀 Menos processamento de JSON

### **Confiabilidade**
- 🎯 Campo dedicado reduz ambiguidade
- 🎯 Prioridade clara na extração
- 🎯 Fallbacks para compatibilidade

### **Manutenibilidade**
- 🔧 Estrutura mais organizada
- 🔧 Fácil identificação de tickets WhatsApp
- 🔧 Logs mais claros e específicos

## 🛠️ **Compatibilidade**

### **Tickets Existentes**
- ✅ Sistema funciona com tickets antigos (fallback)
- ✅ Campos `client_phone`, `customerPhone` mantidos
- ✅ Metadados preservados

### **Tickets Novos**
- ✅ Campo `nunmsg` sempre preenchido
- ✅ Resposta automática 100% funcional
- ✅ Identificação rápida de tickets WhatsApp

## 📊 **Monitoramento**

### **Logs do Webhook**
```
✅ Telefone vinculado automaticamente ao ticket no campo nunmsg: +5511999998888
```

### **Logs do Frontend**
```
✅ [EXTRAÇÃO] Telefone extraído do campo nunmsg: +5511999998888
```

### **Consulta SQL para Verificar**
```sql
SELECT 
  COUNT(*) as total_tickets,
  COUNT(nunmsg) as tickets_com_nunmsg,
  ROUND((COUNT(nunmsg)::float / COUNT(*)) * 100, 2) as percentual_com_nunmsg
FROM tickets;
```

## 🔍 **Troubleshooting**

### **Ticket sem nunmsg**
1. Verificar logs do webhook
2. Confirmar se mensagem veio via WhatsApp
3. Checar se campo está no schema da tabela

### **Telefone não extraído**
1. Executar `testPhoneExtraction()` no console
2. Verificar logs de extração
3. Confirmar prioridades de fallback

### **Resposta não enviada**
1. Usar `extractPhoneFromTicket()` do hook
2. Validar formato do telefone
3. Verificar conexão Evolution API

## 📝 **Próximos Passos**

1. **Migração de Dados** (opcional)
   - Atualizar tickets existentes com nunmsg baseado nos metadados

2. **Índices de Performance**
   - Criar índice em `nunmsg` para consultas rápidas

3. **Validações**
   - Adicionar constraint para formato de telefone

4. **Relatórios**
   - Dashboard de tickets WhatsApp usando campo `nunmsg`

---

## 🎉 **Status: IMPLEMENTADO E FUNCIONAL**

O campo `nunmsg` está completamente integrado e funcionando. Todos os novos tickets WhatsApp criados via webhook terão o número do cliente salvo neste campo, garantindo resposta automática eficiente e confiável. 