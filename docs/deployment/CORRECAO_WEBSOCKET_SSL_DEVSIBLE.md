# 🔧 **CORREÇÃO WebSocket SSL - data.devsible.com.br**

## 🚨 **PROBLEMA IDENTIFICADO:**
O frontend está tentando conectar via `wss://data.devsible.com.br/realtime/v1/websocket` (WebSocket Secure) mas o Supabase não está configurado corretamente para SSL.

---

## ✅ **SOLUÇÕES (ESCOLHA UMA):**

### **🔄 OPÇÃO 1: CORRIGIR SSL/HTTPS (RECOMENDADO)**

#### **1.1 📝 Configurar .env para HTTPS completo:**

```env
############
# Auth - CONFIGURAÇÃO SSL COMPLETA ⚡
############

SITE_URL=https://data.devsible.com.br
API_EXTERNAL_URL=https://data.devsible.com.br
SUPABASE_PUBLIC_URL=https://data.devsible.com.br
ADDITIONAL_REDIRECT_URLS=https://data.devsible.com.br,https://212.85.0.57:3000,http://212.85.0.57:3009,http://localhost:3000,http://localhost:3007,http://localhost:3009

############
# API Proxy - SSL HABILITADO ⚡
############

KONG_HTTP_PORT=8000
KONG_HTTPS_PORT=8443

############
# Studio - SSL HABILITADO ⚡
############

STUDIO_DEFAULT_ORGANIZATION=Devisible
STUDIO_DEFAULT_PROJECT=Bkcrm
STUDIO_PORT=3000
SUPABASE_PUBLIC_URL=https://data.devsible.com.br
```

#### **1.2 🔐 Configurar SSL no NGINX da VPS:**

```nginx
# /etc/nginx/sites-available/supabase
server {
    listen 80;
    server_name data.devsible.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name data.devsible.com.br;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Supabase API
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket para Realtime
    location /realtime/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

---

### **🔄 OPÇÃO 2: USAR HTTP (SOLUÇÃO RÁPIDA)**

#### **2.1 📝 Configurar .env para HTTP:**

```env
############
# Auth - CONFIGURAÇÃO HTTP ⚡
############

SITE_URL=http://data.devsible.com.br
API_EXTERNAL_URL=http://data.devsible.com.br
SUPABASE_PUBLIC_URL=http://data.devsible.com.br
ADDITIONAL_REDIRECT_URLS=http://data.devsible.com.br,http://212.85.0.57:3000,http://212.85.0.57:3009,http://localhost:3000,http://localhost:3007,http://localhost:3009

############
# Studio ⚡
############

STUDIO_DEFAULT_ORGANIZATION=Devisible
STUDIO_DEFAULT_PROJECT=Bkcrm
STUDIO_PORT=3000
SUPABASE_PUBLIC_URL=http://data.devsible.com.br
```

#### **2.2 🔧 Atualizar BKCRM .env:**

```env
# No arquivo .env do BKCRM:
VITE_SUPABASE_URL=http://data.devsible.com.br
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

---

### **🔄 OPÇÃO 3: USAR IP DIRETO (FALLBACK)**

#### **3.1 📝 Configurar .env para IP:**

```env
############
# Auth - CONFIGURAÇÃO IP DIRETO ⚡
############

SITE_URL=http://212.85.0.57:8000
API_EXTERNAL_URL=http://212.85.0.57:8000
SUPABASE_PUBLIC_URL=http://212.85.0.57:8000
ADDITIONAL_REDIRECT_URLS=http://212.85.0.57:8000,http://212.85.0.57:3000,http://212.85.0.57:3009,http://localhost:3000,http://localhost:3007,http://localhost:3009

############
# Studio ⚡
############

STUDIO_DEFAULT_ORGANIZATION=Devisible
STUDIO_DEFAULT_PROJECT=Bkcrm
STUDIO_PORT=3000
SUPABASE_PUBLIC_URL=http://212.85.0.57:8000
```

#### **3.2 🔧 Atualizar BKCRM .env:**

```env
# No arquivo .env do BKCRM:
VITE_SUPABASE_URL=http://212.85.0.57:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

---

## 🛠️ **COMANDOS PARA APLICAR (QUALQUER OPÇÃO):**

### **1. ⚠️ Na VPS (SSH):**

```bash
# Navegar para o Supabase
cd ~/supabase

# Backup
cp .env .env.backup

# Editar arquivo
sudo nano .env
# (Cole a configuração da opção escolhida)

# Reiniciar Supabase
sudo docker-compose down
sudo docker system prune -f
sudo docker-compose up -d

# Verificar se está rodando
sudo docker ps | grep supabase
```

### **2. 🔓 Configurar Firewall (se necessário):**

```bash
# Abrir portas HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8000
sudo ufw allow 8443
sudo ufw allow 4000

# Verificar
sudo ufw status
```

### **3. 💻 No BKCRM Local:**

```bash
# Editar .env do BKCRM
# (Usar a URL da opção escolhida)

# Reiniciar servidor
# Ctrl+C para parar
npm run dev
```

---

## 🧪 **TESTE DE CONECTIVIDADE:**

### **📡 Teste no navegador (F12):**

```javascript
// Teste específico para WebSocket
const testWebSocketConnection = async () => {
  console.log('🧪 Testando WebSocket...');
  
  try {
    // OPÇÃO 1: Se escolheu HTTPS
    const httpsUrl = 'https://data.devsible.com.br';
    
    // OPÇÃO 2: Se escolheu HTTP
    const httpUrl = 'http://data.devsible.com.br';
    
    // OPÇÃO 3: Se escolheu IP
    const ipUrl = 'http://212.85.0.57:8000';
    
    // Escolha a URL que você configurou:
    const testUrl = httpUrl; // ← Altere aqui!
    
    // Teste básico
    const response = await fetch(`${testUrl}/health`);
    console.log('✅ API responde:', response.status);
    
    // Teste WebSocket específico
    const supabaseClient = window.supabase;
    const channel = supabaseClient
      .channel('test-websocket-fix')
      .subscribe(status => {
        console.log('📡 WebSocket Status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('🎉 WEBSOCKET FUNCIONANDO!');
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no WebSocket');
        }
      });
    
    setTimeout(() => {
      channel.unsubscribe();
      console.log('🔌 Teste finalizado');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
testWebSocketConnection();
```

---

## 📋 **PROBLEMAS COMUNS:**

### **❌ "Mixed Content" (HTTP/HTTPS)**
- Use **OPÇÃO 1** (SSL completo) ou **OPÇÃO 2** (HTTP completo)
- Evite misturar HTTP e HTTPS

### **❌ "Certificate Error"**
- Se usar OPÇÃO 1, configure SSL válido
- Ou use **OPÇÃO 2** (HTTP)

### **❌ "WebSocket Still Failing"**
- Verificar se porta 4000 está aberta
- Verificar logs: `sudo docker-compose logs realtime`

---

## 🎯 **RECOMENDAÇÃO:**

**Para teste rápido**: Use **OPÇÃO 2** (HTTP)  
**Para produção**: Use **OPÇÃO 1** (HTTPS com SSL)  
**Se tudo falhar**: Use **OPÇÃO 3** (IP direto)  

**💡 Me informe qual opção você quer tentar primeiro!** 