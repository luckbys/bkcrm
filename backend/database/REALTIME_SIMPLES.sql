-- =====================================================
-- 🔧 REALTIME SIMPLES - BKCRM
-- =====================================================
-- Script simplificado e compatível com todas as versões
-- Execute UMA SEÇÃO POR VEZ para evitar erros
-- =====================================================

-- ⚠️ INSTRUÇÕES:
-- 1. Execute cada seção separadamente 
-- 2. Se der erro em uma seção, continue para a próxima
-- 3. No final, execute o teste de verificação

-- =====================================================
-- SEÇÃO 1: LIMPEZA (Execute primeiro)
-- =====================================================

DROP FUNCTION IF EXISTS public.check_realtime_config();
DROP FUNCTION IF EXISTS public.test_realtime_connection();
DROP FUNCTION IF EXISTS public.cleanup_test_data();
DROP FUNCTION IF EXISTS public.diagnostic_realtime();
DROP VIEW IF EXISTS public.realtime_activity;

-- =====================================================
-- SEÇÃO 2: CRIAR TABELA NOTIFICATIONS (se não existir)
-- =====================================================

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

ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SEÇÃO 3: CRIAR PUBLICAÇÃO (Execute e ignore erros)
-- =====================================================

-- TENTE EXECUTAR ESTE COMANDO:
-- Se der erro, ignore e continue

CREATE PUBLICATION supabase_realtime;

-- =====================================================
-- SEÇÃO 4: ADICIONAR TABELAS À PUBLICAÇÃO
-- =====================================================

-- Execute estes comandos um por vez:
-- Se algum der erro, ignore e continue para o próximo

ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."notifications";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."messages";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tickets";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."profiles";

-- =====================================================
-- SEÇÃO 5: CRIAR POLÍTICAS RLS
-- =====================================================

DROP POLICY IF EXISTS "notifications_select_policy" ON "public"."notifications";
CREATE POLICY "notifications_select_policy" ON "public"."notifications"
FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "notifications_insert_policy" ON "public"."notifications";
CREATE POLICY "notifications_insert_policy" ON "public"."notifications"
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- SEÇÃO 6: FUNÇÃO DE DIAGNÓSTICO
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
  user_authenticated := auth.uid() IS NOT NULL;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) INTO publications_exist;
  
  SELECT json_build_object(
    'notifications', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications'),
    'messages', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages'),
    'tickets', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets'),
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

-- =====================================================
-- SEÇÃO 7: FUNÇÃO DE TESTE
-- =====================================================

CREATE OR REPLACE FUNCTION public.test_realtime_connection()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  IF auth.uid() IS NULL THEN
    result := json_build_object(
      'error', 'User not authenticated',
      'solution', 'Login first',
      'status', 'error'
    );
    RETURN result;
  END IF;

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
    'Realtime funcionando!',
    'info',
    false,
    json_build_object('test', true)
  );
  
  result := json_build_object(
    'success', true,
    'message', 'Teste realizado com sucesso',
    'user_id', auth.uid(),
    'status', 'success'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'error', SQLERRM,
      'status', 'error'
    );
    RETURN result;
END;
$$;

-- =====================================================
-- SEÇÃO 8: PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION public.diagnostic_realtime() TO authenticated;
GRANT EXECUTE ON FUNCTION public.test_realtime_connection() TO authenticated;

-- =====================================================
-- ✅ TESTE FINAL
-- =====================================================

-- Execute este comando para testar:
-- SELECT public.diagnostic_realtime();

-- Se retornar "status": "ready", está funcionando!
-- Se não, verifique quais seções deram erro e tente novamente

-- ===================================================== 