import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2MjE3MDEsImV4cCI6MjA0NzE5NzcwMX0.55c2GsV3bUC3kGdO_7tRz-EJZKj7qR-HKcHaGIQ5DfY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para mapear status (mesma lógica do frontend)
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

async function testStatusMapping() {
  console.log('🧪 Testando mapeamento de status dos tickets...\n');

  try {
    // 1. Buscar todos os tickets para ver os status existentes
    console.log('📋 Buscando todos os tickets...');
    const { data: allTickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    console.log(`✅ ${allTickets.length} tickets encontrados\n`);

    // 2. Agrupar por status original
    const statusCounts = {};
    allTickets.forEach(ticket => {
      const originalStatus = ticket.status;
      const mappedStatus = mapStatus(originalStatus);
      
      if (!statusCounts[originalStatus]) {
        statusCounts[originalStatus] = { count: 0, mapped: mappedStatus, tickets: [] };
      }
      statusCounts[originalStatus].count++;
      statusCounts[originalStatus].tickets.push(ticket.id);
    });

    console.log('📊 Status encontrados no banco de dados:');
    Object.entries(statusCounts).forEach(([original, info]) => {
      console.log(`  ${original} → ${info.mapped} (${info.count} tickets)`);
    });

    // 3. Contadores mapeados para o frontend
    const frontendCounts = {
      pendente: 0,
      atendimento: 0,
      finalizado: 0,
      cancelado: 0
    };

    allTickets.forEach(ticket => {
      const mappedStatus = mapStatus(ticket.status);
      frontendCounts[mappedStatus]++;
    });

    console.log('\n📈 Contadores que aparecerão no frontend:');
    console.log(`  🟡 Pendentes: ${frontendCounts.pendente}`);
    console.log(`  🔵 Em Atendimento: ${frontendCounts.atendimento}`);
    console.log(`  🟢 Finalizados: ${frontendCounts.finalizado}`);
    console.log(`  🔴 Cancelados: ${frontendCounts.cancelado}`);

    // 4. Mostrar detalhes dos tickets finalizados
    const finalizedTickets = allTickets.filter(ticket => mapStatus(ticket.status) === 'finalizado');
    
    if (finalizedTickets.length > 0) {
      console.log(`\n✅ Tickets que aparecerão na aba "Finalizados" (${finalizedTickets.length}):`);
      finalizedTickets.forEach(ticket => {
        console.log(`  • ${ticket.title} (Status original: ${ticket.status}) - ID: ${ticket.id.substring(0, 8)}...`);
      });
    } else {
      console.log('\n❌ Nenhum ticket aparecerá na aba "Finalizados"');
    }

    // 5. Verificar especificamente tickets com status 'closed'
    const closedTickets = allTickets.filter(ticket => ticket.status === 'closed');
    
    if (closedTickets.length > 0) {
      console.log(`\n🔒 Tickets com status 'closed' (${closedTickets.length}):`);
      closedTickets.forEach(ticket => {
        console.log(`  • ${ticket.title} → Mapeado para: ${mapStatus(ticket.status)}`);
      });
    } else {
      console.log('\n🔒 Nenhum ticket com status "closed" encontrado');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testStatusMapping(); 