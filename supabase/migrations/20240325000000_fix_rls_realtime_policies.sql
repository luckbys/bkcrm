-- ===================================================================
-- CORREÇÃO DAS POLÍTICAS RLS PARA REALTIME - BKCRM
-- Criado em: 2024-03-25
-- Descrição: Corrige bloqueios RLS que impedem Realtime de funcionar
-- ===================================================================

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA CORREÇÃO
ALTER TABLE "public"."tickets" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" DISABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS ANTIGAS QUE PODEM ESTAR CONFLITANDO
DROP POLICY IF EXISTS "Users can read own tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "Users can read department tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "Admins can read all tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "Users can create tickets" ON "public"."tickets";
DROP POLICY IF EXISTS "Users can update own tickets" ON "public"."tickets";

DROP POLICY IF EXISTS "Users can read own messages" ON "public"."messages";
DROP POLICY IF EXISTS "Users can read ticket messages" ON "public"."messages";
DROP POLICY IF EXISTS "Users can create messages" ON "public"."messages";

DROP POLICY IF EXISTS "Users can read own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";

-- 3. REABILITAR RLS COM POLÍTICAS PERMISSIVAS PARA REALTIME
ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- POLÍTICAS PARA TABELA TICKETS (PERMISSIVAS PARA REALTIME)
-- ===================================================================

-- Leitura de tickets (MUITO PERMISSIVA para resolver Realtime)
CREATE POLICY "realtime_tickets_read" ON "public"."tickets"
FOR SELECT
TO authenticated
USING (true);

-- Criação de tickets
CREATE POLICY "realtime_tickets_create" ON "public"."tickets"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Atualização de tickets
CREATE POLICY "realtime_tickets_update" ON "public"."tickets"
FOR UPDATE
TO authenticated
USING (true);

-- ===================================================================
-- POLÍTICAS PARA TABELA MESSAGES (PERMISSIVAS PARA REALTIME)
-- ===================================================================

-- Leitura de mensagens
CREATE POLICY "realtime_messages_read" ON "public"."messages"
FOR SELECT
TO authenticated
USING (true);

-- Criação de mensagens
CREATE POLICY "realtime_messages_create" ON "public"."messages"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Atualização de mensagens
CREATE POLICY "realtime_messages_update" ON "public"."messages"
FOR UPDATE
TO authenticated
USING (true);

-- ===================================================================
-- POLÍTICAS PARA TABELA PROFILES (PERMISSIVAS PARA REALTIME)
-- ===================================================================

-- Leitura de perfis
CREATE POLICY "realtime_profiles_read" ON "public"."profiles"
FOR SELECT
TO authenticated
USING (true);

-- Atualização de perfis
CREATE POLICY "realtime_profiles_update" ON "public"."profiles"
FOR UPDATE
TO authenticated
USING (true);

-- ===================================================================
-- HABILITAR REALTIME NAS TABELAS (GARANTIR QUE ESTÁ ATIVO)
-- ===================================================================

-- Remover das publicações existentes (se existir)
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."tickets";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."messages";
ALTER PUBLICATION "supabase_realtime" DROP TABLE IF EXISTS "public"."profiles";

-- Adicionar novamente com configuração correta
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."tickets";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."messages";
ALTER PUBLICATION "supabase_realtime" ADD TABLE "public"."profiles";

-- ===================================================================
-- COMENTÁRIOS E LOGS
-- ===================================================================

-- Inserir log da migração
INSERT INTO "public"."system_logs" (
  "action",
  "details",
  "created_at"
) VALUES (
  'RLS_REALTIME_FIX',
  'Políticas RLS corrigidas para permitir funcionamento do Realtime',
  NOW()
) ON CONFLICT DO NOTHING;

-- ===================================================================
-- VERIFICAÇÃO DAS POLÍTICAS CRIADAS
-- ===================================================================

-- Comentário para verificação
/* 
VERIFICAR SE AS POLÍTICAS FORAM CRIADAS:

SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('tickets', 'messages', 'profiles', 'notifications')
ORDER BY tablename, policyname;

VERIFICAR PUBLICAÇÕES REALTIME:
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
*/ 