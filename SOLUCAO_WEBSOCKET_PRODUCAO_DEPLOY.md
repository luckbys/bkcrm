#!/bin/bash
# 🚀 Deploy WebSocket Produção - Script Automatizado
# Execução: bash deploy-websocket-production.sh

echo "🚀 [DEPLOY] Iniciando deploy WebSocket produção..."
echo "=================================================="

# 1. 📁 Criar diretório de deploy
echo "📁 [DEPLOY] Criando estrutura de arquivos..."
mkdir -p deploy-websocket-prod

# 2. 📄 Criar package.json
echo "📄 [DEPLOY] Criando package.json..."
cat > deploy-websocket-prod/package.json << 'EOF'
{
  "name": "bkcrm-websocket",
  "version": "1.0.0",
  "type": "commonjs",
  "description": "BKCRM WebSocket Server for Production",
  "main": "webhook-evolution-websocket.cjs",
  "scripts": {
    "start": "node webhook-evolution-websocket.cjs",
    "dev": "node webhook-evolution-websocket.cjs",
    "health": "curl -f http://localhost:4000/webhook/health || exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2",
    "cors": "^2.8.5",
    "@supabase/supabase-js": "^2.38.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# 3. 🐳 Criar Dockerfile
echo "🐳 [DEPLOY] Criando Dockerfile..."
cat > deploy-websocket-prod/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Instalar dependências primeiro (cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Copiar código
COPY . .

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S webhookuser -u 1001
USER webhookuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/webhook/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

EXPOSE 4000

CMD ["npm", "start"]
EOF

# 4. 📋 Criar docker-compose.yml
echo "📋 [DEPLOY] Criando docker-compose.yml..."
cat > deploy-websocket-prod/docker-compose.yml << 'EOF'
version: '3.8'

services:
  bkcrm-websocket:
    build: .
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
      - SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CV
    volumes:
      - ./logs:/app/logs
    networks:
      - bkcrm-network

networks:
  bkcrm-network:
    driver: bridge

volumes:
  logs:
EOF

# 5. 📁 Copiar webhook
echo "📁 [DEPLOY] Copiando webhook..."
cp webhook-evolution-websocket.cjs deploy-websocket-prod/

# 6. 📋 Criar .env.production
echo "📋 [DEPLOY] Criando .env.production..."
cat > deploy-websocket-prod/.env.production << 'EOF'
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CV
EOF

# 7. 📋 Criar instruções EasyPanel
echo "📋 [DEPLOY] Criando instruções EasyPanel..."
cat > deploy-websocket-prod/INSTRUCOES_EASYPANEL.md << 'EOF'
# 🚀 Deploy WebSocket EasyPanel - Instruções

## 📋 **Passos no EasyPanel:**

### **1. Criar Nova Aplicação**
- Nome: `bkcrm-websocket`
- Tipo: Docker
- Porta: 4000

### **2. Configurar Domínio**
- Domínio: `ws.bkcrm.devsible.com.br`
- SSL: Ativar Let's Encrypt

### **3. Upload Arquivos**
Fazer upload de todos os arquivos desta pasta:
- `webhook-evolution-websocket.cjs`
- `package.json`
- `Dockerfile`
- `docker-compose.yml`
- `.env.production`

### **4. Variáveis de Ambiente**
```
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CV
```

### **5. Deploy**
1. Clicar em "Deploy"
2. Aguardar build
3. Verificar logs
4. Testar: `https://ws.bkcrm.devsible.com.br/webhook/health`

### **6. Atualizar Frontend**
Alterar `src/stores/chatStore.ts`:
```javascript
const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4000' 
  : 'https://websocket.bkcrm.devsible.com.br';
```
EOF

# 8. 🎯 Criar arquivo zip para upload
echo "🎯 [DEPLOY] Criando arquivo ZIP para upload..."
cd deploy-websocket-prod
zip -r ../bkcrm-websocket-production.zip .
cd ..

echo ""
echo "✅ [DEPLOY] Deploy preparado com sucesso!"
echo "=================================================="
echo "📁 Arquivos criados em: deploy-websocket-prod/"
echo "📦 ZIP para upload: bkcrm-websocket-production.zip"
echo ""
echo "🚀 [PRÓXIMOS PASSOS]:"
echo "1. Fazer upload do ZIP no EasyPanel"
echo "2. Seguir instruções em INSTRUCOES_EASYPANEL.md"
echo "3. Testar: https://ws.bkcrm.devsible.com.br/webhook/health"
echo "4. Atualizar frontend com nova URL"
echo ""
echo "🌐 URLs finais:"
echo "   Frontend: https://bkcrm.devsible.com.br"
echo "   WebSocket: https://websocket.bkcrm.devsible.com.br"
echo "   Health: https://websocket.bkcrm.devsible.com.br/webhook/health"

# 🔧 CORREÇÃO URL WEBSOCKET PRODUÇÃO
## URL Corrigida: https://websocket.bkcrm.devsible.com.br/

### 📋 ARQUIVOS CORRIGIDOS

#### 1. Frontend Principal
- ✅ `src/stores/chatStore.ts` 
  - **Antes:** `'https://bkcrm.devsible.com.br'`
  - **Depois:** `'https://websocket.bkcrm.devsible.com.br'`

- ✅ `src/hooks/useWebSocketMessages.ts`
  - **Antes:** `'wss://ws.bkcrm.devsible.com.br'`  
  - **Depois:** `'https://websocket.bkcrm.devsible.com.br'`

- ✅ `src/hooks/useRealtimeNotifications.ts`
  - **Antes:** `'https://ws.bkcrm.devsible.com.br'`
  - **Depois:** `'https://websocket.bkcrm.devsible.com.br'`

- ✅ `src/hooks/useSystemHealthCheck.ts`
  - **Antes:** `'https://ws.bkcrm.devsible.com.br'`
  - **Depois:** `'https://websocket.bkcrm.devsible.com.br'`

#### 2. Arquivos de Configuração
- ✅ `deployment/env.production`
  - **Antes:** `VITE_WEBSOCKET_URL=https://ws.bkcrm.devsible.com.br`
  - **Depois:** `VITE_WEBSOCKET_URL=https://websocket.bkcrm.devsible.com.br`

#### 3. Arquivos de Teste
- ✅ `src/utils/test-websocket-production.ts`
  - **Antes:** `'https://ws.bkcrm.devsible.com.br'`
  - **Depois:** `'https://websocket.bkcrm.devsible.com.br'`

#### 4. Configuração Easypanel
- ✅ `deploy-webhook/easypanel-websocket.json`
  - **Antes:** `"host": "ws.bkcrm.devsible.com.br"`
  - **Depois:** `"host": "websocket.bkcrm.devsible.com.br"`

- ✅ `deployment/test-websocket-easypanel.js`
  - **Antes:** `production: 'https://ws.bkcrm.devsible.com.br'`
  - **Depois:** `production: 'https://websocket.bkcrm.devsible.com.br'`

### 🚀 DEPLOY EM PRODUÇÃO

#### Passos para Deploy:

1. **Build da aplicação:**
   ```bash
   npm run build
   ```

2. **Configurar variável de ambiente:**
   ```env
   VITE_WEBSOCKET_URL=https://websocket.bkcrm.devsible.com.br
   ```

3. **Upload para servidor de produção**

4. **Configurar DNS/Proxy:**
   - Apontar `websocket.bkcrm.devsible.com.br` para o servidor WebSocket (porta 4000)
   - Configurar SSL/HTTPS

5. **Testar conexão:**
   ```bash
   curl https://websocket.bkcrm.devsible.com.br/health
   ```

### 🧪 TESTES DE VERIFICAÇÃO

#### No Console do Navegador:
```javascript
// Teste de conexão
testProductionWebSocket()

// Debug da configuração
debugWebSocketConfig()

// Verificar URL configurada
console.log('WebSocket URL:', window.location.hostname === 'localhost' 
  ? 'http://localhost:4000' 
  : 'https://websocket.bkcrm.devsible.com.br')
```

#### Teste de Health Check:
```bash
# Via curl
curl -X GET https://websocket.bkcrm.devsible.com.br/webhook/health

# Resposta esperada:
{
  "status": "ok",
  "websocket": {
    "enabled": true,
    "connections": 0
  },
  "evolution": {
    "connected": true,
    "instances": 1
  }
}
```

### 📊 IMPACTO DAS MUDANÇAS

#### ✅ Benefícios:
- **URL Dedicada:** WebSocket agora tem subdomínio próprio
- **Melhor Organização:** Separação clara entre frontend e WebSocket
- **SSL/HTTPS:** Conexão segura garantida
- **Escalabilidade:** Facilita futuras otimizações de infraestrutura

#### 🔧 Compatibilidade:
- **Desenvolvimento:** Mantém `http://localhost:4000`
- **Produção:** Usa `https://websocket.bkcrm.devsible.com.br`
- **Detecção Automática:** Baseada no hostname atual

### 🔍 MONITORAMENTO

#### Logs a Verificar:
```
✅ [CHAT-STORE] WebSocket URL detectada: https://websocket.bkcrm.devsible.com.br
✅ [WS] Conectado ao WebSocket
✅ [HEALTH] Sistema saudável
```

#### Sinais de Problema:
```
❌ [CHAT] Erro de conexão: Network error
❌ [WS] Timeout de conexão
⚠️ [HEALTH] Falha no health check
```

### 🛠️ TROUBLESHOOTING

#### Se não conectar:
1. **Verificar DNS:** `nslookup websocket.bkcrm.devsible.com.br`
2. **Verificar porta:** `telnet websocket.bkcrm.devsible.com.br 443`
3. **Verificar SSL:** `openssl s_client -connect websocket.bkcrm.devsible.com.br:443`
4. **Verificar logs:** Console do navegador + logs do servidor

#### Fallback:
Se o WebSocket falhar, o sistema usa polling HTTP como backup automático.

### 📝 CHECKLIST DE DEPLOY

- [ ] ✅ URLs corrigidas em todos os arquivos
- [ ] ✅ Build da aplicação executado
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ DNS apontado para o servidor correto
- [ ] ✅ SSL/HTTPS configurado
- [ ] ✅ Health check respondendo
- [ ] ✅ Teste de conexão WebSocket funcionando
- [ ] ✅ Sistema em produção operacional

### 🎯 URLS FINAIS

- **Frontend:** https://bkcrm.devsible.com.br/
- **WebSocket:** https://websocket.bkcrm.devsible.com.br/
- **Health Check:** https://websocket.bkcrm.devsible.com.br/webhook/health
- **Evolution Webhook:** https://websocket.bkcrm.devsible.com.br/webhook/evolution

---

## ✅ CORREÇÃO APLICADA COM SUCESSO!

🔗 **URL WebSocket Produção:** `https://websocket.bkcrm.devsible.com.br/`

Todos os arquivos foram atualizados para usar a URL correta fornecida pelo usuário. 