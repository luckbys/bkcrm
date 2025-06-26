# Build stage
FROM node:18.19-alpine as builder

WORKDIR /app

# Configurar npm e ambiente
ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Instalar dependências necessárias
RUN apk add --no-cache python3 make g++

# Copiar arquivos de dependências
COPY package*.json ./
COPY . .

# Instalar todas as dependências (incluindo devDependencies)
RUN npm install

# Build da aplicação
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copiar os arquivos de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Healthcheck mais robusto
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
