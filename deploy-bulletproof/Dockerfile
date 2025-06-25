FROM node:18-alpine AS build

# Instalar dependÃªncias bÃ¡sicas
RUN apk add --no-cache curl bash

WORKDIR /app

# Copiar package.json e instalar dependÃªncias
COPY package.json ./
COPY package-lock.json* ./
RUN npm ci --silent

# Copiar arquivos necessÃ¡rios
COPY . .

# Garantir que todos os diretÃ³rios existam e tenham conteÃºdo
RUN mkdir -p src/config src/services/database src/services/whatsapp
RUN echo "export default {};" > src/config/index.ts || true
RUN echo "export default {};" > src/services/database/index.ts || true
RUN echo "export default {};" > src/services/whatsapp/index.ts || true

# Build da aplicaÃ§Ã£o
RUN npm run build

# Verificar se build foi criado
RUN test -d dist || (echo "Build falhou" && exit 1)

# === PRODUÃ‡ÃƒO ===
FROM nginx:alpine

# Instalar Node.js para backend
RUN apk add --no-cache nodejs npm curl

# Copiar frontend build
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar backend
WORKDIR /app
COPY webhook-evolution-websocket.js .
RUN npm init -y
RUN npm install express socket.io cors @supabase/supabase-js

# Configurar nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Script de inicializaÃ§Ã£o
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]
