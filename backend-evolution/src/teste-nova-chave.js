// 🧪 TESTE DA NOVA CHAVE SUPABASE FORNECIDA PELO USUÁRIO
// Para executar: node teste-nova-chave.js

const { createClient } = require('@supabase/supabase-js');

// ✅ NOVA CHAVE FORNECIDA PELO USUÁRIO
const SUPABASE_URL = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';

async function testSupabaseConnection() {
  console.log('🔧 [TESTE] Testando nova chave Supabase...');
  console.log(`📊 URL: ${SUPABASE_URL}`);
  console.log(`🔑 Key: ${SUPABASE_KEY.substring(0, 20)}...`);
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    // 1. Teste de conexão básica
    console.log('\n📡 [TESTE 1] Testando conexão básica...');
    const { data: testData, error: testError } = await supabase
      .from('tickets')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ [TESTE 1] Erro na conexão:', testError.message);
      return false;
    }
    
    console.log('✅ [TESTE 1] Conexão básica OK');
    
    // 2. Teste de leitura de mensagens
    console.log('\n📨 [TESTE 2] Testando leitura de mensagens...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);
    
    if (msgError) {
      console.error('❌ [TESTE 2] Erro ao ler mensagens:', msgError.message);
      return false;
    }
    
    console.log(`✅ [TESTE 2] Leitura de mensagens OK - ${messages.length} mensagens encontradas`);
    
    if (messages.length > 0) {
      console.log('📋 [EXEMPLO] Primeira mensagem:');
      const msg = messages[0];
      console.log(`   ID: ${msg.id}`);
      console.log(`   Ticket: ${msg.ticket_id}`);
      console.log(`   Conteúdo: ${msg.content ? msg.content.substring(0, 50) : 'N/A'}...`);
      console.log(`   Data: ${msg.created_at}`);
    }
    
    // 3. Teste de leitura de tickets
    console.log('\n🎫 [TESTE 3] Testando leitura de tickets...');
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .limit(5);
    
    if (ticketError) {
      console.error('❌ [TESTE 3] Erro ao ler tickets:', ticketError.message);
      return false;
    }
    
    console.log(`✅ [TESTE 3] Leitura de tickets OK - ${tickets.length} tickets encontrados`);
    
    if (tickets.length > 0) {
      console.log('📋 [EXEMPLO] Primeiro ticket:');
      const ticket = tickets[0];
      console.log(`   ID: ${ticket.id}`);
      console.log(`   Cliente: ${ticket.customer_name || 'N/A'}`);
      console.log(`   Status: ${ticket.status || 'N/A'}`);
      console.log(`   Data: ${ticket.created_at}`);
    }
    
    // 4. Teste de inserção (se for possível com esta chave)
    console.log('\n💾 [TESTE 4] Testando inserção de teste...');
    const testMessage = {
      ticket_id: 'test-ticket-' + Date.now(),
      content: 'Mensagem de teste - ' + new Date().toISOString(),
      sender_id: 'test-user',
      sender_name: 'Teste',
      type: 'text',
      is_internal: true
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('messages')
      .insert([testMessage])
      .select();
    
    if (insertError) {
      console.warn('⚠️ [TESTE 4] Não foi possível inserir (provavelmente chave apenas de leitura):', insertError.message);
    } else {
      console.log('✅ [TESTE 4] Inserção OK - ID:', insertData[0]?.id);
      
      // Limpeza: remover mensagem de teste
      await supabase
        .from('messages')
        .delete()
        .eq('id', insertData[0]?.id);
      console.log('🧹 [LIMPEZA] Mensagem de teste removida');
    }
    
    console.log('\n🎉 [RESULTADO] Testes concluídos com sucesso!');
    console.log('✅ A nova chave está funcionando corretamente');
    return true;
    
  } catch (error) {
    console.error('💥 [ERRO GERAL]', error.message);
    return false;
  }
}

// Executar teste
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n🚀 [CONCLUSÃO] Chave Supabase válida! Você pode reiniciar o WebSocket agora.');
    } else {
      console.log('\n❌ [CONCLUSÃO] Problemas encontrados com a chave.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 [FATAL]', error);
    process.exit(1);
  }); 