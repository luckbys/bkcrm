# 🚨 Passos para Corrigir Campo nunmsg

## 📋 **Checklist Rápido**

### **1. Adicionar Campo nunmsg no Banco**
Execute no **SQL Editor do Supabase**:
```sql
-- Adicionar campo nunmsg se não existir
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS nunmsg VARCHAR NULL;

-- Migrar números existentes dos metadados
UPDATE tickets SET nunmsg = COALESCE(
  metadata->>'client_phone',
  metadata->>'whatsapp_phone', 
  CASE 
    WHEN metadata->>'anonymous_contact' LIKE '%@s.whatsapp.net' 
    THEN REPLACE(metadata->>'anonymous_contact', '@s.whatsapp.net', '')
    ELSE metadata->>'anonymous_contact'
  END
)
WHERE channel = 'whatsapp' AND nunmsg IS NULL;

-- Verificar resultado
SELECT COUNT(*) as com_nunmsg FROM tickets WHERE channel = 'whatsapp' AND nunmsg IS NOT NULL;
```

### **2. Verificar se Webhook Está Salvando**

**A. Iniciar o webhook:**
```bash
cd backend/webhooks
node webhook-evolution-complete-corrigido.js
```

**B. Testar se está funcionando:**
```bash
curl http://localhost:4000/webhook/health
```

**C. Enviar mensagem de teste:**
Execute este payload no **PowerShell**:
```powershell
$body = @{
    event = "messages.upsert"
    instance = "teste-nunmsg"
    data = @{
        key = @{
            remoteJid = "5511999887766@s.whatsapp.net"
            fromMe = $false
            id = "TEST_NUNMSG_$(Get-Date -Format 'yyyyMMddHHmmss')"
        }
        message = @{
            conversation = "[TESTE] Verificando campo nunmsg"
        }
        messageTimestamp = [int][double]::Parse((Get-Date -UFormat %s))
        pushName = "Teste Nunmsg"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:4000/webhook/evolution" -Method POST -Body $body -ContentType "application/json"
```

### **3. Verificar no Banco**
Execute no **SQL Editor do Supabase**:
```sql
-- Verificar se ticket foi criado com nunmsg
SELECT id, title, nunmsg, channel, created_at 
FROM tickets 
WHERE nunmsg = '+5511999887766' 
ORDER BY created_at DESC 
LIMIT 1;
```

## ✅ **Resultado Esperado**

Se tudo estiver funcionando:
- ✅ Campo `nunmsg` existe na tabela
- ✅ Webhook está rodando na porta 4000
- ✅ Mensagem de teste cria ticket com `nunmsg = '+5511999887766'`
- ✅ Tickets antigos foram migrados com números dos metadados

## 🔧 **Problemas Comuns**

### **Campo nunmsg não existe**
```sql
ALTER TABLE public.tickets ADD COLUMN nunmsg VARCHAR NULL;
```

### **Webhook não está rodando**
```bash
cd backend/webhooks
node webhook-evolution-complete-corrigido.js
```

### **API Key inválida**
Verifique se o webhook usa a service role key:
```javascript
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';
```

### **Tickets antigos sem nunmsg**
```sql
UPDATE tickets SET nunmsg = metadata->>'whatsapp_phone'
WHERE channel = 'whatsapp' AND nunmsg IS NULL AND metadata->>'whatsapp_phone' IS NOT NULL;
```

## 🎯 **Teste Final**

1. Execute o script SQL no Supabase
2. Inicie o webhook 
3. Envie mensagem de teste via PowerShell
4. Verifique se ticket foi criado com nunmsg preenchido
5. ✅ **Sucesso**: Sistema funcionando 100%! 