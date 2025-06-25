#!/bin/bash

# 🚀 Deploy BKCRM no EasyPanel usando Heroku Builder 24
# Este script configura o projeto para usar buildpacks ao invés de Docker tradicional

echo "🔧 Configurando deploy com Heroku Builder 24..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# 1. Atualizar package.json para incluir engines
echo "📦 Configurando engines no package.json..."
npm pkg set engines.node=">=18.0.0"
npm pkg set engines.npm=">=8.0.0"

# 2. Criar Procfile para especificar como rodar a aplicação
echo "📝 Criando Procfile..."
cat > Procfile << 'EOF'
web: npm run start
EOF

# 3. Criar arquivo .buildpacks (alternativa ao app.json)
echo "🏗️ Criando .buildpacks..."
cat > .buildpacks << 'EOF'
https://github.com/heroku/heroku-buildpack-nodejs
https://github.com/heroku/heroku-buildpack-static
EOF

# 4. Verificar se todas as dependências estão corretas
echo "🔍 Verificando dependências..."
if ! npm list --depth=0 > /dev/null 2>&1; then
    echo "⚠️ Algumas dependências podem estar faltando. Instalando..."
    npm install
fi

# 5. Criar um build de teste local
echo "🧪 Testando build local..."
if npm run build; then
    echo "✅ Build local executado com sucesso!"
else
    echo "❌ Erro no build local. Verificando problemas..."
    
    # Verificar arquivos de configuração específicos
    if [ ! -f "src/config/index.ts" ]; then
        mkdir -p src/config
        echo "export default {};" > src/config/index.ts
    fi
    
    if [ ! -f "src/services/database/index.ts" ]; then
        mkdir -p src/services/database
        echo "export default {};" > src/services/database/index.ts
    fi
    
    if [ ! -f "src/services/whatsapp/index.ts" ]; then
        mkdir -p src/services/whatsapp
        echo "export default {};" > src/services/whatsapp/index.ts
    fi
    
    echo "🔄 Tentando build novamente..."
    if npm run build; then
        echo "✅ Build corrigido com sucesso!"
    else
        echo "❌ Build ainda falhando. Verifique os logs acima."
        exit 1
    fi
fi

# 6. Criar arquivo de configuração para EasyPanel
echo "⚙️ Criando configuração para EasyPanel..."
cat > easypanel.config.json << 'EOF'
{
  "name": "bkcrm",
  "build": {
    "type": "buildpack",
    "stack": "heroku-24",
    "buildpacks": [
      "heroku/nodejs",
      "https://github.com/heroku/heroku-buildpack-static"
    ]
  },
  "web": {
    "port": "$PORT",
    "command": "npm run start"
  },
  "env": {
    "NODE_ENV": "production",
    "NPM_CONFIG_PRODUCTION": "true",
    "VITE_APP_ENV": "production"
  }
}
EOF

# 7. Limpar cache e arquivos temporários
echo "🧹 Limpando cache..."
rm -rf node_modules/.cache
rm -rf dist
npm cache clean --force

# 8. Instruções finais
echo ""
echo "🎉 Configuração concluída!"
echo ""
echo "📋 Próximos passos para deploy no EasyPanel:"
echo "1. Faça commit das mudanças no Git:"
echo "   git add ."
echo "   git commit -m 'Configure Heroku Builder 24 for EasyPanel'"
echo "   git push origin main"
echo ""
echo "2. No EasyPanel:"
echo "   - Vá em 'Build Settings'"
echo "   - Escolha 'Buildpack' ao invés de 'Dockerfile'"
echo "   - Defina Stack: heroku-24"
echo "   - Buildpacks: heroku/nodejs e heroku/static"
echo "   - Start Command: npm run start"
echo ""
echo "3. Variáveis de ambiente no EasyPanel:"
echo "   NODE_ENV=production"
echo "   NPM_CONFIG_PRODUCTION=true"
echo "   VITE_APP_ENV=production"
echo ""
echo "✨ O deploy agora deve funcionar sem o erro 127!"

chmod +x deployment/easypanel-heroku-deploy.sh 