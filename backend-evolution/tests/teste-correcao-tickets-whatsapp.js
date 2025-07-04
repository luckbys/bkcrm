const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testarCorrecaoTicketsWhatsApp() {
  try {
    console.log('🧪 Iniciando testes de correção de tickets WhatsApp...\n');

    // Teste 1: Criar primeiro ticket
    console.log('📋 Teste 1: Criar primeiro ticket');
    const { data: result1 } = await supabase
      .rpc('find_or_create_whatsapp_ticket', {
        p_phone: '5511999998888',
        p_client_name: 'Cliente Teste',
      });
    
    const { ticket_id: ticket1, is_new: isNew1, sequence_number: seq1 } = result1[0];
    console.log('✅ Ticket 1 criado:', { ticket1, isNew1, seq1 });
    console.log('');

    // Teste 2: Tentar criar ticket duplicado (deve retornar o mesmo)
    console.log('📋 Teste 2: Tentar criar ticket duplicado');
    const { data: result2 } = await supabase
      .rpc('find_or_create_whatsapp_ticket', {
        p_phone: '5511999998888',
        p_client_name: 'Cliente Teste',
      });
    
    const { ticket_id: ticket2, is_new: isNew2, sequence_number: seq2 } = result2[0];
    console.log('✅ Ticket 2 (deve ser igual ao 1):', { ticket2, isNew2, seq2 });
    console.log(`🔍 É o mesmo ticket? ${ticket1 === ticket2 ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log('');

    // Teste 3: Finalizar ticket e criar novo
    console.log('📋 Teste 3: Finalizar ticket e criar novo');
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ status: 'finalizado' })
      .eq('id', ticket1);

    if (updateError) throw updateError;

    const { data: result3 } = await supabase
      .rpc('find_or_create_whatsapp_ticket', {
        p_phone: '5511999998888',
        p_client_name: 'Cliente Teste',
      });
    
    const { ticket_id: ticket3, is_new: isNew3, sequence_number: seq3 } = result3[0];
    console.log('✅ Ticket 3 (deve ser novo):', { ticket3, isNew3, seq3 });
    console.log(`🔍 É um novo ticket? ${ticket1 !== ticket3 ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`🔍 Sequência incrementada? ${seq3 > seq2 ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log('');

    // Teste 4: Verificar dados completos dos tickets
    console.log('📋 Teste 4: Verificar dados completos');
    const { data: tickets } = await supabase
      .from('tickets')
      .select('*')
      .in('id', [ticket1, ticket3])
      .order('created_at', { ascending: true });

    console.log('✅ Dados dos tickets:');
    tickets.forEach(ticket => {
      console.log(`\nTicket ${ticket.id}:`);
      console.log('- Título:', ticket.title);
      console.log('- Status:', ticket.status);
      console.log('- Canal:', ticket.channel);
      console.log('- Metadata:', ticket.metadata);
    });

    console.log('\n✅ Testes concluídos com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro nos testes:', error);
  }
}

// Executar testes
testarCorrecaoTicketsWhatsApp(); 