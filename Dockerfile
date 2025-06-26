# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copiar apenas os arquivos necessários para instalar dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar o resto dos arquivos
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar os arquivos de build
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuração básica do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
