FROM node:18-alpine AS build

RUN apk add --no-cache curl bash

WORKDIR /app

# Copiar package.json
COPY package.json ./
COPY package-lock.json* ./

# Instalar dependÃªncias
RUN npm ci --silent

# Copiar cÃ³digo fonte
COPY . .

# Garantir diretÃ³rios existem
RUN mkdir -p src/config src/services/database src/services/whatsapp
RUN echo "export default {};" > src/config/index.ts || true
RUN echo "export default {};" > src/services/database/index.ts || true  
RUN echo "export default {};" > src/services/whatsapp/index.ts || true

# Build frontend
RUN npm run build

# Verificar build
RUN test -d dist || exit 1

# === STAGE PRODUÃ‡ÃƒO ===
FROM nginx:alpine

# Instalar Node.js
RUN apk add --no-cache nodejs npm curl

# Copiar frontend
COPY --from=build /app/dist /usr/share/nginx/html

# Configurar backend - ARQUIVO CORRETO
WORKDIR /app
COPY webhook-evolution-websocket.js ./

# Instalar deps backend
RUN npm init -y
RUN npm install express socket.io cors @supabase/supabase-js

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
