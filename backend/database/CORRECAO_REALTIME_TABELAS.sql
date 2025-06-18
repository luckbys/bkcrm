-- =====================================================
-- 🔧 CORREÇÃO REALTIME - Habilitar Tabelas Faltantes
-- =====================================================
-- Este script adiciona as tabelas profiles e tickets 
-- à publicação do Realtime no Supabase
-- =====================================================

-- 📋 DIAGNÓSTICO ATUAL:
-- ✅ messages: Enabled
-- ❌ profiles: Not Enabled  
-- ❌ tickets: Not Enabled

-- 🚀 SOLUÇÃO: Adicionar tabelas faltantes à publicação

-- 1. Habilitar Realtime para a tabela 'tickets'
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- 2. Habilitar Realtime para a tabela 'profiles'  
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- 3. Verificar se há outras tabelas importantes que precisam ser adicionadas
-- (notifications, departments, etc.)

-- 4. Adicionar tabela notifications (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        RAISE NOTICE 'Tabela notifications adicionada ao Realtime';
    ELSE
        RAISE NOTICE 'Tabela notifications não existe, pulando...';
    END IF;
END
$$;

-- 5. Adicionar tabela departments (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
        RAISE NOTICE 'Tabela departments adicionada ao Realtime';
    ELSE
        RAISE NOTICE 'Tabela departments não existe, pulando...';
    END IF;
END
$$;

-- =====================================================
-- 🧪 VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas críticas estão habilitadas
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN tablename = ANY(
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'realtime'
    ) 
    THEN 'Enabled'
    ELSE 'Not Enabled'
  END as realtime_status,
  -- Verificação adicional pela publicação
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = pg_tables.tablename
    )
    THEN 'Published'
    ELSE 'Not Published'
  END as publication_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('tickets', 'messages', 'profiles', 'notifications', 'departments')
ORDER BY tablename;

-- =====================================================
-- 📝 COMANDOS DE TESTE APÓS EXECUÇÃO
-- =====================================================

-- Execute este comando no console do navegador para testar:
/*
console.log('🧪 Testando Realtime após correção...');

// Função de teste
window.testRealtimeAfterFix = async () => {
  try {
    console.log('📊 Verificando conexão Supabase...');
    
    // Testar se Supabase está conectado
    const { data: user } = await window.supabase.auth.getUser();
    console.log('👤 Usuário logado:', user?.user?.email || 'Nenhum');
    
    // Testar subscription nas tabelas críticas
    const testSubscription = window.supabase
      .channel('test-realtime-fix')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tickets' }, 
        (payload) => console.log('🎫 Evento tickets:', payload)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' }, 
        (payload) => console.log('👤 Evento profiles:', payload)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        (payload) => console.log('💬 Evento messages:', payload)
      )
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime funcionando! Tabelas habilitadas com sucesso.');
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ Erro na subscription do Realtime');
        }
      });
    
    // Aguardar conexão
    setTimeout(() => {
      console.log('🔌 Estado da conexão:', window.supabase.realtime.connectionState());
    }, 2000);
    
    return testSubscription;
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
};

// Executar teste
window.testRealtimeAfterFix();
*/

-- =====================================================
-- ✅ FINALIZAÇÃO
-- =====================================================

-- Mensagem de sucesso
SELECT 
  '🎉 Correção do Realtime concluída!' as status,
  'Execute a verificação final acima para confirmar' as next_step,
  'Todas as tabelas críticas foram adicionadas à publicação' as result; 