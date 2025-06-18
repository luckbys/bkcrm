import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: './webhook.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 VERIFICAÇÃO DE CLIENTES NO BANCO DE DADOS');
console.log('================================================');

async function verificarClientes() {
  try {
    // Buscar cliente com o número de teste
    const numeroTeste = '5511987654321';
    
    console.log(`📞 Buscando cliente com número: ${numeroTeste}`);
    
    const { data: cliente, error: clienteError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', numeroTeste)
      .order('created_at', { ascending: false })
      .limit(1);

    if (clienteError) {
      console.error('❌ Erro ao buscar cliente:', clienteError.message);
      return;
    }

    if (cliente && cliente.length > 0) {
      console.log('\n✅ CLIENTE ENCONTRADO:');
      console.log('📋 Dados do cliente:');
      console.log('  ID:', cliente[0].id);
      console.log('  Nome:', cliente[0].name);
      console.log('  Telefone:', cliente[0].phone);
      console.log('  Email:', cliente[0].email);
      console.log('  Status:', cliente[0].status);
      console.log('  Categoria:', cliente[0].category);
      console.log('  Canal:', cliente[0].channel);
      console.log('  Criado em:', cliente[0].created_at);
      console.log('  Tags:', cliente[0].tags);
      console.log('  Metadata:', JSON.stringify(cliente[0].metadata, null, 2));
    } else {
      console.log('\n❌ CLIENTE NÃO ENCONTRADO');
      console.log(`💡 Nenhum cliente encontrado com o número ${numeroTeste}`);
    }

    // Buscar tickets relacionados ao número
    console.log('\n🎫 BUSCANDO TICKETS RELACIONADOS...');
    
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, metadata, created_at, customer_id')
      .or(`metadata->>'whatsapp_phone.eq.${numeroTeste},metadata->>'client_phone.eq.${numeroTeste}`)
      .order('created_at', { ascending: false })
      .limit(3);

    if (ticketsError) {
      console.error('❌ Erro ao buscar tickets:', ticketsError.message);
      return;
    }

    if (tickets && tickets.length > 0) {
      console.log(`\n✅ ENCONTRADOS ${tickets.length} TICKETS:`);
      tickets.forEach((ticket, index) => {
        console.log(`\n📋 Ticket ${index + 1}:`);
        console.log('  ID:', ticket.id);
        console.log('  Título:', ticket.title);
        console.log('  Customer ID:', ticket.customer_id);
        console.log('  Criado em:', ticket.created_at);
        console.log('  Metadata:', JSON.stringify(ticket.metadata, null, 2));
      });
    } else {
      console.log('\n❌ NENHUM TICKET ENCONTRADO');
      console.log(`💡 Nenhum ticket encontrado para o número ${numeroTeste}`);
    }

    // Buscar todos os clientes criados recentemente (últimos 10)
    console.log('\n📊 ÚLTIMOS CLIENTES CRIADOS:');
    
    const { data: recentClientes, error: recentError } = await supabase
      .from('customers')
      .select('id, name, phone, email, created_at, channel, metadata')
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ Erro ao buscar clientes recentes:', recentError.message);
      return;
    }

    if (recentClientes && recentClientes.length > 0) {
      console.log(`\n📋 Últimos ${recentClientes.length} clientes:`);
      recentClientes.forEach((cliente, index) => {
        console.log(`\n${index + 1}. ${cliente.name}`);
        console.log(`   📞 ${cliente.phone}`);
        console.log(`   📧 ${cliente.email}`);
        console.log(`   📅 ${new Date(cliente.created_at).toLocaleString('pt-BR')}`);
        console.log(`   📡 Canal: ${cliente.channel || 'N/A'}`);
        
        if (cliente.metadata?.auto_created) {
          console.log('   🤖 Cliente criado automaticamente');
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar verificação
await verificarClientes();

console.log('\n✅ Verificação concluída!'); 