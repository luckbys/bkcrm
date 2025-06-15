// Script de debug para testar clique nos tickets
// Execute no console do navegador

console.log('🔧 Iniciando debug do clique nos tickets...');

// Função para simular clique em um ticket
function debugTicketClick() {
  console.log('🎯 Procurando tickets na página...');
  
  // Procurar por elementos de ticket (cards ou linhas)
  const ticketElements = document.querySelectorAll('[data-ticket-id], .cursor-pointer');
  console.log('🎯 Elementos encontrados:', ticketElements.length);
  
  if (ticketElements.length > 0) {
    const firstTicket = ticketElements[0];
    console.log('🎯 Primeiro ticket encontrado:', firstTicket);
    
    // Simular clique
    console.log('🎯 Simulando clique...');
    firstTicket.click();
    
    // Verificar se modal apareceu
    setTimeout(() => {
      const modal = document.querySelector('[role="dialog"]');
      const backdrop = document.querySelector('.fixed.inset-0');
      console.log('🎯 Modal encontrado:', !!modal);
      console.log('🎯 Backdrop encontrado:', !!backdrop);
      
      if (modal) {
        console.log('✅ Modal abriu com sucesso!');
      } else {
        console.log('❌ Modal não abriu. Verificando localStorage...');
        
        // Verificar localStorage
        const keys = Object.keys(localStorage).filter(key => key.includes('chat-minimized'));
        console.log('🎯 Chaves de chat minimizado no localStorage:', keys);
        
        keys.forEach(key => {
          const value = localStorage.getItem(key);
          console.log(`🎯 ${key}: ${value}`);
        });
      }
    }, 1000);
  } else {
    console.log('❌ Nenhum ticket encontrado na página');
  }
}

// Função para limpar localStorage de chats minimizados
function clearMinimizedChats() {
  console.log('🧹 Limpando localStorage de chats minimizados...');
  const keys = Object.keys(localStorage).filter(key => key.includes('chat-minimized'));
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🗑️ Removido: ${key}`);
  });
  console.log('✅ localStorage limpo!');
}

// Função para verificar estado atual
function checkCurrentState() {
  console.log('🔍 Verificando estado atual...');
  
  // Verificar se há tickets na página
  const tickets = document.querySelectorAll('[data-ticket-id], .cursor-pointer');
  console.log('🎯 Tickets na página:', tickets.length);
  
  // Verificar se há modal aberto
  const modal = document.querySelector('[role="dialog"]');
  console.log('🎯 Modal aberto:', !!modal);
  
  // Verificar localStorage
  const minimizedKeys = Object.keys(localStorage).filter(key => key.includes('chat-minimized'));
  console.log('🎯 Chats minimizados no localStorage:', minimizedKeys.length);
  
  return {
    ticketsCount: tickets.length,
    modalOpen: !!modal,
    minimizedChats: minimizedKeys.length
  };
}

// Disponibilizar funções globalmente para debug
window.debugTicketClick = debugTicketClick;
window.clearMinimizedChats = clearMinimizedChats;
window.checkCurrentState = checkCurrentState;

console.log('🎯 Funções de debug disponíveis:');
console.log('  - debugTicketClick() - Simula clique no primeiro ticket');
console.log('  - clearMinimizedChats() - Limpa localStorage de chats minimizados');
console.log('  - checkCurrentState() - Verifica estado atual da página');

// Executar verificação inicial
checkCurrentState(); 