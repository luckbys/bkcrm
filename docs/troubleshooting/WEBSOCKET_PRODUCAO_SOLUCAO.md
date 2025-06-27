# 🔧 Solução WebSocket Produção - BKCRM

## 🎯 **PROBLEMA IDENTIFICADO**

O sistema funciona **PERFEITAMENTE** em desenvolvimento local, mas em produção o WebSocket não conecta/não recebe mensagens.

### **Status Atual:**
- ✅ **Local:** `http://localhost:4000` - 100% funcional
- ❌ **Produção:** `https://bkcrm.devsible.com.br` - WebSocket não funciona

---

## 🔍 **DIAGNÓSTICO APLICADO**

### **1. Correção URL WebSocket**
```typescript
// ✅ CORRIGIDO em src/stores/chatStore.ts
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:4000' 
  : 'https://bkcrm.devsible.com.br'; // ⭐ URL correta com proxy nginx
```

### **2. Script de Diagnóstico Criado**
```javascript
// ✅ Disponível no console do navegador
diagnoseProductionWebSocket() // Diagnóstico completo
quickWebSocketTest() // Teste rápido
```

---

## 🛠️ **SOLUÇÕES NECESSÁRIAS**

### **📋 Checklist Crítico:**

1. **✅ Servidor WebSocket ativo na porta 4000**
   ```bash
   # Verificar se está rodando
   sudo netstat -tlnp | grep 4000
   # Ou
   ps aux | grep webhook
   ```

2. **❌ Configuração nginx para proxy WebSocket**
   ```bash
   # Aplicar configuração
   sudo cp deployment/nginx-websocket-production.conf /etc/nginx/sites-available/bkcrm
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **❌ SSL/TLS configurado corretamente**
   ```bash
   # Verificar certificado
   sudo certbot certificates
   # Renovar se necessário
   sudo certbot renew
   ```

4. **❌ CORS configurado no servidor**
   - Verificar se `https://bkcrm.devsible.com.br` está na lista de origins permitidas

---

## 🔧 **PASSOS PARA CORREÇÃO**

### **Passo 1: Verificar Servidor WebSocket**
```bash
# Conectar ao servidor de produção
ssh user@bkcrm.devsible.com.br

# Verificar se webhook está rodando
pm2 list
# ou
systemctl status bkcrm-webhook

# Se não estiver rodando:
cd /var/www/bkcrm
node webhook-evolution-websocket.cjs
# ou com PM2:
pm2 start webhook-evolution-websocket.cjs --name "bkcrm-websocket"
```

### **Passo 2: Aplicar Configuração Nginx**
```bash
# Backup da configuração atual
sudo cp /etc/nginx/sites-available/bkcrm /etc/nginx/sites-available/bkcrm.backup

# Aplicar nova configuração (conteúdo do arquivo deployment/nginx-websocket-production.conf)
sudo nano /etc/nginx/sites-available/bkcrm

# Testar configuração
sudo nginx -t

# Se OK, aplicar
sudo systemctl reload nginx
```

### **Passo 3: Verificar Conectividade**
```bash
# Teste 1: Health check
curl https://bkcrm.devsible.com.br/webhook/health

# Teste 2: Socket.IO endpoint
curl https://bkcrm.devsible.com.br/socket.io/

# Teste 3: No navegador (console)
diagnoseProductionWebSocket()
```

---

## 🎯 **CONFIGURAÇÃO NGINX CRÍTICA**

### **Seção WebSocket Essencial:**
```nginx
# ADICIONAR ao /etc/nginx/sites-available/bkcrm
location /socket.io/ {
    proxy_pass http://localhost:4000/socket.io/;
    proxy_http_version 1.1;
    
    # Headers essenciais para WebSocket
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts para WebSocket
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_cache_bypass $http_upgrade;
    
    # CORS para WebSocket
    add_header Access-Control-Allow-Origin "https://bkcrm.devsible.com.br" always;
    add_header Access-Control-Allow-Credentials true always;
}
```

---

## 🚨 **RESOLUÇÃO PRIORITÁRIA**

### **Opção 1: Proxy Nginx (RECOMENDADO)**
- Configurar nginx para proxy `/socket.io/` → `http://localhost:4000`
- URL frontend: `https://bkcrm.devsible.com.br`
- ✅ **Mais seguro e profissional**

### **Opção 2: Porta Direta (TEMPORÁRIO)**
```typescript
// Se nginx não funcionar, usar porta direta
const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4000' 
  : 'https://bkcrm.devsible.com.br:4000'; // ⚠️ Porta direta
```

---

## 📊 **VERIFICAÇÃO FINAL**

### **Logs para Monitorar:**
```bash
# WebSocket específico
sudo tail -f /var/log/nginx/bkcrm.websocket.log

# Nginx geral
sudo tail -f /var/log/nginx/bkcrm.error.log

# Servidor Node.js
pm2 logs bkcrm-websocket
```

### **Testes no Navegador:**
```javascript
// Console F12
diagnoseProductionWebSocket() // Diagnóstico completo
quickWebSocketTest() // Teste de 5s
```

---

## ✅ **RESULTADO ESPERADO**

### **Logs de Sucesso:**
```
✅ [WEBSOCKET-DEBUG] Health check OK
✅ [WEBSOCKET-DEBUG] Endpoint Socket.IO acessível  
✅ [WEBSOCKET-DEBUG] Webhook endpoint acessível
✅ [WEBSOCKET-DEBUG] Conexão WebSocket SUCESSO!
🎉 [WEBSOCKET-DEBUG] DIAGNÓSTICO: WebSocket funcionando corretamente!
```

### **Funcionalidade Esperada:**
- ✅ Chat abre e conecta instantaneamente
- ✅ Mensagens aparecem em tempo real
- ✅ Indicador "Online" no header
- ✅ Zero mensagens perdidas

---

## 🎯 **STATUS DE IMPLEMENTAÇÃO**

- ✅ **Frontend:** URL corrigida para `https://bkcrm.devsible.com.br`
- ✅ **Diagnóstico:** Script criado e disponível no console
- ✅ **Configuração:** nginx-websocket-production.conf pronto
- ❌ **Deploy:** Aguardando aplicação no servidor

### **Próximo Passo:**
**Aplicar configuração nginx no servidor de produção** 🚀 