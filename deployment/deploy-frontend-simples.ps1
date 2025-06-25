# Deploy Frontend + Backend Completo
Write-Host "Criando deploy completo..." -ForegroundColor Green

# 1. Criar package.json otimizado
$pkg = @'
{
  "name": "bkcrm",
  "version": "1.0.0",
  "scripts": {
    "build": "vite build",
    "start": "vite preview --port 3000 --host 0.0.0.0"
  },
  "dependencies": {
    "@chakra-ui/react": "^3.21.0",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@supabase/supabase-js": "^2.50.0",
    "@tanstack/react-query": "^5.56.2",
    "axios": "^1.10.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.2",
    "socket.io-client": "^4.8.1",
    "zustand": "^5.0.5",
    "lucide-react": "^0.462.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4",
    "tailwindcss": "^3.4.11",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47"
  }
}
'@
$pkg | Out-File -FilePath "package.deploy.json" -Encoding UTF8

# 2. Criar .env
$env = @'
NODE_ENV=production
PORT=80
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
VITE_WEBSOCKET_URL=wss://bkcrm.devsible.com.br
'@
$env | Out-File -FilePath ".env.deploy" -Encoding UTF8

# 3. Criar nginx config
$nginxConfig = @'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /webhook/ {
        proxy_pass http://localhost:4000/webhook/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    location /health {
        return 200 '{"status":"healthy","service":"nginx"}';
        add_header Content-Type application/json;
    }
}
'@
$nginxConfig | Out-File -FilePath "nginx.deploy.conf" -Encoding UTF8

# 4. Criar Dockerfile
$dockerfile = @'
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
'@
$dockerfile | Out-File -FilePath "Dockerfile.deploy" -Encoding UTF8

# 5. Criar script de start
$startScript = @'
#!/bin/bash
set -e

echo "Iniciando BKCRM..."

ls -la /usr/share/nginx/html/ | head -5
ls -la /app/

echo "Iniciando WebSocket na porta 4000..."
cd /app
node webhook-evolution-websocket.js &
WEBHOOK_PID=$!

sleep 5

if curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
    echo "WebSocket OK"
else
    echo "Erro WebSocket"
    exit 1
fi

echo "Iniciando Nginx na porta 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

sleep 3

if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Nginx OK"
    echo "Frontend: http://localhost/"
    echo "WebSocket: http://localhost/webhook/"
else
    echo "Erro Nginx"
    exit 1
fi

echo "WebSocket PID: $WEBHOOK_PID"
echo "Nginx PID: $NGINX_PID"

wait $WEBHOOK_PID $NGINX_PID
'@
$startScript | Out-File -FilePath "start.deploy.sh" -Encoding UTF8

# 6. Criar diretório
if (Test-Path "deploy-completo") {
    Remove-Item -Recurse -Force "deploy-completo"
}
New-Item -ItemType Directory -Name "deploy-completo" | Out-Null

# 7. Copiar arquivos
Copy-Item "package.deploy.json" "deploy-completo/package.json"
Copy-Item ".env.deploy" "deploy-completo/.env"
Copy-Item "Dockerfile.deploy" "deploy-completo/Dockerfile"
Copy-Item "nginx.deploy.conf" "deploy-completo/"
Copy-Item "start.deploy.sh" "deploy-completo/"
Copy-Item "webhook-evolution-websocket.js" "deploy-completo/"

# Copiar código fonte
Copy-Item -Recurse "src" "deploy-completo/"
Copy-Item -Recurse "public" "deploy-completo/"
Copy-Item "index.html" "deploy-completo/"

# Copiar configs
if (Test-Path "vite.config.ts") { Copy-Item "vite.config.ts" "deploy-completo/" }
if (Test-Path "tsconfig.json") { Copy-Item "tsconfig*.json" "deploy-completo/" }
if (Test-Path "tailwind.config.ts") { Copy-Item "tailwind.config.ts" "deploy-completo/" }
if (Test-Path "postcss.config.js") { Copy-Item "postcss.config.js" "deploy-completo/" }
if (Test-Path "package-lock.json") { Copy-Item "package-lock.json" "deploy-completo/" }

# 8. Criar ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path "deploy-completo.zip") {
    Remove-Item "deploy-completo.zip"
}
[System.IO.Compression.ZipFile]::CreateFromDirectory("deploy-completo", "deploy-completo.zip")

$zipSize = (Get-Item "deploy-completo.zip").Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host "Pacote criado: deploy-completo.zip ($zipSizeMB MB)" -ForegroundColor Green

Write-Host ""
Write-Host "INSTRUCOES PARA EASYPANEL:" -ForegroundColor Blue
Write-Host ""
Write-Host "1. Faca upload: deploy-completo.zip"
Write-Host "2. Configure:"
Write-Host "   - Dockerfile: Dockerfile"
Write-Host "   - Port: 80"
Write-Host "3. Apos deploy:"
Write-Host "   - Frontend: https://bkcrm.devsible.com.br"
Write-Host "   - WebSocket: https://bkcrm.devsible.com.br/webhook/health"
Write-Host "   - Health: https://bkcrm.devsible.com.br/health"
Write-Host ""
Write-Host "Deploy COMPLETO pronto!" -ForegroundColor Green 