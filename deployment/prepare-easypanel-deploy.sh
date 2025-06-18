#!/bin/bash

# Criar diretório temporário
mkdir -p deploy-temp

# Copiar arquivos necessários
cp Dockerfile deploy-temp/
cp webhook-evolution-complete-corrigido.cjs deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/

# Criar arquivo .env com as configurações
cat > deploy-temp/.env << EOL
NODE_ENV=production
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
EOL

# Criar arquivo zip
cd deploy-temp
zip -r ../deploy-easypanel.zip ./*
cd ..

# Limpar diretório temporário
rm -rf deploy-temp

echo "✅ Arquivo deploy-easypanel.zip criado com sucesso!"
echo "📋 Instruções:"
echo "1. Faça upload do arquivo deploy-easypanel.zip no EasyPanel"
echo "2. Configure as variáveis de ambiente no EasyPanel"
echo "3. Inicie o deploy" 