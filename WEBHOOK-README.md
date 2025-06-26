# 🔗 Webhook Evolution API + WebSocket

## ✅ **PROBLEMA RESOLVIDO: ES Modules vs CommonJS**

### 🚨 **Problema Original**
```
ReferenceError: require is not defined in ES module scope
```

### ✅ **Solução Implementada**

**1. Criado `webhook-evolution-websocket.cjs`**
- Extensão `.cjs` força CommonJS (permite `require()`)
- Mantém toda funcionalidade original
- Compatível com package.json que tem `"type": "module"`

**2. Instaladas dependências backend**
```bash
npm install express cors socket.io @supabase/supabase-js
```

**3. Scripts adicionados ao package.json**
```json
{
  "webhook": "node start-webhook.js",
  "webhook:dev": "node webhook-evolution-websocket.cjs",
  "webhook:direct": "node webhook-evolution-websocket.cjs"
}
```

## 🚀 **Como Usar**

### **Desenvolvimento Local**
```bash
# Opção 1: Script direto (RECOMENDADO)
npm run webhook:direct

# Opção 2: Via script wrapper
npm run webhook

# Opção 3: Comando direto
node webhook-evolution-websocket.cjs
```

### **Verificar Status**
```bash
curl http://localhost:4000/webhook/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-26T15:29:23.469Z",
  "server": "Webhook Evolution API com WebSocket",
  "websocket": {
    "enabled": true,
    "connections": 0,
    "activeTickets": 0
  }
}
```

## 📡 **Endpoints Disponíveis**

- **Health Check**: `GET /webhook/health`
- **Webhook Evolution**: `POST /webhook/evolution`
- **WebSocket Stats**: `GET /webhook/ws-stats`
- **WebSocket**: `ws://localhost:4000`

## 🔧 **Configuração**

### **Variáveis de Ambiente** (no código)
```javascript
const PORT = 4000;
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
```

### **CORS Configurado para:**
- `http://localhost:3000-3006`
- `https://bkcrm.devsible.com.br`
- `https://ws.bkcrm.devsible.com.br`

## 🔄 **Funcionalidades**

### **Webhook Evolution API**
- ✅ Recebe mensagens WhatsApp via `POST /webhook/evolution`
- ✅ Cria clientes automaticamente na tabela `profiles`
- ✅ Cria tickets automaticamente na tabela `tickets`
- ✅ Salva mensagens na tabela `messages`

### **WebSocket Real-time**
- ✅ Broadcasting de mensagens em tempo real
- ✅ Gerenciamento de conexões por ticket
- ✅ Estatísticas de conexões ativas

### **Banco de Dados (Supabase)**
- ✅ Integração completa com Supabase
- ✅ Criação automática de clientes/tickets
- ✅ Metadados WhatsApp preservados

## 🐛 **Debug**

### **Verificar Processos**
```bash
# Ver processos Node.js ativos
tasklist | findstr node.exe

# Parar todos processos Node.js
taskkill /f /im node.exe
```

### **Logs em Tempo Real**
O webhook exibe logs detalhados:
```
🚀 Servidor webhook + WebSocket rodando na porta 4000
🔗 Health check: http://localhost:4000/webhook/health
📡 WebSocket: ws://localhost:4000
🎯 Webhook URL: http://localhost:4000/webhook/evolution
```

## 📦 **Deploy em Produção**

Para deploy, use a versão `.cjs`:
```dockerfile
# Dockerfile
FROM node:18-alpine
COPY package.json ./
RUN npm install
COPY webhook-evolution-websocket.cjs ./
EXPOSE 4000
CMD ["node", "webhook-evolution-websocket.cjs"]
```

## ✅ **Status Atual**

- 🟢 **Webhook funcionando**: ✅ Porta 4000
- 🟢 **Health check**: ✅ Status 200
- 🟢 **WebSocket**: ✅ Sem erros
- 🟢 **Supabase**: ✅ Conectado
- 🟢 **CORS**: ✅ Configurado
- 🟢 **ES Modules**: ✅ Problema resolvido

---

**🎯 WEBHOOK 100% FUNCIONAL PARA RECEBER MENSAGENS WHATSAPP** 