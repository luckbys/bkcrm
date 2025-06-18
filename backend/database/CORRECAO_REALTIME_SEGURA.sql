-- =====================================================
-- 🔧 CORREÇÃO REALTIME SEGURA - Verificar Antes de Adicionar
-- =====================================================
-- Este script verifica primeiro se as tabelas já estão 
-- na publicação antes de tentar adicioná-las
-- =====================================================

-- 📊 DIAGNÓSTICO INICIAL: Verificar status atual
SELECT 
  schemaname,
  tablename,
  'Verificando...' as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tickets', 'messages', 'profiles', 'notifications', 'departments')
ORDER BY tablename;

-- =====================================================
-- 🛡️ ADIÇÃO SEGURA DAS TABELAS
-- =====================================================

-- 1. Adicionar tabela 'tickets' (se ainda não estiver)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'tickets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
        RAISE NOTICE '✅ Tabela tickets adicionada ao Realtime';
    ELSE
        RAISE NOTICE '⚠️ Tabela tickets já está na publicação Realtime';
    END IF;
END
$$;

-- 2. Adicionar tabela 'profiles' (se ainda não estiver)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
        RAISE NOTICE '✅ Tabela profiles adicionada ao Realtime';
    ELSE
        RAISE NOTICE '⚠️ Tabela profiles já está na publicação Realtime';
    END IF;
END
$$;

-- 3. Adicionar tabela 'messages' (se ainda não estiver)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        RAISE NOTICE '✅ Tabela messages adicionada ao Realtime';
    ELSE
        RAISE NOTICE '⚠️ Tabela messages já está na publicação Realtime';
    END IF;
END
$$;

-- 4. Adicionar tabela 'notifications' (se existir e não estiver na publicação)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'notifications'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'notifications'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
            RAISE NOTICE '✅ Tabela notifications adicionada ao Realtime';
        ELSE
            RAISE NOTICE '⚠️ Tabela notifications já está na publicação Realtime';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Tabela notifications não existe, pulando...';
    END IF;
END
$$;

-- 5. Adicionar tabela 'departments' (se existir e não estiver na publicação)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'departments'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
              AND schemaname = 'public' 
              AND tablename = 'departments'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
            RAISE NOTICE '✅ Tabela departments adicionada ao Realtime';
        ELSE
            RAISE NOTICE '⚠️ Tabela departments já está na publicação Realtime';
        END IF;
    ELSE
        RAISE NOTICE 'ℹ️ Tabela departments não existe, pulando...';
    END IF;
END
$$;

-- =====================================================
-- 📊 VERIFICAÇÃO FINAL COMPLETA
-- =====================================================

-- Verificar TODAS as tabelas na publicação Realtime
SELECT 
  '📋 TABELAS NA PUBLICAÇÃO REALTIME:' as title;

SELECT 
  schemaname as schema,
  tablename as tabela,
  '✅ Habilitado' as status_realtime
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- 🎯 VERIFICAÇÃO ESPECÍFICA DAS TABELAS CRÍTICAS
-- =====================================================

SELECT 
  '🎯 STATUS DAS TABELAS CRÍTICAS:' as title;

SELECT 
  tablename as tabela,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = pg_tables.tablename
    )
    THEN '✅ Enabled'
    ELSE '❌ Not Enabled'
  END as realtime_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = pg_tables.tablename
    )
    THEN '✅ Exists'
    ELSE '❌ Missing'
  END as table_exists
FROM (
  SELECT 'tickets' as tablename
  UNION SELECT 'messages'
  UNION SELECT 'profiles' 
  UNION SELECT 'notifications'
  UNION SELECT 'departments'
) as critical_tables
LEFT JOIN pg_tables ON pg_tables.tablename = critical_tables.tablename 
  AND pg_tables.schemaname = 'public'
ORDER BY critical_tables.tablename;

-- =====================================================
-- 🧪 COMANDO DE TESTE SIMPLIFICADO
-- =====================================================

-- Mensagem final
SELECT 
  '🎉 Verificação e correção do Realtime concluída!' as status,
  'Execute o teste no console do navegador para confirmar' as next_step;

-- =====================================================
-- 📝 TESTE NO CONSOLE DO NAVEGADOR
-- =====================================================

/*
Execute isso no console do navegador (F12) após executar este SQL:

console.log('🧪 Teste Realtime Simples...');

// Teste básico de conexão
const testConnection = async () => {
  try {
    // Verificar usuário logado
    const { data: user } = await window.supabase.auth.getUser();
    console.log('👤 Usuário:', user?.user?.email || 'Não logado');
    
    if (!user?.user) {
      console.log('❌ Faça login primeiro para testar o Realtime');
      return;
    }
    
    // Teste de subscription simples
    const subscription = window.supabase
      .channel('test-realtime-final')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        (payload) => console.log('💬 Evento messages:', payload.eventType)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        (payload) => console.log('🎫 Evento tickets:', payload.eventType)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        (payload) => console.log('👤 Evento profiles:', payload.eventType)
      )
      .subscribe((status) => {
        console.log('📡 Status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ REALTIME FUNCIONANDO! Todas as tabelas conectadas.');
        }
      });
    
    // Status da conexão após 3 segundos
    setTimeout(() => {
      console.log('🔌 Estado final:', window.supabase.realtime.connectionState());
    }, 3000);
    
    return subscription;
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
testConnection();
*/ 