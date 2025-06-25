FROM node:18-alpine AS frontend-build

RUN apk add --no-cache curl bash

WORKDIR /app

COPY package.deploy.json package.json
COPY package-lock.json* ./
RUN npm ci --silent

COPY . .
RUN npm run build

RUN ls -la dist/ || (echo "Build failed" && exit 1)

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
