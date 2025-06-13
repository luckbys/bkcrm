# ✅ Checklist: Deploy Webhook Evolution API no EasyPanel

## 📁 Arquivos Preparados ✅

- [x] `webhook-evolution-complete.js` - Servidor webhook principal
- [x] `Dockerfile.webhook` - Container Docker otimizado
- [x] `webhook.env` - Variáveis de ambiente
- [x] `package.json` - Dependências Node.js
- [x] `docker-compose.webhook.yml` - Configuração de deploy

## 🚀 Passos para Deploy

### 1. Preparação Local ✅
- [x] Servidor webhook testado e funcionando
- [x] Arquivos de deploy criados
- [x] Configurações validadas

### 2. Upload para EasyPanel
- [ ] Acessar EasyPanel Dashboard
- [ ] Criar nova aplicação: "evolution-webhook"
- [ ] Fazer upload dos 5 arquivos acima
- [ ] Configurar Dockerfile: `Dockerfile.webhook`

### 3. Configurações da Aplicação
- [ ] **Porta**: `4000`
- [ ] **Tipo**: Web Application
- [ ] **Health Check**: `/health`

### 4. Variáveis de Ambiente
Configurar essas variáveis no EasyPanel:

```
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
```

### 5. Configuração de Domínio
- [ ] **Domínio**: `bkcrm.devsible.com.br`
- [ ] **Caminho**: `/webhook`
- [ ] **SSL**: Habilitado (Let's Encrypt)
- [ ] **Porta interna**: `4000`

### 6. Deploy
- [ ] Clicar em "Deploy"
- [ ] Aguardar build da imagem
- [ ] Verificar logs de inicialização

### 7. Testes
- [ ] Testar: `curl https://bkcrm.devsible.com.br/webhook/health`
- [ ] Verificar resposta JSON com status "healthy"
- [ ] Testar endpoint principal: `https://bkcrm.devsible.com.br/webhook/evolution`

### 8. Configurar Evolution API
- [ ] Executar: `node configurar-webhooks-local.js`
- [ ] Verificar configuração com: `node verificar-webhooks.js`

## 🎯 URLs Finais

Após deploy bem-sucedido:

- **Webhook**: `https://bkcrm.devsible.com.br/webhook/evolution`
- **Health**: `https://bkcrm.devsible.com.br/webhook/health`
- **Status**: `https://bkcrm.devsible.com.br/webhook/`

## 📱 Teste Final

1. Enviar mensagem WhatsApp para número conectado na Evolution API
2. Verificar logs do webhook no EasyPanel
3. Confirmar processamento da mensagem
4. Verificar criação de ticket no CRM

## 🚨 Se Algo Der Errado

### Container não inicia
- Verificar logs no EasyPanel
- Confirmar variáveis de ambiente
- Checar Dockerfile

### 404 no webhook
- Verificar configuração de domínio
- Confirmar caminho `/webhook`
- Aguardar propagação SSL

### Evolution API não conecta
- Verificar URL: `https://bkcrm.devsible.com.br/webhook/evolution`
- Confirmar API key e permissões
- Testar conexão manual

---

**💡 Dica**: Mantenha os logs do EasyPanel abertos durante o primeiro teste para monitorar em tempo real! 