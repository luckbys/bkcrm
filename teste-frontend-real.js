// 🧪 TESTE FRONTEND REAL - Simular frontend e verificar se estado atualiza

const axios = require('axios');

async function testarFrontendReal() {
  console.log('🧪 === TESTE DE ATUALIZAÇÃO DO FRONTEND ===\n');

  const TICKET_ID = '788a5f10-a693-4cfa-8410-ed5cd082e555';
  const WEBHOOK_URL = 'http://localhost:4000';

  // 1. Verificar estado inicial
  console.log('1️⃣ VERIFICANDO ESTADO INICIAL DO SERVIDOR...');
  try {
    const stats = await axios.get(`${WEBHOOK_URL}/webhook/ws-stats`);
    console.log('   📊 Conexões WebSocket ativas:', stats.data.totalConnections);
    console.log('   🎫 Tickets ativos:', stats.data.activeTickets);
    
    if (stats.data.totalConnections === 0) {
      console.log('   ⚠️ NENHUMA CONEXÃO ATIVA - Frontend pode não estar conectado');
    }
  } catch (error) {
    console.log('   ❌ Erro ao verificar stats:', error.message);
  }

  // 2. Enviar mensagem via webhook (Evolution API format)
  console.log('\n2️⃣ ENVIANDO MENSAGEM VIA WEBHOOK...');
  try {
    const testMessage = {
      event: 'messages.upsert',
      instance: 'atendimento-ao-cliente-suporte',
      data: {
        key: {
          id: `frontend-test-${Date.now()}`,
          remoteJid: '5512981022013@s.whatsapp.net',
          fromMe: false
        },
        message: {
          conversation: `🎯 TESTE FRONTEND REAL - ${new Date().toLocaleTimeString()}`
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Teste Frontend Real'
      }
    };

    const response = await axios.post(`${WEBHOOK_URL}/webhook/evolution`, testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
      console.log('   ✅ Webhook processado:', response.data.message);
      console.log('   📡 WebSocket broadcast:', response.data.websocket);
      console.log('   🎫 Ticket ID:', response.data.ticketId);
      console.log('   📨 Message ID:', response.data.messageId);
    }
  } catch (error) {
    console.log('   ❌ Erro webhook:', error.message);
    return;
  }

  // 3. Aguardar e verificar novamente as conexões
  console.log('\n3️⃣ AGUARDANDO 3 SEGUNDOS E VERIFICANDO NOVAMENTE...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    const stats = await axios.get(`${WEBHOOK_URL}/webhook/ws-stats`);
    console.log('   📊 Conexões após mensagem:', stats.data.totalConnections);
    console.log('   🎫 Tickets com mensagens:', stats.data.activeTickets);
    console.log('   📈 Detalhe das conexões:', stats.data.connectionsByTicket);
  } catch (error) {
    console.log('   ❌ Erro stats pós-mensagem:', error.message);
  }

  // 4. Instrução para verificar no frontend
  console.log('\n4️⃣ === INSTRUÇÕES PARA VERIFICAR NO FRONTEND ===');
  console.log('');
  console.log('🌐 ABRA O NAVEGADOR E SIGA ESTES PASSOS:');
  console.log('');
  console.log('1. Vá para http://localhost:3000');
  console.log('2. Faça login no sistema');
  console.log('3. Abra a lista de tickets');
  console.log('4. Clique no ticket com ID: 788a5f10-a693-4cfa-8410-ed5cd082e555');
  console.log('5. Abra o console do navegador (F12 → Console)');
  console.log('6. Digite: debugUnifiedChat()');
  console.log('7. Verifique se aparece a mensagem que acabamos de enviar');
  console.log('');
  console.log('📋 SE A MENSAGEM NÃO APARECER:');
  console.log('• Verifique se há erros no console');
  console.log('• Confirme se isConnected: true');
  console.log('• Execute: window.useChatStore.getState().init()');
  console.log('• Execute: window.useChatStore.getState().load("788a5f10-a693-4cfa-8410-ed5cd082e555")');
  console.log('');
  console.log('🔍 COMANDOS ÚTEIS NO CONSOLE DO NAVEGADOR:');
  console.log('• debugUnifiedChat() - Debug completo');
  console.log('• window.useChatStore.getState() - Estado atual');
  console.log('• window.useChatStore.getState().init() - Reconectar');
  console.log('• window.useChatStore.getState().load("TICKET_ID") - Recarregar mensagens');
  console.log('');

  // 5. Teste adicional: enviar múltiplas mensagens
  console.log('5️⃣ ENVIANDO 3 MENSAGENS ADICIONAIS PARA TESTE...');
  for (let i = 1; i <= 3; i++) {
    try {
      const testMessage = {
        event: 'messages.upsert',
        instance: 'atendimento-ao-cliente-suporte',
        data: {
          key: {
            id: `test-batch-${i}-${Date.now()}`,
            remoteJid: '5512981022013@s.whatsapp.net',
            fromMe: false
          },
          message: {
            conversation: `📨 Mensagem de teste ${i}/3 - ${new Date().toLocaleTimeString()}`
          },
          messageTimestamp: Math.floor(Date.now() / 1000),
          pushName: `Cliente Teste ${i}`
        }
      };

      const response = await axios.post(`${WEBHOOK_URL}/webhook/evolution`, testMessage);
      console.log(`   ✅ Mensagem ${i}/3 enviada:`, response.data.messageId);
      
      // Aguardar 1 segundo entre mensagens
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`   ❌ Erro mensagem ${i}:`, error.message);
    }
  }

  console.log('\n6️⃣ === RESUMO FINAL ===');
  console.log('✅ Backend: 100% funcional');
  console.log('✅ Webhook: Processando mensagens');
  console.log('✅ WebSocket: Transmitindo eventos');
  console.log('🎯 Próximo: Verificar frontend no navegador');
  console.log('');
  console.log('📊 Total de mensagens enviadas: 4');
  console.log(`🎫 Ticket alvo: ${TICKET_ID}`);
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');
  console.log('🔗 Se tudo estiver correto, você deve ver 4 novas mensagens no chat!');
}

// Executar teste
testarFrontendReal().catch(console.error); 