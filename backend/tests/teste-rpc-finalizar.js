// Teste das funções RPC - Cole no console do navegador

console.log('🧪 Testando funções RPC para finalização...');

async function testRPCFunctions() {
  try {
    // Verificar se supabase está disponível
    if (typeof window.supabase === 'undefined') {
      console.log('❌ Supabase não está disponível globalmente');
      console.log('🔧 Tentando acessar via import...');
      
      // Tentar acessar o supabase do useTicketsDB
      if (window.useTicketsDB) {
        console.log('✅ Hook useTicketsDB encontrado');
      } else {
        console.log('❌ Hook useTicketsDB não encontrado');
        return;
      }
    }

    // Testar se a função RPC existe no banco
    console.log('🔧 Testando se função finalize_ticket existe...');
    
    // Criar um ID de teste (UUID falso)
    const testTicketId = '00000000-0000-0000-0000-000000000001';
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc('finalize_ticket', {
      ticket_id: testTicketId
    });

    if (rpcError) {
      if (rpcError.code === '42883') {
        console.log('❌ Função RPC não existe no banco de dados');
        console.log('📋 Execute o script CRIAR_FUNCAO_RPC_FINALIZAR.sql no Supabase');
      } else {
        console.log('🔍 RPC existe mas retornou erro (esperado para ID falso):', rpcError);
      }
    } else {
      console.log('✅ Função RPC existe e respondeu:', rpcResult);
    }

    // Testar buscar tickets reais para teste
    console.log('\n📋 Buscando tickets disponíveis para teste...');
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, status')
      .in('status', ['open', 'in_progress', 'atendimento'])
      .limit(1);

    if (ticketsError) {
      console.log('❌ Erro ao buscar tickets:', ticketsError);
    } else if (tickets && tickets.length > 0) {
      const testTicket = tickets[0];
      console.log(`✅ Ticket encontrado para teste: ${testTicket.title} (${testTicket.status})`);
      
      // Testar finalização real (mas apenas simular)
      console.log('\n🧪 Simulando finalização...');
      console.log(`ID do ticket: ${testTicket.id}`);
      console.log('Comando que seria executado:');
      console.log(`supabase.rpc('finalize_ticket', { ticket_id: '${testTicket.id}' })`);
      
    } else {
      console.log('⚠️ Nenhum ticket aberto encontrado para teste');
    }

    console.log('\n✅ Teste de RPC concluído!');

  } catch (error) {
    console.error('❌ Erro no teste RPC:', error);
  }
}

// Executar teste
testRPCFunctions(); 