// 🔧 Script de Debug - Mensagens do Cliente
// Execute no console do navegador para debugar problemas

console.log('🚀 Script de debug de mensagens carregado!');

// 1. Verificar se o store existe
const chatStore = window.useChatStore?.getState?.();
if (!chatStore) {
  console.error('❌ ChatStore não encontrado!');
} else {
  console.log('✅ ChatStore encontrado:', chatStore);
}

// 2. Função para debugar estado atual
function debugChatState() {
  const store = window.useChatStore?.getState?.();
  if (!store) return;

  console.log('📊 Estado atual do chat:', {
    isConnected: store.isConnected,
    isLoading: store.isLoading,
    error: store.error,
    messageKeys: Object.keys(store.messages),
    totalMessages: Object.values(store.messages).reduce((total, msgs) => total + msgs.length, 0)
  });

  // Mostrar mensagens por ticket
  Object.entries(store.messages).forEach(([ticketId, messages]) => {
    console.log(`📋 Ticket ${ticketId}: ${messages.length} mensagens`);
    messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. [${msg.sender}] ${msg.content.substring(0, 50)}...`);
    });
  });
}

// 3. Função para simular mensagem do cliente
function simulateClientMessage(ticketId, content = 'Mensagem de teste do cliente') {
  const store = window.useChatStore?.getState?.();
  if (!store || !store.socket) {
    console.error('❌ Socket não disponível');
    return;
  }

  const mockMessage = {
    id: `test-${Date.now()}`,
    ticket_id: ticketId,
    ticketId: ticketId,
    content: content,
    sender_name: 'Cliente Teste',
    sender: 'client',
    is_internal: false,
    created_at: new Date().toISOString()
  };

  // Simular evento new-message
  store.socket.emit('new-message', mockMessage);
  console.log('✅ Mensagem simulada enviada:', mockMessage);

  // Verificar após 1 segundo
  setTimeout(() => {
    const newState = window.useChatStore?.getState?.();
    const messages = newState?.messages[ticketId] || [];
    console.log(`📊 Mensagens após simulação: ${messages.length}`);
  }, 1000);
}

// 4. Função para forçar reload de mensagens
function forceReloadMessages(ticketId) {
  const store = window.useChatStore?.getState?.();
  if (!store) {
    console.error('❌ Store não disponível');
    return;
  }

  console.log(`🔄 Forçando reload para ticket ${ticketId}...`);
  store.load(ticketId);

  setTimeout(() => {
    const messages = store.messages[ticketId] || [];
    console.log(`📊 Mensagens após reload: ${messages.length}`);
  }, 2000);
}

// 5. Monitorar mudanças no store
let lastMessageCount = 0;
function startMonitoring(ticketId) {
  console.log(`👁️ Iniciando monitoramento para ticket ${ticketId}...`);
  
  const checkInterval = setInterval(() => {
    const store = window.useChatStore?.getState?.();
    if (!store) return;

    const messages = store.messages[ticketId] || [];
    const currentCount = messages.length;

    if (currentCount !== lastMessageCount) {
      console.log(`📈 Mudança detectada: ${lastMessageCount} → ${currentCount} mensagens`);
      lastMessageCount = currentCount;
      
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        console.log(`📨 Última mensagem: [${lastMsg.sender}] ${lastMsg.content.substring(0, 50)}...`);
      }
    }
  }, 1000);

  // Parar após 30 segundos
  setTimeout(() => {
    clearInterval(checkInterval);
    console.log('⏹️ Monitoramento finalizado');
  }, 30000);

  return checkInterval;
}

// Exportar funções para uso no console
window.debugChat = {
  // Debug do estado atual
  debugState: () => {
    console.log('=== DEBUG ESTADO CHAT ===');
    
    // Verificar se o UnifiedChatModal está aberto
    const modal = document.querySelector('[role="dialog"]');
    console.log('Modal aberto:', !!modal);
    
    // Debug do chatStore
    if (window.useChatStore) {
      const state = window.useChatStore.getState();
      console.log('ChatStore State:', {
        isConnected: state.isConnected,
        isLoading: state.isLoading,
        error: state.error,
        totalTickets: Object.keys(state.messages).length,
        messages: state.messages,
        socket: !!state.socket
      });
    }
    
    // Debug do WebSocket
    if (window.io) {
      console.log('Socket.IO disponível:', !!window.io);
    }
    
    // Debug função global debugUnifiedChat
    if (window.debugUnifiedChat) {
      console.log('=== DEBUG UNIFIED CHAT ===');
      window.debugUnifiedChat();
    } else {
      console.log('⚠️ debugUnifiedChat não disponível (modal fechado?)');
    }
  },

  // Simular mensagem do cliente
  simulateMessage: (ticketId, content = 'Mensagem de teste do cliente') => {
    console.log(`🧪 Simulando mensagem do cliente para ticket ${ticketId}`);
    
    if (window.useChatStore) {
      const state = window.useChatStore.getState();
      if (state.socket && state.isConnected) {
        // Simular evento new-message como se viesse do webhook
        const mockMessage = {
          id: `test-${Date.now()}`,
          ticket_id: ticketId,
          content: content,
          sender_id: null, // cliente
          sender_name: 'Cliente Teste',
          is_internal: false,
          created_at: new Date().toISOString(),
          type: 'text'
        };
        
        console.log('📨 Simulando new-message:', mockMessage);
        state.socket.emit('new-message', mockMessage);
        
        // Também disparar o evento diretamente para teste
        state.socket._callbacks['$new-message']?.forEach(callback => {
          callback(mockMessage);
        });
      } else {
        console.error('❌ Socket não conectado');
      }
    }
  },

  // Forçar reload de mensagens
  forceReload: (ticketId) => {
    console.log(`🔄 Forçando reload para ticket ${ticketId}`);
    
    if (window.useChatStore) {
      const state = window.useChatStore.getState();
      state.load(ticketId);
    }
    
    // Também tentar debugUnifiedChat se disponível
    if (window.debugUnifiedChat) {
      window.debugUnifiedChat();
    }
  },

  // Verificar conexão WebSocket
  checkConnection: () => {
    console.log('🔍 Verificando conexão WebSocket...');
    
    if (window.useChatStore) {
      const state = window.useChatStore.getState();
      console.log('Estado da conexão:', {
        isConnected: state.isConnected,
        socketExists: !!state.socket,
        socketConnected: state.socket?.connected,
        socketId: state.socket?.id,
        error: state.error
      });
      
      if (state.socket) {
        console.log('Socket details:', {
          readyState: state.socket.readyState,
          transport: state.socket.io?.engine?.transport?.name,
          url: state.socket.io?.uri
        });
      }
    }
  },

  // Monitor mudanças por 30 segundos
  startMonitor: (ticketId) => {
    console.log(`📊 Iniciando monitor para ticket ${ticketId} por 30 segundos...`);
    
    let count = 0;
    const interval = setInterval(() => {
      count++;
      console.log(`📊 Monitor ${count}/30:`);
      
      if (window.useChatStore) {
        const state = window.useChatStore.getState();
        const messages = state.messages[ticketId] || [];
        console.log(`   Mensagens: ${messages.length}`);
        console.log(`   Conectado: ${state.isConnected}`);
        console.log(`   Loading: ${state.isLoading}`);
        
        if (messages.length > 0) {
          console.log(`   Última: ${messages[messages.length - 1]?.content?.substring(0, 30)}`);
        }
      }
      
      if (count >= 30) {
        clearInterval(interval);
        console.log('📊 Monitor finalizado');
      }
    }, 1000);
    
    return interval;
  },

  // Testar conectividade com servidor
  testServer: async () => {
    console.log('🌐 Testando conectividade com servidor...');
    
    const urls = [
      'http://localhost:4000/webhook/health',
      'https://bkcrm.devsible.com.br/webhook/health',
      'https://websocket.bkcrm.devsible.com.br/webhook/health'
    ];
    
    for (const url of urls) {
      try {
        console.log(`Testando ${url}...`);
        const response = await fetch(url);
        const data = await response.json();
        console.log(`✅ ${url}:`, data);
      } catch (error) {
        console.log(`❌ ${url}:`, error.message);
      }
    }
  },

  // Conectar manualmente ao WebSocket
  manualConnect: () => {
    console.log('🔌 Forçando conexão manual...');
    
    if (window.useChatStore) {
      const state = window.useChatStore.getState();
      
      // Desconectar se já conectado
      if (state.socket) {
        state.disconnect();
        setTimeout(() => {
          state.init();
        }, 1000);
      } else {
        state.init();
      }
    }
  },

  // Limpar estado e reconectar
  reset: () => {
    console.log('🔄 Resetando sistema de chat...');
    
    if (window.useChatStore) {
      const state = window.useChatStore.getState();
      state.disconnect();
      
      setTimeout(() => {
        console.log('🔄 Reiniciando conexão...');
        state.init();
      }, 2000);
    }
  }
};

console.log(`
🎯 Funções disponíveis:
- debugChat.debugState() - Mostrar estado atual
- debugChat.simulateMessage(ticketId, content) - Simular mensagem do cliente
- debugChat.forceReload(ticketId) - Forçar reload das mensagens
- debugChat.startMonitor(ticketId) - Monitorar mudanças por 30s
- debugChat.testServer() - Testar conectividade com servidor
- debugChat.manualConnect() - Conectar manualmente ao WebSocket
- debugChat.reset() - Limpar estado e reconectar

Exemplo de uso:
debugChat.debugState();
debugChat.simulateMessage('123', 'Olá, preciso de ajuda!');
debugChat.startMonitor('123');
`);

// Auto-executar debug inicial
console.log('🔍 Executando debug inicial...');
setTimeout(() => {
  window.debugChat.debugState();
  window.debugChat.checkConnection();
}, 1000); 