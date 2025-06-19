# 🚨 Solução: Campo nunmsg não está sendo preenchido

## 🔍 **Problema Identificado**
Tickets WhatsApp estão sendo criados mas o campo `nunmsg` permanece NULL, impedindo a resposta automática.

## ⚡ **Soluções Rápidas**

### **1. VERIFICAR SE CAMPO EXISTE NA TABELA**
```sql
-- Execute no SQL Editor do Supabase:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tickets' AND column_name = 'nunmsg';
```

**Se retornar vazio (campo não existe):**
```sql
-- Adicionar campo nunmsg:
ALTER TABLE public.tickets ADD COLUMN nunmsg VARCHAR NULL;
COMMENT ON COLUMN public.tickets.nunmsg IS 'Número de telefone do cliente WhatsApp';
```

### **2. VERIFICAR STATUS DO WEBHOOK**
Verifique se o webhook está rodando:
- URL: `http://localhost:4000/webhook/health`
- Esperado: Resposta JSON com status "ok"

**Se não estiver rodando:**
```bash
cd backend/webhooks
node webhook-evolution-complete-corrigido.js
```

### **3. TESTAR CRIAÇÃO MANUAL**
Execute no SQL Editor do Supabase:
```sql
-- Teste manual de inserção:
INSERT INTO tickets (
  title, 
  channel, 
  nunmsg, 
  status, 
  priority,
  metadata
) VALUES (
  'Teste nunmsg manual',
  'whatsapp',
  '+5511999887766',
  'open',
  'medium',
  '{"test": true}'::jsonb
);

-- Verificar se foi inserido:
SELECT id, title, nunmsg FROM tickets WHERE nunmsg = '+5511999887766';

-- Limpar teste:
DELETE FROM tickets WHERE nunmsg = '+5511999887766';
```

### **4. ATUALIZAR TICKETS EXISTENTES**
```sql
-- Se campo existir mas tickets antigos estão sem nunmsg,
-- você pode extrair do metadata:
UPDATE tickets SET 
  nunmsg = metadata->>'whatsapp_phone'
WHERE channel = 'whatsapp' 
  AND nunmsg IS NULL 
  AND metadata->>'whatsapp_phone' IS NOT NULL;

-- Verificar resultado:
SELECT COUNT(*) as tickets_com_nunmsg 
FROM tickets 
WHERE channel = 'whatsapp' AND nunmsg IS NOT NULL;
```

## 🔧 **Verificações Detalhadas**

### **A. Logs do Webhook**
Quando webhook está rodando, deve mostrar:
```
✅ Ticket criado: [UUID] com telefone salvo no campo nunmsg: +5511999999999
```

### **B. Estrutura da Tabela Tickets**
Campos obrigatórios para funcionamento:
- ✅ `id` (UUID)
- ✅ `title` (TEXT)
- ✅ `channel` (TEXT)
- ✅ `nunmsg` (VARCHAR) ← **ESTE CAMPO É CRÍTICO**
- ✅ `status` (ENUM)
- ✅ `metadata` (JSONB)

### **C. Payload do Webhook Evolution**
Formato esperado das mensagens:
```javascript
{
  "event": "messages.upsert",
  "instance": "atendimento-ao-cliente-suporte",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net"
    },
    "message": {
      "conversation": "Texto da mensagem"
    }
  }
}
```

## 🎯 **Checklist de Verificação**

- [ ] **Campo nunmsg existe na tabela tickets**
- [ ] **Webhook está rodando na porta 4000**
- [ ] **Instância Evolution API está conectada**
- [ ] **Webhook está configurado na Evolution API**
- [ ] **Logs mostram criação de tickets com nunmsg**

## 📱 **Teste Completo**

### Passo 1: Verificar Banco
```sql
-- No Supabase SQL Editor:
SELECT 
  COUNT(*) as total_tickets,
  COUNT(nunmsg) as com_nunmsg,
  COUNT(*) - COUNT(nunmsg) as sem_nunmsg
FROM tickets 
WHERE channel = 'whatsapp';
```

### Passo 2: Verificar Webhook
```bash
# No terminal:
curl http://localhost:4000/webhook/health
```

### Passo 3: Enviar Mensagem Teste
- Envie mensagem WhatsApp para instância configurada
- Aguarde 5 segundos
- Verifique no banco se ticket foi criado com nunmsg

### Passo 4: Verificar Resultado
```sql
-- Último ticket criado:
SELECT id, title, nunmsg, created_at 
FROM tickets 
WHERE channel = 'whatsapp' 
ORDER BY created_at DESC 
LIMIT 1;
```

## 🚑 **Solução de Emergência**

Se nada funcionar, execute este script completo:

```sql
-- 1. Garantir que campo existe
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS nunmsg VARCHAR NULL;

-- 2. Migrar números existentes do metadata
UPDATE tickets SET 
  nunmsg = COALESCE(
    metadata->>'client_phone',
    metadata->>'whatsapp_phone', 
    REPLACE(metadata->>'anonymous_contact', '@s.whatsapp.net', '')
  )
WHERE channel = 'whatsapp' 
  AND nunmsg IS NULL 
  AND (
    metadata->>'client_phone' IS NOT NULL OR
    metadata->>'whatsapp_phone' IS NOT NULL OR
    metadata->>'anonymous_contact' IS NOT NULL
  );

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_tickets_nunmsg 
ON tickets(nunmsg) WHERE nunmsg IS NOT NULL;

-- 4. Verificar resultado
SELECT 
  'RESULTADO' as status,
  COUNT(*) as total_whatsapp,
  COUNT(nunmsg) as com_nunmsg,
  ROUND((COUNT(nunmsg)::float / COUNT(*)) * 100, 1) as percentual
FROM tickets 
WHERE channel = 'whatsapp';
```

## 📞 **Resultado Esperado**

Após aplicar as correções:
- ✅ Novos tickets WhatsApp têm nunmsg preenchido automaticamente
- ✅ Tickets antigos migrados com números extraídos dos metadados  
- ✅ Sistema de resposta automática funciona 100%
- ✅ Frontend acessa telefone diretamente via `ticket.nunmsg`

## 🔄 **Próximos Passos**

1. Execute o script SQL de emergência
2. Reinicie o webhook 
3. Teste com mensagem WhatsApp real
4. Verifique se nunmsg está preenchido
5. Confirme funcionamento da resposta automática 