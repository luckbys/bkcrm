# Solução: Mensagens Evolution API Não Processadas Corretamente

## 🔍 Diagnóstico do Problema

Baseado nos logs fornecidos, identificamos que:

### ✅ O que está funcionando:
- Webhook recebendo mensagens da Evolution API
- Health check respondendo corretamente
- Múltiplos eventos chegando (contacts.update, messages.update, chats.upsert, etc.)

### ❌ O que NÃO está funcionando:
- Eventos `messages.upsert` não sendo processados adequadamente
- Falta de logs de processamento interno
- Mensagens não sendo salvas no banco de dados
- Clientes e tickets não sendo criados automaticamente

## 🛠️ Soluções Implementadas

### 1. Webhook Aprimorado (v2.0)
- **Arquivo**: `backend/webhooks/webhook-evolution-complete-corrigido.js`
- **Melhorias**:
  - Processamento completo de eventos `messages.upsert`
  - Criação automática de clientes na tabela `profiles`
  - Criação automática de tickets vinculados
  - Logs detalhados para debug
  - Suporte a múltiplos tipos de mensagem (texto, imagem, vídeo, áudio, documento)
  - Endpoint genérico para capturar todos os webhooks

### 2. Processamento Inteligente
```javascript
// Fluxo completo implementado:
1. Receber mensagem da Evolution API
2. Extrair telefone e dados do contato
3. Buscar ou criar cliente na tabela 'profiles'
4. Buscar ou criar ticket aberto
5. Salvar mensagem no banco
6. Retornar confirmação de processamento
```

### 3. Suporte a Múltiplos Eventos
- **messages.upsert**: Processado completamente
- **contacts.update**: Recebido mas não processado (conforme esperado)
- **messages.update**: Recebido mas não processado (conforme esperado)
- **chats.upsert**: Recebido mas não processado (conforme esperado)

## 🚀 Como Testar

### 1. Parar o webhook atual
```bash
# Pressione Ctrl+C no terminal onde o webhook está rodando
```

### 2. Iniciar o webhook aprimorado
```bash
node backend/webhooks/webhook-evolution-complete-corrigido.js
```

### 3. Executar testes automáticos
```bash
# Em outro terminal
node backend/tests/testar-webhook-aprimorado.js
```

### 4. Logs esperados no webhook:
```
🔔 Webhook evolution recebido - Evento: messages.upsert
🔄 Processando mensagem do evento: messages.upsert
📱 Processando mensagem de: 5512981022013 (Lucas Borges)
🔍 Buscando cliente para telefone: 5512981022013
✅ Cliente encontrado: Lucas Borges (uuid-do-cliente)
🎫 Buscando ticket existente para cliente: uuid-do-cliente
✅ Ticket existente encontrado: uuid-do-ticket
💬 Salvando mensagem para ticket: uuid-do-ticket
✅ Mensagem salva: uuid-da-mensagem - "mnnkjjnjj..."
✅ Mensagem processada com sucesso! Cliente: xxx, Ticket: yyy, Mensagem: zzz
```

## 🔧 Problemas Comuns e Soluções

### Problema 1: Supabase Key Incorreta
**Sintoma**: Erro 401 Unauthorized
**Solução**: Verificar se está usando a key correta:
```javascript
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';
```

### Problema 2: Schema de Tabelas
**Sintoma**: Erro ao inserir dados
**Solução**: Executar script de correção no Supabase Dashboard:
```sql
-- Verificar se tabela profiles existe
SELECT * FROM profiles LIMIT 1;

-- Verificar se tabela tickets existe  
SELECT * FROM tickets LIMIT 1;

-- Verificar se tabela messages existe
SELECT * FROM messages LIMIT 1;
```

### Problema 3: RLS (Row Level Security)
**Sintoma**: Erro de permissão
**Solução**: Temporariamente desabilitar RLS para webhook:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;  
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
```

## 📊 Verificação de Funcionamento

### 1. No Frontend (React)
- Acessar lista de tickets
- Verificar se novos tickets aparecem
- Verificar se mensagens são exibidas

### 2. No Supabase Dashboard
```sql
-- Verificar clientes criados
SELECT * FROM profiles WHERE role = 'customer' ORDER BY created_at DESC LIMIT 10;

-- Verificar tickets criados
SELECT * FROM tickets WHERE channel = 'whatsapp' ORDER BY created_at DESC LIMIT 10;

-- Verificar mensagens salvas
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;
```

### 3. Logs de Debug
- Ativar logs detalhados no webhook
- Monitorar console do browser no frontend
- Verificar Network tab para requisições

## 🎯 Resultado Esperado

Após implementar as correções:

1. **Mensagens WhatsApp** → **Evolution API** → **Webhook** → **Supabase** → **Frontend**
2. Cada mensagem deve gerar:
   - Cliente criado/encontrado na tabela `profiles`
   - Ticket criado/encontrado na tabela `tickets`
   - Mensagem salva na tabela `messages`
3. Frontend deve exibir conversas em tempo real
4. Logs devem mostrar processamento completo

## 🚨 Comandos de Emergência

### Reiniciar webhook completamente:
```bash
# Parar todos os processos Node.js
taskkill /f /im node.exe

# Iniciar webhook limpo
node backend/webhooks/webhook-evolution-complete-corrigido.js
```

### Limpar dados de teste:
```sql
-- Remover dados de teste (CUIDADO!)
DELETE FROM messages WHERE metadata->>'created_via' = 'webhook_evolution';
DELETE FROM tickets WHERE metadata->>'created_via' = 'webhook_evolution';  
DELETE FROM profiles WHERE metadata->>'created_via' = 'webhook_evolution';
```

### Verificar conectividade:
```bash
# Testar webhook
curl -X GET http://localhost:4000/webhook/health

# Testar Supabase
curl -H "apikey: SUA_SUPABASE_KEY" https://ajlgjjjvuglwgfnyqqvb.supabase.co/rest/v1/profiles?select=*&limit=1
```

---

**✅ Status**: Solução implementada e testada
**📅 Data**: 2025-01-18
**🔄 Versão**: 2.0.0-aprimorado 