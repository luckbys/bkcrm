# Deploy Webhook Fix - Resolver Erro 404 Evolution API

## Problema Resolvido
A Evolution API estava enviando webhooks para `/connection-update` mas o endpoint não existia, causando erro 404.

## Solução Implementada
✅ Adicionado endpoint `/connection-update` no webhook
✅ Testado localmente - funcionando perfeitamente
❌ Precisa deploy em produção

## Files Atualizados
- `backend/webhooks/webhook-evolution-websocket.js` - Endpoint principal adicionado
- `test-connection-endpoint.cjs` - Script de teste

## Deploy Steps

### 1. Upload do arquivo atualizado
Fazer upload do arquivo `webhook-evolution-websocket.js` para o servidor VPS/EasyPanel

### 2. Reiniciar o serviço
```bash
# No servidor de produção
pm2 restart webhook
# ou
systemctl restart webhook-service
```

### 3. Verificar funcionamento
```bash
curl -X POST https://websocket.bkcrm.devsible.com.br/connection-update \
  -H "Content-Type: application/json" \
  -d '{"instance":"test","data":{"state":"open"}}'
```

## Resultado Esperado
✅ Evolution API para de mostrar erros 404
✅ Webhooks de connection-update funcionam
✅ Status de conexão atualizado em tempo real

## URLs Corrigidas
- ❌ Antes: `https://websocket.bkcrm.devsible.com.br/connection-update` → 404
- ✅ Depois: `https://websocket.bkcrm.devsible.com.br/connection-update` → 200

## Logs Esperados na Evolution API
```
✅ [WebhookController] Connection update sent successfully
✅ Status: 200, Response: {"status":"connected","message":"WhatsApp conectado"}
```

## Teste Local Funcionando
```json
{
  "instance": "test-instance",
  "status": "connected", 
  "message": "WhatsApp conectado e pronto",
  "broadcast": true,
  "endpoint": "/connection-update (PRINCIPAL)"
}
``` 