#!/bin/bash

echo "🚀 Deploy CRM para Produção - bkcrm.devsible.com.br"
echo "=================================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

echo "📋 Configurando ambiente de produção..."

# Backup do .env atual
if [ -f ".env" ]; then
    cp .env .env.backup
    echo "✅ Backup do .env criado (.env.backup)"
fi

# Copiar configurações de produção
if [ -f "env.production" ]; then
    cp env.production .env
    echo "✅ Configurações de produção aplicadas"
else
    echo "❌ Arquivo env.production não encontrado!"
    exit 1
fi

echo "📦 Instalando dependências..."
npm install

echo "🔨 Construindo aplicação para produção..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Arquivos gerados em: ./dist/"
else
    echo "❌ Erro no build!"
    exit 1
fi

echo ""
echo "✅ Deploy preparado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Faça upload da pasta 'dist' para seu servidor"
echo "2. Configure o Nginx conforme nginx-webhook.conf"
echo "3. Inicie o webhook server: ./deploy-webhook.sh"
echo ""
echo "🌐 URLs de produção:"
echo "- Frontend: https://bkcrm.devsible.com.br/"
echo "- Webhook: https://bkcrm.devsible.com.br/webhook/evolution"
echo "- Health: https://bkcrm.devsible.com.br/health"
echo "- Supabase (proxy): https://bkcrm.devsible.com.br/supabase"
echo ""
echo "🔧 Configuração do Nginx necessária:"
echo "- Copie nginx-webhook.conf para /etc/nginx/sites-available/"
echo "- Ative o site e recarregue o Nginx"
echo ""
echo "⚠️ Importante:"
echo "- O CORS será resolvido via proxy reverso"
echo "- Certifique-se de que o SSL está configurado"
echo "- Teste todos os endpoints após o deploy" 