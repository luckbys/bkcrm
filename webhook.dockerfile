# Dockerfile para Webhook Evolution API
# Para uso no EasyPanel como serviço separado
FROM node:18-alpine

# Instalar curl para health check
RUN apk add --no-cache curl

# Definir diretório de trabalho
WORKDIR /app

# Define build arguments
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY

# Set environment variables
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV NODE_ENV=production
ENV PORT=4000

# Criar um package.json específico para o webhook (sem type: module)
RUN echo '{\
  "name": "bkcrm-webhook",\
  "version": "1.0.0",\
  "private": true,\
  "main": "webhook-evolution-websocket.cjs",\
  "scripts": {\
    "start": "node webhook-evolution-websocket.cjs"\
  },\
  "dependencies": {\
    "express": "^4.18.2",\
    "socket.io": "^4.7.2",\
    "cors": "^2.8.5",\
    "@supabase/supabase-js": "^2.39.0",\
    "axios": "^1.6.2",\
    "dotenv": "^16.3.1"\
  }\
}' > package.json

# Instalar dependências de produção
RUN npm install --omit=dev

# Copy source files
COPY webhook-evolution-websocket.cjs ./

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S webhook -u 1001

# Mudar ownership dos arquivos
RUN chown -R webhook:nodejs /app
USER webhook

# Expor porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/webhook/health || exit 1

# Comando para iniciar o webhook
CMD ["node", "webhook-evolution-websocket.cjs"] 