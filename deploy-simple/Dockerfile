FROM node:18-alpine AS build
WORKDIR /app
COPY package.simple.json package.json
COPY package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache nodejs npm
COPY --from=build /app/dist /usr/share/nginx/html
COPY webhook-evolution-websocket.js /app/
WORKDIR /app
RUN npm init -y && npm install express socket.io cors @supabase/supabase-js
RUN echo 'server{listen 80;root /usr/share/nginx/html;index index.html;location/{try_files $uri $uri/ /index.html;}}' > /etc/nginx/conf.d/default.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh
EXPOSE 80
CMD ["/start.sh"]
