# 🔧 **CORREÇÃO SUPABASE LOCAL VPS - WebSocket Failed**

## 🚨 **PROBLEMA IDENTIFICADO:**
```
WebSocket connection to 'ws://localhost:8000/realtime/v1/websocket' failed
```

**Causa:** Supabase local na VPS não está configurado para aceitar conexões externas.

---

## 📋 **SOLUÇÕES PASSO A PASSO:**

### **1. 🔍 Verificar Status do Supabase Local**

**No SSH da VPS, execute:**

```bash
# Verificar se Supabase está rodando
sudo netstat -tulpn | grep :8000
sudo docker ps | grep supabase

# Verificar logs do Supabase
sudo docker logs supabase-realtime
sudo docker logs supabase-kong
```

---

### **2. 🌐 Configurar Supabase para Aceitar Conexões Externas**

**Edite o arquivo de configuração do Supabase:**

```bash
# Encontrar diretório do Supabase
find / -name "docker-compose.yml" -path "*/supabase/*" 2>/dev/null

# Ou procurar por:
ls -la ~/supabase/
ls -la /opt/supabase/
ls -la /var/lib/supabase/
```

**Edite o `docker-compose.yml`:**

```bash
sudo nano ~/supabase/docker-compose.yml
```

**Altere as configurações de rede:**

```yaml
services:
  kong:
    ports:
      - "0.0.0.0:8000:8000"  # ← Importante: 0.0.0.0 para aceitar conexões externas
      - "0.0.0.0:8443:8443"
    environment:
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-transformer,cors,key-auth,acl,basic-auth
      KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: 160k
      KONG_NGINX_PROXY_PROXY_BUFFERS: 64 160k

  realtime:
    ports:
      - "0.0.0.0:4000:4000"  # ← Realtime também precisa ser exposto
    environment:
      DB_HOST: db
      DB_NAME: postgres
      DB_USER: postgres
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_PORT: 5432
      PORT: 4000
      JWT_SECRET: ${JWT_SECRET}
      REPLICATION_MODE: RLS
      REPLICATION_POLL_INTERVAL: 100
      SECURE_CHANNELS: "false"  # ← Para HTTP local
      SLOT_NAME: supabase_realtime_rls
      TEMPORARY_SLOT: "true"
```

---

### **3. 🔥 Configurar Firewall da VPS**

```bash
# Abrir portas necessárias
sudo ufw allow 8000
sudo ufw allow 4000
sudo ufw allow 8443

# Verificar status
sudo ufw status

# Se firewall não estiver habilitado:
sudo ufw enable
```

---

### **4. 🔄 Reiniciar Supabase**

```bash
# Parar Supabase
cd ~/supabase  # ou diretório onde está instalado
sudo docker-compose down

# Limpar containers antigos
sudo docker system prune -f

# Iniciar novamente
sudo docker-compose up -d

# Verificar logs
sudo docker-compose logs -f realtime
sudo docker-compose logs -f kong
```

---

### **5. 🌐 Atualizar Configuração do BKCRM**

**Crie/edite arquivo `.env` no projeto:**

```env
# Configuração para Supabase Local VPS
VITE_SUPABASE_URL=http://SEU_IP_DA_VPS:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE

# Configurações de Realtime
VITE_ENABLE_REALTIME=true
VITE_REALTIME_URL=ws://SEU_IP_DA_VPS:4000/socket
```

**⚠️ Substitua `SEU_IP_DA_VPS` pelo IP real da sua VPS!**

---

### **6. 🔧 Configuração Alternativa com NGINX (Recomendado)**

**Criar proxy reverso para HTTPS:**

```bash
sudo nano /etc/nginx/sites-available/supabase
```

**Configuração NGINX:**

```nginx
server {
    listen 80;
    server_name supabase.seu-dominio.com;  # Substitua pelo seu domínio
    
    # Redirecionar para HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name supabase.seu-dominio.com;
    
    # Certificado SSL (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/supabase.seu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/supabase.seu-dominio.com/privkey.pem;
    
    # Proxy para Supabase
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
    }
}
```

**Ativar configuração:**

```bash
sudo ln -s /etc/nginx/sites-available/supabase /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### **7. 🧪 Testar Conectividade**

**Teste direto na VPS:**

```bash
# Testar se Supabase responde
curl -I http://localhost:8000/health

# Testar Realtime
curl -I http://localhost:4000/socket/websocket

# Testar do IP externo
curl -I http://SEU_IP_DA_VPS:8000/health
```

**Teste no navegador (console F12):**

```javascript
// Testar nova configuração
console.log('🔧 Testando nova configuração Supabase...');

// 1. Verificar variáveis de ambiente
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Chave:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

// 2. Testar conectividade básica
const testConnection = async () => {
  try {
    const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/health');
    console.log('✅ Supabase responde:', response.status);
    
    // 3. Testar Realtime
    const channel = window.supabase
      .channel('test-vps')
      .subscribe(status => {
        console.log('📡 Realtime Status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('🎉 REALTIME VPS FUNCIONANDO!');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Erro no canal - verificar configuração');
        }
      });
    
    setTimeout(() => channel.unsubscribe(), 5000);
    
  } catch (error) {
    console.error('❌ Erro de conectividade:', error);
  }
};

testConnection();
```

---

### **8. 🔐 Configuração de Segurança**

**Se funcionar, configure SSL/HTTPS:**

```bash
# Instalar Certbot para SSL gratuito
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d supabase.seu-dominio.com
```

**Atualizar `.env` para HTTPS:**

```env
VITE_SUPABASE_URL=https://supabase.seu-dominio.com
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey AgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

---

## 🚨 **TROUBLESHOOTING RÁPIDO:**

### **Se ainda não funcionar:**

```bash
# 1. Verificar se todas as portas estão abertas
sudo netstat -tulpn | grep -E ":(8000|4000|8443)"

# 2. Verificar logs de erro
sudo docker-compose logs realtime | tail -20
sudo docker-compose logs kong | tail -20

# 3. Reiniciar serviços
sudo systemctl restart docker
sudo docker-compose restart

# 4. Verificar configuração de rede
sudo docker network ls
sudo docker network inspect supabase_default
```

### **Comando de diagnóstico completo:**

```bash
echo "=== DIAGNÓSTICO SUPABASE VPS ==="
echo "Containers rodando:"
sudo docker ps | grep supabase
echo ""
echo "Portas abertas:"
sudo netstat -tulpn | grep -E ":(8000|4000|8443)"
echo ""
echo "Firewall status:"
sudo ufw status
echo ""
echo "Teste de conectividade:"
curl -sI http://localhost:8000/health || echo "❌ Supabase não responde"
curl -sI http://localhost:4000 || echo "❌ Realtime não responde"
```

---

## 📞 **PRÓXIMOS PASSOS:**

1. **Execute o diagnóstico** no SSH da VPS
2. **Configure as portas** conforme mostrado acima  
3. **Teste a conectividade** com os comandos fornecidos
4. **Atualize o `.env`** com o IP correto da VPS
5. **Me informe os resultados** para ajudar com problemas específicos

**💡 Dica:** Se tiver domínio, use NGINX + SSL para maior segurança! 