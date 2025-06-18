# 🔧 Solução: Finalização de Tickets Não Persiste no Banco

## Problema Identificado

O botão "Finalizar" está atualizando apenas o estado local, mas não está persistindo no banco de dados devido a:

1. **Políticas RLS (Row Level Security)** bloqueando UPDATEs
2. **Função RPC** não criada ou não funcionando
3. **Permissões** inadequadas para usuários autenticados

## Correções Implementadas

### 1. Nova Função `finalizeTicket` no Hook

**Arquivo**: `src/hooks/useTicketsDB.ts`

```typescript
// Função específica para finalizar tickets usando RPC
const finalizeTicket = useCallback(async (ticketId: string) => {
  try {
    console.log('🎯 [finalizeTicket] Iniciando finalização via RPC:', { ticketId });

    // Tentar primeiro com RPC que contorna RLS
    const { data: rpcData, error: rpcError } = await supabase.rpc('finalize_ticket', {
      ticket_id: ticketId
    });

    if (rpcData?.success) {
      // Atualizar lista local
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { 
            ...ticket, 
            status: 'closed',
            updated_at: new Date().toISOString(),
            closed_at: new Date().toISOString()
          } : ticket
        )
      );
      return true;
    }
    
    // Fallback para UPDATE direto se RPC falhar
    const { data: updateData, error: updateError } = await supabase
      .from('tickets')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
        closed_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (updateData) {
      setTickets(prev => 
        prev.map(ticket => 
          ticket.id === ticketId ? { ...ticket, ...updateData } : ticket
        )
      );
      return true;
    }

    throw updateError || new Error('Falha na finalização');
  } catch (err) {
    console.error('❌ [finalizeTicket] Erro:', err);
    throw err;
  }
}, []);
```

### 2. Atualização do Header para Usar Nova Função

**Arquivo**: `src/components/crm/ticket-chat/TicketChatHeader.tsx`

```typescript
// Usar a função finalizeTicket diretamente
await finalizeTicket(ticketId);
persistenceSuccess = true;
console.log('✅ Ticket finalizado via finalizeTicket!');
```

## Passos de Resolução

### Passo 1: Executar Scripts SQL no Supabase

1. **Abra o Supabase Dashboard**
2. **Vá em SQL Editor**
3. **Execute este script**:

```sql
-- Verificar se as funções RPC existem
SELECT proname, prosecdef, proowner 
FROM pg_proc 
WHERE proname IN ('finalize_ticket', 'update_ticket_status');

-- Se não existirem, executar:
CREATE OR REPLACE FUNCTION finalize_ticket(ticket_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    -- Atualizar ticket para status fechado
    UPDATE tickets 
    SET 
        status = 'closed',
        updated_at = NOW(),
        closed_at = NOW()
    WHERE id = ticket_id;
    
    -- Verificar se a atualização funcionou
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'message', 'Ticket finalizado com sucesso',
            'ticket_id', ticket_id,
            'timestamp', NOW()
        );
    ELSE
        result := json_build_object(
            'success', false,
            'error', 'Ticket não encontrado ou não foi possível atualizar',
            'ticket_id', ticket_id
        );
    END IF;
    
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'ticket_id', ticket_id
        );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION finalize_ticket(UUID) TO authenticated;

-- Forçar reload do schema
NOTIFY pgrst, 'reload schema';
```

### Passo 2: Verificar RLS Policies

```sql
-- Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tickets';

-- Se necessário, criar política permissiva
CREATE POLICY "Allow ticket updates for authenticated users" ON tickets
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

### Passo 3: Testar no Frontend

1. **Abra o Console do Navegador (F12)**
2. **Cole e execute este código**:

```javascript
// Teste da função RPC
const testTicketId = '00000000-0000-0000-0000-000000000001';

supabase.rpc('finalize_ticket', { ticket_id: testTicketId })
  .then(result => {
    console.log('Resultado RPC:', result);
    if (result.error && result.error.code === '42883') {
      console.log('❌ Função RPC não existe - Execute o script SQL');
    } else {
      console.log('✅ Função RPC está funcionando');
    }
  });
```

### Passo 4: Testar Finalização Real

1. **Abra um ticket no sistema**
2. **Clique em "Finalizar"**
3. **Verifique os logs no console**:

```
🎯 Finalizando ticket: {ticketId: "uuid", currentStatus: "open"}
💾 Usando finalizeTicket...
🎯 [finalizeTicket] Iniciando finalização via RPC: {ticketId: "uuid"}
✅ [finalizeTicket] RPC sucesso: {success: true, message: "..."}
✅ Ticket finalizado via finalizeTicket!
🔄 Recarregando tickets do banco...
✅ Contadores atualizados - Tickets recarregados do banco
```

4. **Verificar se o ticket aparece na aba "Finalizados"**

## Troubleshooting

### Problema: RPC não existe

**Erro**: `function finalize_ticket(uuid) does not exist`

**Solução**: Execute o script SQL do Passo 1

### Problema: Permissão negada

**Erro**: `permission denied for function finalize_ticket`

**Solução**: 
```sql
GRANT EXECUTE ON FUNCTION finalize_ticket(UUID) TO authenticated;
```

### Problema: RLS bloqueia UPDATE

**Erro**: `new row violates row-level security policy`

**Solução**: Execute script de correção RLS:
```sql
-- Política permissiva temporária para debug
CREATE POLICY "Debug - Allow all ticket updates" ON tickets
FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### Problema: Tickets não atualizam na interface

**Solução**: 
1. Verifique se `refreshTickets()` está sendo chamado após finalização
2. Verifique se `mapStatus()` está mapeando 'closed' para 'finalizado'
3. Force reload: `window.location.reload()`

## Validação Final

✅ **Checklist de Funcionamento**:

1. [ ] Script SQL executado sem erros
2. [ ] Função RPC criada: `SELECT * FROM pg_proc WHERE proname = 'finalize_ticket';`
3. [ ] Permissões concedidas: `GRANT EXECUTE ON FUNCTION finalize_ticket(UUID) TO authenticated;`
4. [ ] RLS permite UPDATE: Políticas não restritivas demais
5. [ ] Frontend usa `finalizeTicket()`: Logs mostram "finalizeTicket" sendo chamado
6. [ ] Tickets aparecem em "Finalizados": Contador atualiza
7. [ ] Persistência confirmada: Reload da página mantém tickets finalizados

## Scripts de Teste

Use os scripts criados para diagnóstico:

- `teste-rpc-finalizar.js` - Testa funções RPC
- `teste-finalizar-status.js` - Testa interface
- `DIAGNOSTICO_TICKETS_FINALIZADOS.md` - Guia completo de diagnóstico

## Monitoramento

Para acompanhar o funcionamento:

```sql
-- Ver tickets recentemente finalizados
SELECT id, title, status, updated_at, closed_at 
FROM tickets 
WHERE status = 'closed' 
ORDER BY closed_at DESC 
LIMIT 10;

-- Ver logs de RPC (se habilitado)
SELECT * FROM pg_stat_user_functions 
WHERE funcname = 'finalize_ticket';
``` 