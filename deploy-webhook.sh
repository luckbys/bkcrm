#!/bin/bash

# 🚀 Script de Deploy do Webhook Server para EasyPanel
# Este script prepara os arquivos necessários para o deploy

echo "🚀 Preparando deploy do Webhook Server para EasyPanel..."

# Verificar se arquivos necessários existem
echo "📋 Verificando arquivos necessários..."

required_files=(
    "webhook-evolution-websocket.cjs"
    "webhook-package.json"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo "❌ Arquivos obrigatórios não encontrados:"
    printf '   - %s\n' "${missing_files[@]}"
    exit 1
fi

echo "✅ Todos os arquivos necessários foram encontrados!"

# Criar diretório de deploy
deploy_dir="deploy-webhook"
echo "📁 Criando diretório de deploy: $deploy_dir"
mkdir -p "$deploy_dir"

# Copiar arquivos necessários
echo "📋 Copiando arquivos para deploy..."
cp webhook-evolution-websocket.cjs "$deploy_dir/"
cp webhook-package.json "$deploy_dir/package.json"
cp Dockerfile.webhook "$deploy_dir/Dockerfile"
cp DEPLOY_WEBHOOK_EASYPANEL.md "$deploy_dir/"

# Verificar se há .gitignore
if [ ! -f "$deploy_dir/.gitignore" ]; then
    echo "📝 Criando .gitignore..."
    cat > "$deploy_dir/.gitignore" << EOL
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/
EOL
fi

# Criar arquivo de configuração para EasyPanel
echo "⚙️ Criando configuração para EasyPanel..."
cat > "$deploy_dir/easypanel.yml" << EOL
name: bkcrm-webhook
services:
  webhook:
    image: node:18-alpine
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      PORT: 4000
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/webhook/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOL

# Criar arquivo README específico para o webhook
echo "📖 Criando README do webhook..."
cat > "$deploy_dir/README.md" << EOL
# BKCRM Webhook Server

Servidor webhook para integração Evolution API + WebSocket + Supabase.

## 🚀 Deploy Rápido

1. **Clone este repositório**
2. **Configure variáveis de ambiente na EasyPanel**
3. **Deploy automático**

## 📋 Variáveis Necessárias

\`\`\`bash
NODE_ENV=production
PORT=4000
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU
FRONTEND_URL=https://bkcrm.devsible.com.br
\`\`\`

## ✅ Health Check

\`\`\`bash
curl https://webhook.bkcrm.devsible.com.br/webhook/health
\`\`\`

Para mais detalhes, veja: \`DEPLOY_WEBHOOK_EASYPANEL.md\`
EOL

# Verificar estrutura final
echo "📊 Estrutura do deploy criada:"
tree "$deploy_dir" 2>/dev/null || find "$deploy_dir" -type f -exec echo "  {}" \;

echo ""
echo "✅ Deploy preparado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. 📁 Suba o conteúdo da pasta '$deploy_dir' para seu repositório Git"
echo "2. 🌐 Crie um novo projeto na EasyPanel"
echo "3. ⚙️ Configure as variáveis de ambiente"
echo "4. 🚀 Faça o deploy!"
echo ""
echo "📖 Consulte DEPLOY_WEBHOOK_EASYPANEL.md para instruções detalhadas"

# Verificar se Git está configurado
if command -v git &> /dev/null; then
    echo ""
    echo "💡 Comandos Git sugeridos:"
    echo "   cd $deploy_dir"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Deploy: Webhook server configurado'"
    echo "   git remote add origin <URL_DO_SEU_REPOSITORIO>"
    echo "   git push -u origin main"
fi

echo ""
echo "🎉 Deploy preparado! Agora você pode seguir o guia DEPLOY_WEBHOOK_EASYPANEL.md" 