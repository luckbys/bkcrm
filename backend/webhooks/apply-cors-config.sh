#!/bin/bash

# Copiar configuração Nginx
sudo cp nginx.webhook.conf /etc/nginx/sites-available/webhook.bkcrm.devsible.com.br
sudo ln -sf /etc/nginx/sites-available/webhook.bkcrm.devsible.com.br /etc/nginx/sites-enabled/

# Testar configuração Nginx
sudo nginx -t

# Reiniciar Nginx se o teste passar
if [ $? -eq 0 ]; then
    sudo systemctl restart nginx
    echo "✅ Configuração Nginx atualizada com sucesso"
else
    echo "❌ Erro na configuração Nginx"
    exit 1
fi

# Reiniciar servidor webhook
pm2 restart webhook-evolution-websocket

echo "✅ Configurações CORS aplicadas com sucesso" 