#!/bin/bash
set -e

echo "=== Iniciando BKCRM System ==="

# Verificar arquivos
echo "Verificando arquivos frontend..."
ls -la /usr/share/nginx/html/ | head -10

echo "Verificando arquivos backend..."
ls -la /app/

# Criar diretÃ³rios necessÃ¡rios se nÃ£o existirem
mkdir -p /var/log/nginx
mkdir -p /var/cache/nginx

# Testar configuraÃ§Ã£o nginx
echo "Testando configuraÃ§Ã£o nginx..."
nginx -t

# Iniciar webhook em background
echo "Iniciando WebSocket na porta 4000..."
cd /app
node webhook-evolution-websocket.js &
WEBHOOK_PID=$!

# Aguardar webhook inicializar
echo "Aguardando WebSocket inicializar..."
sleep 10

# Verificar se webhook estÃ¡ rodando
echo "Verificando WebSocket..."
for i in {1..5}; do
    if curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
        echo "âœ… WebSocket iniciado com sucesso"
        break
    else
        echo "â³ Tentativa $i/5 - Aguardando WebSocket..."
        sleep 3
    fi
done

# Verificar se webhook estÃ¡ realmente funcionando
if ! curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
    echo "âŒ WebSocket falhou ao iniciar"
    exit 1
fi

# Iniciar nginx
echo "Iniciando Nginx na porta 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Aguardar nginx inicializar
echo "Aguardando Nginx inicializar..."
sleep 5

# Verificar se nginx estÃ¡ funcionando
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "âœ… Nginx iniciado com sucesso"
    echo "ðŸŒ Frontend disponÃ­vel em: http://localhost/"
    echo "ðŸ”— WebSocket disponÃ­vel em: http://localhost/webhook/"
    echo "ðŸ¥ Health check: http://localhost/health"
else
    echo "âŒ Nginx falhou ao iniciar"
    exit 1
fi

echo "ðŸ“Š Processos ativos:"
echo "- WebSocket PID: $WEBHOOK_PID"
echo "- Nginx PID: $NGINX_PID"

echo "ðŸŽ‰ Sistema BKCRM iniciado com sucesso!"

# Monitorar processos
wait $WEBHOOK_PID $NGINX_PID
