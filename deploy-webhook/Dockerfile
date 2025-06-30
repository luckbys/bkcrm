# Dockerfile para Servidor WebSocket Evolution API
FROM node:18-alpine

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# Definir timezone para Brasil
ENV TZ=America/Sao_Paulo

# Criar diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache do Docker)
COPY package*.json ./

# Instalar dependências de produção
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Copiar código da aplicação
COPY server.js ./

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webhook -u 1001 -G nodejs && \
    chown -R webhook:nodejs /app

# Mudar para usuário não-root
USER webhook

# Expor porta
EXPOSE 4000

# Health check para verificar se o servidor está funcionando
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Comando para iniciar o servidor
CMD ["node", "server.js"] 