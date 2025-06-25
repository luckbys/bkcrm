#!/bin/bash
set -e

echo "=== BKCRM Starting ==="

echo "Starting WebSocket..."
cd /app
node webhook-evolution-websocket.js &

echo "Waiting..."
sleep 10

echo "Starting Nginx..."
nginx -g 'daemon off;' &

echo "Ready!"
wait
