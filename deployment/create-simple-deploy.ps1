# Script simples para criar pacote de deploy

Write-Host "Criando pacote de deploy otimizado..." -ForegroundColor Green

# Limpar cache npm
Write-Host "Limpando cache..." -ForegroundColor Yellow
npm cache clean --force

# Criar package.json simplificado
Write-Host "Criando package.json..." -ForegroundColor Yellow
$pkg = @'
{
  "name": "bkcrm",
  "version": "1.0.0",
  "scripts": {
    "build": "vite build",
    "start": "vite preview --port 80 --host 0.0.0.0"
  },
  "dependencies": {
    "@chakra-ui/react": "^3.21.0",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@supabase/supabase-js": "^2.50.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.2",
    "socket.io-client": "^4.8.1",
    "zustand": "^5.0.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  }
}
'@
$pkg | Out-File -FilePath "package.simple.json" -Encoding UTF8

# Criar .env
Write-Host "Criando .env..." -ForegroundColor Yellow
$env = @'
NODE_ENV=production
PORT=80
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
'@
$env | Out-File -FilePath ".env.simple" -Encoding UTF8

# Criar Dockerfile simples
Write-Host "Criando Dockerfile..." -ForegroundColor Yellow
$dockerfile = @'
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
'@
$dockerfile | Out-File -FilePath "Dockerfile.simple" -Encoding UTF8

# Criar script de start
Write-Host "Criando start script..." -ForegroundColor Yellow
$startScript = @'
#!/bin/sh
node /app/webhook-evolution-websocket.js &
nginx -g "daemon off;"
'@
$startScript | Out-File -FilePath "start.sh" -Encoding UTF8

# Criar diretório
Write-Host "Criando diretorio..." -ForegroundColor Yellow
if (Test-Path "deploy-simple") {
    Remove-Item -Recurse -Force "deploy-simple"
}
New-Item -ItemType Directory -Name "deploy-simple" | Out-Null

# Copiar arquivos
Write-Host "Copiando arquivos..." -ForegroundColor Yellow
Copy-Item "package.simple.json" "deploy-simple/package.json"
Copy-Item ".env.simple" "deploy-simple/.env"
Copy-Item "Dockerfile.simple" "deploy-simple/Dockerfile"
Copy-Item "start.sh" "deploy-simple/"
Copy-Item "webhook-evolution-websocket.js" "deploy-simple/"
Copy-Item -Recurse "src" "deploy-simple/"
Copy-Item -Recurse "public" "deploy-simple/"
Copy-Item "index.html" "deploy-simple/"
if (Test-Path "vite.config.ts") { Copy-Item "vite.config.ts" "deploy-simple/" }
if (Test-Path "package-lock.json") { Copy-Item "package-lock.json" "deploy-simple/" }

# Criar ZIP
Write-Host "Criando ZIP..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
if (Test-Path "deploy-simple.zip") {
    Remove-Item "deploy-simple.zip"
}
[System.IO.Compression.ZipFile]::CreateFromDirectory("deploy-simple", "deploy-simple.zip")

Write-Host "Pacote criado: deploy-simple.zip" -ForegroundColor Green
Write-Host ""
Write-Host "INSTRUCOES:" -ForegroundColor Blue
Write-Host "1. Upload deploy-simple.zip no EasyPanel"
Write-Host "2. Dockerfile: Dockerfile"
Write-Host "3. Port: 80" 
Write-Host "4. Testar: curl https://bkcrm.devsible.com.br/health"
Write-Host ""
Write-Host "Deploy pronto!" -ForegroundColor Green 