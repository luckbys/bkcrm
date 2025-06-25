#!/bin/bash
set -e

echo "Iniciando BKCRM..."

ls -la /usr/share/nginx/html/ | head -5
ls -la /app/

echo "Iniciando WebSocket na porta 4000..."
cd /app
node webhook-evolution-websocket.js &
WEBHOOK_PID=$!

sleep 5

if curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
    echo "WebSocket OK"
else
    echo "Erro WebSocket"
    exit 1
fi

echo "Iniciando Nginx na porta 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

sleep 3

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Nginx OK"
    echo "Frontend: http://localhost/"
    echo "WebSocket: http://localhost/webhook/"
else
    echo "Erro Nginx"
    exit 1
fi

echo "WebSocket PID: $WEBHOOK_PID"
echo "Nginx PID: $NGINX_PID"

wait $WEBHOOK_PID $NGINX_PID
