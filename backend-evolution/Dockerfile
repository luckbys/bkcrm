# Dockerfile para Webhook Evolution API + WebSocket
FROM node:18-alpine

WORKDIR /app

# Copiar package.json específico do webhook
COPY webhook-package.json package.json

# Instalar dependências
RUN npm install --production

# Copiar arquivo do webhook
COPY webhook-evolution-websocket.cjs ./

# Expor porta 4000
EXPOSE 4000

# Comando para iniciar webhook
CMD ["node", "webhook-evolution-websocket.cjs"] 