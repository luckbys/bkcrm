#!/bin/sh

# Script de inicialização para container unificado BKCRM
# Frontend (React/Nginx) + Backend (WebSocket/Node.js)

echo "🚀 Iniciando BKCRM Unified Container..."
echo "📅 $(date)"
echo "🌍 Environment: ${NODE_ENV:-development}"

# Verificar se aplicação WebSocket existe
if [ ! -f "/app/websocket/webhook-evolution-websocket.js" ]; then
    echo "❌ Arquivo WebSocket não encontrado: /app/websocket/webhook-evolution-websocket.js"
    exit 1
fi

# Verificar se frontend existe
if [ ! -d "/usr/share/nginx/html" ]; then
    echo "❌ Diretório frontend não encontrado: /usr/share/nginx/html"
    exit 1
fi

# Iniciar WebSocket server em background
echo "⚡ Iniciando WebSocket Server..."
cd /app/websocket

# Verificar variáveis de ambiente necessárias
if [ -z "$SUPABASE_URL" ]; then
    echo "⚠️  SUPABASE_URL não definida, usando valor padrão"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "⚠️  SUPABASE_ANON_KEY não definida"
fi

# Iniciar servidor Node.js em background
node webhook-evolution-websocket.js &
WEBSOCKET_PID=$!

echo "🔗 WebSocket PID: $WEBSOCKET_PID"

# Aguardar WebSocket inicializar
echo "⏳ Aguardando WebSocket inicializar..."
sleep 5

# Verificar se WebSocket está rodando
if kill -0 $WEBSOCKET_PID 2>/dev/null; then
    echo "✅ WebSocket Server iniciado com sucesso"
else
    echo "❌ Falha ao iniciar WebSocket Server"
    exit 1
fi

# Testar health check do WebSocket
echo "🏥 Testando health check..."
if command -v curl >/dev/null 2>&1; then
    for i in 1 2 3; do
        if curl -f http://localhost:4000/webhook/health >/dev/null 2>&1; then
            echo "✅ Health check OK"
            break
        else
            echo "⏳ Tentativa $i/3 - Aguardando WebSocket..."
            sleep 2
        fi
    done
else
    echo "⚠️  curl não disponível, pulando health check"
fi

# Configurar trap para cleanup
cleanup() {
    echo "🔄 Recebido sinal de terminação..."
    echo "🛑 Parando WebSocket Server (PID: $WEBSOCKET_PID)..."
    kill $WEBSOCKET_PID 2>/dev/null
    echo "🛑 Parando Nginx..."
    nginx -s quit
    echo "✅ Cleanup concluído"
    exit 0
}

trap cleanup TERM INT

# Iniciar nginx em foreground
echo "🌐 Iniciando Nginx..."
echo "📡 Frontend disponível na porta 80"
echo "⚡ WebSocket disponível em /socket.io/"
echo "🔗 Health check disponível em /health"
echo "📊 Webhook endpoints disponíveis em /webhook/"
echo ""
echo "🎉 BKCRM Unified Container iniciado com sucesso!"

# Verificar configuração nginx
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração nginx"
    exit 1
fi

# Iniciar nginx em foreground (não em daemon mode)
exec nginx -g "daemon off;" 