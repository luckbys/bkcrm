FROM node:18-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files primeiro
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar todos os arquivos do projeto
COPY . .

# Expor porta
EXPOSE 4000

# Health check simples
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Comando para iniciar
CMD ["node", "webhook-evolution-complete-corrigido.cjs"] 