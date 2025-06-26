#!/bin/bash

echo "🚀 Deploy do Webhook BKCRM - Evolution API + WebSocket"
echo "=================================================="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale o Docker primeiro."
    exit 1
fi

# Parar container existente se houver
echo "⛔ Parando container webhook existente..."
docker stop bkcrm-webhook 2>/dev/null || true
docker rm bkcrm-webhook 2>/dev/null || true

# Build da imagem
echo "🔨 Fazendo build da imagem webhook..."
docker build -f webhook.dockerfile -t bkcrm-webhook:latest .

if [ $? -ne 0 ]; then
    echo "❌ Erro no build da imagem"
    exit 1
fi

# Executar container
echo "🚀 Iniciando container webhook..."
docker run -d \
  --name bkcrm-webhook \
  --restart unless-stopped \
  -p 4000:4000 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  bkcrm-webhook:latest

if [ $? -eq 0 ]; then
    echo "✅ Webhook implantado com sucesso!"
    echo ""
    echo "📋 Informações do Deploy:"
    echo "🔗 Health Check: http://localhost:4000/webhook/health"
    echo "📡 WebSocket: ws://localhost:4000"
    echo "🎯 Webhook URL: http://localhost:4000/webhook/evolution"
    echo ""
    echo "📊 Status do Container:"
    docker ps | grep bkcrm-webhook
    echo ""
    echo "🔍 Para ver logs: docker logs bkcrm-webhook"
    echo "⛔ Para parar: docker stop bkcrm-webhook"
    
    # Aguardar um momento e testar
    echo "⏳ Aguardando inicialização..."
    sleep 5
    
    echo "🧪 Testando health check..."
    curl -s http://localhost:4000/webhook/health | head -100
else
    echo "❌ Erro ao iniciar o container"
    exit 1
fi 