# Corrigir erro de arquivo no Dockerfile
Write-Host "Corrigindo erro de nome de arquivo no Dockerfile..." -ForegroundColor Green

# 1. Limpar deploy anterior
if (Test-Path "deploy-corrected") { Remove-Item -Recurse -Force "deploy-corrected" }
if (Test-Path "deploy-corrected.zip") { Remove-Item "deploy-corrected.zip" }

# 2. Dockerfile corrigido com arquivo correto
$dockerfile = @'
FROM node:18-alpine AS build

RUN apk add --no-cache curl bash

WORKDIR /app

# Copiar package.json
COPY package.json ./
COPY package-lock.json* ./

# Instalar dependências
RUN npm ci --silent

# Copiar código fonte
COPY . .

# Garantir diretórios existem
RUN mkdir -p src/config src/services/database src/services/whatsapp
RUN echo "export default {};" > src/config/index.ts || true
RUN echo "export default {};" > src/services/database/index.ts || true  
RUN echo "export default {};" > src/services/whatsapp/index.ts || true

# Build frontend
RUN npm run build

# Verificar build
RUN test -d dist || exit 1

# === STAGE PRODUÇÃO ===
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
'@

# 3. Package.json mínimo
$packageJson = @'
{
  "name": "bkcrm",
  "version": "1.0.0",
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.2",
    "@supabase/supabase-js": "^2.50.0",
    "socket.io-client": "^4.8.1",
    "axios": "^1.10.0",
    "lucide-react": "^0.462.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
'@

# 4. Nginx simples
$nginxConf = @'
server {
    listen 80;
    server_name _;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
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
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /health {
        proxy_pass http://localhost:4000/webhook/health;
    }
}
'@

# 5. Start script
$startScript = @'
#!/bin/bash
set -e

echo "=== BKCRM Starting ==="

echo "Starting WebSocket..."
cd /app
node webhook-evolution-websocket.js &

echo "Waiting..."
sleep 10

echo "Starting Nginx..."
nginx -g 'daemon off;' &

echo "Ready!"
wait
'@

# 6. Vite config
$viteConfig = @'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
'@

# 7. .dockerignore
$dockerignore = @'
node_modules
dist
.git
*.md
docs
backend
deployment
tests
.env.local
.vscode
*.log
'@

# 8. Criar estrutura
New-Item -ItemType Directory -Name "deploy-corrected" -Force | Out-Null

Write-Host "Criando arquivos corrigidos..." -ForegroundColor Yellow

# Salvar arquivos
$dockerfile | Out-File -FilePath "deploy-corrected/Dockerfile" -Encoding UTF8
$packageJson | Out-File -FilePath "deploy-corrected/package.json" -Encoding UTF8
$nginxConf | Out-File -FilePath "deploy-corrected/nginx.conf" -Encoding UTF8
$startScript | Out-File -FilePath "deploy-corrected/start.sh" -Encoding UTF8
$viteConfig | Out-File -FilePath "deploy-corrected/vite.config.ts" -Encoding UTF8
$dockerignore | Out-File -FilePath "deploy-corrected/.dockerignore" -Encoding UTF8

# 9. Copiar código fonte
Copy-Item -Recurse "src" "deploy-corrected/" -Force
Copy-Item -Recurse "public" "deploy-corrected/" -Force
Copy-Item "index.html" "deploy-corrected/"

# ARQUIVO CORRETO - webhook-evolution-websocket.js
Copy-Item "webhook-evolution-websocket.js" "deploy-corrected/"

# Configs necessários
$configs = @("tsconfig.json", "tsconfig.app.json", "tsconfig.node.json", "tailwind.config.ts", "postcss.config.js")
foreach ($config in $configs) {
    if (Test-Path $config) {
        Copy-Item $config "deploy-corrected/"
    }
}

# 10. Corrigir diretórios vazios
$emptyDirs = @(
    "deploy-corrected/src/config",
    "deploy-corrected/src/services/database", 
    "deploy-corrected/src/services/whatsapp"
)

foreach ($dir in $emptyDirs) {
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    "export default {};" | Out-File -FilePath "$dir/index.ts" -Encoding UTF8 -Force
    New-Item -ItemType File -Path "$dir/.gitkeep" -Force | Out-Null
}

# 11. Criar tsconfig se não existir
if (!(Test-Path "deploy-corrected/tsconfig.json")) {
    @'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src"]
}
'@ | Out-File -FilePath "deploy-corrected/tsconfig.json" -Encoding UTF8
}

# 12. Criar ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory("deploy-corrected", "deploy-corrected.zip")

$zipSize = (Get-Item "deploy-corrected.zip").Length
$zipSizeMB = [math]::Round($zipSize / 1MB, 2)

Write-Host ""
Write-Host "=== DEPLOY CORRIGIDO CRIADO ===" -ForegroundColor Green
Write-Host "Arquivo: deploy-corrected.zip ($zipSizeMB MB)" -ForegroundColor Green
Write-Host ""
Write-Host "PROBLEMA RESOLVIDO:" -ForegroundColor Blue
Write-Host "- Nome de arquivo CORRETO: webhook-evolution-websocket.js"
Write-Host "- Dockerfile atualizado"
Write-Host "- Dependencias minimas"
Write-Host "- Build simplificado"
Write-Host ""
Write-Host "USE: deploy-corrected.zip" -ForegroundColor Green 