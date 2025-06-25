// 🔗 TESTE INTEGRAÇÃO WEBSOCKET + EVOLUTION API
// Execute no console: testEvolutionIntegration()

interface EvolutionTestResult {
  success: boolean;
  message: string;
  details?: any;
}

// Declarações globais para TypeScript
declare global {
  interface Window {
    chatStore?: {
      socket?: {
        connected: boolean;
      };
      init: () => void;
      join: (ticketId: string) => void;
      send: (ticketId: string, content: string, isInternal: boolean) => Promise<void>;
    };
    testEvolutionIntegration: (ticketId?: string) => Promise<EvolutionTestResult>;
    testInternalMessage: (ticketId?: string) => Promise<EvolutionTestResult>;
    checkEvolutionApiStatus: () => Promise<EvolutionTestResult>;
    testCompleteIntegration: () => Promise<EvolutionTestResult>;
  }
}

// Função para testar envio completo via WebSocket com Evolution API
async function testEvolutionIntegration(ticketId?: string): Promise<EvolutionTestResult> {
  try {
    console.log('🔗 [TESTE EVOLUTION] Iniciando teste de integração...');
    
    // Usar ticket padrão se não fornecido
    const testTicketId = ticketId || '84d758e1-fa68-450e-9de2-48d9826ea800';
    
    // 1. Verificar se há WebSocket conectado
    if (!window.chatStore?.socket) {
      console.log('🔌 [TESTE EVOLUTION] Inicializando WebSocket...');
      window.chatStore?.init();
      
      // Aguardar conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    if (!window.chatStore?.socket?.connected) {
      return {
        success: false,
        message: 'WebSocket não conectado. Verifique se o servidor está rodando na porta 4000.'
      };
    }
    
    console.log('✅ [TESTE EVOLUTION] WebSocket conectado');
    
    // 2. Conectar ao ticket específico
    console.log(`🎫 [TESTE EVOLUTION] Conectando ao ticket: ${testTicketId}`);
    window.chatStore?.join(testTicketId);
    
    // 3. Enviar mensagem de teste não interna (deve ir para WhatsApp)
    const testMessage = `🧪 Teste integração WebSocket + Evolution API - ${new Date().toLocaleString()}`;
    
    console.log('📨 [TESTE EVOLUTION] Enviando mensagem de teste...');
    await window.chatStore?.send(testTicketId, testMessage, false); // isInternal = false
    
    console.log('✅ [TESTE EVOLUTION] Mensagem enviada via WebSocket');
    console.log('⏳ [TESTE EVOLUTION] Aguarde os logs do servidor para verificar se chegou na Evolution API...');
    
    return {
      success: true,
      message: 'Teste enviado com sucesso! Verifique os logs do servidor WebSocket para confirmar envio Evolution API.',
      details: {
        ticketId: testTicketId,
        message: testMessage,
        isInternal: false,
        expectedLogs: [
          '📨 [WS-SEND] Processando envio',
          '🔗 [WS-SEND] Tentando enviar para WhatsApp via Evolution API',
          '📱 [WS-SEND] Enviando para WhatsApp',
          '✅ [WS-SEND] Mensagem enviada para WhatsApp'
        ]
      }
    };
    
  } catch (error) {
    console.error('❌ [TESTE EVOLUTION] Erro:', error);
    return {
      success: false,
      message: 'Erro no teste de integração',
      details: error
    };
  }
}

// Função para testar mensagem interna (NÃO deve ir para WhatsApp)
async function testInternalMessage(ticketId?: string): Promise<EvolutionTestResult> {
  try {
    console.log('🔒 [TESTE INTERNO] Testando mensagem interna...');
    
    const testTicketId = ticketId || '84d758e1-fa68-450e-9de2-48d9826ea800';
    
    if (!window.chatStore?.socket?.connected) {
      return {
        success: false,
        message: 'WebSocket não conectado'
      };
    }
    
    // Enviar mensagem interna
    const internalMessage = `🔒 Nota interna - teste ${new Date().toLocaleString()}`;
    
    console.log('📝 [TESTE INTERNO] Enviando nota interna...');
    await window.chatStore?.send(testTicketId, internalMessage, true); // isInternal = true
    
    return {
      success: true,
      message: 'Mensagem interna enviada. Deve aparecer apenas no sistema, NÃO no WhatsApp.',
      details: {
        ticketId: testTicketId,
        message: internalMessage,
        isInternal: true,
        expectedBehavior: 'Mensagem salva no banco + WebSocket, mas NÃO enviada para Evolution API'
      }
    };
    
  } catch (error) {
    console.error('❌ [TESTE INTERNO] Erro:', error);
    return {
      success: false,
      message: 'Erro no teste de mensagem interna',
      details: error
    };
  }
}

// Função para verificar status da Evolution API
async function checkEvolutionApiStatus(): Promise<EvolutionTestResult> {
  try {
    console.log('🔍 [CHECK API] Verificando status Evolution API...');
    
    const response = await fetch('http://localhost:4000/webhook/check-instance/atendimento-ao-cliente-suporte');
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ [CHECK API] Evolution API respondeu:', result);
      return {
        success: true,
        message: `Evolution API ativa. Instância: ${result.state}`,
        details: result
      };
    } else {
      console.error('❌ [CHECK API] Erro na Evolution API:', result);
      return {
        success: false,
        message: 'Evolution API com problemas',
        details: result
      };
    }
    
  } catch (error) {
    console.error('❌ [CHECK API] Erro ao verificar Evolution API:', error);
    return {
      success: false,
      message: 'Erro ao conectar com Evolution API. Verifique se o servidor está rodando.',
      details: error
    };
  }
}

// Função para teste completo
async function testCompleteIntegration(): Promise<EvolutionTestResult> {
  try {
    console.log('🚀 [TESTE COMPLETO] Iniciando teste completo da integração...');
    
    // 1. Verificar Evolution API
    const apiStatus = await checkEvolutionApiStatus();
    if (!apiStatus.success) {
      return {
        success: false,
        message: 'Evolution API não está funcionando',
        details: apiStatus
      };
    }
    
    // 2. Testar mensagem interna (não deve ir para WhatsApp)
    console.log('🔒 [TESTE COMPLETO] Testando mensagem interna...');
    await testInternalMessage();
    
    // Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Testar mensagem pública (deve ir para WhatsApp)
    console.log('📱 [TESTE COMPLETO] Testando mensagem pública...');
    const publicTest = await testEvolutionIntegration();
    
    return {
      success: true,
      message: 'Teste completo executado! Verifique os logs do servidor.',
      details: {
        apiStatus,
        publicTest,
        instructions: [
          '1. Verifique os logs do servidor WebSocket',
          '2. Procure por logs "📨 [WS-SEND]" e "🔗 [WS-SEND]"',
          '3. Confirme se mensagem chegou no WhatsApp do cliente',
          '4. Mensagem interna NÃO deve aparecer no WhatsApp'
        ]
      }
    };
    
  } catch (error) {
    console.error('❌ [TESTE COMPLETO] Erro:', error);
    return {
      success: false,
      message: 'Erro no teste completo',
      details: error
    };
  }
}

// Auto-exposição das funções
if (typeof window !== 'undefined') {
  window.testEvolutionIntegration = testEvolutionIntegration;
  window.testInternalMessage = testInternalMessage;
  window.checkEvolutionApiStatus = checkEvolutionApiStatus;
  window.testCompleteIntegration = testCompleteIntegration;
  
  console.log('🔗 [EVOLUTION INTEGRATION] Funções de teste disponíveis:');
  console.log('   testEvolutionIntegration("ticketId") - Testar envio para WhatsApp');
  console.log('   testInternalMessage("ticketId") - Testar mensagem interna');
  console.log('   checkEvolutionApiStatus() - Verificar status Evolution API');
  console.log('   testCompleteIntegration() - Teste completo da integração');
}

export { testEvolutionIntegration, testInternalMessage, checkEvolutionApiStatus, testCompleteIntegration }; 