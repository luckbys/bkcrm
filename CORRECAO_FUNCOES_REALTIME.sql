-- =====================================================
-- 🔧 CORREÇÃO DAS FUNÇÕES REALTIME - BKCRM
-- =====================================================
-- Este script corrige os erros das funções que não foram criadas
-- Execute este script se receber erro "function does not exist"
-- =====================================================

-- 🧹 1. LIMPEZA DAS FUNÇÕES EXISTENTES
-- =====================================================

-- Remover funções que podem ter falhado na criação
DROP FUNCTION IF EXISTS public.check_realtime_config();
DROP FUNCTION IF EXISTS public.test_realtime_connection();
DROP FUNCTION IF EXISTS public.cleanup_test_data();
DROP VIEW IF EXISTS public.realtime_activity;

-- 🔍 2. RECRIAR FUNÇÃO DE VERIFICAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_realtime_config()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  tables_in_publication text[];
  rls_enabled_tables text[];
  publications_exist boolean := false;
BEGIN
  -- Verificar se a publicação supabase_realtime existe
  SELECT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) INTO publications_exist;
  
  IF NOT publications_exist THEN
    result := json_build_object(
      'error', 'supabase_realtime publication does not exist',
      'solution', 'Create publication first: CREATE PUBLICATION supabase_realtime;',
      'timestamp', now(),
      'status', 'error'
    );
    RETURN result;
  END IF;

  -- Verificar tabelas na publicação Realtime
  SELECT COALESCE(array_agg(schemaname || '.' || tablename), ARRAY[]::text[])
  INTO tables_in_publication
  FROM pg_publication_tables 
  WHERE pubname = 'supabase_realtime';
  
  -- Verificar tabelas com RLS habilitado
  SELECT COALESCE(array_agg(schemaname || '.' || tablename), ARRAY[]::text[])
  INTO rls_enabled_tables
  FROM pg_tables 
  WHERE schemaname = 'public' 
  AND rowsecurity = true;
  
  result := json_build_object(
    'realtime_publication', tables_in_publication,
    'rls_enabled_tables', rls_enabled_tables,
    'publication_exists', publications_exist,
    'timestamp', now(),
    'status', 'configured'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'error', SQLERRM,
      'timestamp', now(),
      'status', 'error'
    );
    RETURN result;
END;
$$;

-- 🧪 3. RECRIAR FUNÇÃO DE TESTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.test_realtime_connection()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  test_table_exists boolean := false;
BEGIN
  -- Verificar se a tabela notifications existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) INTO test_table_exists;
  
  IF NOT test_table_exists THEN
    result := json_build_object(
      'error', 'notifications table does not exist',
      'solution', 'Create notifications table first',
      'timestamp', now(),
      'status', 'error'
    );
    RETURN result;
  END IF;

  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    result := json_build_object(
      'error', 'User not authenticated',
      'solution', 'Login to test Realtime',
      'timestamp', now(),
      'status', 'error'
    );
    RETURN result;
  END IF;

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
    'user_id', auth.uid(),
    'status', 'success'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'error', SQLERRM,
      'timestamp', now(),
      'status', 'error'
    );
    RETURN result;
END;
$$;

-- 🧹 4. RECRIAR FUNÇÃO DE LIMPEZA
-- =====================================================

CREATE OR REPLACE FUNCTION public.cleanup_test_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count int := 0;
  result json;
BEGIN
  -- Verificar se usuário está autenticado
  IF auth.uid() IS NULL THEN
    result := json_build_object(
      'error', 'User not authenticated',
      'timestamp', now(),
      'status', 'error'
    );
    RETURN result;
  END IF;

  DELETE FROM "public"."notifications" 
  WHERE title = '🧪 Teste Realtime' 
  AND user_id = auth.uid();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  result := json_build_object(
    'success', true,
    'message', 'Dados de teste removidos',
    'deleted_notifications', deleted_count,
    'timestamp', now(),
    'status', 'success'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'error', SQLERRM,
      'timestamp', now(),
      'status', 'error'
    );
    RETURN result;
END;
$$;

-- 📊 5. RECRIAR VIEW DE MONITORAMENTO
-- =====================================================

CREATE OR REPLACE VIEW public.realtime_activity AS
SELECT 
  'messages' as table_name,
  COALESCE(COUNT(*), 0) as total_records,
  COALESCE(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour'), 0) as recent_records,
  MAX(created_at) as last_activity
FROM "public"."messages"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
UNION ALL
SELECT 
  'tickets' as table_name,
  COALESCE(COUNT(*), 0) as total_records,
  COALESCE(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour'), 0) as recent_records,
  MAX(created_at) as last_activity
FROM "public"."tickets"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets')
UNION ALL
SELECT 
  'notifications' as table_name,
  COALESCE(COUNT(*), 0) as total_records,
  COALESCE(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour'), 0) as recent_records,
  MAX(created_at) as last_activity
FROM "public"."notifications"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications');

-- 🔐 6. CRIAR TABELA NOTIFICATIONS SE NÃO EXISTIR
-- =====================================================

-- Criar tabela notifications se não existir (causa comum do erro)
CREATE TABLE IF NOT EXISTS "public"."notifications" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
  read boolean DEFAULT false,
  data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela notifications
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

-- Política para notifications (se não existir)
DROP POLICY IF EXISTS "notifications_select_policy" ON "public"."notifications";
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

DROP POLICY IF EXISTS "notifications_insert_policy" ON "public"."notifications";
CREATE POLICY "notifications_insert_policy" ON "public"."notifications"
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 📡 7. GARANTIR QUE TABELAS ESTÃO NA PUBLICAÇÃO REALTIME
-- =====================================================

-- Criar publicação se não existir
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- Adicionar tabelas à publicação (ignorar erros se já existirem)
DO $$ 
BEGIN
  -- Adicionar notifications à publicação
  BEGIN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."notifications";
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
  END;
  
  -- Adicionar outras tabelas importantes
  BEGIN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."messages";
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tickets";
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;
  
  BEGIN
    ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."profiles";
  EXCEPTION 
    WHEN duplicate_object THEN NULL;
    WHEN undefined_table THEN NULL;
  END;
END $$;

-- ✅ 8. GRANTS E PERMISSÕES
-- =====================================================

-- Garantir permissões para as funções
GRANT EXECUTE ON FUNCTION public.test_realtime_connection() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_test_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_realtime_config() TO authenticated;
GRANT SELECT ON public.realtime_activity TO authenticated;

-- 🧪 9. FUNÇÃO DE DIAGNÓSTICO COMPLETO
-- =====================================================

CREATE OR REPLACE FUNCTION public.diagnostic_realtime()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  user_authenticated boolean;
  tables_exist json;
  publications_exist boolean;
BEGIN
  -- Verificar autenticação
  user_authenticated := auth.uid() IS NOT NULL;
  
  -- Verificar se publicação existe
  SELECT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) INTO publications_exist;
  
  -- Verificar se tabelas principais existem
  SELECT json_build_object(
    'messages', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages'),
    'tickets', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets'),
    'notifications', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications'),
    'profiles', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
  ) INTO tables_exist;
  
  result := json_build_object(
    'user_authenticated', user_authenticated,
    'user_id', auth.uid(),
    'publication_exists', publications_exist,
    'tables_exist', tables_exist,
    'timestamp', now(),
    'status', CASE 
      WHEN user_authenticated AND publications_exist THEN 'ready'
      ELSE 'needs_setup'
    END
  );
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.diagnostic_realtime() TO authenticated;

-- =====================================================
-- ✅ CORREÇÃO CONCLUÍDA!
-- =====================================================

-- Agora teste executando:
-- SELECT public.diagnostic_realtime();
-- SELECT public.check_realtime_config();

-- ===================================================== 