# 📊 Análise dos Logs do Webhook Evolution API

## 🔍 Problemas Identificados nos Logs

### 1. 🚨 Erro RLS na Tabela Customers
```
❌ Erro ao criar cliente: new row violates row-level security policy for table "customers"
```

**Causa**: A política RLS está bloqueando a criação automática de clientes pelo webhook.

**Solução**: Criar função RPC para contornar RLS na criação de clientes.

### 2. 🚨 Erro de Enum no Status do Ticket
```
❌ Erro ao buscar ticket: invalid input value for enum ticket_status: "pendente"
```

**Causa**: O webhook está tentando usar status "pendente" mas o enum do banco não aceita esse valor.

**Solução**: Usar mapeamento correto de status.

### 3. 🚨 Erro de Foreign Key com Customers
```
❌ Erro ao criar ticket no banco: insert or update on table "tickets" violates foreign key constraint "tickets_customer_id_fkey"
```

**Causa**: O customer_id criado não está sendo encontrado na tabela de relacionamento.

**Solução**: Verificar se a tabela customers está usando a estrutura correta.

## 🛠️ Correções Necessárias

### Correção 1: Função RPC para Criar Clientes
```sql
-- Criar função para contornar RLS na criação de clientes
CREATE OR REPLACE FUNCTION create_customer_webhook(
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_customer_id UUID;
    result JSON;
BEGIN
    -- Criar cliente
    INSERT INTO customers (name, phone, email, status, category, tags, created_at)
    VALUES (
        customer_name,
        customer_phone,
        COALESCE(customer_email, 'whatsapp-' || customer_phone || '@auto-generated.com'),
        'prospect',
        'bronze',
        ARRAY['auto-criado', 'whatsapp'],
        NOW()
    )
    RETURNING id INTO new_customer_id;
    
    result := json_build_object(
        'success', true,
        'customer_id', new_customer_id,
        'message', 'Cliente criado com sucesso'
    );
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

GRANT EXECUTE ON FUNCTION create_customer_webhook(TEXT, TEXT, TEXT) TO authenticated;
```

### Correção 2: Mapeamento de Status no Webhook
```javascript
// No webhook-evolution-complete.js, corrigir o mapeamento de status
function mapStatusToDatabase(status) {
    const statusMap = {
        'pendente': 'open',
        'atendimento': 'in_progress', 
        'finalizado': 'closed',
        'cancelado': 'cancelled'
    };
    
    return statusMap[status] || 'open';
}
```

### Correção 3: Verificar Estrutura da Tabela Customers
```sql
-- Verificar se a tabela customers existe e tem a estrutura correta
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;
```

## 📝 Status dos Problemas

### ✅ Resolvidos
- [x] Mapeamento de status frontend (useTicketsDB.ts)
- [x] Função finalizeTicket criada
- [x] Interface de finalização implementada

### ⏳ Pendentes
- [ ] Execução do script SQL no Supabase (URGENTE)
- [ ] Correção RLS para criação de clientes
- [ ] Mapeamento de status no webhook
- [ ] Verificação da estrutura da tabela customers

## 🎯 Próximos Passos

1. **Imediato**: Executar `CRIAR_FUNCAO_RPC_FINALIZAR.sql` no Supabase
2. **Curto prazo**: Corrigir problemas de RLS para clientes
3. **Médio prazo**: Melhorar mapeamento de status no webhook
4. **Longo prazo**: Implementar monitoramento de erros

## 🚀 Comandos para Teste Rápido

```javascript
// No console do navegador, após executar o script SQL:
testRpcFunctions() // Testa se as funções RPC existem

// No terminal, para verificar logs do webhook:
tail -f webhook-evolution-complete.log

// Para testar criação de ticket manualmente:
testTicketCreation()
``` 