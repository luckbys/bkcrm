FROM node:18-alpine AS frontend-build

RUN apk add --no-cache curl bash

WORKDIR /app

# Copiar package.json primeiro
COPY package.deploy.json package.json
COPY package-lock.json* ./

# Instalar dependencias
RUN npm ci --silent

# Copiar arquivos de configuracao
COPY *.html ./
COPY *.ts ./
COPY *.js ./
COPY *.json ./

# Copiar diretorios principais (verificar se existem)
COPY public/ ./public/
COPY src/ ./src/

# Remover diretorios vazios que podem causar problemas
RUN find /app -type d -empty -delete 2>/dev/null || true

# Criar diretorios necessarios se nao existirem
RUN mkdir -p src/config src/types src/utils

# Build do frontend
RUN npm run build

# Verificar se build foi criado
RUN ls -la dist/ && echo "Build criado com sucesso" || (echo "Build falhou" && exit 1)

# Stage de producao
FROM nginx:alpine

# Instalar Node.js
RUN apk add --no-cache nodejs npm curl bash

# Copiar build do frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Verificar se arquivos foram copiados
RUN ls -la /usr/share/nginx/html/ && echo "Frontend copiado" || (echo "Frontend nao copiado" && exit 1)

# Configurar backend
COPY webhook-evolution-websocket.js /app/
WORKDIR /app

# Instalar dependencias do backend
RUN npm init -y && npm install express socket.io cors @supabase/supabase-js --silent

# Configurar nginx
COPY nginx.deploy.conf /etc/nginx/conf.d/default.conf

# Script de start
COPY start.deploy.sh /start.sh
RUN chmod +x /start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["/start.sh"]
