# 🔧 **CONFIGURAÇÃO SUPABASE VPS - IP: 212.85.0.57**

## 🎯 **CONFIGURAÇÃO ESPECÍFICA PARA SUA VPS:**

### **📝 Edite o arquivo `.env` do Supabase na VPS:**

Substitua essas linhas no seu arquivo `.env`:

```env
############
# Auth - CONFIGURAÇÃO ATUALIZADA ⚡
############

SITE_URL=http://212.85.0.57:3000
ADDITIONAL_REDIRECT_URLS=http://212.85.0.57:3000,http://212.85.0.57:3009,http://localhost:3000,http://localhost:3007,http://localhost:3009
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=http://212.85.0.57:8000

############
# Studio - CONFIGURAÇÃO ATUALIZADA ⚡
############

STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=Default Project
STUDIO_PORT=3000
SUPABASE_PUBLIC_URL=http://212.85.0.57:8000
```

---

## 🛠️ **COMANDOS PARA EXECUTAR NA VPS:**

### **1. ⚠️ Backup e edição:**

```bash
# Conectar na VPS via SSH
# Navegar para o diretório do Supabase
cd ~/supabase  # ou onde está o Supabase

# Fazer backup
cp .env .env.backup

# Editar arquivo
sudo nano .env
```

### **2. 🔄 Aplicar mudanças:**

```bash
# Parar todos os serviços
sudo docker-compose down

# Limpar cache do Docker
sudo docker system prune -f

# Iniciar com nova configuração
sudo docker-compose up -d

# Verificar se está rodando
sudo docker ps | grep supabase
```

### **3. 🔓 Configurar firewall:**

```bash
# Abrir todas as portas necessárias
sudo ufw allow 8000
sudo ufw allow 8443
sudo ufw allow 3000
sudo ufw allow 4000

# Verificar status
sudo ufw status
```

---

## 🔧 **ATUALIZAR SEU BKCRM LOCAL:**

### **1. 📝 Edite o arquivo `.env` do seu projeto BKCRM:**

```env
# Atualizar essas variáveis:
VITE_SUPABASE_URL=http://212.85.0.57:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

### **2. 🔄 Reiniciar o servidor de desenvolvimento:**

```powershell
# No PowerShell, parar o servidor atual (Ctrl+C)
# Depois iniciar novamente:
npm run dev
```

---

## 🧪 **TESTES DE CONECTIVIDADE:**

### **1. 📡 Teste da VPS (via SSH):**

```bash
# Testar se Supabase está respondendo
curl -I http://localhost:8000/health
curl -I http://212.85.0.57:8000/health

# Verificar se as portas estão abertas
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :4000
```

### **2. 💻 Teste do seu computador local:**

```bash
# No CMD ou PowerShell do seu PC
curl -I http://212.85.0.57:8000/health
```

### **3. 🌐 Teste no navegador:**

Acesse: `http://212.85.0.57:8000/health`

Deve retornar algo como: `{"status":"ok"}`

### **4. 🔍 Teste JavaScript (F12 no navegador):**

```javascript
// Teste de conexão WebSocket
const testVPSConnection = async () => {
  console.log('🧪 Testando conexão VPS 212.85.0.57...');
  
  try {
    // Teste básico de conectividade
    const response = await fetch('http://212.85.0.57:8000/health');
    console.log('✅ Supabase VPS responde:', response.status);
    
    // Teste específico do Realtime WebSocket
    const supabaseClient = window.supabase;
    const channel = supabaseClient
      .channel('test-vps-realtime')
      .subscribe(status => {
        console.log('📡 Realtime VPS Status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('🎉 REALTIME VPS FUNCIONANDO!');
          console.log('🔗 WebSocket conectado com sucesso!');
        }
        
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro no canal Realtime');
        }
        
        if (status === 'TIMED_OUT') {
          console.error('⏰ Timeout na conexão Realtime');
        }
      });
    
    // Desconectar após 10 segundos
    setTimeout(() => {
      channel.unsubscribe();
      console.log('🔌 Canal desconectado');
    }, 10000);
    
  } catch (error) {
    console.error('❌ Erro na conexão VPS:', error);
  }
};

// Executar teste
testVPSConnection();
```

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES:**

### **❌ "Connection refused" ou "ECONNREFUSED"**

```bash
# Verificar se Docker está rodando
sudo systemctl status docker

# Verificar se Supabase está rodando
sudo docker-compose ps

# Verificar logs
sudo docker-compose logs kong
sudo docker-compose logs auth
```

### **❌ "WebSocket connection failed"**

```bash
# Verificar se a porta 4000 está aberta
sudo ufw allow 4000
sudo netstat -tulpn | grep :4000

# Verificar logs do Realtime
sudo docker-compose logs realtime
```

### **❌ "CORS error"**

Verificar se `ADDITIONAL_REDIRECT_URLS` inclui sua URL do frontend.

### **❌ "502 Bad Gateway"**

```bash
# Reiniciar Kong (proxy)
sudo docker-compose restart kong

# Verificar se PostgreSQL está rodando
sudo docker-compose logs db
```

---

## 📋 **CHECKLIST FINAL:**

✅ **IP da VPS**: 212.85.0.57  
✅ **Arquivo .env do Supabase atualizado**  
✅ **Supabase reiniciado**: `docker-compose down && docker-compose up -d`  
✅ **Firewall configurado**: Portas 8000, 8443, 3000, 4000 abertas  
✅ **BKCRM .env atualizado**: VITE_SUPABASE_URL=http://212.85.0.57:8000  
✅ **BKCRM reiniciado**: `npm run dev`  

---

## 🎯 **PRÓXIMOS PASSOS:**

1. **Execute os comandos na VPS** (backup, edição do .env, restart)
2. **Configure o firewall** (abrir portas)
3. **Atualize o BKCRM local** (.env e restart)
4. **Teste a conectividade** (comandos curl e JavaScript)
5. **Me informe os resultados!** 

**💡 Se der algum erro, me envie a mensagem de erro completa!** 