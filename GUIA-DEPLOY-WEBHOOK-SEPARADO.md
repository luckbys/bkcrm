# 🚀 Guia de Deploy - Webhook BKCRM (Serviço Separado)

## 📋 Visão Geral

Este guia explica como fazer deploy do **webhook do BKCRM** como um **serviço separado** no EasyPanel, independente do frontend que já está rodando.

## 🏗️ Arquitetura Final

```
🌐 Frontend: https://bkcrm.devsible.com.br (já deployado)
🔗 Webhook:  https://webhook.bkcrm.devsible.com.br (novo serviço)
```

## 📁 Arquivos Necessários

✅ **Criados automaticamente:**
- `webhook.dockerfile` - Dockerfile específico para o webhook
- `webhook-easypanel.json` - Configuração do EasyPanel
- `webhook-evolution-websocket.cjs` - Código do webhook (já existe)

## 🔧 Passo a Passo no EasyPanel

### 1️⃣ Criar Novo Serviço

1. Acesse seu **EasyPanel Dashboard**
2. Clique em **"+ New Service"**
3. Selecione **"Git Repository"**

### 2️⃣ Configurar Repositório

```
Repository URL: https://github.com/luckbys/bkcrm.git
Branch: main
```

### 3️⃣ Configurar Build

```
Build Type: Dockerfile
Dockerfile Path: webhook.dockerfile
Build Context: . (root)
```

### 4️⃣ Configurar Rede

```
Internal Port: 4000
Service Name: bkcrm-webhook
```

### 5️⃣ Configurar Domínio

```
Domain: webhook.bkcrm.devsible.com.br
Enable SSL: ✅ Sim
Force HTTPS: ✅ Sim
```

### 6️⃣ Configurar Variáveis de Ambiente

**⚠️ OBRIGATÓRIAS:**

```bash
NODE_ENV=production
PORT=4000
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_KEY=sua_service_key
EVOLUTION_API_URL=sua_evolution_url
EVOLUTION_API_KEY=sua_evolution_key
CORS_ORIGINS=https://bkcrm.devsible.com.br,https://webhook.bkcrm.devsible.com.br
```

### 7️⃣ Configurar Health Check

```
Health Check Path: /webhook/health
Health Check Port: 4000
Initial Delay: 30s
Period: 30s
Timeout: 10s
```

### 8️⃣ Configurar Recursos

```
Memory: 512Mi
CPU: 0.5 cores
Replicas: 1
```

## 🔍 Verificação de Deploy

### ✅ Testes Básicos

1. **Health Check:**
```bash
curl https://webhook.bkcrm.devsible.com.br/webhook/health
# Resposta esperada: {"status":"healthy","timestamp":"..."}
```

2. **WebSocket Stats:**
```bash
curl https://webhook.bkcrm.devsible.com.br/webhook/ws-stats
# Resposta esperada: {"connections":0,"rooms":{},"uptime":"..."}
```

### 🔗 Integração com Frontend

O frontend já está configurado para conectar automaticamente com o webhook em produção. Após o deploy, o sistema deve funcionar completamente:

```
Frontend → Webhook → Evolution API → WhatsApp
```

## 📊 Logs e Monitoramento

### Verificar Logs no EasyPanel

1. Acesse **Services > bkcrm-webhook**
2. Clique na aba **"Logs"**
3. Procure por estas mensagens:

```
✅ 🚀 Servidor Webhook Evolution + WebSocket rodando na porta 4000
✅ 📋 Funcionalidades carregadas
✅ 🔗 WebSocket Events configurados
✅ ✅ Sistema WebSocket ativo
```

### Logs de Funcionamento

**Mensagens WhatsApp recebidas:**
```
📥 [timestamp] POST /webhook/evolution
🔔 Webhook Evolution API chamado
📊 Dados recebidos: {...}
📨 Processando mensagem de +5511999999999
```

**WebSocket funcionando:**
```
🔗 Cliente conectado: socket_id
📝 Cliente entrou no ticket: ticket_123
📨 Nova mensagem enviada via WebSocket
```

## ⚠️ Troubleshooting

### Problema: "Service Unhealthy"

**Solução:**
1. Verificar se as variáveis de ambiente estão corretas
2. Confirmar se o health check path está em `/webhook/health`
3. Verificar logs para erros de conexão Supabase

### Problema: "Cannot connect to database"

**Solução:**
1. Verificar `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`
2. Confirmar se o IP do EasyPanel está liberado no Supabase
3. Testar conexão nos logs

### Problema: "CORS Error"

**Solução:**
1. Verificar se `CORS_ORIGINS` inclui o domínio do frontend
2. Confirmar se ambos domínios usam HTTPS
3. Adicionar `OPTIONS` method se necessário

## 🎯 Resultado Final

Após o deploy bem-sucedido:

✅ **Frontend:** `https://bkcrm.devsible.com.br` (já funcionando)
✅ **Webhook:** `https://webhook.bkcrm.devsible.com.br` (novo)
✅ **Integração:** Frontend conecta automaticamente com webhook
✅ **WhatsApp:** Mensagens são processadas automaticamente
✅ **WebSocket:** Atualizações em tempo real funcionando

## 📞 Suporte

Se houver problemas durante o deploy:

1. **Verificar logs** no EasyPanel
2. **Testar health check** manualmente
3. **Confirmar variáveis** de ambiente
4. **Verificar domínio** e SSL

---

**🎉 Parabéns!** Seu webhook BKCRM estará rodando como serviço independente, processando mensagens WhatsApp automaticamente! 