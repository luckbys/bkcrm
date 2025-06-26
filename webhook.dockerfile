# Dockerfile para Webhook Evolution API
# Para uso no EasyPanel como serviço separado
FROM node:18-alpine

# Definir diretório de trabalho
WORKDIR /app

# Copiar apenas arquivos necessários para o webhook
COPY package.json package-lock.json ./

# Instalar dependências (incluindo as do webhook)
RUN npm ci --only=production

# Copiar arquivo principal do webhook
COPY webhook-evolution-websocket.cjs ./

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

# Comando para iniciar o webhook
CMD ["node", "webhook-evolution-websocket.cjs"] 