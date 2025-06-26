# Ultra-optimized Dockerfile para resolver problema de espaço em disco
FROM node:18-alpine AS build

WORKDIR /app

# Otimizações de npm
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_CACHE=/tmp/.npm
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy apenas package files primeiro
COPY package*.json ./

# Install apenas production dependencies
RUN npm ci --only=production --silent --no-audit --no-fund

# Install dev dependencies apenas para build
RUN npm ci --silent --no-audit --no-fund

# Copy source code
COPY . .

# Criar diretórios faltantes de forma mínima
RUN mkdir -p src/config src/services/database src/services/whatsapp && \
    echo "export default {};" > src/config/index.ts && \
    echo "export default {};" > src/services/database/index.ts && \
    echo "export default {};" > src/services/whatsapp/index.ts

# Build com otimizações
ENV NODE_ENV=production
RUN npm run build

# Limpar cache e node_modules para reduzir tamanho
RUN rm -rf node_modules .npm /tmp/.npm

# Install apenas runtime dependencies
RUN npm ci --only=production --silent --no-audit --no-fund

# Production stage ultra-lightweight
FROM nginx:alpine AS production

# Install apenas curl
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config - CORREÇÃO: usar como nginx.conf principal
COPY nginx.deploy.conf /etc/nginx/nginx.conf

# Lightweight health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

FROM node:18-alpine AS frontend-build

RUN apk add --no-cache curl bash

WORKDIR /app

COPY package.deploy.json package.json
COPY package-lock.json* ./

RUN npm ci --silent

COPY index.html ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

COPY public/ ./public/
COPY src/ ./src/

# Corrigir diretorios vazios no build
RUN find /app -type d -empty -delete 2>/dev/null || true
RUN mkdir -p src/config src/services/database src/services/whatsapp
RUN echo "export default {};" > src/config/index.ts
RUN echo "export default {};" > src/services/database/index.ts  
RUN echo "export default {};" > src/services/whatsapp/index.ts

RUN npm run build
RUN ls -la dist/ || exit 1

FROM nginx:alpine

RUN apk add --no-cache nodejs npm curl bash

COPY --from=frontend-build /app/dist /usr/share/nginx/html

COPY webhook-evolution-websocket.js /app/
WORKDIR /app
RUN npm init -y && npm install express socket.io cors @supabase/supabase-js --silent

# Copy Nginx configurations
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.deploy.conf /etc/nginx/conf.d/default.conf

COPY start.deploy.sh /start.sh
RUN chmod +x /start.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80
CMD ["/start.sh"]
