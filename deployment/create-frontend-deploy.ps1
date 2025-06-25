# Script para deploy completo - Frontend + Backend

Write-Host "🚀 Criando deploy completo (Frontend + Backend)..." -ForegroundColor Green

# 1. Limpar cache
Write-Host "🧹 Limpando cache..." -ForegroundColor Yellow
npm cache clean --force

# 2. Testar build local primeiro
Write-Host "🔨 Testando build local..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✅ Build local funcionando!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no build local. Verifique o código." -ForegroundColor Red
    exit 1
}

# 3. Criar package.json otimizado
Write-Host "📦 Criando package.json otimizado..." -ForegroundColor Yellow
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
$pkg | Out-File -FilePath "package.frontend.json" -Encoding UTF8

# 4. Criar .env
Write-Host "⚙️ Criando .env..." -ForegroundColor Yellow
$env = @'
NODE_ENV=production
PORT=80
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
VITE_WEBSOCKET_URL=wss://bkcrm.devsible.com.br
'@
$env | Out-File -FilePath ".env.frontend" -Encoding UTF8

# 5. Criar configuração nginx correta
Write-Host "🌐 Criando configuração nginx..." -ForegroundColor Yellow
$nginxConfig = @'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Serve frontend React
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Cache para assets estaticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy para webhook/websocket
    location /webhook/ {
        proxy_pass http://localhost:4000/webhook/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy para Socket.IO
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check local
    location /health {
        return 200 '{"status":"healthy","service":"nginx","timestamp":"$time_iso8601"}';
        add_header Content-Type application/json;
    }
}
'@
$nginxConfig | Out-File -FilePath "nginx.frontend.conf" -Encoding UTF8

# 6. Criar Dockerfile completo
Write-Host "🐳 Criando Dockerfile completo..." -ForegroundColor Yellow
$dockerfile = @'
# Multi-stage build para frontend + backend
FROM node:18-alpine AS frontend-build

# Instalar dependencias do sistema
RUN apk add --no-cache curl bash

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package.frontend.json package.json
COPY package-lock.json* ./
RUN npm ci --silent

# Copiar codigo fonte e fazer build
COPY . .
RUN npm run build

# Verificar se build foi criado
RUN ls -la dist/ || (echo "Build failed - dist directory not found" && exit 1)

# Stage final: Nginx + Node.js
FROM nginx:alpine

# Instalar Node.js e dependencias
RUN apk add --no-cache nodejs npm curl bash

# Copiar build do frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Verificar se arquivos foram copiados
RUN ls -la /usr/share/nginx/html/ || (echo "Frontend files not found" && exit 1)

# Configurar webhook backend
COPY webhook-evolution-websocket.js /app/
WORKDIR /app

# Instalar dependencias do webhook
RUN npm init -y && npm install express socket.io cors @supabase/supabase-js --silent

# Configurar nginx
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf

# Script de inicializacao
COPY start.frontend.sh /start.sh
RUN chmod +x /start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["/start.sh"]
'@
$dockerfile | Out-File -FilePath "Dockerfile.frontend" -Encoding UTF8

# 7. Criar script de start
Write-Host "🚀 Criando script de inicialização..." -ForegroundColor Yellow
$startScript = @'
#!/bin/bash
set -e

echo "🚀 Iniciando BKCRM Frontend + Backend..."

# Verificar se arquivos existem
echo "📁 Verificando arquivos..."
ls -la /usr/share/nginx/html/ | head -5
ls -la /app/

# Iniciar webhook em background
echo "🔗 Iniciando WebSocket webhook na porta 4000..."
cd /app
node webhook-evolution-websocket.js &
WEBHOOK_PID=$!

# Aguardar webhook inicializar
sleep 5

# Verificar se webhook esta rodando
if curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
    echo "✅ WebSocket iniciado com sucesso"
else
    echo "❌ Erro ao iniciar WebSocket"
    exit 1
fi

# Iniciar nginx
echo "🌐 Iniciando servidor web na porta 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Aguardar nginx inicializar
sleep 3

# Verificar se nginx esta servindo
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx iniciado com sucesso"
    echo "🌍 Frontend disponivel em http://localhost/"
    echo "🔗 WebSocket disponivel em http://localhost/webhook/"
else
    echo "❌ Erro ao iniciar Nginx"
    exit 1
fi

echo "📊 Processos ativos:"
echo "- WebSocket PID: $WEBHOOK_PID"
echo "- Nginx PID: $NGINX_PID"

# Aguardar processos
wait $WEBHOOK_PID $NGINX_PID
'@
$startScript | Out-File -FilePath "start.frontend.sh" -Encoding UTF8

# 8. Criar diretório de deploy
Write-Host "📁 Criando diretório de deploy..." -ForegroundColor Yellow
if (Test-Path "deploy-frontend") {
    Remove-Item -Recurse -Force "deploy-frontend"
}
New-Item -ItemType Directory -Name "deploy-frontend" | Out-Null

# 9. Copiar arquivos
Write-Host "📄 Copiando arquivos..." -ForegroundColor Yellow
Copy-Item "package.frontend.json" "deploy-frontend/package.json"
Copy-Item ".env.frontend" "deploy-frontend/.env"
Copy-Item "Dockerfile.frontend" "deploy-frontend/Dockerfile"
Copy-Item "nginx.frontend.conf" "deploy-frontend/"
Copy-Item "start.frontend.sh" "deploy-frontend/"
Copy-Item "webhook-evolution-websocket.js" "deploy-frontend/"

# Copiar código fonte
Copy-Item -Recurse "src" "deploy-frontend/"
Copy-Item -Recurse "public" "deploy-frontend/"
Copy-Item "index.html" "deploy-frontend/"

# Copiar arquivos de configuração se existirem
if (Test-Path "vite.config.ts") { Copy-Item "vite.config.ts" "deploy-frontend/" }
if (Test-Path "tsconfig.json") { Copy-Item "tsconfig*.json" "deploy-frontend/" }
if (Test-Path "tailwind.config.js") { Copy-Item "tailwind.config.js" "deploy-frontend/" }
if (Test-Path "postcss.config.js") { Copy-Item "postcss.config.js" "deploy-frontend/" }
if (Test-Path "package-lock.json") { Copy-Item "package-lock.json" "deploy-frontend/" }

# 10. Criar ZIP
Write-Host "🗜️ Criando arquivo ZIP..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path "deploy-frontend.zip") {
    Remove-Item "deploy-frontend.zip"
}
[System.IO.Compression.ZipFile]::CreateFromDirectory("deploy-frontend", "deploy-frontend.zip")

$zipSize = (Get-Item "deploy-frontend.zip").Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host "✅ Pacote frontend criado: deploy-frontend.zip ($zipSizeMB MB)" -ForegroundColor Green

# 11. Instruções
Write-Host ""
Write-Host "📋 INSTRUÇÕES PARA EASYPANEL:" -ForegroundColor Blue
Write-Host ""
Write-Host "1️⃣ Faça upload do arquivo: deploy-frontend.zip"
Write-Host ""
Write-Host "2️⃣ Configure no EasyPanel:"
Write-Host "   - Dockerfile: Dockerfile"
Write-Host "   - Build Context: /"
Write-Host "   - Port: 80"
Write-Host ""
Write-Host "3️⃣ Variáveis de ambiente (já no .env):"
Write-Host "   ✅ NODE_ENV=production"
Write-Host "   ✅ PORT=80"
Write-Host "   ✅ VITE_SUPABASE_URL"
Write-Host ""
Write-Host "4️⃣ Após deploy, acessar:"
Write-Host "   🌍 Frontend: https://bkcrm.devsible.com.br"
Write-Host "   🔗 WebSocket: https://bkcrm.devsible.com.br/webhook/health"
Write-Host "   🏥 Health: https://bkcrm.devsible.com.br/health"
Write-Host ""
Write-Host "🎉 Deploy COMPLETO pronto!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Recursos incluídos:" -ForegroundColor Yellow
Write-Host "   ✅ Frontend React servido pelo Nginx"
Write-Host "   ✅ Backend WebSocket na porta 4000"
Write-Host "   ✅ Proxy automático entre frontend/backend"
Write-Host "   ✅ Health checks configurados"
Write-Host "   ✅ Cache otimizado para assets"
Write-Host "   ✅ Suporte a SPA (Single Page Application)" 