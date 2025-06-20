// 🧪 SCRIPT DE TESTE WEBSOCKET SYSTEM
// Execute no console: testWebSocketSystem()

export const testWebSocketSystem = () => {
  console.log('🧪 [TEST] Iniciando teste do sistema WebSocket');
  
  // 1. Testar conexão com servidor
  const testConnection = async () => {
    try {
      const response = await fetch('http://localhost:4000/webhook/health');
      const data = await response.json();
      
      console.log('✅ [TEST] Servidor webhook ativo:', data);
      
      if (data.websocket?.enabled) {
        console.log('✅ [TEST] WebSocket habilitado');
        console.log(`📊 [TEST] Conexões ativas: ${data.websocket.connections}`);
        console.log(`🎫 [TEST] Tickets ativos: ${data.websocket.activeTickets}`);
      } else {
        console.error('❌ [TEST] WebSocket não habilitado no servidor');
      }
      
      return data.websocket?.enabled || false;
    } catch (error) {
      console.error('❌ [TEST] Erro ao conectar com servidor:', error);
      return false;
    }
  };

  // 2. Testar estatísticas WebSocket
  const testStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/webhook/ws-stats');
      const stats = await response.json();
      
      console.log('📊 [TEST] Estatísticas WebSocket:', stats);
      return stats;
    } catch (error) {
      console.error('❌ [TEST] Erro ao obter estatísticas:', error);
      return null;
    }
  };

  // 3. Testar payload webhook simulado
  const testWebhook = async () => {
    try {
      const testPayload = {
        event: 'MESSAGES_UPSERT',
        instance: 'test-instance',
        data: {
          key: {
            remoteJid: '5511999887766@s.whatsapp.net',
            fromMe: false,
            id: 'TEST_MESSAGE_' + Date.now()
          },
          pushName: 'Cliente Teste WebSocket',
          message: {
            conversation: 'Esta é uma mensagem de teste do sistema WebSocket!'
          },
          messageTimestamp: Math.floor(Date.now() / 1000)
        }
      };

      console.log('📤 [TEST] Enviando payload de teste...');
      
      const response = await fetch('http://localhost:4000/webhook/evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      const result = await response.json();
      console.log('✅ [TEST] Resultado do webhook:', result);
      
      if (result.websocket) {
        console.log('✅ [TEST] Mensagem transmitida via WebSocket');
      } else {
        console.log('⚠️ [TEST] Mensagem não transmitida via WebSocket');
      }
      
      return result;
    } catch (error) {
      console.error('❌ [TEST] Erro ao testar webhook:', error);
      return null;
    }
  };

  // 4. Executar todos os testes
  const runAllTests = async () => {
    console.log('🚀 [TEST] ========== TESTE COMPLETO WEBSOCKET ==========');
    
    // Teste 1: Conexão
    console.log('\n1️⃣ [TEST] Testando conexão...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ [TEST] Servidor não está rodando ou WebSocket desabilitado');
      console.log('💡 [TEST] Execute: cd backend/webhooks && node webhook-evolution-websocket.js');
      return false;
    }
    
    // Teste 2: Estatísticas
    console.log('\n2️⃣ [TEST] Testando estatísticas...');
    await testStats();
    
    // Teste 3: Webhook
    console.log('\n3️⃣ [TEST] Testando processamento de webhook...');
    await testWebhook();
    
    console.log('\n✅ [TEST] ========== TESTES CONCLUÍDOS ==========');
    console.log('💡 [TEST] Para testar frontend, abra o chat de um ticket');
    console.log('💡 [TEST] Verifique logs no console: 🔗 [WS] conectado');
    
    return true;
  };

  // Executar
  runAllTests();
};

// 🔧 Função para diagnosticar problemas
export const diagnoseWebSocketIssues = () => {
  console.log('🔍 [DIAGNOSE] Diagnosticando sistema WebSocket...');
  
  const checks = [
    {
      name: 'Servidor webhook rodando',
      test: () => fetch('http://localhost:4000/webhook/health').then(() => true).catch(() => false)
    },
    {
      name: 'Socket.io-client instalado',
      test: () => {
        try {
          // @ts-ignore
          return !!window.io || typeof require === 'function';
        } catch {
          return false;
        }
      }
    },
    {
      name: 'CORS configurado',
      test: () => fetch('http://localhost:4000/webhook/health', { 
        method: 'OPTIONS' 
      }).then(() => true).catch(() => false)
    }
  ];

  checks.forEach(async (check, index) => {
    try {
      const result = await check.test();
      console.log(`${result ? '✅' : '❌'} [DIAGNOSE] ${index + 1}. ${check.name}: ${result ? 'OK' : 'FALHOU'}`);
    } catch (error) {
      console.log(`❌ [DIAGNOSE] ${index + 1}. ${check.name}: ERRO - ${error}`);
    }
  });
};

// 📊 Função para monitorar WebSocket em tempo real
export const monitorWebSocket = () => {
  console.log('📊 [MONITOR] Iniciando monitoramento WebSocket...');
  
  const interval = setInterval(async () => {
    try {
      const response = await fetch('http://localhost:4000/webhook/ws-stats');
      const stats = await response.json();
      
      console.log(`📊 [MONITOR] ${new Date().toLocaleTimeString()} - Conexões: ${stats.totalConnections} | Tickets: ${stats.activeTickets}`);
      
      if (Object.keys(stats.connectionsByTicket).length > 0) {
        console.log('🎫 [MONITOR] Tickets ativos:', stats.connectionsByTicket);
      }
    } catch (error) {
      console.error('❌ [MONITOR] Erro ao monitorar:', error);
    }
  }, 5000);

  console.log('📊 [MONITOR] Monitoramento ativo (a cada 5s)');
  console.log('💡 [MONITOR] Para parar: clearInterval(' + interval + ')');
  
  return interval;
};

// Disponibilizar no window global para facilitar uso
if (typeof window !== 'undefined') {
  (window as any).testWebSocketSystem = testWebSocketSystem;
  (window as any).diagnoseWebSocketIssues = diagnoseWebSocketIssues;
  (window as any).monitorWebSocket = monitorWebSocket;
} 