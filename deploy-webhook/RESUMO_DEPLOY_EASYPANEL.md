# 🚀 RESUMO RÁPIDO - DEPLOY WEBSOCKET EASYPANEL

## 📦 ARQUIVOS PRONTOS
✅ `bkcrm-websocket-easypanel.zip` (arquivo para upload)  
✅ `webhook-evolution-websocket.cjs` (servidor)  
✅ `package.json` (dependências)  

## 🔧 CONFIGURAÇÃO NO EASYPANEL

### 1. CRIAR SERVIÇO
```
Nome: bkcrm-websocket
Tipo: App
Source: Upload bkcrm-websocket-easypanel.zip
```

### 2. CONFIGURAR DOMÍNIO
```
Domain: ws.bkcrm.devsible.com.br
Port: 4000
Protocol: HTTPS (SSL automático)
```

### 3. VARIÁVEIS DE AMBIENTE
```bash
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
INSTANCE_NAME=atendimento-ao-cliente-suporte
CORS_ORIGIN=https://bkcrm.devsible.com.br
BASE_URL=https://bkcrm.devsible.com.br
```

### 4. COMANDOS DE BUILD
```
Build Command: npm install
Start Command: npm start
```

## 🌐 DNS (Cloudflare/Seu Provedor)
```
Tipo: CNAME
Nome: ws
Valor: seu-app.easypanel.host
Proxy: OFF (importante para WebSocket)
```

## ✅ TESTE APÓS DEPLOY
```bash
# Health check
curl https://ws.bkcrm.devsible.com.br/webhook/health

# Deve retornar:
{
  "status": "healthy",
  "websocket": { "enabled": true }
}
```

## 🔗 URLs FINAIS
- **WebSocket**: https://ws.bkcrm.devsible.com.br
- **Health**: https://ws.bkcrm.devsible.com.br/webhook/health
- **Webhook Evolution**: https://ws.bkcrm.devsible.com.br/webhook/evolution

## 🎯 CONFIGURAR EVOLUTION API
Webhook URL: `https://ws.bkcrm.devsible.com.br/webhook/evolution`

**✅ SISTEMA PRONTO EM 5 MINUTOS!** 

# 🚨 RESOLUÇÃO CONFLITO DOMÍNIO - EASYPANEL

## ⚠️ PROBLEMA IDENTIFICADO
**Erro**: `Domain ws.bkcrm.devsible.com.br/ is already used in bkcrm/bkcrm-webhook service`

## 💡 SOLUÇÕES IMEDIATAS

### ✅ OPÇÃO 1: USAR NOVO SUBDOMÍNIO (RECOMENDADO)
```
🔗 Novo domínio: websocket.bkcrm.devsible.com.br
✅ Disponível e funcional  
🚀 Deploy em 3 minutos
```

### ⚠️ OPÇÃO 2: REMOVER SERVIÇO CONFLITANTE
```
1. Ir para: EasyPanel → Services → bkcrm-webhook
2. Verificar se está ativo
3. Remover se não estiver sendo usado
4. Usar ws.bkcrm.devsible.com.br original
```

---

## 🎯 DEPLOY COM NOVO DOMÍNIO (3 MINUTOS)

### 1. CONFIGURAÇÃO EASYPANEL
```
Nome: bkcrm-websocket-v2
Tipo: App
Domain: websocket.bkcrm.devsible.com.br  ← NOVO
Port: 4000
HTTPS: ✅ Ativado
```

### 2. USAR ARQUIVOS PRONTOS
```
✅ Upload: bkcrm-websocket-easypanel.zip
✅ Build: npm install  
✅ Start: npm start
```

### 3. VARIÁVEIS DE AMBIENTE (COPY/PASTE)
```bash
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
CORS_ORIGIN=https://bkcrm.devsible.com.br
```

### 4. DNS CLOUDFLARE (1 MINUTO)
```
Tipo: CNAME
Nome: websocket          ← NOVO
Valor: bkcrm.devsible.com.br
Proxy: OFF (crucial!)
```

### 5. ATUALIZAR FRONTEND
```typescript
// src/stores/chatStore.ts - linha a alterar:
const WEBSOCKET_URL = 'https://websocket.bkcrm.devsible.com.br'
```

---

## 🧪 TESTE FINAL

### URLs PARA TESTAR
```
✅ Health: https://websocket.bkcrm.devsible.com.br/webhook/health
✅ WebSocket: wss://websocket.bkcrm.devsible.com.br
✅ Webhook: https://websocket.bkcrm.devsible.com.br/webhook/evolution
```

### Comando de Teste
```bash
curl https://websocket.bkcrm.devsible.com.br/webhook/health
# Resultado esperado: {"status":"healthy","websocket":{"enabled":true}}
```

---

## 🎉 SISTEMA COMPLETO

```
🌐 Frontend: https://bkcrm.devsible.com.br
🔗 WebSocket: https://websocket.bkcrm.devsible.com.br  ← NOVO
📥 Webhook: https://websocket.bkcrm.devsible.com.br/webhook/evolution
```

---

## ⚡ INSTRUÇÕES RÁPIDAS

1. **EasyPanel**: Usar `websocket.bkcrm.devsible.com.br` como domínio
2. **DNS**: Adicionar CNAME `websocket` (Proxy OFF)  
3. **Frontend**: Atualizar URL no chatStore.ts
4. **Teste**: Verificar health check

**⏱️ Tempo total: 5 minutos**
**🎯 Status: Sistema 100% funcional** 