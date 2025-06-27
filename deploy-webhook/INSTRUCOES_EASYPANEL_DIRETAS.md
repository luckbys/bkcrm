# 🎯 INSTRUÇÕES DIRETAS - EASYPANEL

## ⚠️ PROBLEMA: Domínio em uso
```
Domain ws.bkcrm.devsible.com.br/ is already used in bkcrm/bkcrm-webhook service
```

## ✅ SOLUÇÃO RÁPIDA (2 opções)

### OPÇÃO 1: USAR NOVO DOMÍNIO (RECOMENDADO)

#### 1. Na tela atual do EasyPanel, trocar:
```
De: ws.bkcrm.devsible.com.br
Para: websocket.bkcrm.devsible.com.br
```

#### 2. Manter outras configurações:
```
Port: 4000
HTTPS: ✅ Ativo
Protocol: HTTP
Path: /
```

#### 3. Variáveis de ambiente (copy/paste):
```
PORT=4000
NODE_ENV=production
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
CORS_ORIGIN=https://bkcrm.devsible.com.br
```

#### 4. Clicar "Criar" e aguardar deploy

---

### OPÇÃO 2: REMOVER CONFLITO

#### 1. Cancelar essa tela
#### 2. Ir para: Services → bkcrm-webhook 
#### 3. Verificar se está sendo usado
#### 4. Se não estiver: Delete service
#### 5. Voltar e usar ws.bkcrm.devsible.com.br original

---

## 🌐 DNS (DEPOIS DO DEPLOY)

### Cloudflare:
```
Tipo: CNAME
Nome: websocket
Conteúdo: bkcrm.devsible.com.br  
Proxy: OFF (obrigatório!)
```

---

## 🧪 TESTE (1 MINUTO)

Após deploy, testar:
```
https://websocket.bkcrm.devsible.com.br/webhook/health
```

Deve retornar:
```json
{"status":"healthy","websocket":{"enabled":true}}
```

---

## ✅ PRONTO!

URLs finais:
- **Frontend**: https://bkcrm.devsible.com.br
- **WebSocket**: https://websocket.bkcrm.devsible.com.br  
- **Health**: https://websocket.bkcrm.devsible.com.br/webhook/health

**Frontend já atualizado para o novo domínio! 🎉** 