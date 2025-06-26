# 🚀 Deploy do Webhook no EasyPanel

## 📋 **Situação Atual**
- ✅ **Frontend BKCRM**: Funcionando no EasyPanel
- ❌ **Webhook**: Precisa ser implantado separadamente

## 🎯 **Opções de Deploy do Webhook**

### **📦 Opção 1: Novo Serviço no EasyPanel (RECOMENDADO)**

**1. Criar novo serviço no EasyPanel:**
- Nome: `bkcrm-webhook`
- Tipo: `Docker`
- Repository: `https://github.com/luckbys/bkcrm.git`
- Branch: `main`
- Dockerfile: `webhook.dockerfile`

**2. Configurações:**
```
Port: 4000
Build Command: docker build -f webhook.dockerfile -t bkcrm-webhook .
Start Command: node webhook-evolution-websocket.cjs
Environment Variables:
  - NODE_ENV=production
  - PORT=4000
```

**3. Domínio sugerido:**
- `webhook.bkcrm.devsible.com.br`
- Ou subpath: `bkcrm.devsible.com.br/webhook`

### **📦 Opção 2: Mesmo Container (Simples)**

**Modificar o Dockerfile principal** para incluir ambos:

```dockerfile
# Multi-stage: Frontend + Webhook
FROM node:18-alpine as frontend
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine as production
WORKDIR /app

# Instalar serve para frontend
RUN npm install -g serve

# Copiar build do frontend
COPY --from=frontend /app/dist ./dist

# Copiar webhook
COPY webhook-evolution-websocket.cjs ./
COPY package.json ./
RUN npm install express cors socket.io @supabase/supabase-js --production

# Script para iniciar ambos
COPY start-both.sh ./
RUN chmod +x start-both.sh

EXPOSE 3000 4000
CMD ["./start-both.sh"]
```

### **📦 Opção 3: VPS Separado**

Deploy do webhook em VPS dedicado:
- DigitalOcean Droplet ($5/mês)
- AWS EC2 t2.micro (Free tier)
- Google Cloud VM

## 🔧 **Arquivos Criados**

### **webhook.dockerfile** (Principal)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json ./
COPY webhook-evolution-websocket.cjs ./
RUN npm install express cors socket.io @supabase/supabase-js --production
EXPOSE 4000
CMD ["node", "webhook-evolution-websocket.cjs"]
```

### **deploy-webhook.sh** (Script Deploy Local)
```bash
#!/bin/bash
docker build -f webhook.dockerfile -t bkcrm-webhook .
docker run -d --name bkcrm-webhook -p 4000:4000 bkcrm-webhook
```

### **webhook-docker-compose.yml** (Docker Compose)
```yaml
version: '3.8'
services:
  bkcrm-webhook:
    build:
      dockerfile: webhook.dockerfile
    ports:
      - "4000:4000"
    restart: unless-stopped
```

## 🛠️ **Passos para Deploy no EasyPanel**

### **Método Recomendado: Serviço Separado**

**1. No EasyPanel Dashboard:**
- Clique em "Novo Serviço"
- Escolha "Docker"
- Repository: `https://github.com/luckbys/bkcrm.git`

**2. Configurações Build:**
```
Dockerfile Path: webhook.dockerfile
Build Args: (vazio)
Build Context: . (raiz)
```

**3. Configurações Deploy:**
```
Port: 4000
Environment:
  NODE_ENV=production
  PORT=4000
Health Check: GET /webhook/health
```

**4. Domínio:**
```
Domain: webhook.bkcrm.devsible.com.br
Port: 4000
SSL: Auto (Let's Encrypt)
```

**5. Deploy:**
- Clique "Deploy"
- Aguardar build (2-3 minutos)
- Verificar logs

### **Verificação Pós-Deploy:**

```bash
# Health check
curl https://webhook.bkcrm.devsible.com.br/webhook/health

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2025-06-26T...",
  "server": "Webhook Evolution API com WebSocket"
}
```

## 📡 **URLs Finais**

Após deploy completo:

- **Frontend**: `https://bkcrm.devsible.com.br`
- **Webhook**: `https://webhook.bkcrm.devsible.com.br`
- **WebSocket**: `wss://webhook.bkcrm.devsible.com.br`

## 🔄 **Integração**

**Atualizar frontend** para usar webhook em produção:

```typescript
// src/config/index.ts
const WEBHOOK_URL = process.env.NODE_ENV === 'production' 
  ? 'https://webhook.bkcrm.devsible.com.br'
  : 'http://localhost:4000';
```

## ⚡ **Deploy Rápido (Teste Local)**

```bash
# Clone e teste local
git clone https://github.com/luckbys/bkcrm.git
cd bkcrm
chmod +x deploy-webhook.sh
./deploy-webhook.sh
```

---

**🎯 RESULTADO:** Frontend + Webhook funcionando em domínios separados com integração completa WhatsApp! 