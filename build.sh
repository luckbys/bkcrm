#!/bin/bash

echo "🔄 Iniciando build do BKCRM..."

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
  echo "📦 Instalando dependências..."
  npm install
fi

# Build sem verificação de tipos TypeScript
echo "🏗️ Fazendo build da aplicação..."
export NODE_OPTIONS="--max-old-space-size=4096"
npx vite build --mode production

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
  echo "✅ Build realizado com sucesso!"
  echo "📂 Arquivos gerados em: ./dist/"
  ls -la dist/
else
  echo "❌ Erro no build!"
  exit 1
fi 