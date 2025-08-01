# 🔗 Configuração de Webhook - Evolution API

## **Visão Geral**

O sistema de webhook permite que o BKCRM receba eventos do WhatsApp automaticamente através da Evolution API, possibilitando:

- ✅ **Criação automática de tickets** quando mensagens chegam
- ✅ **Roteamento inteligente** para departamentos corretos  
- ✅ **Sincronização em tempo real** de status de mensagens
- ✅ **Notificações instantâneas** para atendentes

---

## **🎯 Como Funciona**

**Fluxo:**
1. **Mensagem chega** no WhatsApp da empresa
2. **Evolution API detecta** o evento
3. **Webhook é disparado** para URL configurada
4. **Backend BKCRM processa** e cria ticket automaticamente
5. **Frontend atualiza** em tempo real

---

## **⚙️ Configuração no Sistema**

### **1. Acessar Configuração**
1. Vá em **Admin → Departamentos**
2. Selecione o departamento desejado
3. Na instância WhatsApp, clique em **"Webhook"**

### **2. Configurar URL**
- **URL Sugerida:** `https://seu-dominio.com/api/webhooks/evolution`
- **Eventos:** Mensagens, Status de Conexão, Confirmações
- **Status:** Ativo/Inativo

### **3. Testar Configuração**
- Use o botão **"Testar"** para verificar conectividade
- Envie uma mensagem de teste para validar

---

## **🔧 Configuração Técnica**

### **Eventos Configurados**
```json
{
  "events": [
    "MESSAGES_UPSERT",    // Mensagens recebidas/enviadas
    "MESSAGES_UPDATE",    // Atualizações de status
    "CONNECTION_UPDATE",  // Status de conexão
    "SEND_MESSAGE"        // Confirmação de envio
  ]
}
```

### **Payload de Exemplo**
```json
{
  "event": "MESSAGES_UPSERT",
  "instance": "financeiro-principal",
  "data": {
    "key": {
      "remoteJid": "5511999887766@s.whatsapp.net",
      "fromMe": false,
      "id": "msg-id-123"
    },
    "message": {
      "conversation": "Olá, preciso de ajuda com minha conta"
    },
    "messageTimestamp": 1640995200,
    "pushName": "João Silva"
  }
}
```

---

## **🌐 Configuração do Backend**

### **Endpoint Necessário**
```typescript
// /api/webhooks/evolution
app.post('/api/webhooks/evolution', async (req, res) => {
  try {
    const { event, instance, data } = req.body;
    
    // Filtrar apenas mensagens recebidas
    if (event === 'MESSAGES_UPSERT' && !data.key.fromMe) {
      await ticketRoutingService.processIncomingMessage({
        instanceName: instance,
        senderPhone: data.key.remoteJid.replace('@s.whatsapp.net', ''),
        message: data.message.conversation || '[Mídia]',
        senderName: data.pushName || 'Cliente',
        messageId: data.key.id,
        timestamp: data.messageTimestamp
      });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});
```

---

## **🔒 Segurança**

### **Recomendações**
- ✅ Use **HTTPS** sempre (obrigatório em produção)
- ✅ Valide **IP de origem** da Evolution API
- ✅ Implemente **rate limiting** no endpoint
- ✅ Use **autenticação** por token se necessário
- ✅ **Logs detalhados** para auditoria

### **URLs Válidas**
```bash
✅ https://meucrm.com/api/webhooks/evolution
✅ https://api.empresa.com.br/webhooks/whatsapp
❌ http://localhost:3000/webhook (não funciona em produção)
❌ https://meusite.com/ (sem path específico)
```

---

## **🧪 Testes**

### **1. Teste Manual**
```bash
# Simular webhook da Evolution API
curl -X POST https://seu-dominio.com/api/webhooks/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "MESSAGES_UPSERT",
    "instance": "teste-instancia",
    "data": {
      "key": {
        "remoteJid": "5511999887766@s.whatsapp.net",
        "fromMe": false,
        "id": "test-msg-123"
      },
      "message": {
        "conversation": "Mensagem de teste"
      },
      "messageTimestamp": 1640995200,
      "pushName": "Teste Cliente"
    }
  }'
```

### **2. Teste via Sistema**
```javascript
// Console do navegador
testWebhookIntegration('financeiro-principal', '11999887766', 'Teste de integração');
```

---

## **📊 Monitoramento**

### **Logs Importantes**
```bash
# Webhook recebido
🔗 Webhook recebido: MESSAGES_UPSERT para financeiro-principal

# Ticket criado automaticamente  
✅ Ticket #1234 criado automaticamente para +5511999887766

# Erro de processamento
❌ Erro ao processar webhook: URL não encontrada
```

---

## **🚨 Troubleshooting**

### **Problemas Comuns**

#### **1. Webhook não está sendo chamado**
```bash
# Verificar configuração na Evolution API
GET /webhook/find/nome-da-instancia

# Reconfigurar se necessário
PUT /webhook/set/nome-da-instancia
```

#### **2. Endpoint retorna erro 404**
- ✅ Verificar se a URL está correta
- ✅ Confirmar se o backend está rodando
- ✅ Testar endpoint manualmente

#### **3. Tickets não são criados**
- ✅ Verificar logs do `ticketRoutingService`
- ✅ Confirmar se departamento existe
- ✅ Validar formato do telefone

---

## **📋 Checklist de Implementação**

### **Frontend (✅ Implementado)**
- [x] Modal de configuração de webhook
- [x] Interface para inserir URL
- [x] Botão de teste de conectividade
- [x] Validação de URL
- [x] Feedback visual de status

### **Backend (🔄 Pendente)**
- [ ] Endpoint `/api/webhooks/evolution`
- [ ] Integração com `ticketRoutingService`
- [ ] Validação de segurança
- [ ] Logs de auditoria
- [ ] Rate limiting

### **Evolution API (🔄 Configurar)**
- [ ] Configurar webhook para cada instância
- [ ] Testar eventos MESSAGES_UPSERT
- [ ] Validar conectividade
- [ ] Monitorar logs

---

## **🎯 Próximos Passos**

1. **Implementar endpoint backend** `/api/webhooks/evolution`
2. **Configurar webhook** nas instâncias Evolution API
3. **Testar fluxo completo** de mensagem → ticket
4. **Monitorar** e ajustar conforme necessário
5. **Documentar** configurações específicas de produção

---

**Status:** ✅ Interface pronta, aguardando implementação do backend
