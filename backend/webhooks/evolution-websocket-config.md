# 🔗 CONFIGURAÇÃO WEBSOCKET EVOLUTION API + BKCRM

## 📋 RESUMO DO PROBLEMA

Baseado na análise dos logs e testes, o problema é que:

1. **WebSocket BKCRM** está funcionando (porta 4000) ✅
2. **Evolution API** está respondendo mas sem WebSocket ❌
3. **Mensagens não chegam** porque não há integração WebSocket ❌

## 🔧 CONFIGURAÇÃO EVOLUTION API WEBSOCKET

### 1. Ativar WebSocket na Evolution API

Na Evolution API, você precisa configurar as seguintes variáveis de ambiente:

```bash
# Ativar WebSocket
WEBSOCKET_ENABLED=true

# Modo Global (recomendado para múltiplas instâncias)
WEBSOCKET_GLOBAL_EVENTS=true

# Ou Modo Tradicional (uma instância por vez)
WEBSOCKET_GLOBAL_EVENTS=false
```

### 2. URLs de Conexão

**Modo Global:**
```
wss://press-evolution-api.jhkbgs.easypanel.host
```

**Modo Tradicional:**
```
wss://press-evolution-api.jhkbgs.easypanel.host/atendimento-ao-cliente-suporte
```

### 3. Configurar Webhook URL na Evolution API

Configure o webhook da Evolution API para apontar para seu sistema BKCRM:

```bash
curl -X POST "https://press-evolution-api.jhkbgs.easypanel.host/webhook/set/atendimento-ao-cliente-suporte" \
  -H "Content-Type: application/json" \
  -H "apikey: SUA_API_KEY" \
  -d '{
    "url": "http://localhost:4000/webhook/evolution",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": [
      "APPLICATION_STARTUP",
      "QRCODE_UPDATED", 
      "CONNECTION_UPDATE",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
      "SEND_MESSAGE"
    ]
  }'
```

## 🚀 SOLUÇÃO IMPLEMENTADA

### Arquivo: `evolution-websocket-bridge.js`

Criei um bridge que conecta:
- **Evolution API WebSocket** → **Sistema BKCRM**
- **Mensagens WhatsApp** → **WebSocket BKCRM em tempo real**

### Como Funciona:

1. **Cliente WebSocket** conecta na Evolution API
2. **Escuta eventos** `messages.upsert` do WhatsApp
3. **Processa mensagens** e salva no Supabase
4. **Envia via WebSocket** para o frontend BKCRM
5. **Atualização em tempo real** no chat

## 📱 CONFIGURAÇÃO NO FRONTEND

No arquivo `useWebSocketMessages.ts`, a URL já está configurada:

```typescript
const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://ws.bkcrm.devsible.com.br'
  : 'http://localhost:4000';
```

## 🔄 FLUXO COMPLETO

### Recebimento de Mensagem WhatsApp:
```
WhatsApp → Evolution API → WebSocket Evolution → 
Bridge BKCRM → Supabase → WebSocket BKCRM → Frontend
```

### Envio de Mensagem:
```
Frontend → WebSocket BKCRM → Evolution API → WhatsApp
```

## ⚡ COMANDOS PARA ATIVAR

### 1. Parar webhook atual:
```bash
# Encontrar processo na porta 4000
netstat -ano | findstr :4000
# Matar processo (substitua PID)
taskkill /F /PID [PID_NUMBER]
```

### 2. Instalar dependências:
```bash
npm install socket.io-client
```

### 3. Iniciar sistema integrado:
```bash
# Opção 1: Usar webhook atual (já tem endpoints Evolution)
cd backend/webhooks
node webhook-evolution-websocket.js

# Opção 2: Usar versão integrada (recomendado)
node webhook-evolution-websocket-integrated.js
```

### 4. Iniciar cliente WebSocket Evolution:
```bash
# Em outro terminal
node backend/webhooks/evolution-websocket-client.js
```

## 🧪 TESTAR INTEGRAÇÃO

```bash
# Executar teste completo
node test-evolution-websocket.js
```

## 📊 STATUS ESPERADO

Após configuração:
- ✅ Health Check: OK
- ✅ WebSocket BKCRM: Conectado
- ✅ Evolution WebSocket: Conectado
- ✅ Mensagens WhatsApp: Tempo real
- ✅ Envio mensagens: Funcionando

## 🔧 TROUBLESHOOTING

### Problema: Evolution WebSocket não conecta
**Solução:** Verificar se `WEBSOCKET_ENABLED=true` na Evolution API

### Problema: Mensagens não chegam
**Solução:** Configurar webhook URL apontando para BKCRM

### Problema: Instância desconectada
**Solução:** Reconectar WhatsApp no painel Evolution API

### Problema: API Key inválida
**Solução:** Renovar API Key na Evolution API

## 🎯 PRÓXIMOS PASSOS

1. **Configurar Evolution API** com WebSocket habilitado
2. **Configurar webhook URL** apontando para sistema BKCRM
3. **Conectar instância WhatsApp** no painel Evolution API
4. **Testar fluxo completo** com mensagens reais
5. **Deploy no Easypanel** com configurações de produção

## 💡 DICAS IMPORTANTES

- Use **modo global** se tiver múltiplas instâncias
- Configure **webhook URL** corretamente
- Mantenha **API Key** segura
- Monitore **logs** para debugging
- Teste com **número real** do WhatsApp

## 🔗 LINKS ÚTEIS

- [Documentação Evolution WebSocket](https://doc.evolution-api.com/v2/pt/integrations/websocket)
- [Painel Evolution API](https://press-evolution-api.jhkbgs.easypanel.host)
- [Sistema BKCRM](http://localhost:3000)
- [Health Check](http://localhost:4000/webhook/health) 