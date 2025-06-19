/**
 * 🔍 VERIFICAR VINCULAÇÃO AUTOMÁTICA DE TELEFONE
 * 
 * Script Node.js para verificar se os telefones estão sendo
 * vinculados automaticamente aos tickets via webhook
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usar as credenciais do .env)
const SUPABASE_URL = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3MDcyMzcsImV4cCI6MjA0NTI4MzIzN30.Tr6nY-F63DWGNPv0dN49d4rlO7NwlMF8pprJLFh8rOQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificarVinculacaoTelefone() {
  console.log('🔍 === VERIFICAÇÃO VINCULAÇÃO AUTOMÁTICA DE TELEFONE ===\n');

  try {
    // 1. Buscar tickets WhatsApp recentes
    console.log('📋 1. BUSCANDO TICKETS WHATSAPP RECENTES:');
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('channel', 'whatsapp')
      .order('created_at', { ascending: false })
      .limit(10);

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError);
      return;
    }

    console.log(`   📊 Total de tickets WhatsApp encontrados: ${tickets.length}`);

    if (tickets.length === 0) {
      console.log('   ⚠️ Nenhum ticket WhatsApp encontrado');
      console.log('   💡 Envie uma mensagem WhatsApp primeiro para testar');
      return;
    }

    // 2. Analisar vinculação de telefones
    console.log('\n📱 2. ANÁLISE DE TELEFONES VINCULADOS:');
    
    let ticketsComTelefone = 0;
    let ticketsComCamposDiretos = 0;
    let ticketsComMetadados = 0;

    console.log('\n📋 DETALHES DOS TICKETS:');
    tickets.forEach((ticket, index) => {
      console.log(`\n   ${index + 1}. Ticket: ${ticket.id}`);
      console.log(`      Título: ${ticket.title}`);
      console.log(`      Cliente: ${ticket.client || 'N/A'}`);
      console.log(`      Status: ${ticket.status}`);
      console.log(`      Criado: ${new Date(ticket.created_at).toLocaleString()}`);
      
      // Verificar campos diretos
      const clientPhone = ticket.client_phone;
      const customerPhone = ticket.customerPhone;
      const isWhatsApp = ticket.isWhatsApp;
      
      console.log(`      Campo client_phone: ${clientPhone || 'N/A'}`);
      console.log(`      Campo customerPhone: ${customerPhone || 'N/A'}`);
      console.log(`      Campo isWhatsApp: ${isWhatsApp || 'N/A'}`);
      
      // Verificar metadados
      const metadados = ticket.metadata || {};
      const whatsappPhone = metadados.whatsapp_phone;
      const metadataClientPhone = metadados.client_phone;
      
      console.log(`      Metadata whatsapp_phone: ${whatsappPhone || 'N/A'}`);
      console.log(`      Metadata client_phone: ${metadataClientPhone || 'N/A'}`);
      console.log(`      Metadata instance_name: ${metadados.instance_name || 'N/A'}`);
      
      // Contadores
      if (clientPhone || customerPhone || whatsappPhone || metadataClientPhone) {
        ticketsComTelefone++;
        
        if (clientPhone || customerPhone) {
          ticketsComCamposDiretos++;
        }
        
        if (whatsappPhone || metadataClientPhone) {
          ticketsComMetadados++;
        }
      }
    });

    // 3. Estatísticas
    console.log('\n📊 3. ESTATÍSTICAS:');
    console.log(`   📋 Total de tickets: ${tickets.length}`);
    console.log(`   📱 Tickets com telefone: ${ticketsComTelefone}`);
    console.log(`   📞 Tickets com campos diretos: ${ticketsComCamposDiretos}`);
    console.log(`   📝 Tickets com telefone nos metadados: ${ticketsComMetadados}`);
    
    const percentualComTelefone = tickets.length > 0 ? 
      (ticketsComTelefone / tickets.length * 100).toFixed(1) : 0;
    
    console.log(`   📈 Percentual com telefone: ${percentualComTelefone}%`);

    // 4. Verificação do último ticket (mais recente)
    console.log('\n🔍 4. VERIFICAÇÃO DO ÚLTIMO TICKET:');
    const ultimoTicket = tickets[0];
    
    const temTelefone = Boolean(
      ultimoTicket.client_phone || 
      ultimoTicket.customerPhone ||
      ultimoTicket.metadata?.whatsapp_phone ||
      ultimoTicket.metadata?.client_phone
    );
    
    if (temTelefone) {
      console.log('   ✅ Último ticket TEM telefone vinculado');
      console.log('   ✅ Vinculação automática está funcionando!');
    } else {
      console.log('   ❌ Último ticket NÃO tem telefone vinculado');
      console.log('   ⚠️ Possível problema na vinculação automática');
    }

    // 5. Buscar mensagens do último ticket
    console.log('\n💬 5. MENSAGENS DO ÚLTIMO TICKET:');
    
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('ticket_id', ultimoTicket.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (messagesError) {
      console.error('   ❌ Erro ao buscar mensagens:', messagesError);
    } else {
      console.log(`   💬 Total de mensagens: ${messages.length}`);
      
      messages.forEach((msg, index) => {
        const phone = msg.metadata?.whatsapp_phone || 'N/A';
        console.log(`   ${index + 1}. "${msg.content?.substring(0, 50)}..." (${phone})`);
      });
    }

    console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
    
    // Conclusão
    if (ticketsComTelefone === tickets.length) {
      console.log('🎉 PERFEITO: Todos os tickets têm telefone vinculado!');
    } else if (ticketsComTelefone > 0) {
      console.log('⚠️ PARCIAL: Alguns tickets têm telefone vinculado');
      console.log('💡 Execute o script SQL para adicionar colunas se necessário');
    } else {
      console.log('❌ PROBLEMA: Nenhum ticket tem telefone vinculado');
      console.log('💡 Verifique se o webhook está funcionando corretamente');
    }

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

// Executar verificação
if (require.main === module) {
  verificarVinculacaoTelefone();
}

module.exports = { verificarVinculacaoTelefone }; 