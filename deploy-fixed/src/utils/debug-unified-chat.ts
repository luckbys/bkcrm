// 🔧 Debug e Teste do UnifiedChatModal
// Para usar: Execute debugUnifiedChat() no console do navegador

export interface DebugResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

// 🎯 Função principal de debug
declare global {
  interface Window {
    debugUnifiedChat: () => void;
    testWebSocketConnection: () => Promise<DebugResult>;
    testMessageSending: (ticketId: string, message: string) => Promise<DebugResult>;
    simulateClientMessage: (ticketId: string, clientName?: string) => void;
    forceChatReload: (ticketId: string) => void;
    debugChatState: () => void;
  }
}

// 🔗 Função para testar conexão WebSocket
const testWebSocketConnection = async (): Promise<DebugResult> => {
  try {
    console.log('🔗 [DEBUG] Testando conexão WebSocket...');
    
    // Verificar se o chatStore está disponível
    const chatStore = (window as any).useChatStore?.getState?.();
    if (!chatStore) {
      return {
        success: false,
        error: 'ChatStore não encontrado',
        timestamp: new Date()
      };
    }

    console.log('📊 [DEBUG] Estado atual do chat:', {
      isConnected: chatStore.isConnected,
      isLoading: chatStore.isLoading,
      isSending: chatStore.isSending,
      error: chatStore.error,
      messageCount: Object.keys(chatStore.messages).length,
      tickets: Object.keys(chatStore.messages)
    });

    // Tentar inicializar se não conectado
    if (!chatStore.isConnected) {
      console.log('🔄 [DEBUG] Tentando conectar...');
      chatStore.init();
      
      // Aguardar um pouco para conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newState = chatStore;
      console.log('✅ [DEBUG] Estado após tentativa de conexão:', {
        isConnected: newState.isConnected,
        error: newState.error
      });
    }

    return {
      success: chatStore.isConnected,
      data: {
        status: chatStore.isConnected ? 'Conectado' : 'Desconectado',
        error: chatStore.error,
        tickets: Object.keys(chatStore.messages)
      },
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao testar WebSocket:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date()
    };
  }
};

// 📤 Função para testar envio de mensagens
const testMessageSending = async (ticketId: string, message: string): Promise<DebugResult> => {
  try {
    console.log(`📤 [DEBUG] Testando envio de mensagem para ticket ${ticketId}...`);
    
    const chatStore = (window as any).useChatStore?.getState?.();
    if (!chatStore) {
      throw new Error('ChatStore não encontrado');
    }

    if (!chatStore.isConnected) {
      throw new Error('WebSocket não conectado');
    }

    // Enviar mensagem
    await chatStore.send(ticketId, message, false);
    
    console.log('✅ [DEBUG] Mensagem enviada com sucesso');
    
    // Verificar se mensagem foi adicionada
    const messages = chatStore.messages[ticketId] || [];
    const lastMessage = messages[messages.length - 1];
    
    return {
      success: true,
      data: {
        messagesSent: true,
        lastMessage: lastMessage,
        totalMessages: messages.length
      },
      timestamp: new Date()
    };
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao enviar mensagem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao enviar',
      timestamp: new Date()
    };
  }
};

// 🎭 Simular mensagem do cliente
const simulateClientMessage = (ticketId: string, clientName: string = 'Cliente Teste') => {
  try {
    console.log(`🎭 [DEBUG] Simulando mensagem do cliente para ticket ${ticketId}...`);
    
    const chatStore = (window as any).useChatStore?.getState?.();
    if (!chatStore?.socket) {
      console.error('❌ Socket não disponível');
      return;
    }

    // Simular mensagem chegando via WebSocket
    const mockMessage = {
      id: `mock-client-${Date.now()}`,
      ticket_id: ticketId,
      ticketId: ticketId,
      content: `Olá! Esta é uma mensagem de teste do cliente. ${new Date().toLocaleTimeString()}`,
      sender_name: clientName,
      sender_id: null, // null = cliente
      is_internal: false,
      created_at: new Date().toISOString()
    };

    // Emitir evento como se fosse o servidor
    chatStore.socket.emit('new-message', mockMessage);
    
    console.log('✅ [DEBUG] Mensagem do cliente simulada:', mockMessage);
    
    // Verificar se foi adicionada
    setTimeout(() => {
      const messages = chatStore.messages[ticketId] || [];
      console.log(`📊 [DEBUG] Total de mensagens após simulação: ${messages.length}`);
    }, 1000);
    
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao simular mensagem:', error);
  }
};

// 🔄 Forçar reload do chat
const forceChatReload = (ticketId: string) => {
  try {
    console.log(`🔄 [DEBUG] Forçando reload do ticket ${ticketId}...`);
    
    const chatStore = (window as any).useChatStore?.getState?.();
    if (!chatStore) {
      console.error('❌ ChatStore não encontrado');
      return;
    }

    // Entrar no ticket e carregar mensagens
    if (chatStore.isConnected) {
      chatStore.join(ticketId);
      chatStore.load(ticketId);
      console.log('✅ [DEBUG] Reload iniciado');
    } else {
      console.log('🔄 [DEBUG] Não conectado, tentando inicializar...');
      chatStore.init();
      setTimeout(() => {
        if (chatStore.isConnected) {
          chatStore.join(ticketId);
          chatStore.load(ticketId);
        }
      }, 2000);
    }
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao forçar reload:', error);
  }
};

// 📊 Debug do estado do chat
const debugChatState = () => {
  try {
    console.log('📊 [DEBUG] Estado detalhado do chat:');
    
    const chatStore = (window as any).useChatStore?.getState?.();
    if (!chatStore) {
      console.error('❌ ChatStore não encontrado');
      return;
    }

    const state = {
      connection: {
        isConnected: chatStore.isConnected,
        isLoading: chatStore.isLoading,
        isSending: chatStore.isSending,
        error: chatStore.error,
        socketExists: !!chatStore.socket
      },
      messages: Object.entries(chatStore.messages).map(([ticketId, messages]) => {
        const messageArray = messages as any[];
        return {
          ticketId,
          count: messageArray.length,
          lastMessage: messageArray.length > 0 ? messageArray[messageArray.length - 1] : null
        };
      }),
      store: chatStore
    };

    console.table(state.connection);
    console.table(state.messages);
    console.log('🔧 [DEBUG] Store completo:', state.store);

    return state;
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao debug state:', error);
  }
};

// 🎯 Função principal de debug
const debugUnifiedChat = () => {
  console.log('🧪 [DEBUG] === DEBUG UNIFIED CHAT MODAL ===');
  console.log('');
  
  console.log('📋 [DEBUG] Funções disponíveis:');
  console.log('  🔗 testWebSocketConnection() - Testa conexão');
  console.log('  📤 testMessageSending(ticketId, message) - Testa envio');
  console.log('  🎭 simulateClientMessage(ticketId, clientName?) - Simula mensagem cliente');
  console.log('  🔄 forceChatReload(ticketId) - Força reload');
  console.log('  📊 debugChatState() - Estado detalhado');
  console.log('');
  
  // Testar conexão automaticamente
  testWebSocketConnection().then(result => {
    if (result.success) {
      console.log('✅ [DEBUG] Conexão WebSocket OK!');
      console.log('📊 [DEBUG] Dados:', result.data);
    } else {
      console.log('❌ [DEBUG] Problema na conexão:', result.error);
    }
  });
  
  // Debug do estado atual
  debugChatState();
  
  console.log('');
  console.log('💡 [DEBUG] Exemplos de uso:');
  console.log('  simulateClientMessage("1807441290", "João Silva")');
  console.log('  testMessageSending("1807441290", "Olá, mensagem de teste!")');
  console.log('  forceChatReload("1807441290")');
  console.log('');
};

// 🌐 Expor funções globalmente
if (typeof window !== 'undefined') {
  window.debugUnifiedChat = debugUnifiedChat;
  window.testWebSocketConnection = testWebSocketConnection;
  window.testMessageSending = testMessageSending;
  window.simulateClientMessage = simulateClientMessage;
  window.forceChatReload = forceChatReload;
  window.debugChatState = debugChatState;
} 