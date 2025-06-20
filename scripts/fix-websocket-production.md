# 🔧 Correção WebSocket em Produção - bkcrm.devsible.com.br

## 🎯 **Problema Identificado**

O diagnóstico mostrou que:
- ✅ **Servidor WebSocket funcionando** na porta 4000
- ✅ **Health check funcionando** via proxy `/webhook/health`
- ❌ **WebSocket falhando** porque não há proxy configurado para Socket.io

**Erro:** `WebSocket connection to 'wss://bkcrm.devsible.com.br/socket.io/' failed`

## 🔧 **Soluções (Escolha UMA)**

### **Opção 1: Configurar Proxy nginx (RECOMENDADO)**

#### 1. No servidor, editar arquivo nginx:
```bash
sudo nano /etc/nginx/sites-available/bkcrm
```

#### 2. Adicionar configuração WebSocket dentro do bloco `server`:
```nginx
# Adicionar estas linhas ao arquivo de configuração existente:

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

#### 3. Testar e recarregar nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 4. Reverter URL no código:
```typescript
// Em src/hooks/useWebSocketMessages.ts, trocar para:
const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bkcrm.devsible.com.br'  // SEM porta
  : 'http://localhost:4000';
```

---

### **Opção 2: Usar porta 4000 direta (ATUAL)**

**✅ Já implementado!** O código atual usa:
```typescript
const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bkcrm.devsible.com.br:4000'  // COM porta
  : 'http://localhost:4000';
```

#### Vantagens:
- ✅ Funciona imediatamente
- ✅ Não precisa configurar nginx

#### Desvantagens:
- ⚠️ Precisa liberar porta 4000 no firewall
- ⚠️ Expõe porta adicional

---

## 🧪 **Como Testar**

### 1. Verificar se servidor WebSocket está rodando:
```bash
# No servidor de produção:
curl https://bkcrm.devsible.com.br:4000/webhook/health
```

### 2. Testar no navegador:
```javascript
// Console do navegador em produção:
diagnoseProductionWebSocket()
```

### 3. Verificar logs WebSocket:
```javascript
// Se conectar, deve mostrar:
// ✅ [WS] Conectado ao WebSocket
// ✅ [WS] Conectado ao ticket
```

---

## 🚀 **Verificação Final**

### Status Esperado:
1. ✅ `https://bkcrm.devsible.com.br/webhook/health` → 200 OK
2. ✅ `https://bkcrm.devsible.com.br:4000/webhook/health` → 200 OK  
3. ✅ WebSocket conecta sem erros
4. ✅ Mensagens aparecem em tempo real
5. ✅ Não mostra mais "Carregando..." infinito

### Comandos de Monitoramento:
```bash
# Verificar se servidor WebSocket está rodando
netstat -tulpn | grep :4000

# Verificar logs do WebSocket
tail -f /path/to/websocket.log

# Verificar conexões ativas
ss -tulpn | grep :4000
```

---

## 📞 **Se Precisar de Ajuda**

1. **Verificar firewall:** `sudo ufw status`
2. **Verificar processo:** `ps aux | grep webhook`
3. **Verificar logs nginx:** `sudo tail -f /var/log/nginx/error.log`
4. **Reiniciar WebSocket:** Matar processo e rodar novamente

**Status:** A solução com porta 4000 já está implementada e deve funcionar assim que o build for deployado! 🎉 