# Dockerfile para Frontend BKCRM React/Vite
# Para uso no EasyPanel como serviço separado do webhook

# Build stage
FROM node:18-alpine AS build

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar TODAS as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte (excluindo node_modules e outros desnecessários)
COPY . .

# Definir variáveis de ambiente para build
ENV NODE_ENV=production
ENV VITE_API_URL=https://webhook.bkcrm.devsible.com.br

# Build da aplicação React/Vite
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=build /app/dist /usr/share/nginx/html

# Criar diretório para configuração do Nginx
RUN mkdir -p /etc/nginx/conf.d

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# O nginx:alpine já vem com usuário nginx configurado adequadamente

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"] 