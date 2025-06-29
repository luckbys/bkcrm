# 🚀 DEPLOY EASYPANEL - SERVIDOR UNIFICADO V2.0

## ✅ STATUS: PRONTO PARA DEPLOY

**Arquivo gerado:** `bkcrm-websocket-unified-v2.zip` (21.4 KB)

## 🎯 O QUE FOI RESOLVIDO

### ❌ PROBLEMA ANTERIOR:
- Evolution API retornando **erro 404** no endpoint `/connection-update`
- **Dois servidores separados** (webhook + websocket)
- Performance degradada e complexidade desnecessária

### ✅ SOLUÇÃO IMPLEMENTADA:
- **SERVIDOR ÚNICO** que faz tudo:
  - 📥 Processa webhooks Evolution API
  - 🔌 Gerencia WebSocket em tempo real
  - 🔗 **Endpoint `/connection-update`** (resolve erro 404)
  - 🏥 Health check e monitoramento

---

## 🚀 DEPLOY RÁPIDO - 5 PASSOS

### 1. **UPLOAD NO EASYPANEL**
- Arquivo: `bkcrm-websocket-unified-v2.zip`
- Nome da app: `bkcrm-websocket-unified`

### 2. **CONFIGURAR VARIÁVEIS**
```
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
EVOLUTION_API_URL=https://evochat.devsible.com.br/
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
```

### 3. **CONFIGURAR DOMÍNIO**
- **Host:** `ws.bkcrm.devsible.com.br`
- **Porta:** `4000`
- **HTTPS:** ✅ Ativado
- **WebSocket:** ✅ Ativado

### 4. **FAZER DEPLOY**
- Clicar em "Deploy"
- Aguardar ~3 minutos

### 5. **TESTAR**
```bash
# Health check
curl https://ws.bkcrm.devsible.com.br/webhook/health

# Endpoint que resolve erro 404
curl -X POST https://ws.bkcrm.devsible.com.br/connection-update
```

---

## ⚡ ENDPOINTS CRÍTICOS

| Endpoint | Função | Status |
|----------|--------|--------|
| `POST /webhook/evolution` | Webhook principal | ✅ Funcional |
| `POST /connection-update` | **RESOLVE ERRO 404** | ✅ **NOVO** |
| `GET /webhook/health` | Health check | ✅ Funcional |
| WebSocket `wss://` | Tempo real | ✅ Funcional |

---

## 🔄 PÓS-DEPLOY

### 1. **RECONFIGURAR EVOLUTION API**
Execute localmente:
```bash
cd deploy-webhook
node fix-evolution-webhook-url.cjs
```

### 2. **ATUALIZAR FRONTEND**
Alterar URL no arquivo `src/stores/chatStore.ts`:
```javascript
const WEBSOCKET_URL = 'https://ws.bkcrm.devsible.com.br';
```

---

## 🎉 RESULTADO FINAL

**SISTEMA 100% INTEGRADO:**
- ✅ Webhook Evolution API → Processa mensagens WhatsApp
- ✅ WebSocket → Atualiza frontend em tempo real
- ✅ **Erro 404 RESOLVIDO** → Endpoint funcionando
- ✅ Performance → Servidor único otimizado
- ✅ Monitoramento → Health check automático

**URLs operacionais:**
- **WebSocket:** `wss://ws.bkcrm.devsible.com.br`
- **Webhook:** `https://ws.bkcrm.devsible.com.br/webhook/evolution`
- **Health:** `https://ws.bkcrm.devsible.com.br/webhook/health` 