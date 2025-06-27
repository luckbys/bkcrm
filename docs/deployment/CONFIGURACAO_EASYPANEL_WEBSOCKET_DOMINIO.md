# 🚀 CONFIGURAÇÃO DE DOMÍNIO WEBSOCKET NO EASYPANEL

## 📋 RESUMO RÁPIDO

**Domínio recomendado**: `ws.bkcrm.devsible.com.br`  
**Porta**: `4000`  
**Tipo**: `WebSocket + HTTP`

## 🔧 PASSO A PASSO NO EASYPANEL

### 1. CRIAR NOVO SERVIÇO

1. **Login no EasyPanel**
   - Acesse seu painel EasyPanel
   - Vá para o projeto existente ou crie novo

2. **Criar novo serviço**
   ```
   Nome: bkcrm-websocket
   Tipo: App
   Source: Upload de arquivos
   ```

### 2. CONFIGURAR DOMÍNIO

#### Opção A: Subdomínio dedicado (RECOMENDADO)
```
Domain: ws.bkcrm.devsible.com.br
Port: 4000
Protocol: HTTP/HTTPS
```

#### Opção B: Path no domínio principal
```
Domain: bkcrm.devsible.com.br
Path: /websocket
Port: 4000
Protocol: HTTP/HTTPS
```

### 3. VARIÁVEIS DE AMBIENTE

No EasyPanel, configure estas variáveis:

```bash
# Porta do servidor
PORT=4000

# URLs de produção
BASE_URL=https://bkcrm.devsible.com.br
WEBSOCKET_URL=https://ws.bkcrm.devsible.com.br

# Supabase (usar as mesmas do frontend)
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Evolution API
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# Instância WhatsApp
INSTANCE_NAME=atendimento-ao-cliente-suporte

# CORS
CORS_ORIGIN=https://bkcrm.devsible.com.br

# Segurança
NODE_ENV=production
```

### 4. ARQUIVOS PARA UPLOAD

Crie um ZIP com estes arquivos:

```
websocket-deploy.zip
├── webhook-evolution-websocket.cjs
├── package.json
├── Dockerfile (opcional)
└── .env
```

#### 📁 package.json mínimo:
```json
{
  "name": "bkcrm-websocket",
  "version": "1.0.0",
  "main": "webhook-evolution-websocket.cjs",
  "scripts": {
    "start": "node webhook-evolution-websocket.cjs"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "@supabase/supabase-js": "^2.38.0",
    "cors": "^2.8.5",
    "axios": "^1.6.0"
  }
}
```

## 🌐 CONFIGURAÇÃO DE DNS

### No seu provedor de DNS (Cloudflare, etc.):

```
Tipo: CNAME
Nome: ws
Valor: seu-projeto.easypanel.host
Proxy: Desabilitado (para WebSocket)
TTL: Auto
```

### Verificação DNS:
```bash
# Testar resolução
nslookup ws.bkcrm.devsible.com.br

# Testar conectividade
curl https://ws.bkcrm.devsible.com.br/webhook/health
```

## 🔗 CONFIGURAÇÃO DO FRONTEND

Atualizar `src/stores/chatStore.ts`:

```typescript
// 🔧 URL DINÂMICA: Detectar ambiente automaticamente
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:4000' 
  : 'https://ws.bkcrm.devsible.com.br'; // ⭐ Novo domínio
```

## 🚀 DEPLOY NO EASYPANEL

### 1. Upload dos arquivos
```bash
# Criar ZIP localmente
zip -r websocket-deploy.zip webhook-evolution-websocket.cjs package.json

# Ou usar script PowerShell
Compress-Archive -Path webhook-evolution-websocket.cjs,package.json -DestinationPath websocket-deploy.zip
```

### 2. Configurar no painel
1. **Upload** do ZIP
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. **Port**: `4000`
5. **Domain**: `ws.bkcrm.devsible.com.br`

### 3. SSL automático
O EasyPanel configura SSL automaticamente via Let's Encrypt.

## 🔍 TESTE APÓS DEPLOY

### 1. Health Check
```bash
curl https://ws.bkcrm.devsible.com.br/webhook/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-27T11:40:00.000Z",
  "server": "Webhook Evolution API com WebSocket",
  "websocket": {
    "enabled": true,
    "connections": 0,
    "activeTickets": 0
  }
}
```

### 2. WebSocket Test
```javascript
// No console do navegador
const socket = io('https://ws.bkcrm.devsible.com.br');
socket.on('connect', () => console.log('✅ WebSocket conectado!'));
```

## 🐛 TROUBLESHOOTING

### ❌ Erro: "Failed to connect"
```bash
# Verificar se serviço está rodando
curl https://ws.bkcrm.devsible.com.br/webhook/health

# Verificar logs no EasyPanel
# Dashboard > Serviços > bkcrm-websocket > Logs
```

### ❌ Erro: "SSL certificate"
```bash
# Forçar renovação SSL no EasyPanel
# Dashboard > Domains > ws.bkcrm.devsible.com.br > Renew SSL
```

### ❌ Erro: "CORS"
Verificar se `CORS_ORIGIN` está configurado corretamente:
```
CORS_ORIGIN=https://bkcrm.devsible.com.br
```

## 📊 MONITORAMENTO

### Endpoints úteis:
- **Health**: `https://ws.bkcrm.devsible.com.br/webhook/health`
- **Stats**: `https://ws.bkcrm.devsible.com.br/webhook/ws-stats`
- **Webhook**: `https://ws.bkcrm.devsible.com.br/webhook/evolution`

### Dashboard EasyPanel:
- **CPU/RAM**: Monitorar uso de recursos
- **Logs**: Verificar erros em tempo real
- **Metrics**: Acompanhar performance

## 🎯 CONFIGURAÇÃO FINAL

### URLs do sistema completo:
```
Frontend: https://bkcrm.devsible.com.br
WebSocket: https://ws.bkcrm.devsible.com.br
API: https://ws.bkcrm.devsible.com.br/webhook/evolution
Health: https://ws.bkcrm.devsible.com.br/webhook/health
```

### Configuração Evolution API:
```
Webhook URL: https://ws.bkcrm.devsible.com.br/webhook/evolution
```

## ✅ CHECKLIST FINAL

- [ ] Domínio DNS configurado (`ws.bkcrm.devsible.com.br`)
- [ ] Serviço no EasyPanel criado
- [ ] Variáveis de ambiente configuradas
- [ ] Arquivos enviados (ZIP)
- [ ] SSL ativo (Let's Encrypt)
- [ ] Health check respondendo
- [ ] Frontend conectando no WebSocket
- [ ] Evolution API webhook configurado
- [ ] Mensagens fluindo em tempo real

**🎉 SISTEMA PRONTO PARA PRODUÇÃO!**