// 🔧 CORREÇÃO ESPECÍFICA PARA CONEXÃO WEBSOCKET
// Execute: fixWebSocketConnection() no console

export const fixWebSocketConnection = async (): Promise<void> => {
  console.log('🔧 [CONNECTION] Diagnosticando e corrigindo conexão WebSocket...');
  console.log('='.repeat(60));
  
  // 1. Verificar estado atual do chatStore
  console.log('1️⃣ Verificando estado atual do chatStore...');
  const chatStore = (window as any).useChatStore?.getState?.();
  
  if (!chatStore) {
    console.error('❌ [CONNECTION] chatStore não encontrado!');
    console.log('💡 Tentando importar chatStore...');
    
    try {
      // Tentar importar dinamicamente
      const { useChatStore } = await import('../stores/chatStore');
      const store = useChatStore.getState();
      console.log('✅ [CONNECTION] chatStore importado:', {
        isConnected: store.isConnected,
        isLoading: store.isLoading,
        hasSocket: !!store.socket,
        error: store.error
      });
      
      // Expor globalmente
      (window as any).useChatStore = useChatStore;
    } catch (importError) {
      console.error('❌ [CONNECTION] Erro ao importar chatStore:', importError);
      return;
    }
  }
  
  const currentState = (window as any).useChatStore?.getState?.();
  
  console.log('📊 [CONNECTION] Estado atual:', {
    isConnected: currentState?.isConnected,
    isLoading: currentState?.isLoading,
    hasSocket: !!currentState?.socket,
    socketConnected: currentState?.socket?.connected,
    error: currentState?.error,
    messagesCount: Object.keys(currentState?.messages || {}).length
  });
  
  // 2. Verificar se servidor WebSocket está rodando
  console.log('2️⃣ Verificando servidor WebSocket...');
  try {
    const healthResponse = await fetch('http://localhost:4000/webhook/health');
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ [CONNECTION] Servidor WebSocket OK:', healthData);
    } else {
      console.error('❌ [CONNECTION] Servidor WebSocket com problemas:', healthData);
      console.log('💡 Certifique-se que o servidor está rodando na porta 4000');
      return;
    }
  } catch (healthError) {
    console.error('❌ [CONNECTION] Erro ao verificar servidor:', healthError);
    console.log('💡 Execute: cd backend/webhooks && node webhook-evolution-websocket.js');
    return;
  }
  
  // 3. Forçar desconexão e reconexão
  console.log('3️⃣ Forçando reconexão...');
  try {
    const store = (window as any).useChatStore?.getState?.();
    
    if (store?.socket) {
      console.log('🔌 [CONNECTION] Desconectando socket atual...');
      store.disconnect();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🔗 [CONNECTION] Iniciando nova conexão...');
    store?.init();
    
    // Aguardar conexão
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newState = (window as any).useChatStore?.getState?.();
      
      console.log(`⏳ [CONNECTION] Tentativa ${attempts + 1}/${maxAttempts}:`, {
        isConnected: newState?.isConnected,
        isLoading: newState?.isLoading,
        hasSocket: !!newState?.socket,
        socketConnected: newState?.socket?.connected
      });
      
      if (newState?.isConnected && newState?.socket?.connected) {
        console.log('✅ [CONNECTION] Conexão estabelecida com sucesso!');
        break;
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.error('❌ [CONNECTION] Timeout na conexão após 10 tentativas');
      
      // Tentar conexão manual com Socket.IO
      console.log('🔧 [CONNECTION] Tentando conexão manual...');
      await manualSocketConnection();
    }
    
  } catch (connectionError) {
    console.error('❌ [CONNECTION] Erro na reconexão:', connectionError);
  }
  
  // 4. Verificar estado final
  console.log('4️⃣ Verificando estado final...');
  const finalState = (window as any).useChatStore?.getState?.();
  
  console.log('📊 [CONNECTION] Estado final:', {
    isConnected: finalState?.isConnected,
    isLoading: finalState?.isLoading,
    hasSocket: !!finalState?.socket,
    socketConnected: finalState?.socket?.connected,
    socketId: finalState?.socket?.id,
    error: finalState?.error
  });
  
  if (finalState?.isConnected) {
    console.log('🎉 [CONNECTION] Conexão WebSocket estabelecida com sucesso!');
    
    // Testar funcionalidades básicas
    console.log('🧪 [CONNECTION] Testando funcionalidades...');
    await testBasicFunctionality();
  } else {
    console.error('💥 [CONNECTION] Falha ao estabelecer conexão WebSocket');
    console.log('💡 Possíveis soluções:');
    console.log('   1. Verificar se servidor está rodando: http://localhost:4000/webhook/health');
    console.log('   2. Verificar firewall/antivírus bloqueando porta 4000');
    console.log('   3. Tentar reiniciar o servidor WebSocket');
    console.log('   4. Verificar logs do servidor para erros');
  }
};

// Função para conexão manual com Socket.IO
const manualSocketConnection = async (): Promise<void> => {
  console.log('🔧 [MANUAL] Tentando conexão manual com Socket.IO...');
  
  try {
    // Importar Socket.IO dinamicamente
    const { io } = await import('socket.io-client');
    
    const socketUrl = 'http://localhost:4000';
    console.log(`🔗 [MANUAL] Conectando em: ${socketUrl}`);
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      forceNew: true,
      autoConnect: true
    });
    
    // Aguardar conexão
    const connected = await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('⏰ [MANUAL] Timeout na conexão manual');
        resolve(false);
      }, 15000);
      
      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ [MANUAL] Conexão manual estabelecida!');
        console.log('🔗 [MANUAL] Socket ID:', socket.id);
        resolve(true);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ [MANUAL] Erro na conexão manual:', error);
        resolve(false);
      });
    });
    
    if (connected) {
      // Atualizar o chatStore com o socket manual
      const store = (window as any).useChatStore;
      if (store) {
        store.setState({
          socket: socket,
          isConnected: true,
          isLoading: false,
          error: null
        });
        
        console.log('✅ [MANUAL] Socket manual integrado ao chatStore');
        
        // Expor socket globalmente para debug
        (window as any).debugSocket = socket;
      }
    }
    
  } catch (manualError) {
    console.error('❌ [MANUAL] Erro na conexão manual:', manualError);
  }
};

// Função para testar funcionalidades básicas
const testBasicFunctionality = async (): Promise<void> => {
  console.log('🧪 [TEST] Testando funcionalidades básicas...');
  
  const store = (window as any).useChatStore?.getState?.();
  const socket = store?.socket;
  
  if (!socket || !socket.connected) {
    console.error('❌ [TEST] Socket não disponível para teste');
    return;
  }
  
  // Teste 1: Ping/Pong
  console.log('1️⃣ [TEST] Testando ping...');
  socket.emit('ping', Date.now());
  
  // Teste 2: Join em ticket de teste
  console.log('2️⃣ [TEST] Testando join ticket...');
  const testTicketId = 'test-connection-' + Date.now();
  
  socket.emit('join-ticket', {
    ticketId: testTicketId,
    userId: '00000000-0000-0000-0000-000000000001'
  });
  
  // Teste 3: Solicitar mensagens
  console.log('3️⃣ [TEST] Testando request messages...');
  socket.emit('request-messages', {
    ticketId: testTicketId,
    limit: 10
  });
  
  // Teste 4: Enviar mensagem
  console.log('4️⃣ [TEST] Testando send message...');
  socket.emit('send-message', {
    ticketId: testTicketId,
    content: 'Teste de conexão - ' + new Date().toLocaleTimeString(),
    isInternal: false,
    userId: '00000000-0000-0000-0000-000000000001',
    senderName: 'Teste'
  });
  
  console.log('✅ [TEST] Testes de funcionalidade enviados');
  console.log('👁️ [TEST] Monitore o console para ver as respostas do servidor');
};

// Função para monitorar eventos WebSocket
export const monitorWebSocketEvents = (): void => {
  console.log('👁️ [MONITOR] Iniciando monitoramento de eventos WebSocket...');
  
  const store = (window as any).useChatStore?.getState?.();
  const socket = store?.socket;
  
  if (!socket) {
    console.error('❌ [MONITOR] Socket não disponível para monitoramento');
    return;
  }
  
  // Monitorar todos os eventos
  const events = [
    'connect', 'disconnect', 'connect_error', 'reconnect', 
    'new-message', 'messages-loaded', 'joined-ticket', 'error'
  ];
  
  events.forEach(event => {
    socket.on(event, (data) => {
      console.log(`📡 [MONITOR] Evento '${event}':`, data);
    });
  });
  
  console.log('✅ [MONITOR] Monitoramento ativo para eventos:', events.join(', '));
  console.log('💡 [MONITOR] Execute stopMonitoring() para parar');
  
  // Função para parar monitoramento
  (window as any).stopMonitoring = () => {
    events.forEach(event => {
      socket.off(event);
    });
    console.log('🛑 [MONITOR] Monitoramento parado');
  };
};

// Expor funções globalmente
(window as any).fixWebSocketConnection = fixWebSocketConnection;
(window as any).monitorWebSocketEvents = monitorWebSocketEvents;

console.log('🔧 [CONNECTION-FIX] Sistema de correção de conexão carregado');
console.log('🔧 Execute: fixWebSocketConnection() para corrigir conexão');
console.log('👁️ Execute: monitorWebSocketEvents() para monitorar eventos'); 