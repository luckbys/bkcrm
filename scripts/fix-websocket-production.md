# 🔧 Correção WebSocket em Produção - bkcrm.devsible.com.br

## 🎯 **Status Atual - CORRIGIDO**

✅ **Problema identificado e resolvido:**
- URL corrigida de `https://bkcrm.devsible.com.br:4000` para `https://bkcrm.devsible.com.br`
- Configuração nginx atualizada para proxy WebSocket
- Sistema funcionando localmente e pronto para produção

## 🔧 **Soluções Implementadas**

### **✅ Opção 1: Proxy nginx (IMPLEMENTADA)**

#### 1. **Frontend corrigido:**
```typescript
// src/hooks/useWebSocketMessages.ts - JÁ APLICADO
const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bkcrm.devsible.com.br'  // SEM porta - proxy nginx
  : 'http://localhost:4000';
```

#### 2. **Configuração nginx necessária:**
Adicionar ao arquivo `/etc/nginx/sites-available/bkcrm`:

```nginx
# Proxy para Socket.io WebSocket
location /socket.io/ {
    proxy_pass http://localhost:4000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    
    # Timeouts para WebSocket
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Headers CORS para WebSocket
    add_header Access-Control-Allow-Origin "https://bkcrm.devsible.com.br" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept, Origin, X-Requested-With" always;
    add_header Access-Control-Allow-Credentials true always;
}
```

#### 3. **Comandos para aplicar:**
```bash
sudo nano /etc/nginx/sites-available/bkcrm
# (adicionar configuração acima)
sudo nginx -t
sudo systemctl reload nginx
```

---

### **🔄 Opção 2: Fallback - Porta 4000 direta**

Se o proxy nginx não funcionar, reverter para porta direta:

```typescript
// Em src/hooks/useWebSocketMessages.ts:
const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bkcrm.devsible.com.br:4000'  // COM porta direta
  : 'http://localhost:4000';
```

---

## 🧪 **Como Testar**

### 1. **Local (deve funcionar):**
```bash
npm run dev
npm run websocket:dev  # em outro terminal
```

### 2. **Produção (após configurar nginx):**
```bash
# Verificar se servidor WebSocket está rodando:
curl https://bkcrm.devsible.com.br:4000/webhook/health

# Verificar proxy Socket.io:
curl https://bkcrm.devsible.com.br/socket.io/

# No navegador:
diagnoseProductionWebSocket()
```

---

## 🚀 **Próximos Passos**

### **Para LOCAL (já funciona):**
1. ✅ Matar processos Node.js duplicados: `taskkill /f /im node.exe`
2. ✅ Rodar apenas um dev server: `npm run dev`
3. ✅ Rodar WebSocket server: `npm run websocket:dev`

### **Para PRODUÇÃO:**
1. 🔄 **Configurar nginx** com proxy Socket.io (instruções acima)
2. 🔄 **Verificar se servidor WebSocket está rodando** na porta 4000
3. 🔄 **Testar conexão** com `diagnoseProductionWebSocket()`
4. 🔄 **Se falhar, usar fallback** da porta 4000 direta

---

## 📞 **Comandos de Debug**

```bash
# Verificar processos Node.js
tasklist | findstr "node"

# Matar todos os processos Node.js
taskkill /f /im node.exe

# Verificar portas ocupadas
netstat -ano | findstr ":4000"
netstat -ano | findstr ":3000"

# No navegador (console):
diagnoseProductionWebSocket()
testWebSocketConnection()
```

---

## ✅ **Status Final**

- ✅ **Frontend:** Corrigido para usar proxy nginx
- ✅ **Local:** Funcionando perfeitamente
- 🔄 **Produção:** Aguardando configuração nginx
- ✅ **Fallback:** Disponível se proxy falhar
- ✅ **Diagnóstico:** Ferramentas disponíveis 