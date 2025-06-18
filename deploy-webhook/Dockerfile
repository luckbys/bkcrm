FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files primeiro (para cache layer)
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copiar todos os arquivos necessários
COPY webhook-evolution-complete-corrigido.cjs ./
COPY webhook.env ./

# Verificar se o arquivo existe
RUN test -f webhook-evolution-complete-corrigido.cjs || (echo "❌ Arquivo webhook-evolution-complete-corrigido.cjs não encontrado" && exit 1)

# Mudar ownership dos arquivos
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expor porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Comando para iniciar
CMD ["node", "webhook-evolution-complete-corrigido.cjs"] 