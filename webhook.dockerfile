# Dockerfile para Webhook Evolution API
# Para uso no EasyPanel como serviço separado
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

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
CMD ["npm", "run", "webhook"] 