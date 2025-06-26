# Build stage
FROM node:18.19-alpine as builder

WORKDIR /app

# Configurar npm
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

# Copiar apenas os arquivos necessários para instalar dependências
COPY package*.json ./

# Instalar dependências com flags específicos
RUN npm ci --only=production --no-optional

# Copiar o resto dos arquivos
COPY . .

# Build com variáveis de ambiente otimizadas
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copiar os arquivos de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração básica do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
