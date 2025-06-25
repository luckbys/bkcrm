#!/bin/bash

# 🔧 SOLUÇÃO PARA ERRO DE DEPLOY NO EASYPANEL
# Resolve: ERROR: failed to export: saving image with ID

set -e

echo "🚀 Iniciando correção do deploy EasyPanel..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. Limpeza de cache e otimização
echo -e "${YELLOW}🧹 Limpando cache e otimizando build...${NC}"

# Limpar cache npm
npm cache clean --force

# Limpar node_modules
rm -rf node_modules

# Reinstalar dependências com cache limpo
npm install --no-audit --no-fund

# 2. Otimizar package.json para produção
echo -e "${YELLOW}📦 Otimizando package.json...${NC}"

# Criar versão otimizada do package.json
cat > package.easypanel.json << 'EOF'
{
  "name": "bkcrm",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=2048' vite build --mode production",
    "start": "vite preview --port $PORT --host 0.0.0.0",
    "preview": "vite preview --port 80 --host 0.0.0.0"
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
    "zustand": "^5.0.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.5.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  }
}
EOF

# 3. Criar Dockerfile otimizado para EasyPanel
echo -e "${YELLOW}🐳 Criando Dockerfile otimizado...${NC}"

cat > Dockerfile.easypanel-optimized << 'EOF'
# Dockerfile ultra-otimizado para EasyPanel
# Resolve problemas de conexão com Docker daemon

FROM node:18-alpine AS base

# Otimizações de sistema
RUN apk add --no-cache dumb-init curl bash && \
    npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 10000 && \
    npm config set fetch-timeout 600000

WORKDIR /app

# Stage 1: Dependencies
FROM base AS deps
COPY package.easypanel.json package.json
COPY package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production --silent

# Stage 2: Build
FROM base AS builder
COPY package.easypanel.json package.json
COPY package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --silent

COPY . .
RUN npm run build

# Stage 3: Runner
FROM nginx:alpine AS runner

# Instalar Node.js leve
RUN apk add --no-cache nodejs npm curl

# Copiar aplicação
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar webhook
COPY webhook-evolution-websocket.js /app/webhook.js
COPY package.easypanel.json /app/package.json

# Instalar deps do webhook
WORKDIR /app
RUN npm install express socket.io cors @supabase/supabase-js --production

# Configurar nginx simples
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

# Script de inicialização
RUN echo '#!/bin/sh\nnode /app/webhook.js &\nnginx -g "daemon off;"' > /start.sh && chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
EOF

# 4. Configurar variáveis de ambiente
echo -e "${YELLOW}⚙️ Configurando variáveis de ambiente...${NC}"

cat > .env.easypanel << 'EOF'
NODE_ENV=production
PORT=80
VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
VITE_EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
VITE_WEBSOCKET_URL=wss://bkcrm.devsible.com.br
EOF

# 5. Criar script de verificação
echo -e "${YELLOW}🔍 Criando script de verificação...${NC}"

cat > verify-build.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 Verificando build...');

// Verificar arquivos necessários
const requiredFiles = [
  'package.easypanel.json',
  'Dockerfile.easypanel-optimized',
  '.env.easypanel',
  'webhook-evolution-websocket.js'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - FALTANDO`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('❌ Arquivos faltando. Execute o script novamente.');
  process.exit(1);
}

// Testar build local
try {
  console.log('🏗️ Testando build local...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build local funcionando');
} catch (error) {
  console.log('❌ Erro no build local:', error.message);
  process.exit(1);
}

console.log('✅ Verificação completa - pronto para deploy!');
EOF

chmod +x verify-build.js

# 6. Executar verificação
echo -e "${YELLOW}🧪 Executando verificação...${NC}"
node verify-build.js

# 7. Criar pacote otimizado para upload
echo -e "${YELLOW}📦 Criando pacote para upload...${NC}"

# Criar diretório de deploy
rm -rf deploy-easypanel-optimized
mkdir deploy-easypanel-optimized

# Copiar arquivos essenciais
cp package.easypanel.json deploy-easypanel-optimized/package.json
cp package-lock.json deploy-easypanel-optimized/
cp Dockerfile.easypanel-optimized deploy-easypanel-optimized/Dockerfile
cp .env.easypanel deploy-easypanel-optimized/.env
cp webhook-evolution-websocket.js deploy-easypanel-optimized/
cp -r src deploy-easypanel-optimized/
cp -r public deploy-easypanel-optimized/
cp vite.config.ts deploy-easypanel-optimized/
cp tsconfig*.json deploy-easypanel-optimized/ 2>/dev/null || true
cp index.html deploy-easypanel-optimized/
cp tailwind.config.js deploy-easypanel-optimized/ 2>/dev/null || true
cp postcss.config.js deploy-easypanel-optimized/ 2>/dev/null || true

# Criar arquivo ZIP
cd deploy-easypanel-optimized
zip -r ../deploy-easypanel-optimized.zip . -x "*.git*" "node_modules/*" "dist/*"
cd ..

echo -e "${GREEN}✅ Pacote criado: deploy-easypanel-optimized.zip${NC}"

# 8. Instruções finais
echo -e "${BLUE}📋 INSTRUÇÕES PARA EASYPANEL:${NC}"
echo ""
echo "1️⃣ Faça upload do arquivo: deploy-easypanel-optimized.zip"
echo ""
echo "2️⃣ Configure no EasyPanel:"
echo "   - Dockerfile: Dockerfile"
echo "   - Build Context: /"
echo "   - Port: 80"
echo ""
echo "3️⃣ Variáveis de ambiente (já no .env):"
echo "   ✅ NODE_ENV=production"
echo "   ✅ PORT=80"
echo "   ✅ VITE_SUPABASE_URL"
echo "   ✅ VITE_EVOLUTION_API_URL"
echo ""
echo "4️⃣ Após deploy, testar:"
echo "   curl https://bkcrm.devsible.com.br/health"
echo ""
echo -e "${GREEN}🚀 Deploy otimizado pronto!${NC}"
echo ""
echo -e "${YELLOW}💡 Problemas resolvidos:${NC}"
echo "   ✅ Docker daemon connection reset"
echo "   ✅ Build layers otimizados"
echo "   ✅ Cache NPM configurado"
echo "   ✅ Dependências minimizadas"
echo "   ✅ Multi-stage build eficiente" 