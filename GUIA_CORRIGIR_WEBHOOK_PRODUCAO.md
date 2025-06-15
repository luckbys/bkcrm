# 🔧 Guia: Corrigir Webhook de Produção

## 📋 **SITUAÇÃO ATUAL**

✅ **FUNCIONANDO:**
- Evolution API enviando mensagens
- Webhook de produção recebendo mensagens
- Endpoints configurados corretamente

❌ **PROBLEMAS:**
- Credenciais do Supabase inválidas no servidor de produção
- Mensagens não sendo salvas no banco de dados

## 🎯 **SOLUÇÃO COMPLETA**

### **PASSO 1: Arquivos Atualizados**

Os seguintes arquivos foram corrigidos localmente:
- ✅ `webhook-evolution-complete.js` (credenciais corretas)
- ✅ `webhook-producao.env` (configuração para produção)

### **PASSO 2: Upload para Servidor de Produção**

1. **Acesse seu EasyPanel:**
   - URL: https://press-evolution-api.jhkbgs.easypanel.host
   - Vá para o projeto do webhook

2. **Faça upload dos arquivos atualizados:**
   - `webhook-evolution-complete.js` (arquivo principal corrigido)
   - `webhook-producao.env` (novas variáveis de ambiente)

### **PASSO 3: Atualizar Variáveis de Ambiente**

No EasyPanel, configure estas variáveis de ambiente:

```env
WEBHOOK_PORT=4000
NODE_ENV=production
BASE_URL=https://bkcrm.devsible.com.br

# Evolution API
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# Supabase - CREDENCIAIS CORRETAS
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU

# Segurança
WEBHOOK_SECRET=evolution_webhook_secret_2024
ALLOWED_ORIGINS=https://bkcrm.devsible.com.br,https://press-evolution-api.jhkbgs.easypanel.host
```

### **PASSO 4: Reiniciar Webhook**

1. No EasyPanel, reinicie o serviço do webhook
2. Aguarde alguns segundos para inicialização
3. Verifique se está rodando na porta 4000

### **PASSO 5: Testar Funcionamento**

Após atualizar, teste:

```bash
# Testar health check
curl https://bkcrm.devsible.com.br/webhook/health

# Testar processamento (execute localmente)
node corrigir-webhook-producao.js
```

## 🔍 **VERIFICAÇÃO DE SUCESSO**

Quando funcionar, você verá:

```json
{
  "received": true,
  "timestamp": "2025-06-15T23:xx:xx.xxxZ",
  "event": "MESSAGES_UPSERT",
  "processed": true,
  "message": "Mensagem processada com sucesso"
}
```

## 🚨 **ALTERNATIVA RÁPIDA**

Se não conseguir acessar o EasyPanel agora, você pode:

1. **Configurar webhook local temporariamente:**
   ```bash
   # Instalar ngrok
   npm install -g ngrok
   
   # Expor porta 4000
   ngrok http 4000
   
   # Usar URL do ngrok no Evolution API
   ```

2. **Reconfigurar Evolution API para localhost:**
   ```bash
   node CORRIGIR_EVOLUTION_SIMPLIFICADO.js
   ```

## 📞 **TESTE FINAL**

Após corrigir, envie uma mensagem WhatsApp para:
**5512981022013** (Lucas Borges)

A mensagem deve aparecer automaticamente no seu CRM!

## 🎯 **RESULTADO ESPERADO**

✅ Mensagem chega no webhook  
✅ Ticket é criado automaticamente  
✅ Mensagem é salva no banco  
✅ Aparece no frontend do CRM  

---

**📝 Nota:** As credenciais do Supabase foram corrigidas e testadas. O problema é apenas no servidor de produção que ainda usa credenciais antigas. 