# 🚀 Guia de Deploy - Evolution Webhook Server para Produção

Este guia te ajudará a configurar o webhook server da Evolution API em produção no domínio `https://bkcrm.devsible.com.br/`.

## 📋 Pré-requisitos

- Servidor Linux (Ubuntu/CentOS/Debian)
- Node.js 18+ instalado
- Nginx instalado
- Certificado SSL configurado
- Acesso SSH ao servidor
- Domínio `bkcrm.devsible.com.br` apontando para seu servidor

## 🔧 Passo 1: Preparar o Servidor

### 1.1 Instalar Node.js (se não estiver instalado)
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 1.2 Instalar PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.3 Criar usuário para a aplicação (recomendado)
```bash
sudo useradd -m -s /bin/bash webhook
sudo usermod -aG sudo webhook
```

## 📁 Passo 2: Deploy dos Arquivos

### 2.1 Fazer upload dos arquivos para o servidor
```bash
# No seu servidor, criar diretório
sudo mkdir -p /var/www/bkcrm-webhook
sudo chown webhook:webhook /var/www/bkcrm-webhook

# Fazer upload dos arquivos:
# - webhook-production.js
# - webhook.env
# - package.json
# - deploy-webhook.sh
```

### 2.2 Configurar permissões
```bash
cd /var/www/bkcrm-webhook
chmod +x deploy-webhook.sh
```

## ⚙️ Passo 3: Configurar Variáveis de Ambiente

### 3.1 Editar o arquivo `webhook.env`
```bash
nano webhook.env
```

```env
# Configurações do Webhook Server para Produção
WEBHOOK_PORT=4000
NODE_ENV=production

# URL base do seu domínio
BASE_URL=https://bkcrm.devsible.com.br

# Configurações da Evolution API
EVOLUTION_API_URL=https://press-evolution-api.jhkbgs.easypanel.host
EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11

# Configurações de segurança (MUDE ESTA CHAVE!)
WEBHOOK_SECRET=SUA_CHAVE_SECRETA_SUPER_FORTE_AQUI_123456

# Configurações de CORS
ALLOWED_ORIGINS=https://bkcrm.devsible.com.br,https://press-evolution-api.jhkbgs.easypanel.host

# Configurações do Supabase (se necessário)
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

## 🚀 Passo 4: Executar o Deploy

### 4.1 Executar o script de deploy
```bash
./deploy-webhook.sh
```

### 4.2 Verificar se está rodando
```bash
pm2 status
pm2 logs evolution-webhook
```

## 🌐 Passo 5: Configurar Nginx

### 5.1 Criar configuração do Nginx
```bash
sudo nano /etc/nginx/sites-available/bkcrm-webhook
```

Cole o conteúdo do arquivo `nginx-webhook.conf` e ajuste:
- Caminhos dos certificados SSL
- Porta do frontend (se diferente de 3000)

### 5.2 Ativar o site
```bash
sudo ln -s /etc/nginx/sites-available/bkcrm-webhook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 Passo 6: Configurar SSL (se necessário)

### 6.1 Usando Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d bkcrm.devsible.com.br
```

### 6.2 Renovação automática
```bash
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔧 Passo 7: Configurar Evolution API

### 7.1 Configurar webhook na Evolution API
No painel da Evolution API, configure:

**URL do Webhook:** `https://bkcrm.devsible.com.br/webhook/evolution`

**Eventos para escutar:**
- `MESSAGES_UPSERT`
- `QRCODE_UPDATED`
- `CONNECTION_UPDATE`
- `SEND_MESSAGE`

### 7.2 Testar a configuração
```bash
# Testar health check
curl https://bkcrm.devsible.com.br/health

# Testar webhook
curl -X POST https://bkcrm.devsible.com.br/test \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook funcionando"}'
```

## 📊 Passo 8: Monitoramento

### 8.1 Comandos úteis do PM2
```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs evolution-webhook

# Reiniciar aplicação
pm2 restart evolution-webhook

# Parar aplicação
pm2 stop evolution-webhook

# Ver métricas
pm2 monit
```

### 8.2 Logs do Nginx
```bash
# Logs de acesso
sudo tail -f /var/log/nginx/bkcrm-webhook-access.log

# Logs de erro
sudo tail -f /var/log/nginx/bkcrm-webhook-error.log
```

## 🔥 Passo 9: Firewall e Segurança

### 9.1 Configurar UFW (Ubuntu)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 9.2 Bloquear acesso direto à porta 4000
```bash
sudo ufw deny 4000
```

## 🧪 Passo 10: Testes Finais

### 10.1 Testar endpoints
```bash
# Status geral
curl https://bkcrm.devsible.com.br/

# Health check
curl https://bkcrm.devsible.com.br/health

# Teste de webhook
curl -X POST https://bkcrm.devsible.com.br/webhook/evolution \
  -H "Content-Type: application/json" \
  -d '{
    "event": "MESSAGES_UPSERT",
    "instance": "test",
    "data": {
      "key": {"remoteJid": "5511999999999@s.whatsapp.net"},
      "message": {"conversation": "Teste de mensagem"}
    }
  }'
```

### 10.2 Verificar logs
```bash
pm2 logs evolution-webhook --lines 50
```

## 🚨 Troubleshooting

### Problema: Servidor não inicia
```bash
# Verificar logs
pm2 logs evolution-webhook

# Verificar porta
sudo netstat -tlnp | grep :4000

# Verificar permissões
ls -la /var/www/bkcrm-webhook/
```

### Problema: Nginx 502 Bad Gateway
```bash
# Verificar se o Node.js está rodando
pm2 status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar conexão local
curl http://localhost:4000/health
```

### Problema: CORS errors
- Verificar `ALLOWED_ORIGINS` no `webhook.env`
- Verificar se o domínio está correto
- Verificar logs do servidor

## 📱 URLs Finais

Após o deploy completo, você terá:

- **Webhook Principal:** `https://bkcrm.devsible.com.br/webhook/evolution`
- **Health Check:** `https://bkcrm.devsible.com.br/health`
- **Teste:** `https://bkcrm.devsible.com.br/test`
- **Status:** `https://bkcrm.devsible.com.br/`

## 🔄 Atualizações Futuras

Para atualizar o servidor:

1. Fazer upload dos novos arquivos
2. Executar: `pm2 restart evolution-webhook`
3. Verificar logs: `pm2 logs evolution-webhook`

---

## 🔧 Passo 11: Resolver CORS do Supabase

### 11.1 Problema de CORS
Se você receber erro:
```
Access to fetch at 'https://press-supabase.jhkbgs.easypanel.host/auth/v1/token' 
from origin 'https://bkcrm.devsible.com.br' has been blocked by CORS policy
```

### 11.2 Solução via Proxy Reverso
O arquivo `nginx-webhook.conf` já inclui um proxy para o Supabase que resolve o CORS.

### 11.3 Configurar Frontend para Produção
```bash
# Copiar configurações de produção
cp env.production .env

# Fazer build
npm run build

# Ou usar o script automatizado
./deploy-production.sh
```

### 11.4 Verificar configuração
O arquivo `env.production` configura:
```env
VITE_SUPABASE_URL=https://bkcrm.devsible.com.br/supabase
```

Isso faz com que todas as requisições do Supabase passem pelo proxy do Nginx, resolvendo o CORS.

## ✅ Checklist Final

- [ ] Node.js instalado
- [ ] PM2 instalado e configurado
- [ ] Arquivos enviados para o servidor
- [ ] Variáveis de ambiente configuradas
- [ ] Nginx configurado e funcionando
- [ ] SSL configurado
- [ ] Firewall configurado
- [ ] Evolution API configurada
- [ ] **CORS do Supabase resolvido via proxy**
- [ ] **Frontend configurado para produção**
- [ ] Testes realizados com sucesso
- [ ] Monitoramento funcionando

**🎉 Parabéns! Seu webhook server está rodando em produção!** 