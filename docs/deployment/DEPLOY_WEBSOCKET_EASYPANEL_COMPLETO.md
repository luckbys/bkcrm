# 🚀 Deploy WebSocket Server no EasyPanel - Guia Completo

## 📋 **Problema Identificado**
```
WebSocket connection to 'ws://localhost:4000/socket.io/?EIO=4&transport=websocket' failed
```

O frontend está tentando conectar ao `localhost:4000` mas você precisa do servidor WebSocket rodando em produção no EasyPanel.

---

## 🎯 **Solução Completa**

### **Passo 1: Preparar Arquivos para Deploy**

1️⃣ **Copiar arquivo WebSocket principal:**
```bash
cp backend/webhooks/webhook-evolution-websocket.js deploy-webhook/
```

2️⃣ **Atualizar Dockerfile para usar arquivo correto:**
```dockerfile
# deploy-webhook/Dockerfile
FROM node:18-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# CORRIGIR: usar arquivo WebSocket correto
COPY webhook-evolution-websocket.js ./
COPY webhook.env ./

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# CORRIGIR: usar arquivo WebSocket correto  
CMD ["node", "webhook-evolution-websocket.js"]
```

3️⃣ **Verificar package.json tem dependências corretas:**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "@supabase/supabase-js": "^2.38.4",
    "cors": "^2.8.5",
    "crypto": "^1.0.1"
  }
}
```

---

### **Passo 2: Configurar EasyPanel**

4️⃣ **Fazer upload dos arquivos no EasyPanel:**
- `webhook-evolution-websocket.js`
- `Dockerfile`
- `package.json`
- `webhook.env`

5️⃣ **Configurar Serviço no EasyPanel:**

**Configurações Básicas:**
- **Nome do Serviço:** `bkcrm-websocket`
- **Tipo:** `Docker Build`
- **Porta:** `4000`

**Configurações de Build:**
- **Context:** `.`
- **Dockerfile:** `Dockerfile`

**Domínio:**
- **Subdomínio:** `ws.bkcrm.devsible.com.br`
- **Porta:** `4000`
- **SSL:** Ativado ✅

**Variáveis de Ambiente:**
```env
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
BASE_URL=https://bkcrm.devsible.com.br
```

---

### **Passo 3: Atualizar Frontend**

6️⃣ **Atualizar chatStore.ts para usar URL de produção:**

```typescript
// src/stores/chatStore.ts

// Detectar ambiente automaticamente
const getSocketUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  } else {
    return 'https://ws.bkcrm.devsible.com.br'; // URL do EasyPanel
  }
};

// Usar na inicialização do socket
const socketUrl = getSocketUrl();
this.socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  timeout: 15000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  forceNew: true
});
```

---

### **Passo 4: Deploy**

7️⃣ **Executar Deploy no EasyPanel:**
1. Fazer upload dos arquivos
2. Configurar as variáveis de ambiente
3. Clicar em "Deploy"
4. Aguardar build completar

8️⃣ **Verificar se funcionou:**
```bash
# Testar health check
curl https://ws.bkcrm.devsible.com.br/health

# Deve retornar: {"status":"ok","timestamp":"..."}
```

---

### **Passo 5: Configurar SSL e WebSocket**

9️⃣ **Configurar Nginx no EasyPanel** (se necessário):
```nginx
server {
    listen 80;
    server_name ws.bkcrm.devsible.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name ws.bkcrm.devsible.com.br;
    
    # Configurações SSL automáticas do EasyPanel
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

---

## 🧪 **Teste Completo**

### **Script de Teste Local:**
```javascript
// No console do navegador
const testWebSocket = () => {
  const socket = io('https://ws.bkcrm.devsible.com.br');
  
  socket.on('connect', () => {
    console.log('✅ WebSocket conectado!', socket.id);
    
    // Testar join ticket
    socket.emit('join-ticket', { ticketId: 'test-123' });
  });
  
  socket.on('joined-ticket', (data) => {
    console.log('🎯 Join realizado:', data);
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Erro de conexão:', error);
  });
  
  return socket;
};

// Executar teste
const socket = testWebSocket();
```

---

## 🔧 **Troubleshooting**

### **Problema 1: Build falha**
```bash
# Verificar logs no EasyPanel
# Comum: dependências faltando no package.json
```

### **Problema 2: WebSocket não conecta**
```bash
# Verificar se porta 4000 está exposta
# Verificar se SSL está ativo
# Verificar logs do container
```

### **Problema 3: CORS Error**
```javascript
// Verificar se frontend URL está na lista CORS do servidor
// Adicionar domínio no webhook-evolution-websocket.js
```

---

## 📊 **URLs Finais**

**Desenvolvimento:**
- Frontend: `http://localhost:3000`
- WebSocket: `http://localhost:4000`

**Produção:**
- Frontend: `https://bkcrm.devsible.com.br`
- WebSocket: `https://ws.bkcrm.devsible.com.br`

---

## ✅ **Checklist Final**

- [ ] ✅ Arquivos copiados para deploy-webhook/
- [ ] ✅ Dockerfile atualizado
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Serviço criado no EasyPanel
- [ ] ✅ Domínio ws.bkcrm.devsible.com.br configurado
- [ ] ✅ SSL ativado
- [ ] ✅ Frontend atualizado com nova URL
- [ ] ✅ Teste de conexão realizado
- [ ] ✅ Health check funcionando

**Após estes passos, o erro de WebSocket connection failed será resolvido! 🚀** 