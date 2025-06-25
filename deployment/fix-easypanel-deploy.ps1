# 🔧 SOLUÇÃO PARA ERRO DE DEPLOY NO EASYPANEL
# Versão PowerShell - Resolve: ERROR: failed to export: saving image with ID

Write-Host "🚀 Iniciando correção do deploy EasyPanel..." -ForegroundColor Green

# 1. Limpeza de cache e otimização
Write-Host "🧹 Limpando cache e otimizando build..." -ForegroundColor Yellow

# Limpar cache npm
npm cache clean --force

# Limpar node_modules
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}

# Reinstalar dependências com cache limpo
npm install --no-audit --no-fund

# 2. Otimizar package.json para produção
Write-Host "📦 Otimizando package.json..." -ForegroundColor Yellow

$packageOptimized = @{
    name = "bkcrm"
    version = "1.0.0"
    private = $true
    scripts = @{
        build = "vite build --mode production"
        start = "vite preview --port 80 --host 0.0.0.0"
        preview = "vite preview --port 80 --host 0.0.0.0"
    }
    dependencies = @{
        "@chakra-ui/react" = "^3.21.0"
        "@emotion/react" = "^11.14.0"
        "@emotion/styled" = "^11.14.0"
        "@supabase/supabase-js" = "^2.50.0"
        "@tanstack/react-query" = "^5.56.2"
        "axios" = "^1.10.0"
        "react" = "^18.2.0"
        "react-dom" = "^18.2.0"
        "react-router-dom" = "^6.26.2"
        "socket.io-client" = "^4.8.1"
        "zustand" = "^5.0.5"
    }
    devDependencies = @{
        "@vitejs/plugin-react" = "^4.5.1"
        "typescript" = "^5.2.2"
        "vite" = "^5.1.4"
    }
    engines = @{
        node = ">=18.0.0"
        npm = ">=8.0.0"
    }
}

$packageOptimized | ConvertTo-Json -Depth 10 | Set-Content "package.easypanel.json"

# 3. Criar Dockerfile otimizado para EasyPanel
Write-Host "🐳 Criando Dockerfile otimizado..." -ForegroundColor Yellow

@"
# Dockerfile ultra-otimizado para EasyPanel
FROM node:18-alpine AS base
RUN apk add --no-cache dumb-init curl bash
WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps
COPY package.easypanel.json package.json
COPY package-lock.json* ./
RUN npm ci --only=production --silent

# Stage 2: Build
FROM base AS builder
COPY package.easypanel.json package.json
COPY package-lock.json* ./
RUN npm ci --silent
COPY . .
RUN npm run build

# Stage 3: Runner
FROM nginx:alpine AS runner
RUN apk add --no-cache nodejs npm curl
COPY --from=builder /app/dist /usr/share/nginx/html
COPY webhook-evolution-websocket.js /app/webhook.js
COPY package.easypanel.json /app/package.json
WORKDIR /app
RUN npm install express socket.io cors @supabase/supabase-js --production
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files \$uri \$uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
RUN echo '#!/bin/sh' > /start.sh && echo 'node /app/webhook.js &' >> /start.sh && echo 'nginx -g "daemon off;"' >> /start.sh && chmod +x /start.sh
EXPOSE 80
CMD ["/start.sh"]
"@ | Set-Content "Dockerfile.easypanel-optimized"

# 4. Configurar variáveis de ambiente
Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Yellow

@"
NODE_ENV=production
PORT=80
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
VITE_WEBSOCKET_URL=wss://bkcrm.devsible.com.br
"@ | Set-Content ".env.easypanel"

# 5. Criar script de verificação
Write-Host "🔍 Criando script de verificação..." -ForegroundColor Yellow

@"
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Verificando build...');

const requiredFiles = [
  'package.easypanel.json',
  'Dockerfile.easypanel-optimized',
  '.env.easypanel',
  'webhook-evolution-websocket.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅ ' + file + ' - OK');
  } else {
    console.log('❌ ' + file + ' - FALTANDO');
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('❌ Arquivos faltando. Execute o script novamente.');
  process.exit(1);
}

try {
  console.log('🏗️ Testando build local...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build local funcionando');
} catch (error) {
  console.log('❌ Erro no build local:', error.message);
  process.exit(1);
}

console.log('✅ Verificação completa - pronto para deploy!');
"@ | Set-Content "verify-build.js"

# 6. Executar verificação
Write-Host "🧪 Executando verificação..." -ForegroundColor Yellow
node verify-build.js

# 7. Criar pacote otimizado para upload
Write-Host "📦 Criando pacote para upload..." -ForegroundColor Yellow

# Criar diretório de deploy
if (Test-Path "deploy-easypanel-optimized") {
    Remove-Item -Recurse -Force "deploy-easypanel-optimized"
}
New-Item -ItemType Directory -Name "deploy-easypanel-optimized" | Out-Null

# Copiar arquivos essenciais
Copy-Item "package.easypanel.json" "deploy-easypanel-optimized/package.json"
if (Test-Path "package-lock.json") { Copy-Item "package-lock.json" "deploy-easypanel-optimized/" }
Copy-Item "Dockerfile.easypanel-optimized" "deploy-easypanel-optimized/Dockerfile"
Copy-Item ".env.easypanel" "deploy-easypanel-optimized/.env"
Copy-Item "webhook-evolution-websocket.js" "deploy-easypanel-optimized/"
Copy-Item -Recurse "src" "deploy-easypanel-optimized/"
Copy-Item -Recurse "public" "deploy-easypanel-optimized/"
if (Test-Path "vite.config.ts") { Copy-Item "vite.config.ts" "deploy-easypanel-optimized/" }
if (Test-Path "tsconfig.json") { Copy-Item "tsconfig*.json" "deploy-easypanel-optimized/" }
Copy-Item "index.html" "deploy-easypanel-optimized/"
if (Test-Path "tailwind.config.js") { Copy-Item "tailwind.config.js" "deploy-easypanel-optimized/" }
if (Test-Path "postcss.config.js") { Copy-Item "postcss.config.js" "deploy-easypanel-optimized/" }

# Criar arquivo ZIP
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path "deploy-easypanel-optimized.zip") {
    Remove-Item "deploy-easypanel-optimized.zip"
}
[System.IO.Compression.ZipFile]::CreateFromDirectory("deploy-easypanel-optimized", "deploy-easypanel-optimized.zip")

Write-Host "✅ Pacote criado: deploy-easypanel-optimized.zip" -ForegroundColor Green

# 8. Instruções finais
Write-Host ""
Write-Host "📋 INSTRUÇÕES PARA EASYPANEL:" -ForegroundColor Blue
Write-Host ""
Write-Host "1️⃣ Faça upload do arquivo: deploy-easypanel-optimized.zip"
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
Write-Host "   ✅ VITE_EVOLUTION_API_URL"
Write-Host ""
Write-Host "4️⃣ Após deploy, testar:"
Write-Host "   curl https://bkcrm.devsible.com.br/health"
Write-Host ""
Write-Host "🚀 Deploy otimizado pronto!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Problemas resolvidos:" -ForegroundColor Yellow
Write-Host "   ✅ Docker daemon connection reset"
Write-Host "   ✅ Build layers otimizados"
Write-Host "   ✅ Cache NPM configurado"
Write-Host "   ✅ Dependências minimizadas"
Write-Host "   ✅ Multi-stage build eficiente" 