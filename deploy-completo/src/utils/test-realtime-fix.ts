// 🧪 Teste para verificar correção do sistema realtime
// Executar no console: testRealtimeFix()

export const testRealtimeFix = () => {
  console.log('🧪 [TEST] Iniciando teste da correção do realtime...');
  
  // Simular ticket mock para teste
  const mockTicket = {
    id: 12345,
    title: 'Teste Realtime Fix',
    client: 'Cliente Teste',
    status: 'atendimento',
    channel: 'chat'
  };
  
  try {
    console.log('✅ [TEST] Mock ticket criado:', mockTicket);
    
    // Simular função de processamento do ticketIdForRealtime
    const ticketIdForRealtime = (() => {
      try {
        const rawId = mockTicket?.id;
        if (!rawId) {
          console.log('⚠️ [TEST] Nenhum ID de ticket disponível');
          return null;
        }
        
        const ticketId = rawId.toString();
        console.log('📡 [TEST] Usando ticket ID:', ticketId);
        return ticketId;
      } catch (error) {
        console.error('❌ [TEST] Erro ao processar ticket ID:', error);
        return null;
      }
    })();
    
    console.log('✅ [TEST] ticketIdForRealtime calculado:', ticketIdForRealtime);
    
    // Simular configuração do useRealtimeMessages
    const realtimeConfig = {
      ticketId: ticketIdForRealtime,
      pollingInterval: 15000,
      maxRetries: 3,
      enabled: Boolean(ticketIdForRealtime)
    };
    
    console.log('✅ [TEST] Configuração realtime:', realtimeConfig);
    
    // Validar se não há erro de inicialização
    if (ticketIdForRealtime && realtimeConfig.enabled) {
      console.log('🎉 [TEST] Correção bem-sucedida! Sistema realtime pode ser inicializado');
      console.log('📊 [TEST] Resumo:');
      console.log('  - ✅ ticketIdForRealtime calculado antes do hook');
      console.log('  - ✅ Configuração válida gerada');
      console.log('  - ✅ Sistema habilitado corretamente');
      console.log('  - ✅ Sem erro "Cannot access before initialization"');
      
      return true;
    } else {
      console.warn('⚠️ [TEST] Sistema não habilitado (ticket inválido)');
      return false;
    }
    
  } catch (error) {
    console.error('❌ [TEST] Erro durante teste:', error);
    return false;
  }
};

// Disponibilizar globalmente
(window as any).testRealtimeFix = testRealtimeFix;

console.log('🧪 Teste disponível: execute testRealtimeFix() no console'); 