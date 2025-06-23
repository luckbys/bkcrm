# 🚨 SOLUÇÃO COMPLETA: ERRO EISDIR NO DOCKER

## ❌ PROBLEMA IDENTIFICADO
```
EISDIR: illegal operation on a directory, open '/etc/easypanel/projects/press/bkcrm-websocket/code/node_modules/@socket.io/'
```

**Causa:** O ZIP continha pastas aninhadas que o Docker tentou abrir como arquivos.

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. 📁 ESTRUTURA CORRETA DO ZIP
O arquivo `webhook-corrigido-final.zip` agora contém apenas:
```
webhook-corrigido-final.zip
├── webhook-evolution-websocket.js
├── package.json
└── Dockerfile.websocket
```

### 2. 🔧 DOCKERFILE CORRIGIDO
```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package.json ./
RUN npm ci --only=production
COPY webhook-evolution-websocket.js ./
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app
USER nodejs
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/webhook/health || exit 1
EXPOSE 4000
CMD ["node", "webhook-evolution-websocket.js"]
```

## 🚀 INSTRUÇÕES DE DEPLOY

### PASSO 1: Upload do ZIP Correto
1. Acesse o EasyPanel VPS
2. Vá para o projeto `bkcrm`
3. Encontre o container `bkcrm-websocket`
4. Faça upload do arquivo: `webhook-corrigido-final.zip`

### PASSO 2: Configuração do Build
1. **Build Command:** `docker build -t webhook-server .`
2. **Port:** `4000`
3. **Environment Variables:**
   ```
   SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
   EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
   ```

### PASSO 3: Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Verifique os logs para confirmar sucesso

## 🧪 TESTE PÓS-DEPLOY

### Teste 1: Health Check
```bash
curl https://bkcrm.devsible.com.br/webhook/health
```
**Resultado esperado:**
```json
{
  "status": "healthy",
  "server": "webhook-evolution-websocket",
  "websocket": "active",
  "endpoints": ["POST /webhook/evolution", "GET /webhook/health"]
}
```

### Teste 2: WebSocket
```bash
curl https://ws.bkcrm.devsible.com.br/webhook/health
```
**Resultado esperado:**
```json
{
  "status": "healthy",
  "connections": 0,
  "tickets": {}
}
```

### Teste 3: Mensagem WhatsApp
Execute no console do navegador:
```javascript
// Teste de mensagem WhatsApp
fetch('https://bkcrm.devsible.com.br/webhook/evolution', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: { remoteJid: '5511999999999@s.whatsapp.net', fromMe: false },
      message: { conversation: 'Teste deploy corrigido' },
      pushName: 'Cliente Teste'
    }
  })
})
.then(r => r.json())
.then(data => console.log('Resultado:', data));
```

**Resultado esperado:**
```json
{
  "received": true,
  "processed": true,
  "event": "MESSAGES_UPSERT",
  "ticketId": "uuid-gerado",
  "websocket": true,
  "message": "Mensagem processada com sucesso"
}
```

## 🔍 TROUBLESHOOTING

### Se o erro EISDIR persistir:
1. **Limpe o container:** Delete e recrie o container
2. **Verifique o ZIP:** Extraia e confirme a estrutura
3. **Use Dockerfile simples:** Sem COPY de pastas

### Se o build falhar:
1. **Verifique logs:** EasyPanel mostra erros detalhados
2. **Teste local:** `docker build -t test .`
3. **Verifique dependências:** package.json correto

### Se o webhook não funcionar:
1. **Verifique credenciais:** SUPABASE_URL e KEY
2. **Teste health check:** `/webhook/health`
3. **Verifique logs:** Container logs no EasyPanel

## 📋 CHECKLIST FINAL

- [ ] ZIP criado com estrutura correta
- [ ] Dockerfile corrigido
- [ ] Upload feito no EasyPanel
- [ ] Build executado com sucesso
- [ ] Health check responde
- [ ] WebSocket conecta
- [ ] Mensagens WhatsApp processam
- [ ] Notificações aparecem no CRM

## 🎯 RESULTADO ESPERADO

Após o deploy correto:
- ✅ Webhook processa mensagens WhatsApp
- ✅ WebSocket envia notificações em tempo real
- ✅ CRM recebe mensagens instantaneamente
- ✅ Sistema 100% bidirecional funcionando

---

**📁 Arquivo ZIP:** `webhook-corrigido-final.zip`
**🔧 Dockerfile:** Corrigido para evitar EISDIR
**🚀 Status:** Pronto para deploy 