// 🔍 DEBUG: Por que mensagens não aparecem no frontend?
// Script para diagnosticar o fluxo completo de mensagens

async function debugFrontendMensagens() {
  console.log('🔍 DIAGNOSTICANDO MENSAGENS NO FRONTEND...\n');

  // 1. Verificar se o WebSocket está funcionando
  console.log('1️⃣ VERIFICANDO WEBSOCKET');
  try {
    const wsStats = await fetch('http://localhost:4000/webhook/ws-stats');
    if (wsStats.ok) {
      const data = await wsStats.json();
      console.log('   ✅ WebSocket Status:', data.status);
      console.log('   🔗 Conexões ativas:', data.totalConnections);
      console.log('   🎫 Tickets ativos:', data.activeTickets);
      console.log('   📊 Stats por ticket:', data.ticketStats);
    }
  } catch (error) {
    console.log('   ❌ Erro WebSocket:', error.message);
  }

  console.log('\n');

  // 2. Verificar mensagens no banco de dados
  console.log('2️⃣ VERIFICANDO MENSAGENS NO BANCO');
  const ticketId = '788a5f10-a693-4cfa-8410-ed5cd082e555'; // ID do ticket de teste
  
  try {
    // Simular busca no Supabase (você pode adaptar conforme sua implementação)
    console.log('   📋 Ticket ID:', ticketId);
    console.log('   🔍 Verificando últimas mensagens...');
    
    // Você pode adicionar aqui uma chamada real para o Supabase
    console.log('   ⚠️ Implementar busca real no Supabase aqui');
  } catch (error) {
    console.log('   ❌ Erro banco:', error.message);
  }

  console.log('\n');

  // 3. Testar envio de mensagem via webhook
  console.log('3️⃣ TESTANDO ENVIO VIA WEBHOOK');
  try {
    const testMessage = {
      event: 'messages.upsert',
      instance: 'atendimento-ao-cliente-suporte',
      data: {
        key: {
          id: `debug-test-${Date.now()}`,
          remoteJid: '5512981022013@s.whatsapp.net',
          fromMe: false
        },
        message: {
          conversation: `🧪 TESTE DEBUG FRONTEND - ${new Date().toLocaleTimeString()}`
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Debug Frontend Test'
      }
    };

    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Webhook Response:', result.message);
      console.log('   📡 WebSocket Broadcast:', result.websocket);
      console.log('   🎫 Ticket ID:', result.ticketId);
    } else {
      console.log('   ❌ Erro webhook:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('   ❌ Erro teste:', error.message);
  }

  console.log('\n');

  // 4. Verificar configuração do frontend
  console.log('4️⃣ VERIFICANDO CONFIGURAÇÃO FRONTEND');
  console.log('   📋 Checklist:');
  console.log('   □ Socket.IO client instalado no frontend?');
  console.log('   □ Conexão WebSocket configurada para localhost:4000?');
  console.log('   □ Frontend está escutando evento "new-message"?');
  console.log('   □ Estado das mensagens sendo atualizado corretamente?');
  console.log('   □ Componente de chat renderizando as mensagens?');

  console.log('\n');

  // 5. Logs do navegador
  console.log('5️⃣ VERIFICAR LOGS DO NAVEGADOR');
  console.log('   🌐 Abra o console do navegador e verifique:');
  console.log('   • Erros de conexão WebSocket');
  console.log('   • Mensagens sendo recebidas via Socket.IO');
  console.log('   • Estado do chat sendo atualizado');
  console.log('   • Renderização dos componentes React');

  console.log('\n');

  // 6. Teste de conectividade
  console.log('6️⃣ TESTE DE CONECTIVIDADE COMPLETO');
  try {
    // Health check
    const health = await fetch('http://localhost:4000/webhook/health');
    if (health.ok) {
      const healthData = await health.json();
      console.log('   ✅ Server Health:', healthData.status);
      console.log('   📋 Endpoints disponíveis:', healthData.endpoints);
    }

    // Test all endpoints
    const endpoints = [
      '/webhook/evolution',
      '/webhook/evolution/connection-update',
      '/webhook/evolution/messages-upsert'
    ];

    for (const endpoint of endpoints) {
      try {
        const testReq = await fetch(`http://localhost:4000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        console.log(`   ${testReq.ok ? '✅' : '❌'} ${endpoint}: ${testReq.status}`);
      } catch (err) {
        console.log(`   ❌ ${endpoint}: ${err.message}`);
      }
    }
  } catch (error) {
    console.log('   ❌ Erro conectividade:', error.message);
  }

  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Verificar logs do navegador (F12 → Console)');
  console.log('2. Confirmar se frontend está conectado ao WebSocket');
  console.log('3. Verificar se componente de chat está renderizando mensagens');
  console.log('4. Testar com ticket real aberto na interface');
  console.log('5. Verificar se Socket.IO está instalado no frontend');
}

// Função para simular envio de mensagem real
async function simularMensagemReal() {
  console.log('📱 SIMULANDO MENSAGEM REAL DA EVOLUTION API...\n');

  const mensagemReal = {
    event: 'messages.upsert',
    instance: 'atendimento-ao-cliente-suporte',
    data: {
      key: {
        id: '3EB0D603A48F1D832046DE193A44BAA41EC22E19',
        remoteJid: '5512981022013@s.whatsapp.net',
        fromMe: false,
        participant: '5512981022013@s.whatsapp.net'
      },
      message: {
        conversation: `🔥 MENSAGEM REAL TESTE FRONTEND - ${new Date().toLocaleTimeString()}`
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Cliente Real WhatsApp',
      status: 'PENDING'
    },
    destination: 'https://bkcrm.devsible.com.br/webhook',
    date_time: new Date().toISOString(),
    sender: '5512981022013@s.whatsapp.net',
    server_url: 'https://press-evolution-api.jhkbgs.easypanel.host',
    apikey: '5CFA92D7-A434-43E8-8D3F-2482FA7E1B28'
  };

  try {
    const response = await fetch('http://localhost:4000/webhook/evolution', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mensagemReal)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Mensagem enviada com sucesso!');
      console.log('📊 Resultado:', result);
      console.log('\n🎯 AGORA VERIFIQUE NO FRONTEND:');
      console.log('1. Abra o chat do ticket 788a5f10-a693-4cfa-8410-ed5cd082e555');
      console.log('2. A mensagem deve aparecer instantaneamente');
      console.log('3. Se não aparecer, verifique console do navegador');
    } else {
      console.log('❌ Erro ao enviar mensagem:', response.status);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

// Executar diagnóstico
console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO...\n');
debugFrontendMensagens()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTE ADICIONAL: Enviar mensagem real');
    console.log('='.repeat(60));
    return simularMensagemReal();
  })
  .catch(console.error); 