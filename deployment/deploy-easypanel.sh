#!/bin/bash

# 🚀 Deploy do Servidor Webhook Evolution API - EasyPanel
# Este script configura o servidor webhook no EasyPanel

echo "🚀 Iniciando deploy do servidor webhook no EasyPanel..."

# Verificar se estamos no diretório correto
if [ ! -f "webhook-evolution-complete.js" ]; then
    echo "❌ Erro: arquivo webhook-evolution-complete.js não encontrado!"
    echo "Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o arquivo de configuração existe
if [ ! -f "webhook.env" ]; then
    echo "❌ Erro: arquivo webhook.env não encontrado!"
    echo "Configure as variáveis de ambiente primeiro"
    exit 1
fi

echo "✅ Arquivos necessários encontrados"

# Criar Dockerfile se não existir
if [ ! -f "Dockerfile.webhook" ]; then
    echo "📝 Criando Dockerfile para o webhook..."
    cat > Dockerfile.webhook << 'EOF'
FROM node:18-alpine

# Criar diretório de trabalho
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar arquivos do servidor webhook
COPY webhook-evolution-complete.js ./
COPY webhook.env ./.env

# Expor porta
EXPOSE 4000

# Comando para iniciar
CMD ["node", "webhook-evolution-complete.js"]
EOF
    echo "✅ Dockerfile.webhook criado"
fi

# Criar docker-compose para EasyPanel
if [ ! -f "docker-compose.webhook.yml" ]; then
    echo "📝 Criando docker-compose.webhook.yml..."
    cat > docker-compose.webhook.yml << 'EOF'
version: '3.8'

services:
  evolution-webhook:
    build:
      context: .
      dockerfile: Dockerfile.webhook
    container_name: evolution-webhook
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    env_file:
      - webhook.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.evolution-webhook.rule=Host(\`bkcrm.devsible.com.br\`) && PathPrefix(\`/webhook\`)"
      - "traefik.http.services.evolution-webhook.loadbalancer.server.port=4000"
      - "traefik.http.routers.evolution-webhook.tls.certresolver=letsencrypt"
EOF
    echo "✅ docker-compose.webhook.yml criado"
fi

# Criar .easypanel.yml se não existir
if [ ! -f ".easypanel.yml" ]; then
    echo "📝 Criando configuração EasyPanel..."
    cat > .easypanel.yml << 'EOF'
name: evolution-webhook
description: Servidor Webhook para Evolution API
type: app
source:
  type: git
  repo: https://github.com/seu-usuario/bkcrm.git
  branch: main
build:
  dockerfile: Dockerfile.webhook
deploy:
  replicas: 1
  strategy: rolling
  resources:
    memory: 512Mi
    cpu: 0.5
domains:
  - host: bkcrm.devsible.com.br
    path: /webhook
    port: 4000
env:
  - name: NODE_ENV
    value: production
  - name: WEBHOOK_PORT
    value: "4000"
  - name: BASE_URL
    value: "https://bkcrm.devsible.com.br"
healthcheck:
  path: /health
  port: 4000
  interval: 30s
EOF
    echo "✅ .easypanel.yml criado"
fi

echo ""
echo "🎉 Arquivos de deploy criados com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Commit e push dos arquivos para seu repositório Git"
echo "2. No EasyPanel, criar nova aplicação com este repositório"
echo "3. Configurar variáveis de ambiente"
echo "4. Fazer deploy"
echo ""
echo "📁 Arquivos criados:"
echo "  - Dockerfile.webhook"
echo "  - docker-compose.webhook.yml"
echo "  - .easypanel.yml"
echo ""
echo "🔗 URL final: https://bkcrm.devsible.com.br/webhook/evolution" 