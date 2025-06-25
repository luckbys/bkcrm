# Corrigir Dockerfile para problemas de diretorio
Write-Host "Corrigindo Dockerfile para problemas de diretorio..." -ForegroundColor Green

# 1. Criar Dockerfile corrigido
$dockerfile = @'
FROM node:18-alpine AS frontend-build

RUN apk add --no-cache curl bash

WORKDIR /app

# Copiar package.json primeiro
COPY package.deploy.json package.json
COPY package-lock.json* ./

# Instalar dependencias
RUN npm ci --silent

# Copiar arquivos de configuracao
COPY *.html ./
COPY *.ts ./
COPY *.js ./
COPY *.json ./

# Copiar diretorios principais (verificar se existem)
COPY public/ ./public/
COPY src/ ./src/

# Remover diretorios vazios que podem causar problemas
RUN find /app -type d -empty -delete 2>/dev/null || true

# Criar diretorios necessarios se nao existirem
RUN mkdir -p src/config src/types src/utils

# Build do frontend
RUN npm run build

# Verificar se build foi criado
RUN ls -la dist/ && echo "Build criado com sucesso" || (echo "Build falhou" && exit 1)

# Stage de producao
FROM nginx:alpine

# Instalar Node.js
RUN apk add --no-cache nodejs npm curl bash

# Copiar build do frontend
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Verificar se arquivos foram copiados
RUN ls -la /usr/share/nginx/html/ && echo "Frontend copiado" || (echo "Frontend nao copiado" && exit 1)

# Configurar backend
COPY webhook-evolution-websocket.js /app/
WORKDIR /app

# Instalar dependencias do backend
RUN npm init -y && npm install express socket.io cors @supabase/supabase-js --silent

# Configurar nginx
COPY nginx.deploy.conf /etc/nginx/conf.d/default.conf

# Script de start
COPY start.deploy.sh /start.sh
RUN chmod +x /start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["/start.sh"]
'@
$dockerfile | Out-File -FilePath "Dockerfile.fixed" -Encoding UTF8

# 2. Criar .dockerignore para evitar problemas
$dockerignore = @'
node_modules
dist
.git
.env.local
.env.development
.env.test
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
.vscode
*.md
README*
docs/
backend/
deployment/
'@
$dockerignore | Out-File -FilePath ".dockerignore.fixed" -Encoding UTF8

# 3. Criar script de start mais robusto
$startScript = @'
#!/bin/bash
set -e

echo "=== Iniciando BKCRM System ==="

# Verificar arquivos
echo "Verificando arquivos frontend..."
ls -la /usr/share/nginx/html/ | head -10

echo "Verificando arquivos backend..."
ls -la /app/

# Criar diretórios necessários se não existirem
mkdir -p /var/log/nginx
mkdir -p /var/cache/nginx

# Testar configuração nginx
echo "Testando configuração nginx..."
nginx -t

# Iniciar webhook em background
echo "Iniciando WebSocket na porta 4000..."
cd /app
node webhook-evolution-websocket.js &
WEBHOOK_PID=$!

# Aguardar webhook inicializar
echo "Aguardando WebSocket inicializar..."
sleep 10

# Verificar se webhook está rodando
echo "Verificando WebSocket..."
for i in {1..5}; do
    if curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
        echo "✅ WebSocket iniciado com sucesso"
        break
    else
        echo "⏳ Tentativa $i/5 - Aguardando WebSocket..."
        sleep 3
    fi
done

# Verificar se webhook está realmente funcionando
if ! curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
    echo "❌ WebSocket falhou ao iniciar"
    exit 1
fi

# Iniciar nginx
echo "Iniciando Nginx na porta 80..."
nginx -g 'daemon off;' &
NGINX_PID=$!

# Aguardar nginx inicializar
echo "Aguardando Nginx inicializar..."
sleep 5

# Verificar se nginx está funcionando
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx iniciado com sucesso"
    echo "🌍 Frontend disponível em: http://localhost/"
    echo "🔗 WebSocket disponível em: http://localhost/webhook/"
    echo "🏥 Health check: http://localhost/health"
else
    echo "❌ Nginx falhou ao iniciar"
    exit 1
fi

echo "📊 Processos ativos:"
echo "- WebSocket PID: $WEBHOOK_PID"
echo "- Nginx PID: $NGINX_PID"

echo "🎉 Sistema BKCRM iniciado com sucesso!"

# Monitorar processos
wait $WEBHOOK_PID $NGINX_PID
'@
$startScript | Out-File -FilePath "start.fixed.sh" -Encoding UTF8

# 4. Limpar diretório anterior
if (Test-Path "deploy-fixed") {
    Remove-Item -Recurse -Force "deploy-fixed"
}
New-Item -ItemType Directory -Name "deploy-fixed" | Out-Null

# 5. Copiar arquivos corrigidos
Copy-Item "package.deploy.json" "deploy-fixed/package.json"
Copy-Item ".env.deploy" "deploy-fixed/.env"
Copy-Item "Dockerfile.fixed" "deploy-fixed/Dockerfile"
Copy-Item ".dockerignore.fixed" "deploy-fixed/.dockerignore"
Copy-Item "nginx.deploy.conf" "deploy-fixed/"
Copy-Item "start.fixed.sh" "deploy-fixed/start.deploy.sh"
Copy-Item "webhook-evolution-websocket.js" "deploy-fixed/"

# 6. Copiar código fonte de forma seletiva
Write-Host "Copiando codigo fonte..." -ForegroundColor Yellow

# Copiar src excluindo pastas vazias
if (Test-Path "src") {
    Copy-Item -Recurse "src" "deploy-fixed/" -Force
    
    # Criar arquivos vazios em diretórios que podem estar vazios
    if (!(Test-Path "deploy-fixed/src/config")) { New-Item -ItemType Directory -Path "deploy-fixed/src/config" -Force }
    New-Item -ItemType File -Path "deploy-fixed/src/config/.gitkeep" -Force
}

# Copiar public
if (Test-Path "public") {
    Copy-Item -Recurse "public" "deploy-fixed/"
}

# Copiar arquivos raiz
Copy-Item "index.html" "deploy-fixed/"

# Copiar configs se existirem
$configFiles = @(
    "vite.config.ts",
    "tsconfig.json", 
    "tsconfig.app.json",
    "tsconfig.node.json",
    "tailwind.config.ts",
    "postcss.config.js",
    "package-lock.json"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Copy-Item $file "deploy-fixed/"
    }
}

# 7. Criar ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path "deploy-fixed.zip") {
    Remove-Item "deploy-fixed.zip"
}
[System.IO.Compression.ZipFile]::CreateFromDirectory("deploy-fixed", "deploy-fixed.zip")

$zipSize = (Get-Item "deploy-fixed.zip").Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host "Deploy corrigido criado: deploy-fixed.zip ($zipSizeMB MB)" -ForegroundColor Green

Write-Host ""
Write-Host "PROBLEMAS CORRIGIDOS:" -ForegroundColor Blue
Write-Host "- Diretorios vazios removidos"
Write-Host "- .dockerignore adicionado"
Write-Host "- Build mais robusto"
Write-Host "- Health checks melhorados"
Write-Host "- Logs detalhados"
Write-Host ""
Write-Host "Use: deploy-fixed.zip para o novo deploy" -ForegroundColor Green 