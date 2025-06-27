#!/bin/bash

# 🚀 Script de Deploy WebSocket para EasyPanel
# Este script automatiza o deploy do servidor WebSocket no EasyPanel

echo "🚀 BKCRM WebSocket Deploy para EasyPanel"
echo "========================================"

# Verificar se os arquivos necessários existem
echo "📋 Verificando arquivos necessários..."

if [ ! -f "webhook-evolution-websocket.js" ]; then
    echo "❌ webhook-evolution-websocket.js não encontrado!"
    echo "🔧 Copiando da pasta backend..."
    cp ../backend/webhooks/webhook-evolution-websocket.js .
fi

if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile não encontrado!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json não encontrado!"
    exit 1
fi

echo "✅ Todos os arquivos necessários encontrados!"

# Verificar se estamos no diretório correto
if [ ! -d "../src" ]; then
    echo "❌ Execute este script na pasta deploy-webhook/"
    exit 1
fi

echo ""
echo "📦 Arquivos prontos para deploy:"
echo "- webhook-evolution-websocket.js ($(wc -l < webhook-evolution-websocket.js) linhas)"
echo "- Dockerfile"
echo "- package.json"
echo "- webhook.env"

echo ""
echo "🌐 Configurações de Deploy:"
echo "- URL: https://ws.bkcrm.devsible.com.br"
echo "- Porta: 4000"
echo "- Environment: production"

echo ""
echo "📖 PRÓXIMOS PASSOS NO EASYPANEL:"
echo "1. Criar novo serviço:"
echo "   - Nome: bkcrm-websocket"
echo "   - Tipo: Docker Build"
echo ""
echo "2. Fazer upload dos arquivos:"
echo "   - webhook-evolution-websocket.js"
echo "   - Dockerfile"
echo "   - package.json"
echo "   - webhook.env"
echo ""
echo "3. Configurar domínio:"
echo "   - ws.bkcrm.devsible.com.br"
echo "   - Porta: 4000"
echo "   - SSL: Ativado"
echo ""
echo "4. Variáveis de ambiente (copiar e colar):"
echo "NODE_ENV=production"
echo "PORT=4000"
echo "SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co"
echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU"
echo "EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host"
echo "EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11"
echo "BASE_URL=https://bkcrm.devsible.com.br"
echo ""
echo "5. Executar deploy no EasyPanel"
echo ""
echo "6. Testar se funcionou:"
echo "   curl https://ws.bkcrm.devsible.com.br/health"
echo ""
echo "✅ Arquivos preparados! Faça o upload no EasyPanel."
echo ""
echo "🧪 TESTE LOCAL:"
echo "Para testar localmente antes do deploy:"
echo "docker build -t bkcrm-websocket ."
echo "docker run -p 4000:4000 --env-file webhook.env bkcrm-websocket"
echo ""

# Criar arquivo ZIP para upload fácil (opcional)
if command -v zip &> /dev/null; then
    echo "📦 Criando arquivo ZIP para upload..."
    zip -r bkcrm-websocket-deploy.zip \
        webhook-evolution-websocket.js \
        Dockerfile \
        package.json \
        webhook.env \
        easypanel-websocket.json \
        deploy-easypanel.sh \
        > /dev/null
    echo "✅ Arquivo bkcrm-websocket-deploy.zip criado!"
    echo "📁 Você pode fazer upload deste ZIP no EasyPanel"
fi

echo ""
echo "🎯 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "Agora faça o upload dos arquivos no EasyPanel e execute o deploy." 