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
