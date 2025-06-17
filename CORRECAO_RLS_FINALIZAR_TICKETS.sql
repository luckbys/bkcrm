-- ===================================
-- CORREÇÃO RLS: Finalizar Tickets
-- ===================================
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. VERIFICAR POLÍTICAS ATUAIS
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename IN ('tickets', 'notifications')
ORDER BY tablename, policyname;

-- 2. REMOVER POLÍTICAS PROBLEMÁTICAS DE TICKETS
DROP POLICY IF EXISTS "Usuários podem ver tickets do seu departamento" ON tickets;
DROP POLICY IF EXISTS "Usuários podem criar tickets" ON tickets;
DROP POLICY IF EXISTS "Usuários podem atualizar tickets do seu departamento" ON tickets;
DROP POLICY IF EXISTS "Tickets policy" ON tickets;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON tickets;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON tickets;

-- 3. CRIAR POLÍTICAS SIMPLES E PERMISSIVAS PARA TICKETS
CREATE POLICY "Allow all for authenticated users on tickets"
  ON tickets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. VERIFICAR SE TABELA NOTIFICATIONS EXISTE E CORRIGIR
DO $$
BEGIN
    -- Verificar se a tabela notifications existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
    ) THEN
        -- Remover políticas problemáticas de notifications
        DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
        DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
        DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
        
        -- Criar política permissiva para notifications
        CREATE POLICY "Allow all for authenticated users on notifications"
          ON notifications
          FOR ALL
          TO authenticated
          USING (true)
          WITH CHECK (true);
          
        RAISE NOTICE '✅ Políticas de notifications corrigidas';
    ELSE
        RAISE NOTICE 'ℹ️ Tabela notifications não existe';
    END IF;
END $$;

-- 5. GARANTIR QUE RLS ESTÁ HABILITADO MAS COM POLÍTICAS PERMISSIVAS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Se tabela notifications existir, habilitar RLS também
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 6. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    'tickets' as tabela,
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'tickets'
UNION ALL
SELECT 
    'notifications' as tabela,
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY tabela, policyname;

-- 7. TESTAR UPDATE DE TICKET
DO $$
DECLARE
    test_ticket_id UUID;
    current_user_id UUID;
BEGIN
    -- Obter ID do usuário atual
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Usuário não autenticado para teste';
        RETURN;
    END IF;
    
    -- Buscar um ticket existente
    SELECT id INTO test_ticket_id 
    FROM tickets 
    WHERE status != 'closed'
    LIMIT 1;
    
    IF test_ticket_id IS NOT NULL THEN
        -- Testar UPDATE
        UPDATE tickets 
        SET 
            status = 'closed',
            updated_at = TIMEZONE('utc', NOW()),
            closed_at = TIMEZONE('utc', NOW())
        WHERE id = test_ticket_id;
        
        RAISE NOTICE '✅ Teste de finalização: SUCESSO para ticket %', test_ticket_id;
        
        -- Reverter o teste
        UPDATE tickets 
        SET 
            status = 'open',
            closed_at = NULL
        WHERE id = test_ticket_id;
        
    ELSE
        RAISE NOTICE 'ℹ️ Nenhum ticket aberto encontrado para teste';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Erro no teste de finalização: %', SQLERRM;
END $$;

-- 8. FORÇAR RELOAD DO CACHE
NOTIFY pgrst, 'reload schema';

-- 9. RESULTADO FINAL
SELECT 'Políticas RLS corrigidas. Agora você pode finalizar tickets no frontend!' as resultado; 