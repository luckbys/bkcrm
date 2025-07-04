// Teste simples - Cole no console do navegador
console.log('🧪 Testando finalização de ticket no frontend...');

// Simular finalização de um ticket
async function testTicketFinalization() {
  try {
    // Verificar se há tickets carregados
    const ticketManagement = document.querySelector('[data-testid="ticket-management"]') ||
                           document.querySelector('.space-y-6'); // Container principal
    
    if (!ticketManagement) {
      console.log('❌ Componente TicketManagement não encontrado');
      return;
    }
    
    console.log('✅ Componente encontrado, verificando dados...');
    
    // Verificar se window tem funções globais disponíveis (para debug)
    if (window.testDatabase) {
      console.log('🔧 Testando conexão com banco...');
      window.testDatabase();
    }
    
    // Verificar se existe algum ticket aberto
    const openTickets = document.querySelectorAll('[data-status="open"], [data-status="atendimento"], [data-status="pendente"]');
    console.log(`📊 Tickets abertos encontrados: ${openTickets.length}`);
    
    // Verificar contadores atuais
    const badges = document.querySelectorAll('span[class*="badge"], .badge');
    console.log('🏷️ Contadores atuais:');
    badges.forEach((badge, index) => {
      if (badge.textContent && /^\d+$/.test(badge.textContent.trim())) {
        console.log(`  Badge ${index}: ${badge.textContent}`);
      }
    });
    
    // Testar mapeamento de status
    const mapStatus = (status) => {
      const statusMap = {
        'pendente': 'pendente',
        'open': 'pendente',
        'atendimento': 'atendimento', 
        'in_progress': 'atendimento',
        'finalizado': 'finalizado',
        'resolved': 'finalizado',
        'closed': 'finalizado',
        'cancelado': 'cancelado',
        'cancelled': 'cancelado'
      };
      return statusMap[status] || 'pendente';
    };
    
    console.log('🧪 Teste de mapeamento:');
    console.log(`  closed → ${mapStatus('closed')}`);
    console.log(`  resolved → ${mapStatus('resolved')}`);
    console.log(`  finalizado → ${mapStatus('finalizado')}`);
    
    console.log('✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testTicketFinalization(); 