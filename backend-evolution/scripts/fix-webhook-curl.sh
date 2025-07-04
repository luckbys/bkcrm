#!/bin/bash

# 🔧 CORREÇÃO RÁPIDA DO WEBHOOK EVOLUTION API
# Execute: bash backend/scripts/fix-webhook-curl.sh

echo "🔧 [WEBHOOK-FIX] Corrigindo URL do webhook na Evolution API..."
echo "============================================================"

# Configurações
EVOLUTION_API_URL="https://evochat.devsible.com.br"
API_KEY="AE69F672-751C-41DC-81E7-86BF5074208E"
INSTANCE_NAME="atendimento-ao-cliente-suporte-n1"
WEBHOOK_URL="http://localhost:4000/webhook/evolution"

echo "📋 Configurações:"
echo "   API URL: $EVOLUTION_API_URL"
echo "   Instância: $INSTANCE_NAME"
echo "   Webhook URL: $WEBHOOK_URL"
echo ""

# 1. Verificar instância atual
echo "1️⃣ Verificando instância atual..."
curl -s -X GET "$EVOLUTION_API_URL/instance/fetchInstances" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" | jq '.[].instance.instanceName' 2>/dev/null || echo "Instâncias encontradas (JSON)"

echo ""

# 2. Verificar webhook atual
echo "2️⃣ Verificando webhook atual..."
curl -s -X GET "$EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" | jq '.webhook.url' 2>/dev/null || echo "Webhook atual verificado"

echo ""

# 3. Configurar webhook correto
echo "3️⃣ Configurando webhook correto..."
WEBHOOK_CONFIG='{
  "enabled": true,
  "url": "'$WEBHOOK_URL'",
  "events": [
    "MESSAGES_UPSERT",
    "CONNECTION_UPDATE",
    "QRCODE_UPDATED"
  ],
  "webhook_by_events": false,
  "webhook_base64": false
}'

echo "📤 Enviando configuração:"
echo "$WEBHOOK_CONFIG"
echo ""

RESPONSE=$(curl -s -w "%{http_code}" -X POST "$EVOLUTION_API_URL/webhook/set/$INSTANCE_NAME" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_CONFIG")

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "📨 Resposta HTTP: $HTTP_CODE"
echo "📋 Resposta: $RESPONSE_BODY"

if [[ "$HTTP_CODE" =~ ^(200|201)$ ]]; then
  echo "✅ [WEBHOOK-FIX] Webhook configurado com sucesso!"
else
  echo "❌ [WEBHOOK-FIX] Erro ao configurar webhook (HTTP $HTTP_CODE)"
fi

echo ""

# 4. Verificar configuração final
echo "4️⃣ Verificando configuração final..."
FINAL_CONFIG=$(curl -s -X GET "$EVOLUTION_API_URL/webhook/find/$INSTANCE_NAME" \
  -H "apikey: $API_KEY" \
  -H "Content-Type: application/json")

echo "📋 Configuração final:"
echo "$FINAL_CONFIG" | jq '.webhook' 2>/dev/null || echo "$FINAL_CONFIG"

echo ""

# 5. Testar webhook
echo "5️⃣ Testando webhook..."
TEST_PAYLOAD='{
  "event": "TEST",
  "instance": "'$INSTANCE_NAME'",
  "data": {
    "message": "Teste de configuração do webhook",
    "timestamp": "'$(date -Iseconds)'"
  }
}'

TEST_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD" \
  --connect-timeout 5 \
  --max-time 10)

TEST_HTTP_CODE="${TEST_RESPONSE: -3}"
TEST_RESPONSE_BODY="${TEST_RESPONSE%???}"

echo "🧪 Teste HTTP: $TEST_HTTP_CODE"
echo "🧪 Resposta: $TEST_RESPONSE_BODY"

if [[ "$TEST_HTTP_CODE" =~ ^(200|201)$ ]]; then
  echo "✅ [WEBHOOK-FIX] Teste do webhook bem-sucedido!"
else
  echo "⚠️ [WEBHOOK-FIX] Erro no teste do webhook (HTTP $TEST_HTTP_CODE)"
  echo "💡 Certifique-se de que o servidor WebSocket está rodando na porta 4000"
fi

echo ""
echo "============================================================"
echo "🎉 [WEBHOOK-FIX] Correção concluída!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Verificar se servidor WebSocket está rodando (porta 4000)"
echo "2. Enviar mensagem de teste via WhatsApp"
echo "3. Verificar logs do servidor WebSocket"
echo "4. Confirmar se mensagens aparecem no CRM"
echo ""
echo "🔗 URLs importantes:"
echo "   Webhook: $WEBHOOK_URL"
echo "   Health: http://localhost:4000/webhook/health"
echo "   Evolution API: $EVOLUTION_API_URL" 