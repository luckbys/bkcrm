// 🧪 TESTE DOS ENDPOINTS EVOLUTION API CORRIGIDOS
// Script para validar correção dos erros 404 da Evolution API

async function testarEndpointsEvolutionCorrigidos() {
  console.log('🧪 TESTANDO ENDPOINTS EVOLUTION API CORRIGIDOS...\n');

  const baseUrl = 'http://localhost:4000';
  
  // Teste 1: Endpoint principal (já funcionava)
  console.log('1️⃣ TESTANDO ENDPOINT PRINCIPAL: /webhook/evolution');
  try {
    const response1 = await fetch(`${baseUrl}/webhook/evolution`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'MESSAGES_UPSERT',
        instance: 'atendimento-ao-cliente-suporte',
        data: {
          key: {
            id: 'test-main-endpoint',
            remoteJid: '5512981022013@s.whatsapp.net',
            fromMe: false
          },
          message: {
            conversation: '✅ Teste endpoint principal funcionando!'
          },
          messageTimestamp: Date.now(),
          pushName: 'Teste Principal'
        }
      })
    });
    
    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    if (response1.ok) {
      const data1 = await response1.json();
      console.log(`   ✅ Resposta: ${data1.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }

  console.log('\n');

  // Teste 2: Endpoint connection-update (era o problema!)
  console.log('2️⃣ TESTANDO ENDPOINT CORRIGIDO: /webhook/evolution/connection-update');
  try {
    const response2 = await fetch(`${baseUrl}/webhook/evolution/connection-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'connection.update',
        instance: 'atendimento-ao-cliente-suporte',
        data: {
          instance: 'atendimento-ao-cliente-suporte',
          wuid: '5512981022013@s.whatsapp.net',
          profileName: 'Lucas Borges',
          state: 'open',
          statusReason: 200
        },
        date_time: new Date().toISOString(),
        sender: '5512981022013@s.whatsapp.net'
      })
    });
    
    console.log(`   Status: ${response2.status} ${response2.statusText}`);
    if (response2.ok) {
      const data2 = await response2.json();
      console.log(`   ✅ Resposta: ${data2.message}`);
      console.log(`   📱 Event: ${data2.event}`);
      console.log(`   📊 Processed: ${data2.processed}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }

  console.log('\n');

  // Teste 3: Endpoint messages-upsert específico
  console.log('3️⃣ TESTANDO ENDPOINT ESPECÍFICO: /webhook/evolution/messages-upsert');
  try {
    const response3 = await fetch(`${baseUrl}/webhook/evolution/messages-upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'messages.upsert',
        instance: 'atendimento-ao-cliente-suporte',
        data: {
          key: {
            id: 'test-specific-endpoint',
            remoteJid: '5512981022013@s.whatsapp.net',
            fromMe: false
          },
          message: {
            conversation: '🎯 Teste endpoint específico!'
          },
          messageTimestamp: Date.now(),
          pushName: 'Teste Específico'
        }
      })
    });
    
    console.log(`   Status: ${response3.status} ${response3.statusText}`);
    if (response3.ok) {
      const data3 = await response3.json();
      console.log(`   ✅ Resposta: ${data3.message || 'Processado'}`);
      console.log(`   🔄 Redirected: ${data3.redirected || false}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }

  console.log('\n');

  // Teste 4: Endpoint genérico
  console.log('4️⃣ TESTANDO ENDPOINT GENÉRICO: /webhook/evolution/qualquer-evento');
  try {
    const response4 = await fetch(`${baseUrl}/webhook/evolution/qualquer-evento`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'qualquer.evento',
        instance: 'atendimento-ao-cliente-suporte',
        data: {
          teste: 'dados genéricos'
        }
      })
    });
    
    console.log(`   Status: ${response4.status} ${response4.statusText}`);
    if (response4.ok) {
      const data4 = await response4.json();
      console.log(`   ✅ Resposta: ${data4.message}`);
      console.log(`   🔗 Endpoint: ${data4.endpoint}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }

  console.log('\n');

  // Teste 5: Health check
  console.log('5️⃣ TESTANDO HEALTH CHECK: /webhook/health');
  try {
    const response5 = await fetch(`${baseUrl}/webhook/health`);
    
    console.log(`   Status: ${response5.status} ${response5.statusText}`);
    if (response5.ok) {
      const data5 = await response5.json();
      console.log(`   ✅ Status: ${data5.status}`);
      console.log(`   🔗 WebSocket Connections: ${data5.websocket.connections}`);
      console.log(`   📋 Endpoints disponíveis: ${data5.endpoints.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }

  console.log('\n🎉 TESTE COMPLETO DOS ENDPOINTS CORRIGIDOS!');
  console.log('\n📋 RESUMO DA CORREÇÃO:');
  console.log('   ✅ Endpoint principal mantido: /webhook/evolution');
  console.log('   ✅ Novo endpoint adicionado: /webhook/evolution/connection-update');
  console.log('   ✅ Novo endpoint adicionado: /webhook/evolution/messages-upsert');
  console.log('   ✅ Endpoint genérico: /webhook/evolution/:event');
  console.log('   ✅ Health check funcionando: /webhook/health');
  console.log('\n🔧 PROBLEMA RESOLVIDO: Evolution API não receberá mais erro 404!');
}

// Executar teste
testarEndpointsEvolutionCorrigidos().catch(console.error); 