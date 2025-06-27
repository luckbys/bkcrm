#!/bin/bash

# Criar diretório temporário
mkdir -p temp-deploy

# Copiar arquivos necessários
cp webhook-evolution-websocket.js temp-deploy/
cp webhook.env temp-deploy/
cp package.json temp-deploy/
cp Dockerfile temp-deploy/

# Gerar package-lock.json
cd temp-deploy
npm install --package-lock-only
cd ..

# Criar arquivo ZIP
zip -r bkcrm-websocket-deploy-v5.zip temp-deploy/*

# Limpar diretório temporário
rm -rf temp-deploy

echo "✅ Pacote de deploy criado: bkcrm-websocket-deploy-v5.zip" 