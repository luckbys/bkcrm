FROM node:18-alpine

WORKDIR /app

# Copiar apenas arquivos necessários
COPY package.json ./
COPY webhook-evolution-websocket.cjs ./

# Instalar dependências (já estão no package.json principal)
RUN npm install express cors socket.io @supabase/supabase-js --production

# Expor porta 4000
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/webhook/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Iniciar webhook
CMD ["node", "webhook-evolution-websocket.cjs"] 