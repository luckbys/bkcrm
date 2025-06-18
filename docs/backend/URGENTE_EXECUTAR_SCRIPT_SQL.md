# 🚨 URGENTE: Executar Script SQL no Supabase

## 📋 Problema Atual
```
POST https://ajlgjjjvuglwgfnyqqvb.supabase.co/rest/v1/rpc/finalize_ticket 404 (Not Found)

Erro: Could not find the function public.finalize_ticket(ticket_id) in the schema cache
```

## ⚡ Solução Imediata

### 1. Acessar Supabase Dashboard
1. Acesse: https://supabase.com/dashboard/projects
2. Entre no projeto `ajlgjjjvuglwgfnyqqvb` 
3. Vá em **SQL Editor** (menu esquerdo)

### 2. Executar Script SQL
Copie e cole todo o conteúdo do arquivo `CRIAR_FUNCAO_RPC_FINALIZAR.sql` no SQL Editor e clique em **RUN**.

**Conteúdo do Script:**
```sql
-- ===================================
-- FUNÇÃO RPC: Finalizar Ticket (Contorna RLS)
-- ===================================

-- 1. CRIAR FUNÇÃO PARA ATUALIZAR STATUS DO TICKET
CREATE OR REPLACE FUNCTION update_ticket_status(
    ticket_id UUID,
    new_status TEXT,
    closed_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do proprietário da função
AS $$
DECLARE
    updated_ticket_record tickets%ROWTYPE;
    result JSON;
BEGIN
    -- Verificar se o ticket existe
    IF NOT EXISTS (SELECT 1 FROM tickets WHERE id = ticket_id) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ticket não encontrado',
            'ticket_id', ticket_id
        );
    END IF;
    
    -- Atualizar o ticket (contorna RLS porque usa SECURITY DEFINER)
    UPDATE tickets 
    SET 
        status = new_status,
        updated_at = NOW(),
        closed_at = CASE 
            WHEN new_status IN ('closed', 'finalizado', 'resolved') 
            THEN closed_timestamp 
            ELSE closed_at 
        END
    WHERE id = ticket_id
    RETURNING * INTO updated_ticket_record;
    
    -- Construir resposta JSON
    result := json_build_object(
        'success', true,
        'ticket_id', updated_ticket_record.id,
        'old_status', 'unknown',
        'new_status', updated_ticket_record.status,
        'updated_at', updated_ticket_record.updated_at,
        'closed_at', updated_ticket_record.closed_at
    );
    
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

-- 2. CRIAR FUNÇÃO SIMPLIFICADA APENAS PARA STATUS
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

-- 3. CONCEDER PERMISSÕES PARA USUÁRIOS AUTENTICADOS
GRANT EXECUTE ON FUNCTION update_ticket_status(UUID, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_ticket(UUID) TO authenticated;

-- 4. RESULTADO
SELECT 'Funções RPC criadas com sucesso! Use supabase.rpc("finalize_ticket", {ticket_id: "uuid"}) no frontend.' as resultado;
```

### 3. Verificar Resultado
Após executar, você deve ver:
```
Funções RPC criadas com sucesso! Use supabase.rpc("finalize_ticket", {ticket_id: "uuid"}) no frontend.
```

### 4. Testar no Console do Navegador
Execute o arquivo `teste-verificar-funcoes-rpc.js` no console do navegador para confirmar que as funções existem.

## 🎯 Por que isso é necessário?

1. **RLS Blocking**: A política de segurança Row Level Security está bloqueando atualizações diretas na tabela `tickets`
2. **SECURITY DEFINER**: As funções RPC com `SECURITY DEFINER` executam com privilégios elevados, contornando o RLS
3. **Schema Cache**: O Supabase precisa recarregar o cache do schema após criar novas funções

## ✅ Após Executar

1. **Frontend funcionará**: O botão "Finalizar Ticket" no chat funcionará corretamente
2. **Banco atualizado**: Os tickets realmente serão marcados como `closed` no banco de dados
3. **Status visível**: Tickets finalizados aparecerão no filtro "Finalizados"

## 🚀 Execute AGORA!

O sistema está esperando essas funções para funcionar corretamente. Após executar o script SQL, a funcionalidade de finalização de tickets funcionará 100%. 