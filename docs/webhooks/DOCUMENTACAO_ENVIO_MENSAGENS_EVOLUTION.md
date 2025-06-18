# 📤 Sistema de Envio de Mensagens via Evolution API

## 🎯 Objetivo
Implementar envio bidirecional de mensagens WhatsApp através da Evolution API, permitindo que o CRM responda automaticamente aos clientes via WhatsApp.

## 📋 Análise da Documentação Evolution API

### Endpoint Principal
```
POST /message/sendText/{instance}
```

### Headers Necessários
```json
{
  "Content-Type": "application/json",
  "apikey": "<api-key>"
}
```

### Payload Estrutura
```json
{
  "number": "5511999999999",
  "options": {
    "delay": 1000,
    "presence": "composing",
    "linkPreview": true,
    "quoted": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": true,
        "id": "MESSAGE_ID",
        "participant": "participant_id"
      },
      "message": {
        "conversation": "Mensagem original"
      }
    }
  },
  "textMessage": {
    "text": "Sua mensagem aqui"
  }
}
```

### Resposta Esperada
```json
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": true,
    "id": "BAE594145F4C59B4"
  },
  "message": {
    "extendedTextMessage": {
      "text": "Sua mensagem aqui"
    }
  },
  "messageTimestamp": "1717689097",
  "status": "PENDING"
}
```

## 🔧 Implementações Realizadas

### 1. **Webhook Server - Endpoints de Envio**

#### Arquivo: `webhook-evolution-complete.js`

**Configurações Evolution API:**
```javascript
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api.devsible.com.br';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_DEFAULT_INSTANCE = 'atendimento-ao-cliente-sac1';
```

**Endpoint: POST `/webhook/send-message`**
```javascript
// Payload esperado:
{
  "phone": "5511999999999",
  "text": "Mensagem a ser enviada",
  "instance": "atendimento-ao-cliente-sac1", // opcional
  "options": {
    "delay": 1000,
    "presence": "composing",
    "linkPreview": true
  }
}
```

**Endpoint: POST `/webhook/reply-message`**
```javascript
// Payload esperado:
{
  "phone": "5511999999999",
  "text": "Resposta à mensagem",
  "instance": "atendimento-ao-cliente-sac1",
  "quotedMessage": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "fromMe": false,
    "id": "MESSAGE_ID",
    "text": "Mensagem original"
  }
}
```

**Funções Implementadas:**
- ✅ `sendWhatsAppMessage()` - Envio de mensagem simples
- ✅ `sendReplyMessage()` - Resposta com citação
- ✅ `formatPhoneNumber()` - Formatação automática de telefones
- ✅ `checkInstanceStatus()` - Verificação de status da instância

### 2. **Frontend Hook - useEvolutionSender.ts**

**Métodos Disponíveis:**
```typescript
const {
  sendMessage,           // Enviar mensagem simples
  replyToMessage,        // Responder com citação
  sendMultipleMessages,  // Envio em lote
  checkServerHealth,     // Health check
  formatPhoneForSending, // Formatação de telefone
  validateMessageData,   // Validação de dados
  isLoading              // Estado de carregamento
} = useEvolutionSender();
```

**Exemplo de Uso:**
```typescript
const result = await sendMessage({
  phone: "5511999999999",
  text: "Olá! Como posso ajudá-lo?",
  instance: "atendimento-ao-cliente-sac1",
  options: {
    delay: 1000,
    presence: "composing"
  }
});
```

### 3. **Integração com TicketChat**

**useTicketChat.ts - Envio Automático:**
```typescript
// Dentro da função handleSendMessage()
if (!isInternal && currentTicket?.customerPhone && currentTicket?.isWhatsApp) {
  const evolutionResult = await sendEvolutionMessage({
    phone: currentTicket.customerPhone,
    text: message,
    instance: whatsappInstance || 'atendimento-ao-cliente-sac1'
  });
  
  if (evolutionResult.success) {
    // Atualizar status da mensagem para "delivered"
    // Mostrar toast de sucesso
  }
}
```

**Fluxo Completo:**
1. 🔄 Usuário digita mensagem no chat
2. 💾 Mensagem é salva no banco Supabase
3. 🖥️ Mensagem aparece na interface
4. 📱 Se for ticket WhatsApp e não for nota interna: envio automático via Evolution API
5. ✅ Status atualizado para "delivered" em caso de sucesso

## 🌐 Configuração de Produção

### Arquivo: `webhook.env`
```env
# Evolution API
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
EVOLUTION_DEFAULT_INSTANCE=atendimento-ao-cliente-sac1

# URLs
BASE_URL=https://bkcrm.devsible.com.br
WEBHOOK_PORT=4000
```

### URLs de Produção
- **Webhook Recebimento:** `https://bkcrm.devsible.com.br/webhook/evolution`
- **Envio de Mensagens:** `https://bkcrm.devsible.com.br/webhook/send-message`
- **Resposta com Citação:** `https://bkcrm.devsible.com.br/webhook/reply-message`
- **Health Check:** `https://bkcrm.devsible.com.br/webhook/health`

## 📊 Recursos Implementados

### ✅ **Funcionalidades Ativas**
1. **Envio Simples:** Mensagens de texto via Evolution API
2. **Resposta com Citação:** Reply a mensagens específicas
3. **Formatação Automática:** Telefones brasileiros (+55)
4. **Validação:** Dados de entrada e telefones
5. **Health Check:** Verificação de servidor e instâncias
6. **Toast Notifications:** Feedback visual para usuário
7. **Status de Entrega:** Atualização automática de status
8. **Logs Detalhados:** Monitoramento completo
9. **Fallback Gracioso:** Continua funcionando mesmo com falhas na Evolution API
10. **Detecção WhatsApp:** Envio apenas para tickets WhatsApp

### 🎛️ **Configurações Avançadas**
- **Delay Configurável:** Tempo entre envios
- **Presence Status:** "digitando", "gravando", etc.
- **Link Preview:** Habilitado por padrão
- **Multiple Instances:** Suporte a múltiplas instâncias Evolution
- **Error Handling:** Tratamento robusto de erros
- **Retry Logic:** (implementável conforme necessidade)

## 🧪 **Testes e Debug**

### Comandos de Teste no Console:
```javascript
// Teste de envio simples
await sendWhatsAppMessage({
  phone: "5511999999999",
  text: "Mensagem de teste",
  instance: "atendimento-ao-cliente-sac1"
});

// Verificar status do servidor
await checkServerHealth();

// Validar dados de mensagem
validateMessageData({
  phone: "11999999999",
  text: "Teste"
});
```

### Logs de Monitoramento:
```
📤 [SEND] Solicitação de envio de mensagem: { phone, text, instance }
📤 Enviando mensagem via Evolution API: { instance, phone, text }
✅ Mensagem enviada com sucesso: { messageId, status, timestamp }
📱 Enviando mensagem via WhatsApp: { phone, message, instance }
✅ Mensagem enviada via WhatsApp: messageId
```

## 🚀 **Performance e Escalabilidade**

### Otimizações Implementadas:
- ⚡ **Timeout:** 30 segundos para requisições
- 🔄 **Async/Await:** Operações não bloqueantes
- 📝 **Validação Prévia:** Evita requisições desnecessárias
- 🎯 **Conditional Sending:** Envia apenas quando necessário
- 💾 **Local First:** Salva local antes de enviar remotamente

### Limites e Considerações:
- **Rate Limiting:** Evolution API pode ter limites
- **Message Size:** Máximo 4096 caracteres por mensagem
- **Instance Health:** Verificação automática de conexão
- **Error Recovery:** Falhas não interrompem o fluxo principal

## 📈 **Próximas Melhorias**

### 🔮 **Funcionalidades Futuras**
1. **Envio de Mídia:** Imagens, documentos, áudios
2. **Templates WhatsApp:** Mensagens pré-aprovadas
3. **Mensagens Agendadas:** Envio programado
4. **Bulk Messaging:** Envio em massa
5. **Delivery Reports:** Relatórios de entrega
6. **Read Receipts:** Confirmação de leitura
7. **Auto-Responder:** Respostas automáticas inteligentes
8. **Message Queue:** Fila de envio com retry automático

### 🔧 **Melhorias Técnicas**
1. **WebSocket Integration:** Real-time status updates
2. **Redis Queue:** Sistema de fila robusto
3. **Metrics Dashboard:** Monitoramento em tempo real
4. **A/B Testing:** Teste de diferentes abordagens
5. **Multi-Language:** Suporte a múltiplos idiomas

## ✅ **Status Atual**
- 🟢 **Recebimento:** 100% funcional
- 🟢 **Envio:** 100% implementado e testado
- 🟢 **Integração Frontend:** Completa
- 🟢 **Configuração Produção:** Ativa
- 🟢 **Documentação:** Completa

Sistema pronto para uso em produção com monitoramento completo e fallbacks graceriosos! 