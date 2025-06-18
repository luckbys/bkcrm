# 📱 Integração Evolution API - WhatsApp Business

Esta documentação detalha como configurar e usar a integração completa da Evolution API com o CRM para envio e recebimento de mensagens WhatsApp.

## 🎯 Visão Geral

A integração permite:
- ✅ **Criar e gerenciar instâncias** do WhatsApp via Evolution API
- ✅ **Conectar números** através de QR Code
- ✅ **Enviar mensagens** diretamente do TicketChat
- ✅ **Receber mensagens** em tempo real via webhooks
- ✅ **Criação automática de tickets** para novas conversas
- ✅ **Status de conexão** em tempo real
- ✅ **Formatação automática** de números brasileiros

## ✅ **STATUS ATUAL DA INTEGRAÇÃO**

### **1. ✅ Webhook Configurado**
- **URL**: `https://press-n8n.jhkbgs.easypanel.host/webhook/res`
- **Eventos**: `MESSAGES_UPSERT`, `CONNECTION_UPDATE`, `QRCODE_UPDATED`, `SEND_MESSAGE`
- **Status**: Configurado corretamente na Evolution API

### **2. ✅ Processamento de Mensagens**
- **EvolutionWebhookProcessor**: Processa webhooks recebidos
- **TicketRoutingService**: Cria tickets automaticamente
- **WebhookResponseService**: Gerencia respostas N8N
- **EvolutionApiManager**: Gerencia instâncias e envio

### **3. ✅ Banco de Dados**
- **Tabela tickets**: Criação automática implementada
- **Tabela messages**: Armazenamento de conversas
- **Tabela evolution_instances**: Gerenciamento de instâncias
- **Constraints**: Resolvidos (anonymous_contact, status, priority)

### **4. ✅ Frontend**
- **TicketChat**: Integração WhatsApp implementada
- **WebhookResponses**: Hook para mensagens em tempo real
- **DepartmentEvolutionManager**: Gerenciamento completo

## 🧪 **COMO TESTAR A INTEGRAÇÃO**

### **Método 1: Teste Completo Automatizado**
```javascript
// No DevTools do navegador (F12)
testEvolutionIntegration()
```

Este comando testa:
1. Conexão com Evolution API
2. Status da instância
3. Webhook configurado
4. Simulação de mensagem
5. Criação de ticket

### **Método 2: Teste Individual**

**1. Testar Conexão:**
```javascript
testEvolutionConnection()
```

**2. Verificar Instâncias:**
```javascript
checkAllInstances()
```

**3. Simular Mensagem WhatsApp:**
```javascript
simulateIncomingWhatsAppMessage()
```

**4. Verificar Tickets Criados:**
```javascript
checkLatestTickets()
```

**5. Testar Endpoint Webhook:**
```javascript
testWebhookEndpoint()
```

### **Método 3: Teste Real com WhatsApp**

1. **Envie uma mensagem** para o número conectado na instância `atendimento-ao-cliente-suporte-n1`
2. **Verifique** se o ticket foi criado automaticamente em: `Gerenciamento de Tickets`
3. **Responda** pelo TicketChat para testar envio

## 🛠️ Configuração Inicial

### 1. Evolution API
Certifique-se de que você tem uma instância da Evolution API rodando. Configure as variáveis de ambiente:

```env
# .env.local
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
```

### 2. Webhook Global (Já Configurado)
O webhook global está configurado para receber em:
```
https://press-n8n.jhkbgs.easypanel.host/webhook/res
```

### 3. N8N Backend
O N8N processa os webhooks e comunica com o CRM através do endpoint global:
```javascript
window.receiveN8nWebhookResponse(payload)
```

## 🚀 Como Usar

### 1. Criando uma Instância WhatsApp

1. **Acesse o Gerenciador de Instâncias:**
   - Vá para a seção de administração
   - Abra "Instâncias WhatsApp"

2. **Criar Nova Instância:**
   ```
   Nome: minha-instancia
   Departamento: Atendimento
   ```

3. **Conectar via QR Code:**
   - Clique em "Gerar QR Code"
   - Escaneie com o WhatsApp
   - Aguarde confirmação

### 2. Configurando Webhook

1. **Acessar Configurações:**
   - Clique no ícone de configurações da instância
   - Abra "Configurar Webhook"

2. **Configurar URL:**
   ```
   URL: https://press-n8n.jhkbgs.easypanel.host/webhook/res
   Eventos: [MESSAGES_UPSERT, CONNECTION_UPDATE, QRCODE_UPDATED, SEND_MESSAGE]
   Enabled: ✅
   ```

3. **Salvar e Testar:**
   - Clique em "Salvar Configuração"
   - Use o botão "Testar Webhook"

### 3. Enviando Mensagens

1. **Pelo TicketChat:**
   - Abra qualquer ticket com telefone configurado
   - Digite a mensagem
   - Clique em "Enviar WhatsApp" (botão verde)

2. **Verificar Status:**
   - ✅ Status da instância conectada
   - 📱 Número formatado corretamente
   - 🚀 Mensagem enviada via Evolution API

### 4. Recebendo Mensagens

1. **Automático via Webhook:**
   - Cliente envia mensagem no WhatsApp
   - Webhook processa automaticamente
   - Ticket é criado ou atualizado
   - Notificação aparece no sistema

2. **Verificar Recebimento:**
   - Vá para "Gerenciamento de Tickets"
   - Tickets com tag "whatsapp" são automáticos
   - Abra o ticket para ver a conversa

## 🔧 Troubleshooting

### Problema: Webhook não funciona
```javascript
// Testar webhook
testWebhookFix()

// Verificar endpoint
testWebhookEndpoint()
```

### Problema: Instância não conecta
```javascript
// Verificar status
checkInstance('nome-da-instancia')

// Gerar novo QR Code
generateQRCode('nome-da-instancia')
```

### Problema: Mensagem não envia
```javascript
// Testar envio
testSendMessage('nome-da-instancia', '5511999998888', 'Teste')

// Verificar formatação
formatPhoneNumber('11999998888')
```

### Problema: Ticket não é criado
```javascript
// Simular criação
simulateIncomingWhatsAppMessage()

// Verificar últimos tickets
checkLatestTickets()
```

## 📊 Monitoramento

### Logs no Console
- 🔗 Conexões com Evolution API
- 📨 Webhooks recebidos
- 🎫 Tickets criados automaticamente
- 📱 Mensagens enviadas/recebidas
- ❌ Erros e soluções

### Métricas Disponíveis
- Total de instâncias ativas
- Mensagens enviadas/dia
- Tickets criados via WhatsApp
- Taxa de sucesso de entrega
- Tempo de resposta médio

## 🔒 Segurança

### Validações Implementadas
- ✅ Números WhatsApp brasileiros
- ✅ URLs de webhook válidas
- ✅ Eventos suportados pela API
- ✅ Autenticação via API Key
- ✅ Rate limiting (100ms entre requests)

### Boas Práticas
- Use HTTPS para webhooks
- Configure API Key forte
- Monitore logs regularmente
- Teste antes de usar em produção
- Mantenha backup das conversas

## 📝 Conclusão

A integração está **100% funcional** e pronta para uso em produção. 

**Para começar a usar:**
1. Execute `testEvolutionIntegration()` no console
2. Certifique-se de que todos os testes passam
3. Conecte uma instância via QR Code
4. Envie uma mensagem de teste
5. Verifique se o ticket foi criado

**Suporte:**
- Use os comandos de teste no console
- Verifique logs detalhados
- Consulte a documentação técnica
- Entre em contato se precisar de ajuda 