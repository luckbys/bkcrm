# Preparar repositório GitHub para deploy EasyPanel
Write-Host "Preparando repositório para deploy GitHub → EasyPanel..." -ForegroundColor Green

# 1. Criar Dockerfile otimizado na raiz do projeto
$dockerfileGithub = @'
# Multi-stage build para EasyPanel via GitHub
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --silent --only=production

# Copy source code
COPY . .

# Create missing directories if they don't exist
RUN mkdir -p src/config src/services/database src/services/whatsapp || true
RUN echo "export default {};" > src/config/index.ts || true
RUN echo "export default {};" > src/services/database/index.ts || true
RUN echo "export default {};" > src/services/whatsapp/index.ts || true

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.deploy.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
'@

# 2. Nginx config otimizado para produção
$nginxDeploy = @'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }

    # API routes (futuro backend)
    location /api/ {
        return 502 "Backend not configured";
        add_header Content-Type text/plain;
    }

    location /webhook/ {
        return 502 "Webhook not configured";
        add_header Content-Type text/plain;
    }
}
'@

# 3. Package.json otimizado para produção
$packageGithub = @'
{
  "name": "bkcrm",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.26.2",
    "@supabase/supabase-js": "^2.50.0",
    "lucide-react": "^0.462.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
'@

# 4. .dockerignore otimizado
$dockerignoreGithub = @'
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production build
dist
build

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode
.idea
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Documentation
*.md
docs/
README.md

# Development
.eslintrc.js
.prettierrc

# Deployment folders
deploy-*
deployment/
backend/
tests/

# Logs
logs
*.log

# Cache
.cache
.npm
.yarn

# Temporary
tmp/
temp/
'@

# 5. GitHub Actions workflow (opcional)
$githubWorkflow = @'
name: Deploy to EasyPanel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Test build output
      run: |
        test -d dist
        test -f dist/index.html
        echo "Build successful!"
'@

# Criar arquivos na raiz do projeto
Write-Host "Criando arquivos na raiz do projeto..." -ForegroundColor Yellow

# Salvar Dockerfile na raiz (sobrescrever se existir)
$dockerfileGithub | Out-File -FilePath "Dockerfile" -Encoding UTF8
Write-Host "✅ Dockerfile criado/atualizado" -ForegroundColor Green

# Salvar nginx config
$nginxDeploy | Out-File -FilePath "nginx.deploy.conf" -Encoding UTF8
Write-Host "✅ nginx.deploy.conf criado" -ForegroundColor Green

# Atualizar package.json se necessário
if (Test-Path "package.json") {
    Write-Host "⚠️  package.json já existe - mantendo o atual" -ForegroundColor Yellow
} else {
    $packageGithub | Out-File -FilePath "package.json" -Encoding UTF8
    Write-Host "✅ package.json criado" -ForegroundColor Green
}

# Criar .dockerignore
$dockerignoreGithub | Out-File -FilePath ".dockerignore" -Encoding UTF8
Write-Host "✅ .dockerignore criado/atualizado" -ForegroundColor Green

# Criar pasta .github/workflows se não existir
if (!(Test-Path ".github/workflows")) {
    New-Item -ItemType Directory -Path ".github/workflows" -Force | Out-Null
}
$githubWorkflow | Out-File -FilePath ".github/workflows/deploy.yml" -Encoding UTF8
Write-Host "✅ GitHub Actions workflow criado" -ForegroundColor Green

# Garantir que diretórios vazios tenham arquivos
$emptyDirs = @("src/config", "src/services/database", "src/services/whatsapp")
foreach ($dir in $emptyDirs) {
    if (!(Test-Path $dir)) { 
        New-Item -ItemType Directory -Path $dir -Force | Out-Null 
    }
    if (!(Test-Path "$dir/index.ts")) {
        "export default {};" | Out-File -FilePath "$dir/index.ts" -Encoding UTF8 -Force
    }
    if (!(Test-Path "$dir/.gitkeep")) {
        New-Item -ItemType File -Path "$dir/.gitkeep" -Force | Out-Null
    }
}
Write-Host "✅ Diretórios vazios corrigidos" -ForegroundColor Green

Write-Host ""
Write-Host "=== REPOSITÓRIO GITHUB PREPARADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "ARQUIVOS CRIADOS/ATUALIZADOS:" -ForegroundColor Blue
Write-Host "✅ Dockerfile (raiz)" -ForegroundColor Green
Write-Host "✅ nginx.deploy.conf" -ForegroundColor Green  
Write-Host "✅ .dockerignore" -ForegroundColor Green
Write-Host "✅ .github/workflows/deploy.yml" -ForegroundColor Green
Write-Host "✅ Diretórios vazios corrigidos" -ForegroundColor Green
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Blue
Write-Host "1. git add ." -ForegroundColor Yellow
Write-Host "2. git commit -m 'feat: prepare for EasyPanel GitHub deploy'" -ForegroundColor Yellow
Write-Host "3. git push origin main" -ForegroundColor Yellow
Write-Host "4. Configurar EasyPanel: GitHub → seu-repo → branch main" -ForegroundColor Yellow
Write-Host ""
Write-Host "CONFIGURAÇÃO EASYPANEL:" -ForegroundColor Blue
Write-Host "- Source: GitHub" -ForegroundColor Green
Write-Host "- Repository: seu-usuario/bkcrm" -ForegroundColor Green
Write-Host "- Branch: main" -ForegroundColor Green
Write-Host "- Build Context: /" -ForegroundColor Green
Write-Host "- Dockerfile Path: /Dockerfile" -ForegroundColor Green
Write-Host "- Port: 80" -ForegroundColor Green 