// ==========================================
// TESTE FINALIZAÇÃO EM MASSA - TICKETS
// ==========================================

async function testeFinalizacaoMassa() {
  console.log('\n🧪 ===== TESTE FINALIZAÇÃO EM MASSA =====\n');

  // Passo 1: Verificar tickets disponíveis
  console.log('1️⃣ Verificando tickets disponíveis...');
  
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, status, client_phone, customer_id')
      .limit(10);

    if (error) {
      console.log('❌ Erro ao buscar tickets:', error);
      return;
    }

    console.log('📋 Tickets encontrados:', {
      total: tickets.length,
      porStatus: tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1;
        return acc;
      }, {}),
      tickets: tickets.map(t => ({ 
        id: t.id, 
        title: t.title?.substring(0, 30) + '...', 
        status: t.status 
      }))
    });

    // Passo 2: Selecionar tickets para finalizar (apenas os que não estão finalizados)
    const ticketsParaFinalizar = tickets.filter(t => 
      t.status !== 'closed' && t.status !== 'finalizado'
    );

    if (ticketsParaFinalizar.length === 0) {
      console.log('⚠️ Nenhum ticket disponível para finalização');
      
      // Criar ticket de teste se necessário
      console.log('🆕 Criando ticket de teste...');
      const { data: novoTicket, error: erroTicket } = await supabase
        .from('tickets')
        .insert({
          title: 'Teste Finalização Massa',
          status: 'open',
          priority: 'normal',
          channel: 'test',
          metadata: { test: true, finalizar_massa: true }
        })
        .select()
        .single();

      if (erroTicket) {
        console.log('❌ Erro ao criar ticket de teste:', erroTicket);
        return;
      }

      console.log('✅ Ticket de teste criado:', novoTicket.id);
      ticketsParaFinalizar.push(novoTicket);
    }

    console.log(`\n2️⃣ Tickets selecionados para finalização: ${ticketsParaFinalizar.length}`);
    
    // Passo 3: Testar função RPC finalize_ticket_simple
    console.log('\n3️⃣ Testando finalização via RPC...');
    
    const resultados = [];
    
    for (const ticket of ticketsParaFinalizar.slice(0, 3)) { // Máximo 3 para teste
      console.log(`💾 Finalizando ticket ${ticket.id}...`);
      
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('finalize_ticket_simple', {
          ticket_uuid: ticket.id
        });

        if (rpcError) {
          console.log(`❌ RPC falhou para ${ticket.id}:`, rpcError);
          resultados.push({ ticket: ticket.id, success: false, error: rpcError });
        } else {
          console.log(`✅ RPC sucesso para ${ticket.id}:`, rpcResult);
          resultados.push({ ticket: ticket.id, success: true, result: rpcResult });
        }
      } catch (error) {
        console.log(`❌ Exceção para ${ticket.id}:`, error);
        resultados.push({ ticket: ticket.id, success: false, error: error.message });
      }
      
      // Aguardar 500ms entre as chamadas
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Passo 4: Verificar resultados
    console.log('\n4️⃣ Resultado da finalização em massa:');
    const sucessos = resultados.filter(r => r.success);
    const falhas = resultados.filter(r => !r.success);
    
    console.log('📊 Estatísticas:', {
      total: resultados.length,
      sucessos: sucessos.length,
      falhas: falhas.length,
      taxa_sucesso: `${Math.round((sucessos.length / resultados.length) * 100)}%`
    });

    if (sucessos.length > 0) {
      console.log('✅ Sucessos:');
      sucessos.forEach(s => {
        console.log(`  - Ticket ${s.ticket}: ${JSON.stringify(s.result)}`);
      });
    }

    if (falhas.length > 0) {
      console.log('❌ Falhas:');
      falhas.forEach(f => {
        console.log(`  - Ticket ${f.ticket}: ${f.error?.message || f.error}`);
      });
    }

    // Passo 5: Verificar status final dos tickets
    console.log('\n5️⃣ Verificando status final dos tickets...');
    
    const ticketsTestados = resultados.map(r => r.ticket);
    const { data: ticketsFinais, error: erroFinal } = await supabase
      .from('tickets')
      .select('id, status, updated_at')
      .in('id', ticketsTestados);

    if (!erroFinal) {
      console.log('📋 Status final dos tickets:');
      ticketsFinais.forEach(ticket => {
        const resultado = resultados.find(r => r.ticket === ticket.id);
        console.log(`  - ${ticket.id}: ${ticket.status} (${resultado?.success ? 'Sucesso' : 'Falha'})`);
      });
    }

    console.log('\n🎉 Teste de finalização em massa concluído!');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Função para testar com tickets mock
async function testeFinalizacaoMassaMock() {
  console.log('\n🧪 ===== TESTE FINALIZAÇÃO EM MASSA (MOCK) =====\n');
  
  const ticketsMock = [
    { id: 1234, client: 'João Silva', status: 'pendente' },
    { id: 1235, client: 'Maria Santos', status: 'atendimento' },
    { id: 1236, client: 'Pedro Costa', status: 'finalizado' },
    { id: 1237, client: 'Ana Oliveira', status: 'pendente' }
  ];

  console.log('📋 Tickets mock:', ticketsMock);

  const selectedTickets = [1234, 1235, 1236, 1237];
  console.log('🎯 Tickets selecionados:', selectedTickets);

  // Simular lógica de finalização
  const ticketsToFinalize = ticketsMock.filter(ticket => 
    selectedTickets.includes(ticket.id) && ticket.status !== 'finalizado'
  );

  console.log('✅ Tickets que serão finalizados:', {
    total: selectedTickets.length,
    aFinalizarCount: ticketsToFinalize.length,
    aFinalizar: ticketsToFinalize.map(t => ({ id: t.id, client: t.client, status: t.status }))
  });

  if (ticketsToFinalize.length === 0) {
    console.log('⚠️ Nenhum ticket precisa ser finalizado');
    return;
  }

  // Simular finalização
  console.log('⏳ Simulando finalização...');
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log(`🎉 ${ticketsToFinalize.length} tickets finalizados (simulação)!`);
  
  // Simular status final
  const statusFinal = ticketsMock.map(ticket => ({
    ...ticket,
    status: selectedTickets.includes(ticket.id) && ticket.status !== 'finalizado' 
      ? 'finalizado' 
      : ticket.status
  }));

  console.log('📊 Status final:', statusFinal);
}

// Executar os testes
console.log('🚀 Iniciando testes de finalização em massa...');

// Verificar se existe supabase global
if (typeof supabase !== 'undefined') {
  testeFinalizacaoMassa();
} else {
  console.log('⚠️ Supabase não encontrado, executando teste mock...');
  testeFinalizacaoMassaMock();
} 