#!/bin/sh

echo "🚀 Iniciando BKCRM Frontend + Webhook..."

# Função para log colorido
log() {
  echo "$(date '+%Y-%m-%d %H:%M:%S') $1"
}

log "📋 Iniciando serviços..."

# Iniciar webhook em background
log "🔗 Iniciando Webhook na porta 4000..."
node webhook-evolution-websocket.cjs &
WEBHOOK_PID=$!

# Aguardar um momento para webhook inicializar
sleep 3

# Verificar se webhook está funcionando
if curl -s http://localhost:4000/webhook/health > /dev/null; then
  log "✅ Webhook iniciado com sucesso (PID: $WEBHOOK_PID)"
else
  log "❌ Erro ao iniciar webhook"
  exit 1
fi

# Iniciar frontend
log "🌐 Iniciando Frontend na porta 3000..."
npx serve -s dist -l 3000 &
FRONTEND_PID=$!

# Aguardar um momento para frontend inicializar
sleep 3

# Verificar se frontend está funcionando
if curl -s http://localhost:3000 > /dev/null; then
  log "✅ Frontend iniciado com sucesso (PID: $FRONTEND_PID)"
else
  log "❌ Erro ao iniciar frontend"
  kill $WEBHOOK_PID 2>/dev/null
  exit 1
fi

log "🎉 Ambos serviços iniciados com sucesso!"
log "🌐 Frontend: http://localhost:3000"
log "🔗 Webhook: http://localhost:4000"
log "📊 Health Check: http://localhost:4000/webhook/health"

# Função para cleanup
cleanup() {
  log "⛔ Parando serviços..."
  kill $WEBHOOK_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  log "✅ Serviços parados"
  exit 0
}

# Capturar sinais para graceful shutdown
trap cleanup SIGTERM SIGINT

# Manter container rodando e monitorar processos
while true; do
  # Verificar se webhook ainda está rodando
  if ! kill -0 $WEBHOOK_PID 2>/dev/null; then
    log "❌ Webhook parou inesperadamente"
    cleanup
  fi
  
  # Verificar se frontend ainda está rodando
  if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    log "❌ Frontend parou inesperadamente"
    cleanup
  fi
  
  sleep 30
done 