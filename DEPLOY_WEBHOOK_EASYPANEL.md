# 🚀 Deploy do Webhook Server na EasyPanel

Este guia explica como fazer o deploy do servidor webhook na EasyPanel.

## 📋 **PRÉ-REQUISITOS**

1. ✅ Conta ativa na EasyPanel
2. ✅ Repositório Git com o código (GitHub/GitLab)
3. ✅ Credenciais do Supabase
4. ✅ Evolution API configurada

## 🔧 **PASSO A PASSO**

### **1. 📁 PREPARAR ARQUIVOS**

Certifique-se de que os seguintes arquivos estão no repositório:

```
📦 Repositório
├── 📄 webhook-evolution-websocket.cjs  (Servidor principal)
├── 📄 webhook-package.json             (Dependências)
├── 📄 Dockerfile.webhook               (Configuração Docker)
└── 📄 DEPLOY_WEBHOOK_EASYPANEL.md     (Este guia)
```

### **2. 🌐 CRIAR PROJETO NA EASYPANEL**

1. **Login na EasyPanel**
   - Acesse sua conta na EasyPanel
   - Vá para o dashboard principal

2. **Criar Novo Projeto**
   - Clique em **"+ New Project"**
   - Escolha **"Source Code"**
   - Selecione **"GitHub"** ou **"GitLab"**

3. **Configurar Repositório**
   - **Repository**: `seu-usuario/bkcrm`
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `node webhook-evolution-websocket.cjs`

### **3. ⚙️ CONFIGURAR VARIÁVEIS DE AMBIENTE**

Na seção **Environment Variables**, adicione:

```bash
# NODE.JS
NODE_ENV=production
PORT=4000

# EVOLUTION API
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# SUPABASE
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU

# CORS (Frontend URLs)
FRONTEND_URL=https://bkcrm.devsible.com.br
```

### **4. 🔧 CONFIGURAÇÕES AVANÇADAS**

#### **🐳 Docker Configuration**

Se usar Docker, configure:

- **Dockerfile**: `Dockerfile.webhook`
- **Build Context**: `.` (raiz do projeto)
- **Port**: `4000`

#### **📦 Package.json**

Certifique-se que `webhook-package.json` está correto:

```json
{
  "name": "bkcrm-webhook",
  "version": "1.0.0",
  "main": "webhook-evolution-websocket.cjs",
  "scripts": {
    "start": "node webhook-evolution-websocket.cjs"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### **5. 🌐 CONFIGURAR DOMÍNIO**

1. **Domínio Personalizado**
   - Vá para **"Custom Domain"**
   - Adicione: `webhook.bkcrm.devsible.com.br`
   - Configure SSL automático

2. **DNS (se necessário)**
   ```
   Type: CNAME
   Name: webhook
   Value: seu-projeto.easypanel.host
   ```

### **6. 🔒 CONFIGURAR HEALTH CHECK**

1. **Health Check URL**: `/webhook/health`
2. **Port**: `4000`
3. **Interval**: `30s`
4. **Timeout**: `10s`

### **7. 🚀 FAZER DEPLOY**

1. **Deploy Inicial**
   - Clique em **"Deploy"**
   - Aguarde o build completar
   - Verifique logs para erros

2. **Verificar Status**
   - Acesse: `https://webhook.bkcrm.devsible.com.br/webhook/health`
   - Deve retornar: `{"status": "OK"}`

## ✅ **VERIFICAÇÃO PÓS-DEPLOY**

### **🧪 Testes Básicos**

1. **Health Check**
   ```bash
   curl https://webhook.bkcrm.devsible.com.br/webhook/health
   ```

2. **WebSocket**
   ```bash
   curl https://webhook.bkcrm.devsible.com.br/webhook/ws-stats
   ```

3. **CORS**
   ```bash
   curl -H "Origin: https://bkcrm.devsible.com.br" \
        https://webhook.bkcrm.devsible.com.br/webhook/health
   ```

### **📊 Monitoramento**

1. **Logs da Aplicação**
   - Vá para **"Logs"** na EasyPanel
   - Verifique por erros ou warnings

2. **Métricas**
   - CPU usage < 80%
   - Memory usage < 512MB
   - Response time < 500ms

## 🔧 **CONFIGURAÇÕES ESPECÍFICAS DA EASYPANEL**

### **📋 Configuração Recomendada**

```yaml
# easypanel.yml (se usar configuração avançada)
name: bkcrm-webhook
services:
  webhook:
    image: node:18-alpine
    build:
      context: .
      dockerfile: Dockerfile.webhook
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      PORT: 4000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/webhook/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### **🔄 Auto Deploy**

1. **GitHub Webhook**
   - EasyPanel configurará automaticamente
   - Deploy automático a cada push na branch `main`

2. **Build Cache**
   - EasyPanel cached dependencies automaticamente
   - Builds subsequentes são mais rápidos

## 🚨 **TROUBLESHOOTING**

### **❌ Problemas Comuns**

1. **Port Already in Use**
   ```bash
   # Solução: Verificar se PORT=4000 está configurado
   ```

2. **CORS Errors**
   ```bash
   # Solução: Adicionar frontend URL nas variáveis
   FRONTEND_URL=https://bkcrm.devsible.com.br
   ```

3. **Health Check Failing**
   ```bash
   # Solução: Verificar se endpoint /webhook/health existe
   ```

4. **Supabase Connection Error**
   ```bash
   # Solução: Verificar credenciais do Supabase
   ```

### **🔍 Debug Commands**

```bash
# Verificar logs
curl https://webhook.bkcrm.devsible.com.br/webhook/debug

# Status das conexões WebSocket
curl https://webhook.bkcrm.devsible.com.br/webhook/ws-stats

# Health check detalhado
curl https://webhook.bkcrm.devsible.com.br/webhook/health?detailed=true
```

## 📱 **INTEGRAÇÃO COM FRONTEND**

### **🔗 URLs para Configurar no Frontend**

```javascript
// src/config/index.ts
export const config = {
  WEBHOOK_URL: 'https://webhook.bkcrm.devsible.com.br',
  WEBSOCKET_URL: 'wss://webhook.bkcrm.devsible.com.br',
  // ... outras configurações
};
```

### **🧪 Teste de Integração**

```javascript
// No console do frontend
fetch('https://webhook.bkcrm.devsible.com.br/webhook/health')
  .then(r => r.json())
  .then(console.log); // Deve retornar {status: "OK"}
```

## 🎯 **OTIMIZAÇÕES**

### **⚡ Performance**

1. **Scaling**
   - Configure **Auto Scaling** se disponível
   - Min instances: 1
   - Max instances: 3

2. **Resources**
   - CPU: 0.5 vCPU
   - Memory: 512MB
   - Storage: 1GB

### **🔒 Segurança**

1. **Rate Limiting**
   - Implementado no código do webhook
   - 100 requests/minute por IP

2. **Environment Variables**
   - Nunca commitar credenciais no código
   - Usar apenas variáveis de ambiente

## 📞 **SUPORTE**

Se tiver problemas:

1. **Logs da EasyPanel**: Primeira verificação
2. **Health Check**: Verificar se o serviço está respondendo
3. **Network**: Verificar conectividade com Evolution API e Supabase
4. **CORS**: Verificar se frontend pode conectar

---

## 🎉 **CONCLUSÃO**

Após seguir este guia, você terá:

✅ Webhook server rodando na EasyPanel  
✅ WebSocket funcionando  
✅ Integração com Evolution API  
✅ Conexão com Supabase  
✅ Health checks configurados  
✅ CORS configurado  
✅ Domínio personalizado  

**URL final**: `https://webhook.bkcrm.devsible.com.br` 