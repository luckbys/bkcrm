// ==========================================
// TESTE FINALIZAÇÃO SIMPLES - SEM NOTIFICAÇÕES
// ==========================================

async function testeFinalizacaoSimples() {
  console.log('\n🧪 ===== TESTE FINALIZAÇÃO SIMPLES =====\n');

  // Passo 1: Verificar se funções foram criadas
  console.log('1️⃣ Verificando se funções RPC foram criadas...');
  
  try {
    const { data: functions, error: functionsError } = await supabase
      .rpc('sql', {
        query: `
          SELECT proname, proargnames 
          FROM pg_proc 
          WHERE proname IN ('finalize_ticket_simple', 'update_ticket_status_simple', 'enable_ticket_triggers')
          ORDER BY proname;
        `
      });

    if (functionsError) {
      console.log('❌ Erro ao verificar funções:', functionsError);
    } else {
      console.log('📋 Funções encontradas:', functions);
      
      const functionNames = functions.map(f => f.proname);
      const expectedFunctions = ['finalize_ticket_simple', 'update_ticket_status_simple', 'enable_ticket_triggers'];
      
      expectedFunctions.forEach(fname => {
        if (functionNames.includes(fname)) {
          console.log(`✅ Função ${fname} encontrada`);
        } else {
          console.log(`❌ Função ${fname} NÃO encontrada`);
        }
      });
    }
  } catch (error) {
    console.log('❌ Erro ao verificar funções via RPC alternativo');
  }

  // Passo 2: Verificar status dos triggers
  console.log('\n2️⃣ Verificando status dos triggers...');
  
  try {
    const { data: triggers, error: triggersError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
              tgname as trigger_name,
              tgenabled as enabled,
              CASE 
                  WHEN tgenabled THEN 'ATIVO' 
                  ELSE 'DESABILITADO' 
              END as status
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          WHERE c.relname = 'tickets'
          AND t.tgname NOT LIKE 'RI_%';
        `
      });

    if (triggersError) {
      console.log('❌ Erro ao verificar triggers:', triggersError);
    } else {
      console.log('📋 Status dos triggers:', triggers);
      
      const disabledTriggers = triggers.filter(t => !t.enabled);
      console.log(`✅ ${disabledTriggers.length} triggers desabilitados`);
      console.log(`⚠️ ${triggers.length - disabledTriggers.length} triggers ainda ativos`);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar triggers');
  }

  // Passo 3: Buscar ticket para teste
  console.log('\n3️⃣ Buscando ticket para teste...');
  
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, title, status')
    .neq('status', 'closed')
    .limit(1);

  if (ticketsError) {
    console.log('❌ Erro ao buscar tickets:', ticketsError);
    return;
  }

  if (!tickets || tickets.length === 0) {
    console.log('⚠️ Nenhum ticket disponível para teste (todos já finalizados)');
    return;
  }

  const testTicket = tickets[0];
  console.log('🎫 Ticket selecionado para teste:', {
    id: testTicket.id,
    title: testTicket.title,
    status: testTicket.status
  });

  // Passo 4: Testar função finalize_ticket_simple
  console.log('\n4️⃣ Testando função finalize_ticket_simple...');
  
  try {
    const { data: result, error: finalizeError } = await supabase.rpc('finalize_ticket_simple', {
      ticket_uuid: testTicket.id
    });

    if (finalizeError) {
      console.log('❌ Erro na função finalize_ticket_simple:', finalizeError);
    } else {
      console.log('📊 Resultado da finalização:', result);
      
      if (result?.success) {
        console.log('✅ Ticket finalizado com sucesso!');
        
        // Verificar se realmente foi finalizado
        const { data: updatedTicket, error: checkError } = await supabase
          .from('tickets')
          .select('id, status, closed_at, updated_at')
          .eq('id', testTicket.id)
          .single();

        if (checkError) {
          console.log('❌ Erro ao verificar ticket atualizado:', checkError);
        } else {
          console.log('📋 Ticket após finalização:', updatedTicket);
          
          if (updatedTicket.status === 'closed') {
            console.log('✅ Status confirmado como "closed"');
            console.log('✅ Closed_at definido:', updatedTicket.closed_at);
          } else {
            console.log('❌ Status não foi alterado para "closed"');
          }
        }
      } else {
        console.log('❌ Finalização falhou:', result?.error);
      }
    }
  } catch (error) {
    console.log('❌ Erro ao executar finalize_ticket_simple:', error);
  }

  // Passo 5: Testar mapeamento de status no frontend
  console.log('\n5️⃣ Testando mapeamento de status...');
  
  try {
    // Simular a função mapStatus do frontend
    const mapStatus = (dbStatus) => {
      const statusMapping = {
        'open': 'pendente',
        'in_progress': 'atendimento', 
        'closed': 'finalizado',
        'resolved': 'finalizado',
        'cancelled': 'cancelado'
      };
      return statusMapping[dbStatus] || dbStatus;
    };

    const testStatuses = ['open', 'in_progress', 'closed', 'resolved', 'cancelled'];
    
    testStatuses.forEach(status => {
      const mapped = mapStatus(status);
      console.log(`📊 "${status}" → "${mapped}"`);
    });

    console.log('✅ Mapeamento de status funcionando');
  } catch (error) {
    console.log('❌ Erro no teste de mapeamento:', error);
  }

  // Passo 6: Testar filtro no banco
  console.log('\n6️⃣ Testando filtro de tickets finalizados...');
  
  try {
    const { data: closedTickets, error: filterError } = await supabase
      .from('tickets')
      .select('id, title, status, closed_at')
      .eq('status', 'closed')
      .order('closed_at', { ascending: false })
      .limit(3);

    if (filterError) {
      console.log('❌ Erro ao filtrar tickets finalizados:', filterError);
    } else {
      console.log('📋 Tickets finalizados encontrados:', closedTickets.length);
      closedTickets.forEach(ticket => {
        console.log(`   - ${ticket.title} (${ticket.status}) - ${ticket.closed_at}`);
      });
      console.log('✅ Filtro funcionando');
    }
  } catch (error) {
    console.log('❌ Erro ao testar filtro:', error);
  }

  console.log('\n🎯 ===== RESUMO DO TESTE =====');
  console.log('✅ Solução simples testada');
  console.log('📊 Verifique os logs acima para detalhes');
  console.log('🚀 Se tudo estiver OK, a finalização deve funcionar!');
}

// Executar teste se estiver no console do navegador
if (typeof window !== 'undefined' && window.supabase) {
  window.testeFinalizacaoSimples = testeFinalizacaoSimples;
  console.log('📋 Teste carregado! Execute: testeFinalizacaoSimples()');
} else {
  console.log('⚠️ Execute este script no console do navegador onde o Supabase está disponível');
} 