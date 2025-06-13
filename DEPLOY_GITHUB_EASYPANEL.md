# 🚀 Deploy via GitHub no EasyPanel

## 📋 Pré-requisitos

✅ Repositório GitHub criado  
✅ Arquivos do webhook commitados  
✅ EasyPanel com acesso ao GitHub  

## 📁 Arquivos Necessários no Repositório

Certifique-se que estes arquivos estão no seu repositório:

### Essenciais para Webhook:
- ✅ `Dockerfile` - Container para deploy
- ✅ `webhook-evolution-complete.js` - Servidor principal
- ✅ `package.json` - Dependências Node.js
- ✅ `.dockerignore` - Otimização do build

### Opcionais:
- ✅ `README-WEBHOOK.md` - Documentação
- ✅ `.gitignore` - Arquivos ignorados

## 🔗 Passo 1: Preparar Repositório

### 1.1 Commit dos Arquivos
```bash
git add .
git commit -m "Add Evolution webhook server for EasyPanel deploy"
git push origin main
```

### 1.2 Verificar Estrutura
```
seu-repositorio/
├── Dockerfile ✅
├── webhook-evolution-complete.js ✅
├── package.json ✅
├── .dockerignore ✅
├── .gitignore ✅
└── README-WEBHOOK.md ✅
```

## 🚀 Passo 2: Deploy no EasyPanel

### 2.1 Criar Nova Aplicação
1. **Acessar EasyPanel Dashboard**
2. **Clicar em "Create New Application"**
3. **Escolher "From Git Repository"**

### 2.2 Configurar Repositório
- **Repository URL**: `https://github.com/seu-usuario/bkcrm.git`
- **Branch**: `main` (ou `master`)
- **Build Command**: `docker build`
- **Dockerfile**: `Dockerfile`

### 2.3 Configurações da Aplicação
- **Name**: `evolution-webhook`
- **Type**: `Web Application`
- **Port**: `4000`

## ⚙️ Passo 3: Variáveis de Ambiente

Configure essas variáveis no EasyPanel:

```env
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
```

## 🌐 Passo 4: Configurar Domínio

### 4.1 Domínio e SSL
- **Domain**: `bkcrm.devsible.com.br`
- **Path**: `/webhook`
- **Port**: `4000`
- **SSL**: ✅ Habilitado (Let's Encrypt)

### 4.2 Health Check
- **Path**: `/health`
- **Port**: `4000`
- **Interval**: `30s`

## 🚀 Passo 5: Deploy

1. **Clicar em "Deploy"**
2. **Aguardar build da imagem Docker**
3. **Verificar logs em tempo real**

### Build Esperado:
```
✅ Cloning repository...
✅ Building Docker image...
✅ Installing dependencies...
✅ Starting container...
✅ Health check passing
```

## ✅ Passo 6: Verificação

### 6.1 Teste Health Check
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

### 6.2 Teste Endpoint Principal
```bash
curl https://bkcrm.devsible.com.br/webhook/evolution
```

## 🔄 Atualizações Automáticas

### Vantagens do Deploy via GitHub:
- ✅ **Auto-deploy** em push para main
- ✅ **Rollback** fácil para versões anteriores
- ✅ **Logs** de deploy detalhados
- ✅ **CI/CD** integrado

### Workflow:
```
Código Local → Git Push → GitHub → EasyPanel Auto-deploy → Produção
```

## 🛠️ Troubleshooting

### Build falha:
1. Verificar Dockerfile na raiz
2. Conferir package.json válido
3. Checar variáveis de ambiente

### Container não inicia:
1. Verificar logs no EasyPanel
2. Confirmar porta 4000 exposta
3. Testar health check local

### 404 no webhook:
1. Verificar configuração de domínio
2. Confirmar path `/webhook`
3. Aguardar propagação SSL

## 🎯 URLs Finais

Após deploy bem-sucedido:

- **Webhook**: `https://bkcrm.devsible.com.br/webhook/evolution`
- **Health**: `https://bkcrm.devsible.com.br/webhook/health`
- **Status**: `https://bkcrm.devsible.com.br/webhook/`

## 🚀 Próximos Passos

1. ✅ Deploy funcionando
2. 🔧 Configurar Evolution API:
   ```bash
   node configurar-webhooks-local.js
   ```
3. 📱 Testar com mensagem WhatsApp real
4. 🗄️ Corrigir banco de dados (se necessário)

---

**💡 Vantagem**: Deploy via GitHub é muito mais prático e permite atualizações automáticas! 