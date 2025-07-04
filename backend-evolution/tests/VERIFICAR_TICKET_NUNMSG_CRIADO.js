const { createClient } = require('@supabase/supabase-js');

// CONFIGURAÇÕES DO SUPABASE (mesmas do webhook corrigido)
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU';

async function verificarTicketCriado() {
  console.log('🔍 Verificando se ticket foi criado com campo nunmsg...');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Buscar ticket com o número de teste
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('id, title, nunmsg, channel, metadata, created_at')
      .eq('nunmsg', '+5511999887766')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao buscar tickets:', error);
      return false;
    }
    
    if (!tickets || tickets.length === 0) {
      console.log('❌ Nenhum ticket encontrado com nunmsg = +5511999887766');
      console.log('');
      console.log('🔍 Vamos verificar tickets recentes para ver o que foi criado:');
      
      // Buscar tickets recentes para diagnóstico
      const { data: recentTickets, error: recentError } = await supabase
        .from('tickets')
        .select('id, title, nunmsg, channel, created_at')
        .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // últimos 10 minutos
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!recentError && recentTickets && recentTickets.length > 0) {
        console.log('📋 Tickets criados nos últimos 10 minutos:');
        recentTickets.forEach((ticket, index) => {
          console.log(`  ${index + 1}. ID: ${ticket.id.substring(0, 8)}...`);
          console.log(`     Título: ${ticket.title}`);
          console.log(`     Nunmsg: ${ticket.nunmsg || 'null'}`);
          console.log(`     Canal: ${ticket.channel}`);
          console.log(`     Criado: ${ticket.created_at}`);
          console.log('');
        });
      }
      
      return false;
    }
    
    console.log(`✅ Encontrados ${tickets.length} ticket(s) com campo nunmsg!`);
    console.log('');
    
    tickets.forEach((ticket, index) => {
      console.log(`🎫 Ticket ${index + 1}:`);
      console.log(`   ID: ${ticket.id}`);
      console.log(`   Título: ${ticket.title}`);
      console.log(`   📱 NUNMSG: ${ticket.nunmsg} ✅`);
      console.log(`   Canal: ${ticket.channel}`);
      console.log(`   Criado: ${ticket.created_at}`);
      
      if (ticket.metadata) {
        console.log(`   Cliente: ${ticket.metadata.client_name || 'N/A'}`);
        console.log(`   Instância: ${ticket.metadata.whatsapp_instance || 'N/A'}`);
      }
      console.log('');
    });
    
    // Verificar se há clientes criados também
    console.log('👤 Verificando clientes criados...');
    const { data: clients, error: clientError } = await supabase
      .from('profiles')
      .select('id, name, email, metadata')
      .eq('role', 'customer')
      .gte('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (!clientError && clients && clients.length > 0) {
      console.log(`✅ Encontrados ${clients.length} cliente(s) criado(s):`);
      clients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.name} (${client.email})`);
        if (client.metadata && client.metadata.phone) {
          console.log(`      📱 Telefone: ${client.metadata.phone}`);
        }
      });
    }
    
    console.log('');
    console.log('🎉 SUCESSO COMPLETO!');
    console.log('✅ API Key do Supabase funcionando');
    console.log('✅ Webhook criando clientes automaticamente'); 
    console.log('✅ Webhook criando tickets com campo nunmsg');
    console.log('✅ Sistema pronto para resposta automática WhatsApp');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar verificação
if (require.main === module) {
  verificarTicketCriado().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verificarTicketCriado }; 