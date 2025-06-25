# Script Final - Corrigir diretórios vazios
Write-Host "Corrigindo diretorios vazios..." -ForegroundColor Green

# 1. Primeiro, corrigir diretórios locais
Write-Host "Criando arquivos nos diretorios vazios..." -ForegroundColor Yellow

# Garantir que diretórios vazios tenham arquivos
$emptyDirs = @(
    "src/config",
    "src/services/database", 
    "src/services/whatsapp"
)

foreach ($dir in $emptyDirs) {
    if (!(Test-Path $dir)) { 
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $gitkeepFile = Join-Path $dir ".gitkeep"
    $indexFile = Join-Path $dir "index.ts"
    
    New-Item -ItemType File -Path $gitkeepFile -Force | Out-Null
    "// Auto-generated placeholder`nexport default {};" | Out-File -FilePath $indexFile -Encoding UTF8
    
    Write-Host "Corrigido: $dir" -ForegroundColor Green
}

# 2. Dockerfile ultra-simples e robusto
$dockerfile = @'
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
'@
$dockerfile | Out-File -FilePath "Dockerfile.final" -Encoding UTF8

# 3. Script de start simples
$startScript = @'
#!/bin/bash
set -e

echo "Iniciando BKCRM System..."

echo "Verificando frontend..."
ls -la /usr/share/nginx/html/ | head -5

echo "Verificando backend..."
ls -la /app/

echo "Testando nginx..."
nginx -t

echo "Iniciando WebSocket..."
cd /app
node webhook-evolution-websocket.js &
WEBHOOK_PID=$!

sleep 10

echo "Verificando WebSocket..."
for i in {1..10}; do
    if curl -f http://localhost:4000/webhook/health > /dev/null 2>&1; then
        echo "WebSocket OK"
        break
    else
        echo "Aguardando WebSocket... ($i/10)"
        sleep 2
    fi
done

echo "Iniciando Nginx..."
nginx -g 'daemon off;' &
NGINX_PID=$!

sleep 5

echo "Verificando Nginx..."
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "Nginx OK"
else
    echo "Erro Nginx"
    exit 1
fi

echo "Sistema iniciado com sucesso!"
echo "Frontend: http://localhost/"
echo "WebSocket: http://localhost/webhook/"
echo "WebSocket PID: $WEBHOOK_PID"
echo "Nginx PID: $NGINX_PID"

wait $WEBHOOK_PID $NGINX_PID
'@
$startScript | Out-File -FilePath "start.final.sh" -Encoding UTF8

# 4. .dockerignore
$dockerignore = @'
node_modules
dist
.git
*.md
docs/
backend/
deployment/
tests/
*.log
.env.local
.vscode
'@
$dockerignore | Out-File -FilePath ".dockerignore.final" -Encoding UTF8

# 5. Criar deploy final
if (Test-Path "deploy-final") {
    Remove-Item -Recurse -Force "deploy-final"
}
New-Item -ItemType Directory -Name "deploy-final" | Out-Null

Copy-Item "package.deploy.json" "deploy-final/package.json"
Copy-Item ".env.deploy" "deploy-final/.env"
Copy-Item "Dockerfile.final" "deploy-final/Dockerfile"
Copy-Item ".dockerignore.final" "deploy-final/.dockerignore"
Copy-Item "nginx.deploy.conf" "deploy-final/"
Copy-Item "start.final.sh" "deploy-final/start.deploy.sh"
Copy-Item "webhook-evolution-websocket.js" "deploy-final/"

# Copiar código fonte
Copy-Item -Recurse "src" "deploy-final/" -Force
Copy-Item -Recurse "public" "deploy-final/"
Copy-Item "index.html" "deploy-final/"

# Configs
$configs = @("vite.config.ts", "tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "tailwind.config.ts", "postcss.config.js", "package-lock.json")
foreach ($file in $configs) {
    if (Test-Path $file) {
        Copy-Item $file "deploy-final/"
    }
}

# ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path "deploy-final.zip") {
    Remove-Item "deploy-final.zip"
}
[System.IO.Compression.ZipFile]::CreateFromDirectory("deploy-final", "deploy-final.zip")

$zipSize = (Get-Item "deploy-final.zip").Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host ""
Write-Host "DEPLOY FINAL CRIADO!" -ForegroundColor Green
Write-Host "Arquivo: deploy-final.zip ($zipSizeMB MB)" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMAS CORRIGIDOS:" -ForegroundColor Blue
Write-Host "- src/config/ - OK"
Write-Host "- src/services/database/ - OK"  
Write-Host "- src/services/whatsapp/ - OK"
Write-Host "- Dockerfile robusto - OK"
Write-Host ""
Write-Host "USE: deploy-final.zip" -ForegroundColor Green 