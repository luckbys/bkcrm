#!/bin/bash
set -e

echo "Iniciando BKCRM System..."

echo "Verificando frontend..."
ls -la /usr/share/nginx/html/ | head -5

echo "Verificando backend..."
ls -la /app/

echo "Testando nginx..."
nginx -t

echo "Iniciando WebSocket..."
cd /app
node webhook-evolution-websocket.js &
WEBHOOK_PID=$!

sleep 10

echo "Verificando WebSocket..."
for i in {1..10}; do
    if curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
        echo "WebSocket OK"
        break
    else
        echo "Aguardando WebSocket... ($i/10)"
        sleep 2
    fi
done

echo "Iniciando Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

sleep 5

echo "Verificando Nginx..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Nginx OK"
else
    echo "Erro Nginx"
    exit 1
fi

echo "Sistema iniciado com sucesso!"
echo "Frontend: http://localhost/"
echo "WebSocket: http://localhost/webhook/"
echo "WebSocket PID: $WEBHOOK_PID"
echo "Nginx PID: $NGINX_PID"

wait $WEBHOOK_PID $NGINX_PID
