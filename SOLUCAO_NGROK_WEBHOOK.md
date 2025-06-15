# 🌐 SOLUÇÃO: Expor Webhook Local com ngrok

## ❌ Problema
Evolution API (servidor remoto) não consegue acessar `localhost:4000` (sua máquina local)

## ✅ Solução: ngrok
Usar ngrok para criar um túnel público para seu webhook local

### 📥 1. Instalar ngrok

**Windows:**
```bash
# Baixar de: https://ngrok.com/download
# Ou usar chocolatey:
choco install ngrok

# Ou usar scoop:
scoop install ngrok
```

### 🔑 2. Configurar ngrok (opcional)
```bash
# Criar conta gratuita em https://ngrok.com/
# Obter authtoken e configurar:
ngrok authtoken SEU_TOKEN_AQUI
```

### 🚀 3. Expor webhook local
```bash
# Executar em terminal separado:
ngrok http 4000

# Resultado esperado:
# Forwarding  https://abc123.ngrok.io -> http://localhost:4000
```

### 🔧 4. Configurar Evolution API
```javascript
// Usar a URL do ngrok no webhook:
const WEBHOOK_URL = 'https://abc123.ngrok.io/webhook/evolution';

// Executar script de configuração:
node corrigir-webhook-final.js
```

### 📋 5. Passos completos

1. **Terminal 1**: Iniciar webhook local
   ```bash
   node webhook-evolution-complete.js
   ```

2. **Terminal 2**: Iniciar ngrok
   ```bash
   ngrok http 4000
   ```

3. **Terminal 3**: Configurar Evolution API
   ```bash
   # Editar corrigir-webhook-final.js com URL do ngrok
   # Executar configuração
   node corrigir-webhook-final.js
   ```

4. **Testar**: Enviar mensagem WhatsApp

### 🧪 6. Verificar funcionamento

**Logs esperados no ngrok:**
```
HTTP Requests
POST /webhook/evolution/messages-upsert  200 OK
POST /webhook/evolution/contacts-update  200 OK
```

**Logs esperados no webhook:**
```
📥 [MESSAGES-UPSERT] Recebido webhook de mensagem
📨 Processando mensagem: { from: 'Nome', phone: '5511...', content: '...' }
```

### ⚠️ Limitações ngrok gratuito
- URL muda a cada reinicialização
- Limite de conexões simultâneas
- Para produção, usar plano pago ou deploy em servidor

### 🚀 Alternativa: Deploy em servidor
Para solução permanente, fazer deploy do webhook no mesmo servidor da Evolution API (EasyPanel)

---

**Próximo passo**: Instalar ngrok e seguir os passos acima 