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

COPY nginx.deploy.conf /etc/nginx/conf.d/default.conf
COPY start.deploy.sh /start.sh
RUN chmod +x /start.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80
CMD ["/start.sh"]
