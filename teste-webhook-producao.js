const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testarWebhookProducao() {
  console.log('🔍 TESTANDO WEBHOOK DE PRODUÇÃO');
  console.log('================================');
  
  const baseUrl = 'https://bkcrm.devsible.com.br';
  const endpoints = [
    '/webhook/evolution/messages-upsert',
    '/webhook/messages-upsert',
    '/webhook/evolution'
  ];
  
  const payload = {
    event: 'MESSAGES_UPSERT',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        remoteJid: '5511999999999@s.whatsapp.net',
        fromMe: false,
        id: 'TEST_ENDPOINT_' + Date.now()
      },
      message: {
        conversation: '🧪 Teste endpoint: ' + new Date().toLocaleString()
      },
      messageTimestamp: Date.now(),
      pushName: 'Cliente Teste Endpoint'
    }
  };

  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testando: ${endpoint}`);
      
      const response = await fetch(baseUrl + endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Processado: ${data.processed}`);
      console.log(`   Evento: ${data.event}`);
      console.log(`   Mensagem: ${data.message}`);
      
      if (data.processed === true) {
        console.log(`   ✅ SUCESSO: ${endpoint} funciona!`);
        return endpoint;
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
  
  console.log('\n❌ Nenhum endpoint funcionou corretamente');
  return null;
}

async function verificarCredenciais() {
  console.log('\n🔑 VERIFICANDO CREDENCIAIS SUPABASE');
  console.log('===================================');
  
  try {
    // Testar conexão com Supabase
    const response = await fetch('https://ajlgjjjvuglwgfnyqqvb.supabase.co/rest/v1/tickets?select=count', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU'
      }
    });

    if (response.ok) {
      console.log('✅ Supabase acessível');
      const data = await response.json();
      console.log('   Resposta:', data);
    } else {
      console.log('❌ Erro Supabase:', response.status);
      const error = await response.text();
      console.log('   Detalhes:', error);
    }
    
  } catch (error) {
    console.log('❌ Erro conexão Supabase:', error.message);
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTES COMPLETOS');
  console.log('=============================\n');
  
  // 1. Testar endpoints
  const endpointFuncional = await testarWebhookProducao();
  
  // 2. Verificar credenciais
  await verificarCredenciais();
  
  // 3. Resumo
  console.log('\n📊 RESUMO DOS TESTES');
  console.log('====================');
  
  if (endpointFuncional) {
    console.log('✅ Endpoint funcional encontrado:', endpointFuncional);
    console.log('💡 SOLUÇÃO: Usar este endpoint no webhook Evolution API');
  } else {
    console.log('❌ Nenhum endpoint funcionou');
    console.log('💡 PROBLEMA: Webhook produção com configuração incorreta');
    console.log('🔧 SOLUÇÃO: Verificar código do webhook produção');
  }
}

main().catch(console.error); 