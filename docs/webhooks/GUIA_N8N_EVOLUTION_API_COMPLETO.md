
# 🔄 Guia Completo: n8n + Evolution API + BKCRM

## 🎯 Visão Geral da Integração

Este guia mostra como conectar **n8n** → **Evolution API** → **BKCRM** para automatizar mensagens WhatsApp.

```
📱 WhatsApp → 🤖 Evolution API → 🔄 n8n → 💻 BKCRM
                     ↓
               🗄️ Supabase
```

## 🔧 1. Configuração do Webhook BKCRM

### 📁 Estrutura de Arquivos
- `backend/webhooks/webhook-evolution-complete-corrigido.js` - Webhook principal
- `.env` - Configurações (use o guia anterior)

### 🚀 Executar o Webhook
```bash
# No diretório raiz do projeto
node backend/webhooks/webhook-evolution-complete-corrigido.js
```

**URLs ativas:**
- 🌐 `https://bkcrm.devsible.com.br/webhook/evolution`
- 🏥 `https://bkcrm.devsible.com.br/webhook/health`

## 🤖 2. Configuração do n8n

### 📋 Workflow n8n Básico

Crie um workflow com os seguintes nós:

#### 1️⃣ **Webhook Trigger** (Receber de Evolution API)
```json
{
  "node_type": "n8n-nodes-base.webhook",
  "settings": {
    "httpMethod": "POST",
    "path": "evolution-webhook",
    "responseCode": 200,
    "responseMode": "onReceived"
  }
}
```

#### 2️⃣ **Function Node** (Processar Mensagem)
```javascript
// Processar dados da Evolution API
const payload = $json.body;

// Extrair informações da mensagem
const messageData = payload.data;
const senderPhone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') || 'unknown';
const messageContent = messageData.message?.conversation || 
                      messageData.message?.extendedTextMessage?.text || 
                      '[Mídia]';

// Preparar dados para BKCRM
return {
  event: 'MESSAGES_UPSERT',
  instance: payload.instance,
  senderPhone,
  messageContent,
  timestamp: new Date().toISOString(),
  messageId: messageData.key?.id
};
```

#### 3️⃣ **HTTP Request** (Enviar para BKCRM)
```json
{
  "node_type": "n8n-nodes-base.httpRequest",
  "settings": {
    "method": "POST",
    "url": "https://bkcrm.devsible.com.br/webhook/evolution",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{{ $json }}"
  }
}
```

#### 4️⃣ **IF Node** (Verificar se precisa responder)
```javascript
// Condição para resposta automática
const message = $json.messageContent.toLowerCase();

// Palavras-chave para resposta automática
const keywords = ['oi', 'olá', 'hello', 'ajuda', 'atendimento'];

return keywords.some(keyword => message.includes(keyword));
```

#### 5️⃣ **HTTP Request** (Resposta Automática via Evolution API)
```json
{
  "node_type": "n8n-nodes-base.httpRequest",
  "settings": {
    "method": "POST",
    "url": "https://press-evolution-api.jhkbgs.easypanel.host/message/sendText/{{ $('Webhook').first().json.instance }}",
    "headers": {
      "Content-Type": "application/json",
      "apikey": "429683C4C977415CAAFCCE10F7D57E11"
    },
    "body": {
      "number": "{{ $('Function').first().json.senderPhone }}",
      "text": "Olá! Recebemos sua mensagem e logo você será atendido. 😊"
    }
  }
}
```

## 📱 3. Configuração da Evolution API

### 🔗 Configurar Webhook na Evolution API

```bash
curl -X POST "https://press-evolution-api.jhkbgs.easypanel.host/webhook/set/sua-instancia" \
  -H "Content-Type: application/json" \
  -H "apikey: 429683C4C977415CAAFCCE10F7D57E11" \
  -d '{
    "url": "https://sua-instancia-n8n.com/webhook/evolution-webhook",
    "enabled": true,
    "events": [
      "MESSAGES_UPSERT",
      "CONNECTION_UPDATE",
      "QRCODE_UPDATED"
    ]
  }'
```

### 🎯 Fluxo Completo

1. **Mensagem WhatsApp** → Evolution API
2. **Evolution API** → n8n (webhook)
3. **n8n** processa e envia → BKCRM
4. **BKCRM** salva no Supabase
5. **n8n** (opcional) → Resposta automática via Evolution API

## 🔄 4. Workflow n8n Avançado

### 📋 Template Completo n8n

```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "evolution-webhook",
        "responseCode": 200,
        "responseMode": "onReceived"
      },
      "type": "n8n-nodes-base.webhook",
      "position": [240, 300],
      "name": "Evolution Webhook"
    },
    {
      "parameters": {
        "functionCode": "const payload = $json.body;\nconst messageData = payload.data;\nconst senderPhone = messageData.key?.remoteJid?.replace('@s.whatsapp.net', '') || 'unknown';\nconst messageContent = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || '[Mídia]';\n\nreturn {\n  event: 'MESSAGES_UPSERT',\n  instance: payload.instance,\n  data: {\n    key: messageData.key,\n    message: messageData.message,\n    senderPhone,\n    messageContent,\n    timestamp: new Date().toISOString()\n  }\n};"
      },
      "type": "n8n-nodes-base.function",
      "position": [460, 300],
      "name": "Process Message"
    },
    {
      "parameters": {
        "url": "https://bkcrm.devsible.com.br/webhook/evolution",
        "options": {
          "headers": {
            "Content-Type": "application/json"
          }
        }
      },
      "type": "n8n-nodes-base.httpRequest",
      "position": [680, 300],
      "name": "Send to BKCRM"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.data.messageContent.toLowerCase() }}",
              "operation": "contains",
              "value2": "oi"
            }
          ]
        }
      },
      "type": "n8n-nodes-base.if",
      "position": [900, 300],
      "name": "Check Auto Reply"
    },
    {
      "parameters": {
        "url": "https://press-evolution-api.jhkbgs.easypanel.host/message/sendText/={{ $('Process Message').first().json.instance }}",
        "options": {
          "headers": {
            "Content-Type": "application/json",
            "apikey": "429683C4C977415CAAFCCE10F7D57E11"
          }
        },
        "jsonParameters": true,
        "bodyParametersJson": "{\n  \"number\": \"{{ $('Process Message').first().json.data.senderPhone }}\",\n  \"text\": \"Olá! Recebemos sua mensagem e logo você será atendido. 😊\\n\\nPara agilizar o atendimento, informe:\\n• Seu nome\\n• Como podemos ajudar\\n\\nObrigado!\"\n}"
      },
      "type": "n8n-nodes-base.httpRequest",
      "position": [1120, 200],
      "name": "Auto Reply"
    }
  ],
  "connections": {
    "Evolution Webhook": {
      "main": [
        [
          {
            "node": "Process Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Process Message": {
      "main": [
        [
          {
            "node": "Send to BKCRM",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Send to BKCRM": {
      "main": [
        [
          {
            "node": "Check Auto Reply",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Auto Reply": {
      "main": [
        [
          {
            "node": "Auto Reply",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 🔧 5. Funcionalidades Avançadas

### 🤖 Resposta Automática Inteligente

```javascript
// Function node para lógica de resposta
const message = $json.data.messageContent.toLowerCase();

// Horário comercial
const now = new Date();
const hour = now.getHours();
const isBusinessHour = hour >= 8 && hour <= 18;

// Palavras-chave categorizadas
const greetings = ['oi', 'olá', 'hello', 'bom dia', 'boa tarde'];
const help = ['ajuda', 'help', 'atendimento', 'suporte'];
const sales = ['preço', 'orçamento', 'vendas', 'comprar'];

let responseType = 'default';
let responseText = '';

if (greetings.some(word => message.includes(word))) {
  responseType = 'greeting';
  responseText = isBusinessHour ? 
    'Olá! Bem-vindo ao nosso atendimento. Como posso ajudar? 😊' :
    'Olá! Nosso horário de atendimento é das 8h às 18h. Deixe sua mensagem que responderemos em breve!';
    
} else if (help.some(word => message.includes(word))) {
  responseType = 'help';
  responseText = 'Estou aqui para ajudar! Em que posso auxiliar você hoje?';
  
} else if (sales.some(word => message.includes(word))) {
  responseType = 'sales';
  responseText = 'Ótimo! Vou conectar você com nossa equipe de vendas. Um momento, por favor! 💼';
}

return {
  shouldReply: responseType !== 'default',
  responseType,
  responseText,
  isBusinessHour,
  senderPhone: $json.data.senderPhone,
  instance: $json.instance
};
```

### 📊 Analytics e Monitoramento

```javascript
// Function node para analytics
const analytics = {
  timestamp: new Date().toISOString(),
  instance: $json.instance,
  senderPhone: $json.data.senderPhone,
  messageLength: $json.data.messageContent.length,
  messageType: $json.data.message.conversation ? 'text' : 'media',
  hasAutoReply: $json.shouldReply || false
};

// Enviar para webhook de analytics
return {
  ...analytics,
  webhookUrl: 'https://bkcrm.devsible.com.br/webhook/analytics'
};
```

## 🔍 6. Monitoramento e Debug

### 📊 Logs do Sistema

1. **BKCRM Webhook**: Console logs em tempo real
2. **n8n**: Executions tab
3. **Evolution API**: Logs via API

### 🛠️ Comandos de Teste

```bash
# Testar webhook BKCRM
curl -X GET https://bkcrm.devsible.com.br/webhook/health

# Testar n8n webhook (substitua pela sua URL)
curl -X POST https://sua-instancia-n8n.com/webhook/evolution-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "MESSAGES_UPSERT",
    "instance": "test",
    "data": {
      "key": {"id": "test123"},
      "message": {"conversation": "Teste de mensagem"}
    }
  }'
```

## ✅ 7. Checklist de Configuração

- [ ] Webhook BKCRM rodando na porta 4000
- [ ] Arquivo `.env` configurado corretamente
- [ ] n8n com workflow ativo
- [ ] Evolution API com webhook configurado
- [ ] Instância WhatsApp conectada
- [ ] Supabase funcionando

## 🚀 8. Próximos Passos

1. **Configure o workflow n8n** usando o template acima
2. **Teste com mensagem real** no WhatsApp
3. **Monitore os logs** em tempo real
4. **Ajuste as respostas automáticas** conforme necessário
5. **Configure analytics** para métricas

**🎉 Sistema pronto para automatizar seu atendimento WhatsApp!** 