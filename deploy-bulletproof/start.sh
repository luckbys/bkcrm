#!/bin/bash
set -e

echo "=== BKCRM STARTUP ==="

echo "Starting WebSocket server..."
cd /app
node webhook-evolution-websocket.js &

echo "Waiting for backend..."
sleep 10

echo "Starting Nginx..."
nginx -g 'daemon off;' &

echo "System ready!"
wait
