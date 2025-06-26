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

# Copy package files
COPY package*.json ./

# Instalar dependências de produção
RUN npm install --omit=dev

# Copy source files
COPY webhook-evolution-websocket.cjs ./
COPY .env* ./

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S webhook -u 1001

# Mudar ownership dos arquivos
RUN chown -R webhook:nodejs /app
USER webhook

# Expor porta do webhook
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/webhook/health || exit 1

# Start the webhook server
CMD ["node", "webhook-evolution-websocket.cjs"] 