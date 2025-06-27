// 🔍 DEBUG PRODUÇÃO - Comparar Evolution API real vs. simulação
console.log('🔍 Debug Produção carregado!');

const axios = require('axios');

// Dados de teste para simular mensagem real da Evolution API
const realEvolutionFormat = {
  event: "messages.upsert", // FORMATO REAL: messages.upsert (com ponto)
  instance: "atendimento-ao-cliente-suporte",
  data: {
    key: {
      id: "3EB0D603A48F1D832046DE193A44BAA41EC22E19",
      remoteJid: "5512981022013@s.whatsapp.net",
      fromMe: false,
      participant: "5512981022013@s.whatsapp.net"
    },
    message: {
      conversation: "🔥 MENSAGEM REAL DO WHATSAPP - Teste produção!"
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: "Cliente Real WhatsApp",
    status: "PENDING"
  },
  destination: "https://bkcrm.devsible.com.br/webhook",
  date_time: new Date().toISOString(),
  sender: "5512981022013@s.whatsapp.net",
  server_url: "https://evochat.devsible.com.br/",
  apikey: "5CFA92D7-A434-43E8-8D3F-2482FA7E1B28"
};

const simulatedFormat = {
  event: "MESSAGES_UPSERT", // FORMATO SIMULADO: MESSAGES_UPSERT (maiúsculo)
  instance: "atendimento-ao-cliente-suporte",
  data: {
    key: {
      id: `test-message-${Date.now()}`,
      remoteJid: "5512981022013@s.whatsapp.net", 
      fromMe: false
    },
    message: {
      conversation: "🧪 MENSAGEM SIMULADA - Teste desenvolvimento!"
    },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: "Cliente Teste Debug"
  }
};

async function testBothFormats() {
  console.log('🧪 === TESTE DOS DOIS FORMATOS ===\n');
  
  try {
    // 1. Testar formato real da Evolution API
    console.log('1️⃣ Testando formato REAL da Evolution API (messages.upsert)...');
    console.log('📦 Payload Real:', JSON.stringify(realEvolutionFormat, null, 2));
    
    const realResponse = await axios.post('http://localhost:4000/webhook/evolution', realEvolutionFormat);
    console.log('✅ Resposta formato REAL:', realResponse.data);
    console.log('');
    
    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Testar formato simulado
    console.log('2️⃣ Testando formato SIMULADO (MESSAGES_UPSERT)...');
    console.log('📦 Payload Simulado:', JSON.stringify(simulatedFormat, null, 2));
    
    const simulatedResponse = await axios.post('http://localhost:4000/webhook/evolution', simulatedFormat);
    console.log('✅ Resposta formato SIMULADO:', simulatedResponse.data);
    console.log('');
    
    // 3. Comparar resultados
    console.log('📊 === COMPARAÇÃO ===');
    console.log('Real processed:', realResponse.data.processed);
    console.log('Simulado processed:', simulatedResponse.data.processed);
    console.log('Real websocket:', realResponse.data.websocket);
    console.log('Simulado websocket:', simulatedResponse.data.websocket);
    
    if (realResponse.data.processed && !simulatedResponse.data.processed) {
      console.log('🎯 PROBLEMA IDENTIFICADO: Formato real funciona, simulado não!');
    } else if (!realResponse.data.processed && simulatedResponse.data.processed) {
      console.log('🎯 PROBLEMA IDENTIFICADO: Formato simulado funciona, real não!');
    } else if (realResponse.data.processed && simulatedResponse.data.processed) {
      console.log('✅ AMBOS FUNCIONAM: Problema pode estar na conexão WebSocket');
    } else {
      console.log('❌ NENHUM FUNCIONA: Problema no webhook');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

async function checkWebSocketConnections() {
  try {
    console.log('\n🔗 === VERIFICANDO CONEXÕES WEBSOCKET ===');
    const stats = await axios.get('http://localhost:4000/webhook/ws-stats');
    console.log('📊 Estatísticas WebSocket:', stats.data);
    
    if (stats.data.totalConnections === 0) {
      console.log('❌ PROBLEMA: Nenhuma conexão WebSocket ativa!');
      console.log('💡 SOLUÇÃO: Abra o UnifiedChatModal no browser primeiro');
    } else {
      console.log('✅ WebSocket tem conexões ativas');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar WebSocket:', error.message);
  }
}

async function fullDebug() {
  console.log('🚀 === DEBUG COMPLETO DE PRODUÇÃO ===\n');
  
  await checkWebSocketConnections();
  await testBothFormats();
  
  console.log('\n🎯 === PRÓXIMOS PASSOS ===');
  console.log('1. Certifique-se que o UnifiedChatModal está aberto no browser');
  console.log('2. Envie uma mensagem real do WhatsApp');
  console.log('3. Compare os logs do servidor com este teste');
  console.log('4. Se o formato real não funcionar, o problema está no webhook');
  console.log('5. Se funcionar, o problema está na Evolution API ou configuração');
}

// Executar automaticamente
fullDebug().catch(console.error); 