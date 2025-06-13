# ✅ Checklist: Commit GitHub + Deploy EasyPanel

## 📁 Arquivos Essenciais Prontos ✅

- [x] `Dockerfile` - Container simplificado e robusto
- [x] `webhook-evolution-complete.js` - Servidor webhook principal  
- [x] `package.json` - Dependências Node.js
- [x] `.dockerignore` - Otimização de build
- [x] `.gitignore` - Arquivos ignorados pelo Git
- [x] `README-WEBHOOK.md` - Documentação do webhook
- [x] `DEPLOY_GITHUB_EASYPANEL.md` - Guia completo

## 🔧 Passo 1: Commit no GitHub

### 1.1 Verificar Status Git
```bash
git status
```

### 1.2 Adicionar Arquivos Novos/Modificados
```bash
git add Dockerfile
git add webhook-evolution-complete.js
git add .dockerignore
git add .gitignore
git add README-WEBHOOK.md
git add DEPLOY_GITHUB_EASYPANEL.md
```

**Ou adicionar tudo:**
```bash
git add .
```

### 1.3 Fazer Commit
```bash
git commit -m "feat: Add Evolution webhook server for EasyPanel deploy

- ✅ Dockerfile otimizado para produção
- ✅ Servidor webhook sem dependência de .env
- ✅ Configuração via variáveis de ambiente
- ✅ Health check e logs estruturados
- ✅ Pronto para deploy no EasyPanel via GitHub"
```

### 1.4 Push para GitHub
```bash
git push origin main
```

## 🚀 Passo 2: Deploy no EasyPanel

### 2.1 Acessar EasyPanel Dashboard
- URL: Seu painel EasyPanel
- Login com suas credenciais

### 2.2 Criar Nova Aplicação
1. **Clicar em "Create New Application"**
2. **Escolher "From Git Repository"**

### 2.3 Configurar Git Repository
- **Repository URL**: `https://github.com/seu-usuario/bkcrm.git`
- **Branch**: `main`
- **Build Context**: Root directory
- **Dockerfile**: `Dockerfile`

### 2.4 Configurações da App
- **Application Name**: `evolution-webhook`
- **Type**: `Web Application`
- **Port**: `4000`

### 2.5 Variáveis de Ambiente
Adicionar essas variáveis:

```
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
```

### 2.6 Configurar Domínio
- **Domain**: `bkcrm.devsible.com.br`
- **Path**: `/webhook`
- **SSL**: ✅ Habilitado
- **Port**: `4000`

### 2.7 Health Check
- **Path**: `/health`
- **Port**: `4000`
- **Interval**: `30s`

## 🚀 Passo 3: Deploy

1. **Clicar em "Deploy"**
2. **Aguardar build (logs em tempo real)**
3. **Verificar container iniciado**

### Build Esperado:
```
📦 Cloning from GitHub...
🔨 Building Docker image...
📥 Installing dependencies...
🚀 Starting container...
✅ Health check OK
🌐 Application deployed successfully
```

## ✅ Passo 4: Teste

### 4.1 Health Check
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

### 4.2 Logs da Aplicação
- No EasyPanel, ir em "Logs"
- Verificar se está funcionando

### 4.3 Teste do Endpoint
```bash
curl -X POST https://bkcrm.devsible.com.br/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{"event":"CONNECTION_UPDATE","instance":"test"}'
```

## 🔧 Passo 5: Configurar Evolution API

Execute localmente:
```bash
node configurar-webhooks-local.js
```

Isso vai configurar a Evolution API para enviar webhooks para:
`https://bkcrm.devsible.com.br/webhook/evolution`

## 🎯 URLs Finais

Após deploy bem-sucedido:

- **Webhook**: `https://bkcrm.devsible.com.br/webhook/evolution`
- **Health**: `https://bkcrm.devsible.com.br/webhook/health`
- **Status**: `https://bkcrm.devsible.com.br/webhook/`
- **EasyPanel App**: `https://evolution-webhook.seu-easypanel.com`

## 🔄 Atualizações Futuras

### Workflow Automático:
1. Modificar código localmente
2. `git add . && git commit -m "update: ..." && git push`
3. EasyPanel detecta push e faz deploy automático
4. Aplicação atualizada em produção

## ⚠️ Troubleshooting

### Build falha:
- Verificar Dockerfile na raiz do repositório
- Confirmar package.json válido
- Checar logs de build no EasyPanel

### Container não inicia:
- Verificar variáveis de ambiente
- Confirmar porta 4000 exposta
- Checar logs da aplicação

### 404 no webhook:
- Verificar configuração de domínio
- Aguardar propagação DNS/SSL
- Testar health check primeiro

---

## 🎉 Resultado Final

✅ **Webhook funcionando em produção**  
✅ **Deploy automático via GitHub**  
✅ **Evolution API configurada**  
✅ **Sistema pronto para receber mensagens WhatsApp**  

**🚀 Agora é só fazer o commit e deploy!** 