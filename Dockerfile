FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S webhookuser -u 1001

# Copiar arquivo do webhook
COPY backend/webhooks/webhook-evolution-complete-corrigido.js ./webhook.js

# Verificar se o arquivo existe
RUN test -f webhook.js || (echo "❌ Arquivo webhook não encontrado" && exit 1)

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV WEBHOOK_PORT=4000
ENV BASE_URL=https://bkcrm.devsible.com.br
ENV EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
ENV EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
ENV SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
ENV SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU

# Mudar ownership dos arquivos
RUN chown -R webhookuser:nodejs /app
USER webhookuser

# Expor porta do webhook
EXPOSE 4000

# Health check para verificar se o webhook está funcionando
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/webhook/health || exit 1

# Comando para iniciar o webhook
CMD ["node", "webhook.js"]