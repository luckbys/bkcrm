#!/bin/bash

echo "🚀 Deploy do Evolution Webhook Server para Produção"
echo "=================================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js primeiro."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Instale o npm primeiro."
    exit 1
fi

echo "✅ Node.js $(node --version) encontrado"
echo "✅ npm $(npm --version) encontrado"

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install express body-parser cors dotenv
else
    echo "✅ Dependências já instaladas"
fi

# Verificar se o arquivo de configuração existe
if [ ! -f "webhook.env" ]; then
    echo "⚠️ Arquivo webhook.env não encontrado. Criando arquivo de exemplo..."
    cat > webhook.env << EOF
# Configurações do Webhook Server para Produção
WEBHOOK_PORT=4000
NODE_ENV=production

# URL base do seu domínio
BASE_URL=https://bkcrm.devsible.com.br

# Configurações da Evolution API
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# Configurações de segurança
WEBHOOK_SECRET=your_webhook_secret_key_here

# Configurações de CORS
ALLOWED_ORIGINS=https://bkcrm.devsible.com.br,https://press-evolution-api.jhkbgs.easypanel.host
EOF
    echo "📝 Arquivo webhook.env criado. Configure as variáveis antes de continuar."
fi

# Verificar se o PM2 está instalado (para produção)
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 encontrado - usando para produção"
    
    # Criar arquivo de configuração do PM2
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'evolution-webhook',
    script: 'webhook-production.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/webhook-error.log',
    out_file: './logs/webhook-out.log',
    log_file: './logs/webhook-combined.log',
    time: true
  }]
};
EOF

    # Criar diretório de logs
    mkdir -p logs

    echo "🔄 Parando instância anterior (se existir)..."
    pm2 stop evolution-webhook 2>/dev/null || true
    pm2 delete evolution-webhook 2>/dev/null || true

    echo "🚀 Iniciando webhook server com PM2..."
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup

    echo "📊 Status do servidor:"
    pm2 status

else
    echo "⚠️ PM2 não encontrado. Instalando PM2 para produção..."
    npm install -g pm2
    
    echo "🚀 Iniciando servidor em modo desenvolvimento..."
    node webhook-production.js
fi

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Webhook URL: https://bkcrm.devsible.com.br/webhook/evolution"
echo "🏥 Health check: https://bkcrm.devsible.com.br/health"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o webhook na Evolution API para: https://bkcrm.devsible.com.br/webhook/evolution"
echo "2. Configure seu proxy reverso (nginx/apache) para redirecionar para porta 4000"
echo "3. Configure SSL/HTTPS no seu servidor"
echo ""
echo "🔧 Comandos úteis:"
echo "- Ver logs: pm2 logs evolution-webhook"
echo "- Reiniciar: pm2 restart evolution-webhook"
echo "- Parar: pm2 stop evolution-webhook"
echo "- Status: pm2 status" 