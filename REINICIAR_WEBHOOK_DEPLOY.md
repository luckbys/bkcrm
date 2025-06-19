# 🔄 Reiniciar Webhook com API Key Corrigida

## 🚨 **Problema Identificado**
O webhook está rodando com API key desatualizada do Supabase, causando erro "Invalid API key".

## ✅ **Correções Aplicadas**

### **1. API Key Atualizada**
- ❌ Antiga: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg5NzI4MDAsImV4cCI6MjAyNDU0ODgwMH0...`
- ✅ Nova: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTk0NDk0MywiZXhwIjoyMDUxNTIwOTQzfQ...`

### **2. Campo nunmsg Adicionado**
Agora o webhook salva automaticamente o número do cliente no campo `nunmsg`:
```javascript
nunmsg: ticketInfo.clientPhone.startsWith('+') ? ticketInfo.clientPhone : `+${ticketInfo.clientPhone}`
```

## 🔧 **Como Reiniciar**

### **Opção 1: Se está rodando localmente**
```bash
# Parar todos os processos Node.js
taskkill /f /im node.exe

# Ir para pasta do webhook
cd backend/webhooks

# Iniciar webhook corrigido
node webhook-evolution-complete-corrigido.js
```

### **Opção 2: Se está rodando em Docker/EasyPanel**
```bash
# Reconstruir e fazer deploy da versão corrigida
cd deploy-webhook

# Verificar se arquivo está atualizado
grep "service_role" webhook-evolution-complete-corrigido.cjs

# Fazer novo deploy no EasyPanel ou Docker
```

### **Opção 3: Verificar qual versão está rodando**
```bash
# Verificar logs do erro para identificar o arquivo
# O erro mostra: /app/webhook.js
# Isso indica que pode estar rodando em container

# Verificar processos ativos
ps aux | grep node
# ou no Windows:
tasklist | findstr node
```

## 🧪 **Teste Após Reiniciar**

### **1. Verificar Health**
```bash
curl http://localhost:4000/webhook/health
```

### **2. Testar Mensagem**
```powershell
$body = @{
    event = "messages.upsert"
    instance = "teste-api-key"
    data = @{
        key = @{
            remoteJid = "5511999887766@s.whatsapp.net"
            fromMe = $false
            id = "TEST_API_KEY_$(Get-Date -Format 'yyyyMMddHHmmss')"
        }
        message = @{
            conversation = "[TESTE API KEY] Verificando se API key foi corrigida"
        }
        messageTimestamp = [int][double]::Parse((Get-Date -UFormat %s))
        pushName = "Teste API Key"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:4000/webhook/evolution" -Method POST -Body $body -ContentType "application/json"
```

### **3. Verificar no Banco**
```sql
-- Se funcionou, deve retornar um ticket com nunmsg preenchido
SELECT id, title, nunmsg, channel, created_at 
FROM tickets 
WHERE nunmsg = '+5511999887766' 
ORDER BY created_at DESC 
LIMIT 1;
```

## ✅ **Resultado Esperado**

Após reiniciar com a API key corrigida:
- ✅ Webhook conecta com sucesso no Supabase
- ✅ Cria clientes automaticamente na tabela `profiles`
- ✅ Cria tickets com campo `nunmsg` preenchido
- ✅ Salva mensagens corretamente
- ✅ Sem mais erros "Invalid API key"

## 🎯 **Próximos Passos**

1. Reinicie o webhook com a versão corrigida
2. Teste com mensagem WhatsApp real
3. Verifique se campo `nunmsg` está sendo salvo
4. ✅ Sistema 100% funcional para resposta automática! 