const { createClient } = require('@supabase/supabase-js');

// CONFIGURAÇÕES DO SUPABASE (mesmas do webhook)
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU';

async function testarAPIKey() {
  console.log('🔧 Testando API Key do Supabase...');
  console.log('📍 URL:', supabaseUrl);
  console.log('🔑 Key role:', supabaseKey.includes('service_role') ? 'service_role' : 'anon');
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Teste 1: Verificar conexão
    console.log('\n📡 Teste 1: Verificando conexão com Supabase...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error);
      return false;
    }
    
    console.log('✅ Conexão OK');
    
    // Teste 2: Tentar criar um cliente de teste
    console.log('\n👤 Teste 2: Tentando criar cliente de teste...');
    const testClientData = {
      id: crypto.randomUUID(),
      role: 'customer',
      email: `teste-api-key-${Date.now()}@auto-generated.com`,
      name: 'Teste API Key',
      metadata: {
        phone: '5511999887766',
        auto_created: true,
        created_from: 'teste_api_key'
      }
    };
    
    const { data: newClient, error: clientError } = await supabase
      .from('profiles')
      .insert([testClientData])
      .select()
      .single();
    
    if (clientError) {
      console.error('❌ Erro ao criar cliente:', clientError);
      return false;
    }
    
    console.log('✅ Cliente criado:', newClient.id);
    
    // Teste 3: Tentar criar um ticket de teste
    console.log('\n🎫 Teste 3: Tentando criar ticket de teste...');
    const testTicketData = {
      id: crypto.randomUUID(),
      title: 'Teste API Key - Nunmsg',
      description: 'Teste para verificar se o campo nunmsg funciona',
      status: 'open',
      priority: 'normal',
      channel: 'whatsapp',
      customer_id: newClient.id,
      nunmsg: '+5511999887766', // 📱 TESTANDO CAMPO NUNMSG
      metadata: {
        teste_api_key: true,
        created_from: 'teste_automatizado'
      }
    };
    
    const { data: newTicket, error: ticketError } = await supabase
      .from('tickets')
      .insert([testTicketData])
      .select()
      .single();
    
    if (ticketError) {
      console.error('❌ Erro ao criar ticket:', ticketError);
      return false;
    }
    
    console.log('✅ Ticket criado:', newTicket.id);
    console.log('📱 Campo nunmsg salvo:', newTicket.nunmsg);
    
    // Limpeza: Remover dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await supabase.from('tickets').delete().eq('id', newTicket.id);
    await supabase.from('profiles').delete().eq('id', newClient.id);
    console.log('✅ Limpeza concluída');
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ API Key está funcionando corretamente');
    console.log('✅ Webhook deve conseguir criar clientes e tickets');
    console.log('✅ Campo nunmsg está funcional');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  const crypto = require('crypto');
  testarAPIKey().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testarAPIKey }; 