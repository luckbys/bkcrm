# 🚨 SOLUÇÃO COMPLETA: ERRO COMANDO DOCKER INVÁLIDO

## ❌ PROBLEMA IDENTIFICADO
```
Command failed with exit code 1: docker buildx build --network host -f '/etc/easypanel/projects/press/bkcrm-websocket/code/docker build -t webhook-server' -t easypanel/press/bkcrm-websocket --label 'keep=true' --build-arg 'SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co' --build-arg 'SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImF1ZCI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU' --build-arg 'EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host' --build-arg 'EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11' --build-arg 'NODE_ENV=production' --build-arg 'GIT_SHA=undefined' /etc/easypanel/projects/press/bkcrm-websocket/code/
```

**Causa:** O Build Command está malformado no EasyPanel.

## ✅ SOLUÇÃO IMPLEMENTADA

### 🔧 CONFIGURAÇÃO CORRETA NO EASYPANEL

#### 1. Build Command (CORRIGIDO)
```
docker build -t webhook-server .
```

**❌ ERRADO (atual):**
```
docker build -t webhook-server
```

**✅ CORRETO:**
```
docker build -t webhook-server .
```

#### 2. Dockerfile Path
```
Dockerfile.websocket
```

#### 3. Port
```
4000
```

#### 4. Environment Variables
```
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImF1ZCI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
NODE_ENV=production
```

## 🚀 INSTRUÇÕES PASSO A PASSO

### PASSO 1: Acessar EasyPanel
1. Acesse o EasyPanel VPS
2. Vá para o projeto `bkcrm`
3. Encontre o container `bkcrm-websocket`

### PASSO 2: Configurar Build Command
1. Clique em "Settings" ou "Configurações"
2. Encontre a seção "Build"
3. **Build Command:** Digite exatamente: `docker build -t webhook-server .`
4. **Dockerfile:** Digite: `Dockerfile.websocket`
5. **Port:** Digite: `4000`

### PASSO 3: Configurar Environment Variables
1. Vá para a seção "Environment Variables"
2. Adicione cada variável:

```
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImF1ZCI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
NODE_ENV=production
```

### PASSO 4: Upload do ZIP
1. Faça upload do arquivo: `webhook-corrigido-final-v2.zip`
2. Aguarde a extração automática

### PASSO 5: Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Verifique os logs para confirmar sucesso

## 🔍 TROUBLESHOOTING

### Se o erro persistir:

#### 1. Verificar Build Command
- Certifique-se que termina com `.` (ponto)
- Não deve ter aspas extras
- Deve ser exatamente: `docker build -t webhook-server .`

#### 2. Verificar Dockerfile Path
- Deve ser: `Dockerfile.websocket`
- Não deve ter caminho completo

#### 3. Verificar Environment Variables
- Não deve ter espaços extras
- Valores devem estar corretos
- Não deve ter aspas desnecessárias

#### 4. Verificar ZIP
- Extraia e confirme que contém:
  - `webhook-evolution-websocket.js`
  - `package.json`
  - `Dockerfile.websocket`

## 🧪 TESTE PÓS-DEPLOY

### Teste 1: Health Check
```bash
curl https://bkcrm.devsible.com.br/webhook/health
```

### Teste 2: WebSocket
```bash
curl https://ws.bkcrm.devsible.com.br/webhook/health
```

### Teste 3: Mensagem WhatsApp
```javascript
// Execute no console do navegador
fetch('https://bkcrm.devsible.com.br/webhook/evolution', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: false },
      message: { conversation: 'Teste comando corrigido' },
      pushName: 'Cliente Teste'
    }
  })
})
.then(r => r.json())
.then(data => console.log('Resultado:', data));
```

## 📋 CHECKLIST FINAL

- [ ] Build Command corrigido: `docker build -t webhook-server .`
- [ ] Dockerfile Path: `Dockerfile.websocket`
- [ ] Port: `4000`
- [ ] Environment Variables configuradas
- [ ] ZIP v2 uploadado
- [ ] Deploy executado com sucesso
- [ ] Health check responde
- [ ] WebSocket conecta
- [ ] Mensagens WhatsApp processam

## 🎯 RESULTADO ESPERADO

Após a correção:
- ✅ Docker build sem erros de comando
- ✅ Container inicia corretamente
- ✅ Webhook processa mensagens WhatsApp
- ✅ WebSocket envia notificações em tempo real
- ✅ Sistema 100% bidirecional funcionando

---

**📁 Arquivo ZIP:** `webhook-corrigido-final-v2.zip`
**🔧 Correção:** Build Command corrigido no EasyPanel
**🚀 Status:** Pronto para deploy com comando correto 