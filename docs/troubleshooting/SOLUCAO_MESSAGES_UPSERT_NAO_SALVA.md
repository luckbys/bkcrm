# 🔧 SOLUÇÃO: Endpoint /messages-upsert não está salvando mensagens

## 📋 Problema Identificado

O endpoint `/messages-upsert` está recebendo requisições da Evolution API, mas **não está salvando mensagens no banco de dados nem criando tickets** quando deveria.

### 🚨 Sintomas
- ✅ Servidor WebSocket rodando na porta 4000
- ✅ Endpoint `/messages-upsert` responde às requisições
- ❌ Mensagens não aparecem no banco de dados
- ❌ Tickets não são criados automaticamente
- ❌ Frontend não recebe atualizações via WebSocket

## 🔍 Diagnóstico Completo

### 1. Executar Diagnóstico Automático

No console do navegador (F12), execute:

```javascript
// Diagnóstico completo do sistema
await fixMessagesUpsert()

// Teste específico do fluxo
await testMessageUpsertFlow()
```

### 2. Verificar Logs do Servidor

No terminal onde o servidor WebSocket está rodando, procure por:

```bash
# Logs esperados quando funcionando:
📥 [COMPAT] /messages-upsert recebido
🔍 Buscando cliente para telefone: +5512981022013
✅ Cliente encontrado/criado
🎫 Buscando ticket existente para cliente
✅ Ticket criado/encontrado
✅ Mensagem salva: [message-id]
📡 [WS] Mensagem transmitida via WebSocket

# Logs de erro comuns:
❌ Erro ao criar cliente: [detalhes]
❌ Erro ao criar ticket: [detalhes]  
❌ Erro ao salvar mensagem: [detalhes]
```

## 🛠️ Soluções por Problema

### Problema 1: Erro de Conexão com Banco

**Sintoma:** `❌ Erro na conexão com banco`

**Solução:**
```bash
# Verificar credenciais do Supabase
cd backend/config
cat CREDENCIAIS_CORRETAS_SUPABASE.env

# Aplicar credenciais corretas no webhook
cp CREDENCIAIS_CORRETAS_SUPABASE.env ../webhooks/.env
```

### Problema 2: Tabela profiles não encontrada

**Sintoma:** `❌ Erro ao criar cliente: table 'profiles' not found`

**Solução:**
```sql
-- Executar no Supabase Dashboard SQL Editor
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'customer',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Problema 3: Tabela tickets com schema incorreto

**Sintoma:** `❌ Erro ao criar ticket: column 'nunmsg' not found`

**Solução:**
```sql
-- Executar no Supabase Dashboard SQL Editor
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS nunmsg TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'email';
```

### Problema 4: Constraint de foreign key

**Sintoma:** `❌ foreign key constraint 'tickets_customer_id_fkey'`

**Solução:**
```sql
-- Executar no Supabase Dashboard SQL Editor
-- Verificar se constraint existe e corrigir se necessário
ALTER TABLE tickets 
DROP CONSTRAINT IF EXISTS tickets_customer_id_fkey;

ALTER TABLE tickets 
ADD CONSTRAINT tickets_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES profiles(id);
```

### Problema 5: Função processMessage com erro

**Sintoma:** Endpoint responde OK mas não processa

**Solução:**
```bash
# Reiniciar servidor WebSocket
cd backend/webhooks
pkill -f "webhook-evolution-websocket.js"
node webhook-evolution-websocket.js
```

## 🧪 Teste Completo do Sistema

### 1. Teste Manual via cURL

```bash
# Testar endpoint diretamente
curl -X POST http://localhost:4000/webhook/messages-upsert \
  -H "Content-Type: application/json" \
  -d '{
    "event": "MESSAGES_UPSERT",
    "instance": "atendimento-ao-cliente-suporte",
    "data": {
      "key": {
        "id": "TEST_MANUAL_'$(date +%s)'",
        "remoteJid": "5512981022013@s.whatsapp.net",
        "fromMe": false
      },
      "message": {
        "conversation": "Teste manual do endpoint - '$(date)'"
      },
      "messageTimestamp": '$(date +%s)'000',
      "pushName": "Teste Manual"
    }
  }'
```

### 2. Verificar Resultado no Banco

```sql
-- Verificar tickets criados
SELECT id, title, nunmsg, channel, created_at 
FROM tickets 
WHERE channel = 'whatsapp' 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar mensagens salvas
SELECT m.id, m.content, m.sender_name, m.created_at, t.title
FROM messages m
JOIN tickets t ON m.ticket_id = t.id
WHERE t.channel = 'whatsapp'
ORDER BY m.created_at DESC
LIMIT 5;
```

## 🔧 Correção Definitiva

### Script de Correção Automática

Execute no console do navegador:

```javascript
// Diagnóstico e correção completa
async function corrigirMessagesUpsert() {
  console.log('🔧 Iniciando correção completa...');
  
  // 1. Diagnosticar problemas
  await fixMessagesUpsert();
  
  // 2. Testar fluxo completo
  await testMessageUpsertFlow();
  
  // 3. Verificar se está funcionando
  const health = await fetch('http://localhost:4000/webhook/health');
  const healthData = await health.json();
  
  console.log('📊 Status final:', healthData);
  
  if (healthData.status === 'healthy') {
    console.log('✅ Sistema corrigido com sucesso!');
  } else {
    console.log('❌ Ainda há problemas - verificar logs do servidor');
  }
}

// Executar correção
await corrigirMessagesUpsert();
```

## 📊 Monitoramento Contínuo

### Funções de Debug Disponíveis

```javascript
// No console do navegador:

// Diagnóstico completo
await fixMessagesUpsert()

// Teste de fluxo
await testMessageUpsertFlow()

// Mostrar logs detalhados
showUpsertLogs()

// Verificar últimos resultados
console.log(window.lastUpsertDiagnostics)
```

### Logs de Monitoramento

```bash
# No terminal do servidor WebSocket:
tail -f webhook.log | grep -E "(UPSERT|COMPAT|ERROR)"
```

## ✅ Checklist de Verificação

- [ ] Servidor WebSocket rodando na porta 4000
- [ ] Endpoint `/webhook/health` responde OK
- [ ] Credenciais Supabase corretas no `.env`
- [ ] Tabela `profiles` existe e acessível
- [ ] Tabela `tickets` tem colunas `nunmsg` e `channel`
- [ ] Tabela `messages` existe e acessível
- [ ] Foreign keys configuradas corretamente
- [ ] Teste manual via cURL funciona
- [ ] Mensagens aparecem no banco após teste
- [ ] Frontend recebe atualizações via WebSocket

## 🚀 Resultado Esperado

Após aplicar as correções:

1. **Mensagem chega no webhook** → Logs mostram processamento
2. **Cliente criado/encontrado** → Registro na tabela `profiles`
3. **Ticket criado/encontrado** → Registro na tabela `tickets`
4. **Mensagem salva** → Registro na tabela `messages`
5. **WebSocket broadcast** → Frontend atualiza automaticamente
6. **Resposta 200 OK** → Evolution API confirma processamento

## 📞 Suporte Adicional

Se o problema persistir:

1. **Copiar logs completos** do servidor WebSocket
2. **Executar diagnóstico** e copiar resultados
3. **Verificar versão** do Node.js e dependências
4. **Testar conexão** Supabase independentemente

---

**Última atualização:** 28/06/2025 23:30  
**Status:** Ferramentas de diagnóstico implementadas e testadas ✅ 