# 🚀 Checklist: O que falta para funcionar a chegada de tickets via webhook Evolution API

## ✅ **STATUS ATUAL**

### **1. ✅ Código Implementado**
- Servidor webhook completo (`webhook-evolution-complete.js`)
- Processamento de mensagens Evolution API
- Criação automática de tickets no banco
- Handlers para QR Code e status de conexão
- Integração com Supabase

### **2. ✅ Frontend Preparado**
- Hook `useWebhookResponses` para escutar mensagens
- Componente `TicketChat` com suporte WhatsApp
- Manager de instâncias Evolution
- Processadores de webhook já criados

---

## ❌ **O QUE FALTA FAZER**

### **1. 🔧 CONFIGURAR SERVIDOR WEBHOOK**

#### **1.1. Instalar Dependências**
```bash
npm install express body-parser cors @supabase/supabase-js dotenv
```

#### **1.2. Rodar Servidor Webhook**
```bash
# Usando o arquivo correto (ES Module)
node webhook-evolution-complete.js
```

#### **1.3. Configurar PM2 para Produção**
```bash
# Instalar PM2
npm install -g pm2

# Rodar com PM2
pm2 start webhook-evolution-complete.js --name "evolution-webhook"
pm2 save
pm2 startup
```

### **2. 🌐 CONFIGURAR EVOLUTION API**

#### **2.1. Configurar Webhook na Evolution API**
Para cada instância da Evolution API, configurar webhook:

```javascript
// URL do seu webhook
const WEBHOOK_URL = 'https://bkcrm.devsible.com.br/webhook/evolution';

// Configurar webhook para instância
await evolutionApiService.setInstanceWebhook('sua-instancia', {
  url: WEBHOOK_URL,
  events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
});
```

#### **2.2. Verificar URL do Webhook**
A Evolution API deve estar configurada para enviar webhooks para:
```
https://bkcrm.devsible.com.br/webhook/evolution
```

### **3. 🗄️ VERIFICAR BANCO DE DADOS**

#### **3.1. Verificar Tabela `evolution_instances`**
```sql
-- Verificar se existem instâncias ativas
SELECT instance_name, status, department_id 
FROM evolution_instances 
WHERE status = 'active';
```

#### **3.2. Verificar Departamentos**
```sql
-- Verificar se departamentos existem
SELECT id, name FROM departments;
```

#### **3.3. Verificar Constraints da Tabela Tickets**
```sql
-- Verificar se constraints foram corrigidas
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'tickets';
```

### **4. 🔗 CONFIGURAR PROXY NGINX**

#### **4.1. Adicionar Configuração Webhook no Nginx**
No arquivo `nginx.conf` ou configuração do site:

```nginx
# Proxy para webhook Evolution
location /webhook/ {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_read_timeout 86400;
}
```

#### **4.2. Reiniciar Nginx**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### **5. 🔧 VERIFICAR CONFIGURAÇÕES**

#### **5.1. Testar Connectivity**
```bash
# Testar se servidor webhook está rodando
curl https://bkcrm.devsible.com.br/health

# Testar endpoint do webhook
curl -X POST https://bkcrm.devsible.com.br/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{"test": "connection"}'
```

#### **5.2. Verificar Evolution API**
```javascript
// No console do navegador
testEvolutionConnection()
```

### **6. 🧪 CONFIGURAR INSTÂNCIAS EVOLUTION**

#### **6.1. Criar/Verificar Instâncias**
```javascript
// No DepartmentEvolutionManager
// 1. Criar nova instância
// 2. Conectar com QR Code
// 3. Verificar se status fica "connected"
```

#### **6.2. Configurar Webhook para Cada Instância**
```javascript
// Executar para cada instância ativa
const instances = await evolutionApiService.listInstances();
for (const instance of instances.data) {
  if (instance.state === 'open') {
    await evolutionApiService.setInstanceWebhook(instance.name, {
      url: 'https://bkcrm.devsible.com.br/webhook/evolution',
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED']
    });
  }
}
```

---

## 🧪 **COMO TESTAR**

### **Teste 1: Servidor Webhook**
```bash
curl https://bkcrm.devsible.com.br/health
```
**Esperado**: `{"status": "healthy", "service": "Evolution Webhook Integration"}`

### **Teste 2: Simular Webhook**
```bash
curl -X POST https://bkcrm.devsible.com.br/test \
  -H "Content-Type: application/json" \
  -d '{
    "simulate": true,
    "phone": "5511999999999",
    "message": "Teste de mensagem",
    "name": "Cliente Teste",
    "instance": "sua-instancia"
  }'
```

### **Teste 3: Mensagem Real WhatsApp**
1. Conectar instância Evolution via QR Code
2. Enviar mensagem para o número conectado
3. Verificar logs do servidor webhook
4. Verificar se ticket foi criado no CRM

### **Teste 4: Verificar No Frontend**
```javascript
// No console do navegador
// Verificar se mensagens chegam
useWebhookResponses.loadEvolutionMessages('ticket-id')
```

---

## 🔍 **DEBUGGING**

### **Logs para Monitorar**

#### **1. Logs do Servidor Webhook**
```bash
# Se usando PM2
pm2 logs evolution-webhook

# Se rodando diretamente
# Verificar output do console
```

#### **2. Logs da Evolution API**
- Verificar se webhooks estão sendo enviados
- Verificar se URL está correta
- Verificar se eventos estão configurados

#### **3. Logs do Supabase**
- Verificar se registros estão sendo inseridos na tabela `tickets`
- Verificar se mensagens estão sendo salvas na tabela `messages`

### **Comandos de Debug**

#### **Verificar Status Geral**
```javascript
// No console do navegador
checkEvolutionIntegration()
```

#### **Verificar Instâncias**
```javascript
// Listar instâncias e status
const instances = await evolutionApiService.listInstances();
console.table(instances.data.map(i => ({
  name: i.name,
  state: i.state,
  webhook: i.webhook?.url || 'Não configurado'
})));
```

#### **Verificar Webhooks Configurados**
```javascript
// Para cada instância
for (const instance of instances.data) {
  const webhook = await evolutionApiService.getInstanceWebhook(instance.name);
  console.log(`${instance.name}: ${webhook.webhook?.url || 'Sem webhook'}`);
}
```

---

## 📋 **ORDEM DE EXECUÇÃO**

1. ✅ **Instalar dependências e rodar servidor webhook**
2. ✅ **Configurar proxy Nginx**
3. ✅ **Verificar/corrigir banco de dados**
4. ✅ **Conectar instâncias Evolution API**
5. ✅ **Configurar webhooks nas instâncias**
6. ✅ **Testar com mensagem real**
7. ✅ **Verificar criação de tickets no CRM**

---

## ⚠️ **PROBLEMAS COMUNS**

### **Erro: "require is not defined"**
**Solução**: Usar `webhook-evolution-complete.js` (ES Module)

### **Erro: "Instância não encontrada"**
**Solução**: Verificar se instância existe no banco `evolution_instances`

### **Erro: "403 Forbidden" ou "404 Not Found"**
**Solução**: Configurar proxy Nginx corretamente

### **Erro: Webhook não recebe dados**
**Solução**: Verificar se Evolution API está enviando para URL correta

### **Erro: Ticket não é criado**
**Solução**: Verificar constraints da tabela tickets e logs do servidor

---

## 🎯 **RESULTADO ESPERADO**

Quando tudo estiver funcionando:

1. 📱 Mensagem chega no WhatsApp conectado à Evolution API
2. 🔔 Evolution API envia webhook para seu servidor
3. 🎫 Servidor cria ticket automaticamente no banco
4. 💬 Mensagem é salva na tabela de mensagens
5. 🖥️ CRM mostra novo ticket em tempo real
6. ✅ Agente pode responder pelo TicketChat

**O sistema deve funcionar completamente automatizado!** 