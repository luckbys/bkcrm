# 🚀 Evolution Webhook Server

Servidor webhook para integração automática entre Evolution API e CRM, processando mensagens WhatsApp em tempo real.

## 📋 Recursos

- ✅ Recepção automática de webhooks Evolution API
- ✅ Processamento de mensagens MESSAGES_UPSERT
- ✅ Criação automática de tickets no CRM
- ✅ Integração com Supabase
- ✅ Health check endpoint
- ✅ Logs estruturados

## 🚀 Deploy no EasyPanel

### Via GitHub (Recomendado)

1. **Fork/Clone este repositório**
2. **No EasyPanel Dashboard:**
   - Create New Application
   - From Git Repository
   - URL: `https://github.com/seu-usuario/bkcrm.git`
   - Branch: `main`
   - Build: `Dockerfile`

### Configurações

#### Variáveis de Ambiente:
```
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=sua_api_key_aqui
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=sua_chave_supabase_aqui
```

#### Domínio:
- **Host**: `bkcrm.devsible.com.br`
- **Path**: `/webhook`
- **Port**: `4000`

## 🔗 Endpoints

- **Webhook**: `POST /webhook/evolution`
- **Health**: `GET /health`
- **Status**: `GET /`

## 📱 Teste

```bash
# Health check
curl https://bkcrm.devsible.com.br/webhook/health

# Resposta esperada:
{
  "status": "healthy",
  "service": "Evolution Webhook Integration",
  "timestamp": "2025-06-13T..."
}
```

## 🔧 Configurar Evolution API

Após deploy, configure os webhooks:

```bash
node configurar-webhooks-local.js
```

## 📊 Monitoramento

- Logs em tempo real no EasyPanel
- Health check automático
- Métricas de performance

---

**🎯 Status**: Pronto para produção  
**🔗 URL**: https://bkcrm.devsible.com.br/webhook/evolution 