// 🧪 TESTE: Verificar conexão entre frontend e WebSocket
// Este script simula o frontend e verifica se mensagens chegam

const io = require('socket.io-client');
const axios = require('axios');

const WEBSOCKET_URL = 'http://localhost:4000';
const TICKET_ID = '788a5f10-a693-4cfa-8410-ed5cd082e555';

async function testarConexaoFrontend() {
  console.log('🧪 === TESTE DE CONEXÃO FRONTEND → WEBSOCKET ===\n');

  // 1. Conectar ao WebSocket como o frontend faria
  console.log('1️⃣ CONECTANDO AO WEBSOCKET...');
  const socket = io(WEBSOCKET_URL, {
    transports: ['websocket', 'polling'],
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000
  });

  let mensagemRecebida = false;
  let connectTrigger = false;

  // Configurar listeners (igual ao frontend)
  socket.on('connect', () => {
    console.log('   ✅ Conectado ao WebSocket!');
    connectTrigger = true;
    
    // Entrar no ticket (igual ao frontend)
    console.log(`   🔗 Entrando no ticket ${TICKET_ID}...`);
    socket.emit('join-ticket', { 
      ticketId: TICKET_ID, 
      userId: '00000000-0000-0000-0000-000000000001' 
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('   🔌 Desconectado:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('   ❌ Erro de conexão:', error.message);
  });

  // EVENTO CRÍTICO: new-message (igual ao frontend)
  socket.on('new-message', (data) => {
    console.log('\n📨 === MENSAGEM RECEBIDA VIA WEBSOCKET ===');
    console.log('📨 Dados completos:', JSON.stringify(data, null, 2));
    console.log('📨 Ticket ID:', data.ticketId || data.ticket_id);
    console.log('📨 Conteúdo:', data.content);
    console.log('📨 Remetente:', data.senderName || data.sender_name);
    console.log('📨 Tipo:', data.sender_id ? 'agent' : 'client');
    mensagemRecebida = true;
  });

  socket.on('joined-ticket', (data) => {
    console.log('   ✅ Entrou no ticket:', data);
    
    // Solicitar mensagens existentes
    console.log('   📥 Solicitando mensagens existentes...');
    socket.emit('request-messages', { ticketId: TICKET_ID, limit: 50 });
  });

  socket.on('messages-loaded', (data) => {
    console.log('\n📥 === MENSAGENS CARREGADAS ===');
    console.log(`📥 Total de mensagens: ${data.messages?.length || 0}`);
    if (data.messages && data.messages.length > 0) {
      console.log('📥 Últimas 3 mensagens:');
      data.messages.slice(-3).forEach((msg, index) => {
        console.log(`   ${index + 1}. ${msg.content?.substring(0, 50)} (${msg.sender_name || 'Unknown'})`);
      });
    }
  });

  socket.on('error', (error) => {
    console.error('   ❌ Erro do servidor:', error);
  });

  // 2. Aguardar conexão
  console.log('\n2️⃣ AGUARDANDO CONEXÃO...');
  await new Promise(resolve => {
    const checkInterval = setInterval(() => {
      if (connectTrigger) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
    
    // Timeout de 10 segundos
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 10000);
  });

  if (!connectTrigger) {
    console.log('   ❌ Falha na conexão após 10 segundos');
    socket.disconnect();
    return;
  }

  // 3. Enviar mensagem via webhook (simular Evolution API)
  console.log('\n3️⃣ ENVIANDO MENSAGEM VIA WEBHOOK...');
  try {
    const testMessage = {
      event: 'messages.upsert',
      instance: 'atendimento-ao-cliente-suporte',
      data: {
        key: {
          id: `test-frontend-${Date.now()}`,
          remoteJid: '5512981022013@s.whatsapp.net',
          fromMe: false
        },
        message: {
          conversation: `🔥 TESTE FRONTEND - ${new Date().toLocaleTimeString()}`
        },
        messageTimestamp: Math.floor(Date.now() / 1000),
        pushName: 'Cliente Teste Frontend'
      }
    };

    const response = await axios.post(`${WEBSOCKET_URL}/webhook/evolution`, testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 200) {
      console.log('   ✅ Webhook enviado com sucesso!');
      console.log('   📊 Response:', response.data.message);
    } else {
      console.log('   ❌ Erro no webhook:', response.status);
    }
  } catch (error) {
    console.log('   ❌ Erro ao enviar webhook:', error.message);
  }

  // 4. Aguardar mensagem por 15 segundos
  console.log('\n4️⃣ AGUARDANDO MENSAGEM POR 15 SEGUNDOS...');
  await new Promise(resolve => {
    let countdown = 15;
    const countInterval = setInterval(() => {
      if (mensagemRecebida) {
        console.log('\n   ✅ MENSAGEM RECEBIDA COM SUCESSO!');
        clearInterval(countInterval);
        resolve();
      } else {
        process.stdout.write(`\r   ⏳ Aguardando... ${countdown}s`);
        countdown--;
        if (countdown < 0) {
          console.log('\n   ❌ TIMEOUT: Mensagem não foi recebida');
          clearInterval(countInterval);
          resolve();
        }
      }
    }, 1000);
  });

  // 5. Resultado final
  console.log('\n5️⃣ === RESULTADO FINAL ===');
  if (mensagemRecebida) {
    console.log('✅ SUCESSO: O sistema está funcionando!');
    console.log('   • WebSocket conectado ✅');
    console.log('   • Ticket joinado ✅');
    console.log('   • Webhook processado ✅');
    console.log('   • Mensagem recebida via WebSocket ✅');
    console.log('\n🎯 O PROBLEMA ESTÁ NO FRONTEND:');
    console.log('   • Verifique se o componente está renderizando as mensagens');
    console.log('   • Verifique o console do navegador para erros');
    console.log('   • Confirme se o useChatStore está sendo usado corretamente');
  } else {
    console.log('❌ FALHA: Mensagem não chegou ao cliente WebSocket');
    console.log('   • Verifique se o frontend está se conectando ao ticket correto');
    console.log('   • Confirme se o evento "new-message" está sendo emitido');
    console.log('   • Verifique logs do servidor WebSocket');
  }

  // 6. Verificar estatísticas do servidor
  console.log('\n6️⃣ VERIFICANDO ESTATÍSTICAS DO SERVIDOR...');
  try {
    const statsResponse = await axios.get(`${WEBSOCKET_URL}/webhook/ws-stats`);
    if (statsResponse.status === 200) {
      console.log('📊 Estatísticas WebSocket:', JSON.stringify(statsResponse.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Erro ao obter estatísticas:', error.message);
  }

  // Desconectar
  console.log('\n🔌 Desconectando...');
  socket.disconnect();
  console.log('✅ Teste finalizado!\n');
}

// Executar teste
testarConexaoFrontend().catch(console.error); 