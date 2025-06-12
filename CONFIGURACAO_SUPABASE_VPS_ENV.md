# 🔧 **CONFIGURAÇÃO SUPABASE VPS - Arquivo .env Corrigido**

## 🚨 **PROBLEMA ATUAL:**
As URLs estão configuradas para `localhost`, impedindo acesso externo via WebSocket.

---

## ✅ **CONFIGURAÇÃO CORRIGIDA:**

### **📝 Substitua no seu arquivo `.env` do Supabase:**

```env
############
# Secrets - MANTENHA OS MESMOS VALORES
############

POSTGRES_PASSWORD=your-super-secret-and-long-postgres-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=Devs@01012522
SECRET_KEY_BASE=UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfYTuRgBiYa15BLrx8etQoXz3gZv1/u2oq
VAULT_ENC_KEY=your-encryption-key-32-chars-min

############
# Database - MANTENHA IGUAL
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

############
# Supavisor - MANTENHA IGUAL
############
POOLER_PROXY_PORT_TRANSACTION=6543
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_TENANT_ID=your-tenant-id

############
# API Proxy - CONFIGURAÇÃO CRÍTICA ⚠️
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# API - MANTENHA IGUAL
############

PGRST_DB_SCHEMAS=public,storage,graphql_public

############
# Auth - CONFIGURAÇÃO CRÍTICA ⚠️
############

## ⚡ ALTERE ESTAS URLS:
SITE_URL=http://SEU_IP_DA_VPS:3000
ADDITIONAL_REDIRECT_URLS=http://SEU_IP_DA_VPS:3000,http://localhost:3000,http://localhost:3007,http://localhost:3009
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=http://SEU_IP_DA_VPS:8000

## Mailer Config - MANTENHA IGUAL
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

## Email auth - MANTENHA IGUAL
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender
ENABLE_ANONYMOUS_USERS=false

## Phone auth - MANTENHA IGUAL
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true

############
# Studio - CONFIGURAÇÃO CRÍTICA ⚠️
############

STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project
STUDIO_PORT=3000

# ⚡ ALTERE ESTA URL:
SUPABASE_PUBLIC_URL=http://SEU_IP_DA_VPS:8000

# Enable webp support
IMGPROXY_ENABLE_WEBP_DETECTION=true

# Add your OpenAI API key to enable SQL Editor Assistant
OPENAI_API_KEY=

############
# Functions - MANTENHA IGUAL
############
FUNCTIONS_VERIFY_JWT=false

############
# Logs - MANTENHA IGUAL
############

LOGFLARE_LOGGER_BACKEND_API_KEY=your-super-secret-and-long-logflare-key
LOGFLARE_API_KEY=your-super-secret-and-long-logflare-key
DOCKER_SOCKET_LOCATION=/var/run/docker.sock
GOOGLE_PROJECT_ID=GOOGLE_PROJECT_ID
GOOGLE_PROJECT_NUMBER=GOOGLE_PROJECT_NUMBER
```

---

## 🔑 **SUBSTITUIÇÕES NECESSÁRIAS:**

### **1. 🌐 Descobrir IP da VPS:**

```bash
# No SSH da VPS, execute:
curl ifconfig.me
# ou
wget -qO- ifconfig.me
# ou
ip route get 1 | awk '{print $NF;exit}'
```

### **2. 📝 Exemplo com IP real:**

Se seu IP da VPS for `203.0.113.45`, substitua:

```env
SITE_URL=http://203.0.113.45:3000
API_EXTERNAL_URL=http://203.0.113.45:8000
SUPABASE_PUBLIC_URL=http://203.0.113.45:8000
ADDITIONAL_REDIRECT_URLS=http://203.0.113.45:3000,http://localhost:3000,http://localhost:3007,http://localhost:3009
```

### **3. 🔒 Com Domínio (Recomendado):**

Se você tiver um domínio, configure assim:

```env
SITE_URL=https://seu-dominio.com:3000
API_EXTERNAL_URL=https://supabase.seu-dominio.com
SUPABASE_PUBLIC_URL=https://supabase.seu-dominio.com
ADDITIONAL_REDIRECT_URLS=https://seu-dominio.com:3000,https://supabase.seu-dominio.com,http://localhost:3000
```

---

## 🛠️ **PASSOS PARA APLICAR:**

### **1. ⚠️ Backup atual:**

```bash
# No SSH da VPS
cd ~/supabase  # ou onde está o Supabase
cp .env .env.backup
```

### **2. ✏️ Editar arquivo:**

```bash
sudo nano .env
```

### **3. 🔄 Aplicar mudanças:**

```bash
# Parar Supabase
sudo docker-compose down

# Limpar cache
sudo docker system prune -f

# Iniciar com nova configuração
sudo docker-compose up -d

# Verificar logs
sudo docker-compose logs -f kong
sudo docker-compose logs -f auth
```

### **4. 🔥 Configurar Firewall:**

```bash
# Abrir portas necessárias
sudo ufw allow 8000
sudo ufw allow 8443
sudo ufw allow 3000

# Verificar status
sudo ufw status
```

---

## 🧪 **TESTAR CONFIGURAÇÃO:**

### **1. 📡 Teste de conectividade:**

```bash
# Da VPS (SSH)
curl -I http://localhost:8000/health
curl -I http://SEU_IP_DA_VPS:8000/health

# Do seu computador local
curl -I http://SEU_IP_DA_VPS:8000/health
```

### **2. 💻 Teste no navegador (F12):**

```javascript
// Atualizar seu BKCRM .env com:
// VITE_SUPABASE_URL=http://SEU_IP_DA_VPS:8000
// VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

// Depois teste:
const testVPSConnection = async () => {
  console.log('🧪 Testando conexão VPS...');
  
  try {
    // Teste de conectividade básica
    const response = await fetch('http://SEU_IP_DA_VPS:8000/health');
    console.log('✅ Supabase VPS responde:', response.status);
    
    // Teste de Realtime
    const channel = window.supabase
      .channel('test-vps-connection')
      .subscribe(status => {
        console.log('📡 Realtime VPS Status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('🎉 REALTIME VPS FUNCIONANDO!');
        }
      });
    
    setTimeout(() => channel.unsubscribe(), 5000);
    
  } catch (error) {
    console.error('❌ Erro na conexão VPS:', error);
  }
};

testVPSConnection();
```

---

## 🚨 **PROBLEMAS COMUNS:**

### **❌ "Connection refused"**
```bash
# Verificar se serviços estão rodando
sudo docker ps | grep supabase
sudo netstat -tulpn | grep :8000
```

### **❌ "CORS error"**
Adicione sua URL no `ADDITIONAL_REDIRECT_URLS`

### **❌ "WebSocket failed"**
Verifique se a porta 4000 também está aberta:
```bash
sudo ufw allow 4000
sudo netstat -tulpn | grep :4000
```

---

## 🎯 **RESUMO DAS MUDANÇAS:**

✅ **SITE_URL**: `localhost:3000` → `SEU_IP_DA_VPS:3000`  
✅ **API_EXTERNAL_URL**: `localhost:8000` → `SEU_IP_DA_VPS:8000`  
✅ **SUPABASE_PUBLIC_URL**: `localhost:8000` → `SEU_IP_DA_VPS:8000`  
✅ **ADDITIONAL_REDIRECT_URLS**: Adicionar URLs do frontend  

**💡 Execute os comandos na ordem e me informe se deu algum erro!** 