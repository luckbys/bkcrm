# 🚀 Guia de Deploy: Servidor Webhook no EasyPanel

## 📋 Pré-requisitos

✅ Servidor webhook funcionando localmente  
✅ EasyPanel configurado no VPS  
✅ Domínio `bkcrm.devsible.com.br` apontando para o VPS  
✅ Evolution API rodando e acessível  

## 📁 Arquivos Necessários

Você precisa fazer upload destes arquivos para o EasyPanel:

1. `webhook-evolution-complete.js` ✅ (já criado)
2. `Dockerfile.webhook` ✅ (já criado)  
3. `webhook.env` ✅ (já criado)
4. `package.json` ✅ (já existe)
5. `docker-compose.webhook.yml` (será criado abaixo)

## 🐳 Passo 1: Criar docker-compose.webhook.yml

Crie este arquivo na raiz do projeto:

```yaml
version: '3.8'

services:
  evolution-webhook:
    build:
      context: .
      dockerfile: Dockerfile.webhook
    container_name: evolution-webhook
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    env_file:
      - webhook.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.evolution-webhook.rule=Host(`bkcrm.devsible.com.br`) && PathPrefix(`/webhook`)"
      - "traefik.http.services.evolution-webhook.loadbalancer.server.port=4000"
      - "traefik.http.routers.evolution-webhook.tls.certresolver=letsencrypt"
```

## 🌐 Passo 2: Deploy no EasyPanel

### Opção A: Via Git Repository (Recomendado)

1. **Commit os arquivos para seu repositório Git:**
   ```bash
   git add .
   git commit -m "Add webhook server for EasyPanel deploy"
   git push origin main
   ```

2. **No EasyPanel Dashboard:**
   - Clique em "Create New Application"
   - Escolha "From Git Repository"
   - URL: `https://github.com/seu-usuario/bkcrm.git`
   - Branch: `main`
   - Build: `Dockerfile.webhook`

### Opção B: Via Upload de Arquivos

1. **No EasyPanel Dashboard:**
   - Clique em "Create New Application"
   - Escolha "Upload Files"
   - Faça upload dos 5 arquivos listados acima

## ⚙️ Passo 3: Configurar a Aplicação

### 3.1 Configurações Básicas
- **Nome**: `evolution-webhook`
- **Tipo**: `Web Application`
- **Porta**: `4000`
- **Dockerfile**: `Dockerfile.webhook`

### 3.2 Variáveis de Ambiente
Configure essas variáveis no EasyPanel:

```
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
WEBHOOK_SECRET=evolution_webhook_secret_2024
ALLOWED_ORIGINS=https://bkcrm.devsible.com.br,https://press-evolution-api.jhkbgs.easypanel.host
```

### 3.3 Domínio e SSL
- **Domínio**: `bkcrm.devsible.com.br`
- **Caminho**: `/webhook`
- **SSL**: Ativado (Let's Encrypt)
- **Porta interna**: `4000`

### 3.4 Health Check
- **Caminho**: `/health`
- **Porta**: `4000`
- **Intervalo**: `30s`

## 🚀 Passo 4: Deploy

1. Clique em "Deploy" no EasyPanel
2. Aguarde o build da imagem Docker
3. Verifique os logs para garantir que iniciou corretamente

## ✅ Passo 5: Verificação

### 5.1 Teste do Servidor
```bash
curl https://bkcrm.devsible.com.br/webhook/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "service": "Evolution Webhook Integration",
  "timestamp": "2025-06-13T..."
}
```

### 5.2 Teste do Endpoint Principal
```bash
curl https://bkcrm.devsible.com.br/webhook/evolution
```

## 🔧 Passo 6: Configurar Evolution API

Execute este comando para configurar os webhooks:

```bash
node configurar-webhooks-local.js
```

## 🏥 Monitoramento

### Logs da Aplicação
No EasyPanel:
- Vá para sua aplicação
- Clique em "Logs"
- Monitor em tempo real

### Métricas
- CPU e Memory usage
- Request count
- Response times

## 🚨 Troubleshooting

### Problema: Container não inicia
**Solução:** Verificar logs e variáveis de ambiente

### Problema: 404 no webhook
**Solução:** Verificar configuração do Traefik/proxy

### Problema: SSL não funciona
**Solução:** Verificar DNS e aguardar certificado Let's Encrypt

## 📊 URLs Finais

- **Webhook**: `https://bkcrm.devsible.com.br/webhook/evolution`
- **Health Check**: `https://bkcrm.devsible.com.br/webhook/health`
- **Status**: `https://bkcrm.devsible.com.br/webhook/`

## 🎉 Próximos Passos

1. ✅ Deploy feito com sucesso
2. 🔧 Configurar webhooks na Evolution API
3. 📱 Testar com mensagem real do WhatsApp
4. 🗄️ Corrigir banco de dados (se necessário)
5. 🚀 Sistema funcionando 100% 