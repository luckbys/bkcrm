/**
 * Debug para problema de mensagens não salvando/exibindo
 */

// Função para verificar WebSocket
export const debugWebSocket = () => {
  console.log('🔧 Testando conexão WebSocket...');
  
  fetch('http://localhost:4000/webhook/health')
    .then(response => response.json())
    .then(data => {
      console.log('✅ WebSocket Status:', data);
      if (data.websocket?.enabled) {
        console.log('✅ WebSocket está funcionando');
        console.log(`📡 Conexões ativas: ${data.websocket.connections}`);
      } else {
        console.log('❌ WebSocket não está funcionando');
      }
    })
    .catch(error => {
      console.error('❌ Erro ao verificar WebSocket:', error);
    });
};

// Função para verificar banco de dados
export const debugDatabase = async () => {
  console.log('🔧 Testando conexão com banco...');
  
  try {
    const { supabase } = await import('../lib/supabase');
    
    // Buscar tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, status')
      .limit(5);
      
    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError);
      return;
    }
    
    console.log('✅ Tickets encontrados:', tickets?.length || 0);
    
    if (tickets && tickets.length > 0) {
      const ticketId = tickets[0].id;
      console.log(`🎯 Testando mensagens do ticket: ${ticketId}`);
      
      // Buscar mensagens do primeiro ticket
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
        
      if (messagesError) {
        console.error('❌ Erro ao buscar mensagens:', messagesError);
        return;
      }
      
      console.log('✅ Mensagens encontradas:', messages?.length || 0);
      
      if (messages && messages.length > 0) {
        console.log('📋 Última mensagem:', {
          content: messages[messages.length - 1].content,
          sender_name: messages[messages.length - 1].sender_name,
          created_at: messages[messages.length - 1].created_at
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral no banco:', error);
  }
};

// Função para verificar hook useTicketChat
export const debugTicketChat = () => {
  console.log('🔧 Verificando estado do useTicketChat...');
  
  // Verificar se existe um ticket selecionado
  const ticketElements = document.querySelectorAll('[data-ticket-id]');
  console.log('🎯 Elementos de ticket encontrados:', ticketElements.length);
  
  // Verificar se existe área de mensagens
  const messageAreas = document.querySelectorAll('[class*="message"], [class*="chat"]');
  console.log('💬 Áreas de mensagens encontradas:', messageAreas.length);
  
  // Verificar se existe input de mensagem
  const messageInputs = document.querySelectorAll('textarea, input[type="text"]');
  console.log('📝 Inputs de mensagem encontrados:', messageInputs.length);
  
  // Verificar console logs recentes
  console.log('📊 Verifique o console para logs do useTicketChat e useWebSocketMessages');
};

// Função principal de diagnóstico
export const diagnosticoCompleto = () => {
  console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO');
  console.log('=====================================');
  
  debugWebSocket();
  
  setTimeout(() => {
    debugDatabase();
  }, 1000);
  
  setTimeout(() => {
    debugTicketChat();
  }, 2000);
  
  console.log('\n💡 Para mais detalhes, abra um ticket no chat e observe os logs');
};

// Disponibilizar no window global
if (typeof window !== 'undefined') {
  window.debugMensagens = {
    debugWebSocket,
    debugDatabase,
    debugTicketChat,
    diagnosticoCompleto
  };
  
  console.log('🔧 Funções de debug disponíveis:');
  console.log('- debugMensagens.diagnosticoCompleto()');
  console.log('- debugMensagens.debugWebSocket()'); 
  console.log('- debugMensagens.debugDatabase()');
  console.log('- debugMensagens.debugTicketChat()');
} 