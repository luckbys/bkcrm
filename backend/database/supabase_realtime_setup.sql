-- =====================================================
-- 📡 CONFIGURAÇÃO REALTIME SUPABASE - BKCRM
-- =====================================================
-- Este script configura todas as tabelas e políticas
-- necessárias para o funcionamento do Realtime no BKCRM
-- =====================================================

-- 🔧 1. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS nas tabelas críticas
ALTER TABLE IF EXISTS "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "public"."webhook_responses" ENABLE ROW LEVEL SECURITY;

-- 📡 2. ADICIONAR TABELAS À PUBLICAÇÃO REALTIME
-- =====================================================

-- Remover tabelas da publicação (caso já existam)
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."messages";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."tickets";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."profiles";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."notifications";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."departments";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."webhook_responses";

-- Adicionar tabelas à publicação Realtime
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."messages";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tickets";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."profiles";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."notifications";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."departments";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."webhook_responses";

-- 🔐 3. POLÍTICAS RLS PARA MESSAGES
-- =====================================================

-- Limpar políticas existentes
DROP POLICY IF EXISTS "messages_select_policy" ON "public"."messages";
DROP POLICY IF EXISTS "messages_insert_policy" ON "public"."messages";
DROP POLICY IF EXISTS "messages_update_policy" ON "public"."messages";
DROP POLICY IF EXISTS "messages_delete_policy" ON "public"."messages";

-- Política SELECT: Usuários podem ver mensagens de tickets do seu departamento ou que são responsáveis
CREATE POLICY "messages_select_policy" ON "public"."messages"
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    -- Admin pode ver tudo
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Usuário pode ver mensagens de tickets do seu departamento
    EXISTS (
      SELECT 1 FROM "public"."tickets" t
      JOIN "public"."profiles" p ON p.id = auth.uid()
      WHERE t.id = ticket_id 
      AND (t.assigned_to = auth.uid() OR p.department = t.department OR t.customer_id = auth.uid())
    )
    OR
    -- Mensagens criadas pelo próprio usuário
    sender_id = auth.uid()
  )
);

-- Política INSERT: Usuários autenticados podem inserir mensagens
CREATE POLICY "messages_insert_policy" ON "public"."messages"
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    sender_id = auth.uid() OR sender_id IS NULL -- Mensagens de webhook podem ter sender_id NULL
  )
);

-- Política UPDATE: Usuários podem atualizar mensagens que criaram ou admins
CREATE POLICY "messages_update_policy" ON "public"."messages"
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- 🔐 4. POLÍTICAS RLS PARA TICKETS
-- =====================================================

-- Limpar políticas existentes
DROP POLICY IF EXISTS "tickets_select_policy" ON "public"."tickets";
DROP POLICY IF EXISTS "tickets_insert_policy" ON "public"."tickets";
DROP POLICY IF EXISTS "tickets_update_policy" ON "public"."tickets";

-- Política SELECT: Usuários podem ver tickets do seu departamento ou que são responsáveis
CREATE POLICY "tickets_select_policy" ON "public"."tickets"
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    -- Admin pode ver tudo
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Usuário pode ver tickets do seu departamento
    EXISTS (
      SELECT 1 FROM "public"."profiles" p
      WHERE p.id = auth.uid() 
      AND (p.department = department OR department IS NULL)
    )
    OR
    -- Tickets atribuídos ao usuário
    assigned_to = auth.uid()
    OR
    -- Cliente pode ver seus próprios tickets
    customer_id = auth.uid()
  )
);

-- Política INSERT: Usuários autenticados podem criar tickets
CREATE POLICY "tickets_insert_policy" ON "public"."tickets"
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Política UPDATE: Usuários podem atualizar tickets do seu departamento ou que são responsáveis
CREATE POLICY "tickets_update_policy" ON "public"."tickets"
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    -- Admin pode atualizar tudo
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Usuário pode atualizar tickets do seu departamento
    EXISTS (
      SELECT 1 FROM "public"."profiles" p
      WHERE p.id = auth.uid() 
      AND (p.department = department OR department IS NULL)
    )
    OR
    -- Tickets atribuídos ao usuário
    assigned_to = auth.uid()
  )
);

-- 🔐 5. POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Limpar políticas existentes
DROP POLICY IF EXISTS "profiles_select_policy" ON "public"."profiles";
DROP POLICY IF EXISTS "profiles_update_policy" ON "public"."profiles";

-- Política SELECT: Usuários podem ver perfis básicos
CREATE POLICY "profiles_select_policy" ON "public"."profiles"
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    -- Usuário pode ver seu próprio perfil
    id = auth.uid()
    OR
    -- Admin pode ver todos os perfis
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Usuários podem ver perfis básicos de outros (nome, departamento)
    true
  )
);

-- Política UPDATE: Usuários podem atualizar seu próprio perfil ou admins
CREATE POLICY "profiles_update_policy" ON "public"."profiles"
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- 🔐 6. POLÍTICAS RLS PARA NOTIFICATIONS
-- =====================================================

-- Limpar políticas existentes
DROP POLICY IF EXISTS "notifications_select_policy" ON "public"."notifications";
DROP POLICY IF EXISTS "notifications_insert_policy" ON "public"."notifications";
DROP POLICY IF EXISTS "notifications_update_policy" ON "public"."notifications";
DROP POLICY IF EXISTS "notifications_delete_policy" ON "public"."notifications";

-- Política SELECT: Usuários podem ver suas próprias notificações
CREATE POLICY "notifications_select_policy" ON "public"."notifications"
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Política INSERT: Sistema pode criar notificações
CREATE POLICY "notifications_insert_policy" ON "public"."notifications"
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Política UPDATE: Usuários podem atualizar suas notificações
CREATE POLICY "notifications_update_policy" ON "public"."notifications"
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Política DELETE: Usuários podem deletar suas notificações
CREATE POLICY "notifications_delete_policy" ON "public"."notifications"
FOR DELETE USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- 🔐 7. POLÍTICAS RLS PARA DEPARTMENTS
-- =====================================================

-- Limpar políticas existentes
DROP POLICY IF EXISTS "departments_select_policy" ON "public"."departments";
DROP POLICY IF EXISTS "departments_insert_policy" ON "public"."departments";
DROP POLICY IF EXISTS "departments_update_policy" ON "public"."departments";

-- Política SELECT: Todos usuários autenticados podem ver departamentos
CREATE POLICY "departments_select_policy" ON "public"."departments"
FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Política INSERT/UPDATE: Apenas admins podem gerenciar departamentos
CREATE POLICY "departments_insert_policy" ON "public"."departments"
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM "public"."profiles" 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "departments_update_policy" ON "public"."departments"
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM "public"."profiles" 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 🔐 8. POLÍTICAS RLS PARA WEBHOOK_RESPONSES
-- =====================================================

-- Limpar políticas existentes
DROP POLICY IF EXISTS "webhook_responses_select_policy" ON "public"."webhook_responses";
DROP POLICY IF EXISTS "webhook_responses_insert_policy" ON "public"."webhook_responses";

-- Política SELECT: Usuários podem ver respostas de webhooks relacionadas aos seus tickets
CREATE POLICY "webhook_responses_select_policy" ON "public"."webhook_responses"
FOR SELECT USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM "public"."profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    EXISTS (
      SELECT 1 FROM "public"."tickets" t
      JOIN "public"."profiles" p ON p.id = auth.uid()
      WHERE t.id::text = "ticketId"
      AND (t.assigned_to = auth.uid() OR p.department = t.department)
    )
  )
);

-- Política INSERT: Sistema pode inserir respostas de webhook
CREATE POLICY "webhook_responses_insert_policy" ON "public"."webhook_responses"
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
);

-- 🧪 9. FUNÇÕES DE TESTE REALTIME
-- =====================================================

-- Função para testar se Realtime está funcionando
CREATE OR REPLACE FUNCTION public.test_realtime_connection()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Inserir uma notificação de teste
  INSERT INTO "public"."notifications" (
    user_id,
    title,
    message,
    type,
    read,
    data
  ) VALUES (
    auth.uid(),
    '🧪 Teste Realtime',
    'Se você recebeu esta notificação, o Realtime está funcionando!',
    'info',
    false,
    json_build_object('test', true, 'timestamp', now())
  );
  
  result := json_build_object(
    'success', true,
    'message', 'Notificação de teste enviada via Realtime',
    'timestamp', now(),
    'user_id', auth.uid()
  );
  
  RETURN result;
END;
$$;

-- Função para limpar dados de teste
CREATE OR REPLACE FUNCTION public.cleanup_test_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM "public"."notifications" 
  WHERE title = '🧪 Teste Realtime' 
  AND user_id = auth.uid();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Dados de teste removidos',
    'deleted_notifications', deleted_count
  );
END;
$$;

-- 📊 10. VIEWS PARA MONITORAMENTO
-- =====================================================

-- View para monitorar atividade Realtime
CREATE OR REPLACE VIEW public.realtime_activity AS
SELECT 
  'messages' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as recent_records,
  MAX(created_at) as last_activity
FROM "public"."messages"
UNION ALL
SELECT 
  'tickets' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as recent_records,
  MAX(created_at) as last_activity
FROM "public"."tickets"
UNION ALL
SELECT 
  'notifications' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as recent_records,
  MAX(created_at) as last_activity
FROM "public"."notifications";

-- 🔍 11. VERIFICAÇÕES DE CONFIGURAÇÃO
-- =====================================================

-- Função para verificar configuração do Realtime
CREATE OR REPLACE FUNCTION public.check_realtime_config()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  tables_in_publication text[];
  rls_enabled_tables text[];
BEGIN
  -- Verificar tabelas na publicação Realtime
  SELECT array_agg(schemaname || '.' || tablename)
  INTO tables_in_publication
  FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime';
  
  -- Verificar tabelas com RLS habilitado
  SELECT array_agg(schemaname || '.' || tablename)
  INTO rls_enabled_tables
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND rowsecurity = true;
  
  result := json_build_object(
    'realtime_publication', tables_in_publication,
    'rls_enabled_tables', rls_enabled_tables,
    'timestamp', now(),
    'status', 'configured'
  );
  
  RETURN result;
END;
$$;

-- ✅ 12. GRANTS E PERMISSÕES
-- =====================================================

-- Garantir que authenticated users podem usar as funções
GRANT EXECUTE ON FUNCTION public.test_realtime_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_test_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_realtime_config() TO authenticated;

-- Permitir SELECT na view de monitoramento
GRANT SELECT ON public.realtime_activity TO authenticated;

-- =====================================================
-- 🎉 CONFIGURAÇÃO REALTIME CONCLUÍDA!
-- =====================================================

-- Para testar se está funcionando, execute no console do seu app:
-- SELECT public.test_realtime_connection();
-- SELECT public.check_realtime_config();

-- =====================================================
-- 📝 NOTAS IMPORTANTES:
-- =====================================================
-- 1. Execute este script no SQL Editor do Supabase
-- 2. Verifique se todas as tabelas existem antes de executar
-- 3. Teste a conexão Realtime após executar
-- 4. Monitor o Realtime Inspector no dashboard do Supabase
-- ===================================================== 