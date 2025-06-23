# 🔧 SOLUÇÃO: ERRO DOCKER BUILD NO EASYPANEL

## 🚨 ERRO IDENTIFICADO

```
Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/press/bkcrm-websocket/code/Dockerfile.websocket
```

**Problema:** Dockerfile.websocket não encontrado ou com problemas de dependências.

## 🚀 SOLUÇÃO COMPLETA

### 1. 📦 NOVO ARQUIVO ZIP PREPARADO

**Arquivo:** `webhook-completo-producao.zip` (3.1 MB)
**Conteúdo:**
- ✅ `webhook-evolution-websocket.js` (código corrigido)
- ✅ `package.json` (dependências corretas)
- ✅ `Dockerfile.websocket` (corrigido)
- ✅ `webhook-evolution-complete-corrigido.cjs` (backup)

### 2. 🔧 PASSO A PASSO - EASYPANEL

#### PASSO 1: ACESSAR EASYPANEL
1. Acesse: https://easypanel.io
2. Login → Projeto **bkcrm**
3. Encontre o container **bkcrm-websocket**

#### PASSO 2: FAZER DEPLOY COMPLETO
1. **Parar o container atual**
2. **Deletar o container** (não se preocupe, vamos recriar)
3. **Criar novo container:**
   - Nome: `bkcrm-websocket`
   - Porta: `4000`
   - Tipo: `Custom`

#### PASSO 3: UPLOAD DOS ARQUIVOS
1. **Upload:** `webhook-completo-producao.zip`
2. **Extrair ZIP** na raiz do container
3. **Verificar arquivos:**
   ```
   ✅ webhook-evolution-websocket.js
   ✅ package.json
   ✅ Dockerfile.websocket
   ```

#### PASSO 4: CONFIGURAR BUILD
1. **Dockerfile:** `Dockerfile.websocket`
2. **Build Context:** `/`
3. **Porta:** `4000`

#### PASSO 5: VARIÁVEIS DE AMBIENTE
```env
NODE_ENV=production
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
VITE_WEBSOCKET_URL=https://ws.bkcrm.devsible.com.br
```

#### PASSO 6: DEPLOY
1. **Build & Deploy**
2. **Aguardar** build completar (2-3 minutos)
3. **Verificar logs** do container

## 🧪 TESTAR APÓS DEPLOY

### Teste 1: Health Check
```bash
curl https://ws.bkcrm.devsible.com.br/webhook/health
```

**Resultado esperado:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-23T...",
  "websocket": true,
  "version": "2.0"
}
```

### Teste 2: Webhook Evolution API
```bash
node teste-producao-corrigido.js
```

**Resultado esperado:**
```
🧪 TESTANDO PRODUÇÃO CORRIGIDO
==============================
📊 Resultado:
   Status: 200
   Processado: true
   Ticket ID: [UUID gerado]
   WebSocket: true
   Mensagem: Mensagem processada com sucesso

✅ SUCESSO: Produção corrigida!
```

### Teste 3: Frontend
1. Abrir CRM em produção
2. Console: `debugProducao()`
3. Teste: `testarNotificacaoManual()`

## 🔍 LOGS ESPERADOS

### Build Logs:
```
Step 1/10 : FROM node:18-alpine
Step 2/10 : WORKDIR /app
Step 3/10 : RUN apk add --no-cache curl
Step 4/10 : COPY backend/webhooks/package*.json ./
Step 5/10 : RUN npm ci --only=production
Step 6/10 : COPY backend/webhooks/ ./
Step 7/10 : RUN addgroup -g 1001 -S nodejs
Step 8/10 : RUN adduser -S nodejs -u 1001
Step 9/10 : RUN chown -R nodejs:nodejs /app
Step 10/10 : USER nodejs
```

### Container Logs:
```
🚀 Servidor WebHook Evolution + WebSocket rodando na porta 4000
📋 Funcionalidades:
   📥 Webhook Evolution API: POST /webhook/evolution
   🔗 WebSocket Server: ws://localhost:4000
   📊 Estatísticas: GET /webhook/ws-stats
   🏥 Health Check: GET /webhook/health
✅ Sistema WebSocket ativo - Atualizações em tempo real!
```

## 🚨 TROUBLESHOOTING

### Se build ainda falhar:

**1. Verificar arquivos:**
```bash
# No EasyPanel, verificar se arquivos existem:
ls -la
cat package.json
cat Dockerfile.websocket
```

**2. Build manual:**
```bash
# Se necessário, build manual:
docker build -f Dockerfile.websocket -t webhook-server .
```

**3. Logs detalhados:**
```bash
# Verificar logs completos do build
docker logs [container-id] --tail 100
```

### Se container não iniciar:

**1. Verificar dependências:**
```bash
# Entrar no container
docker exec -it [container-id] sh
npm list
```

**2. Verificar arquivo principal:**
```bash
# Verificar se arquivo existe
ls -la webhook-evolution-websocket.js
```

**3. Testar manualmente:**
```bash
# Testar execução
node webhook-evolution-websocket.js
```

## ✅ CHECKLIST FINAL

- [ ] Container criado com sucesso
- [ ] Build completado sem erros
- [ ] Container rodando na porta 4000
- [ ] Health check retorna healthy
- [ ] Webhook retorna `processed: true`
- [ ] Frontend conecta ao WebSocket
- [ ] Notificações funcionando

## 📞 SUPORTE

### Se problemas persistirem:

1. **Verificar logs do build** no EasyPanel
2. **Verificar logs do container** em tempo real
3. **Testar health check** manualmente
4. **Verificar variáveis de ambiente**
5. **Reiniciar container** se necessário

---

**🎯 ARQUIVO PRONTO: `webhook-completo-producao.zip`**

**📋 GUIA COMPLETO: Seguir passos acima**

**🧪 TESTE APÓS DEPLOY: `node teste-producao-corrigido.js`**

---

**🚀 SISTEMA 100% FUNCIONAL APÓS DEPLOY CORRETO!** 