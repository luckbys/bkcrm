#!/bin/bash

# 🚀 Script de Deploy: Evolution Webhook Integration
# Este script automatiza o deploy do servidor webhook para receber mensagens da Evolution API

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do Evolution Webhook Integration..."

# Verificar se está no diretório correto
if [ ! -f "webhook-evolution-complete.js" ]; then
    echo "❌ Erro: arquivo webhook-evolution-complete.js não encontrado!"
    echo "Execute este script no diretório raiz do projeto."
    exit 1
fi

# 1. Instalar dependências necessárias
echo "📦 Instalando dependências..."
npm install express body-parser cors @supabase/supabase-js dotenv

# 2. Verificar arquivo de configuração
if [ ! -f "webhook.env" ]; then
    echo "⚠️ Arquivo webhook.env não encontrado. Criando..."
    cat > webhook.env << EOF
# Configurações do Webhook Evolution API
WEBHOOK_PORT=4000
BASE_URL=https://bkcrm.devsible.com.br

# Supabase
SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NDQ5NDMsImV4cCI6MjA1MTUyMDk0M30.xbNH2mNzAYJzNOdwjLDBgF_-P8qMa3Fq2YEyHiV_j4U

# Segurança
WEBHOOK_SECRET=seu-webhook-secret-aqui
ALLOWED_ORIGINS=https://bkcrm.devsible.com.br

# Logs
LOG_LEVEL=info
LOG_FILE=/var/log/evolution-webhook.log
EOF
    echo "✅ Arquivo webhook.env criado com configurações padrão"
    echo "⚠️ IMPORTANTE: Ajuste as configurações conforme necessário"
fi

# 3. Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# 4. Parar processo anterior se existir
echo "🔄 Parando processo anterior..."
pm2 stop evolution-webhook 2>/dev/null || echo "Nenhum processo anterior encontrado"
pm2 delete evolution-webhook 2>/dev/null || echo "Nenhum processo para deletar"

# 5. Iniciar servidor webhook
echo "🚀 Iniciando servidor webhook..."
pm2 start webhook-evolution-complete.js --name "evolution-webhook" --watch --ignore-watch="node_modules logs *.log"

# 6. Salvar configuração PM2
echo "💾 Salvando configuração PM2..."
pm2 save

# 7. Configurar startup automático
echo "🔧 Configurando startup automático..."
pm2 startup | grep -E '^sudo ' | sh 2>/dev/null || echo "⚠️ Execute manualmente: pm2 startup"

# 8. Testar servidor
echo "🧪 Testando servidor..."
sleep 3

# Testar se está rodando
if pm2 list | grep -q "evolution-webhook.*online"; then
    echo "✅ Servidor webhook iniciado com sucesso!"
    
    # Testar health check
    echo "🏥 Testando health check..."
    if curl -f http://localhost:4000/health &>/dev/null; then
        echo "✅ Health check OK!"
    else
        echo "⚠️ Health check falhou - verifique logs: pm2 logs evolution-webhook"
    fi
    
    # Testar endpoint público (se HTTPS estiver configurado)
    echo "🌐 Testando endpoint público..."
    if curl -f https://bkcrm.devsible.com.br/health &>/dev/null; then
        echo "✅ Endpoint público funcionando!"
    else
        echo "⚠️ Endpoint público não responde - verifique configuração Nginx"
    fi
else
    echo "❌ Erro ao iniciar servidor webhook!"
    echo "Verificar logs: pm2 logs evolution-webhook"
    exit 1
fi

# 9. Verificar configuração Nginx
echo "🔧 Verificando configuração Nginx..."
if [ -f "/etc/nginx/sites-available/bkcrm-webhook" ]; then
    echo "✅ Configuração Nginx encontrada"
    
    # Testar configuração
    if nginx -t &>/dev/null; then
        echo "✅ Configuração Nginx válida"
        
        # Recarregar Nginx
        echo "🔄 Recarregando Nginx..."
        systemctl reload nginx 2>/dev/null || echo "⚠️ Execute manualmente: sudo systemctl reload nginx"
    else
        echo "⚠️ Configuração Nginx inválida - execute: sudo nginx -t"
    fi
else
    echo "⚠️ Configuração Nginx não encontrada"
    echo "Copie o arquivo nginx-webhook.conf para /etc/nginx/sites-available/bkcrm-webhook"
fi

# 10. Verificar banco de dados
echo "🗄️ Verificando banco de dados..."
if node -e "
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: './webhook.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
    try {
        const { data, error } = await supabase.from('evolution_instances').select('count').limit(1);
        if (error) throw error;
        console.log('✅ Conexão com Supabase OK');
    } catch (err) {
        console.log('❌ Erro na conexão com Supabase:', err.message);
        process.exit(1);
    }
})();
" 2>/dev/null; then
    echo "✅ Banco de dados conectado"
else
    echo "⚠️ Problemas na conexão com banco - verifique configurações no webhook.env"
fi

# 11. Mostrar informações finais
echo ""
echo "🎉 Deploy concluído!"
echo ""
echo "📊 STATUS:"
echo "- Servidor: $(pm2 list | grep evolution-webhook | awk '{print $10}')"
echo "- Porta: 4000"
echo "- Logs: pm2 logs evolution-webhook"
echo ""
echo "🔗 ENDPOINTS:"
echo "- Health: https://bkcrm.devsible.com.br/health"
echo "- Webhook: https://bkcrm.devsible.com.br/webhook/evolution"
echo "- Teste: https://bkcrm.devsible.com.br/test"
echo ""
echo "🛠️ COMANDOS ÚTEIS:"
echo "- Ver logs: pm2 logs evolution-webhook"
echo "- Reiniciar: pm2 restart evolution-webhook"
echo "- Parar: pm2 stop evolution-webhook"
echo "- Status: pm2 status"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Configurar webhooks na Evolution API:"
echo "   URL: https://bkcrm.devsible.com.br/webhook/evolution"
echo "2. Conectar instâncias WhatsApp"
echo "3. Testar com mensagem real"
echo ""
echo "🧪 TESTE RÁPIDO:"
echo 'curl -X POST https://bkcrm.devsible.com.br/test -H "Content-Type: application/json" -d '"'"'{"test":"ok"}'"'"''
echo ""

# 12. Opcional: Abrir logs em tempo real
read -p "🔍 Quer ver os logs em tempo real? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔍 Mostrando logs em tempo real (Ctrl+C para sair)..."
    pm2 logs evolution-webhook
fi

echo "✨ Deploy finalizado com sucesso!" 