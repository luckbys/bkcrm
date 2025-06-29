# 🚀 GUIA DE DEPLOY EASYPANEL V2.0
## Servidor Webhook + WebSocket Unificado

### 📋 RESUMO DA ATUALIZAÇÃO

**PROBLEMA RESOLVIDO:**
- ✅ **Evolution API erro 404** no endpoint `/connection-update`
- ✅ **Servidor duplo eliminado** - agora é um servidor único
- ✅ **Processamento completo** de mensagens WhatsApp
- ✅ **WebSocket em tempo real** integrado

**NOVA ARQUITETURA:**
```
┌─────────────────────────────────────────┐
│    SERVIDOR UNIFICADO (Porta 4000)     │
├─────────────────────────────────────────┤
│ 📥 Webhook Evolution API                │
│ 🔌 WebSocket Server                     │  
│ 💾 Processamento Supabase              │
│ 🏥 Health Check                        │
│ 📊 Estatísticas                        │
└─────────────────────────────────────────┘
```

---

## 🎯 PASSO A PASSO - DEPLOY EASYPANEL

### 1️⃣ **PREPARAR ARQUIVOS DE DEPLOY**

✅ **Arquivo já gerado:** `bkcrm-websocket-unified-v2.zip` (20.92 KB)

**Conteúdo do pacote:**
- `webhook-evolution-websocket.js` - Servidor unificado
- `package.json` - Dependências Node.js 
- `Dockerfile` - Container otimizado
- `webhook.env` - Variáveis de ambiente
- `package-lock.json` - Build rápido

### 2️⃣ **FAZER UPLOAD NO EASYPANEL**

1. **Acessar EasyPanel:** `https://easypanel.devsible.com.br`
2. **Criar nova aplicação:**
   - Nome: `bkcrm-websocket-unified`
   - Tipo: `Docker Application`
3. **Upload do ZIP:**
   - Fazer upload de: `bkcrm-websocket-unified-v2.zip`
   - EasyPanel irá extrair automaticamente

### 3️⃣ **CONFIGURAR VARIÁVEIS DE AMBIENTE**

No painel do EasyPanel, adicionar as seguintes **Environment Variables:**

```bash
# SERVIDOR
PORT=4000
NODE_ENV=production

# SUPABASE (CRÍTICO!)
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU

# EVOLUTION API  
EVOLUTION_API_URL=https://evochat.devsible.com.br/
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
```

### 4️⃣ **CONFIGURAR DOMÍNIO E PORTA**

**Configurações de rede:**
- **Domínio:** `ws.bkcrm.devsible.com.br`
- **Porta interna:** `4000`
- **HTTPS:** ✅ Habilitado
- **WebSocket:** ✅ Habilitado

**Configuração no EasyPanel:**
```json
{
  "domains": [
    {
      "host": "ws.bkcrm.devsible.com.br",
      "port": 4000,
      "https": true,
      "websocket": true
    }
  ]
}
```

### 5️⃣ **CONFIGURAR HEALTH CHECK**

**Health Check no EasyPanel:**
- **Command:** `curl -f http://localhost:4000/webhook/health`
- **Interval:** 30s
- **Timeout:** 10s  
- **Retries:** 3
- **Start Period:** 10s

### 6️⃣ **FAZER DEPLOY**

1. **Iniciar Build:** Clicar em "Deploy"
2. **Aguardar Build:** ~2-3 minutos
3. **Verificar Logs:** Procurar por:
   ```
   🚀 Servidor Webhook Evolution + WebSocket rodando na porta 4000
   ✅ Sistema WebSocket ativo - Atualizações em tempo real!
   ```

### 7️⃣ **VERIFICAR FUNCIONAMENTO**

**Testes essenciais:**

1. **Health Check:**
   ```bash
   curl https://ws.bkcrm.devsible.com.br/webhook/health
   # Resposta esperada: {"status": "healthy", ...}
   ```

2. **Endpoint que resolve erro 404:**
   ```bash
   curl -X POST https://ws.bkcrm.devsible.com.br/connection-update \
     -H "Content-Type: application/json" \
     -d '{"test": "connection update"}'
   # Resposta esperada: {"status": "received", ...}
   ```

3. **WebSocket Connection:**
   ```javascript
   // Teste no console do navegador
   const socket = io('https://ws.bkcrm.devsible.com.br');
   socket.on('connect', () => console.log('✅ WebSocket conectado!'));
   ```

---

## 🛠️ CONFIGURAÇÃO PÓS-DEPLOY

### 🔄 **ATUALIZAR EVOLUTION API**

**Reconfigura webhooks para usar novo servidor:**

```bash
# Script automático (execute localmente)
node fix-evolution-webhook-url.cjs
```

**Ou configurar manualmente:**
- **URL Webhook:** `https://ws.bkcrm.devsible.com.br/webhook/evolution`
- **Connection Update:** `https://ws.bkcrm.devsible.com.br/connection-update`

### 🔧 **ATUALIZAR FRONTEND**

**Arquivo:** `src/stores/chatStore.ts`
```javascript
// Alterar URL do WebSocket
const WEBSOCKET_URL = 'https://ws.bkcrm.devsible.com.br';
```

---

## 📊 ENDPOINTS DISPONÍVEIS

### 🔌 **WebSocket Events**
- `join-ticket` - Conectar a um ticket
- `send-message` - Enviar nova mensagem  
- `new-message` - Receber nova mensagem
- `request-messages` - Solicitar mensagens
- `connection-stats` - Estatísticas

### 📥 **HTTP Endpoints**
- `POST /webhook/evolution` - Webhook principal Evolution API
- `POST /connection-update` - **RESOLVE ERRO 404** 
- `POST /webhook/evolution/connection-update` - Alternativo
- `GET /webhook/health` - Health check
- `GET /webhook/ws-stats` - Estatísticas WebSocket

---

## 🔍 TROUBLESHOOTING

### ❌ **Container não inicia**
```bash
# Verificar logs no EasyPanel
# Procurar por erros de variáveis de ambiente
```

### ❌ **Erro 404 persistente**
```bash
# Verificar se Evolution API aponta para URL correta:
# https://ws.bkcrm.devsible.com.br/webhook/evolution
```

### ❌ **WebSocket não conecta**
```bash
# Verificar se domínio suporta WebSocket
# Testar: ws://ws.bkcrm.devsible.com.br
```

### ❌ **Mensagens não chegam**
```bash
# Verificar health check:
curl https://ws.bkcrm.devsible.com.br/webhook/health

# Verificar logs de webhook:
# POST /webhook/evolution deve aparecer nos logs
```

---

## ✅ CHECKLIST FINAL

- [ ] ✅ ZIP uploadado no EasyPanel
- [ ] ⚙️ Variáveis de ambiente configuradas
- [ ] 🌐 Domínio `ws.bkcrm.devsible.com.br` configurado
- [ ] 🏥 Health check respondendo
- [ ] 📥 Endpoint `/connection-update` funcionando (resolve erro 404)
- [ ] 🔌 WebSocket conectando
- [ ] 🔄 Evolution API reconfigurada
- [ ] 💻 Frontend atualizado com nova URL

---

## 🎉 RESULTADO ESPERADO

**Sistema 100% funcional:**
- ✅ **Webhook Evolution API** processa mensagens WhatsApp
- ✅ **WebSocket** atualiza frontend em tempo real  
- ✅ **Erro 404 resolvido** - endpoint `/connection-update` funcionando
- ✅ **Performance otimizada** - servidor único
- ✅ **Monitoramento** via health check e estatísticas

**URLs finais:**
- **WebSocket:** `wss://ws.bkcrm.devsible.com.br`
- **Webhook:** `https://ws.bkcrm.devsible.com.br/webhook/evolution`
- **Health:** `https://ws.bkcrm.devsible.com.br/webhook/health` 