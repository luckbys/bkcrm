#!/bin/sh
node /app/webhook-evolution-websocket.js &
nginx -g "daemon off;"
