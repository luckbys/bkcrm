// 🔍 DIAGNÓSTICO: Por que mensagens não chegam no CRM
// Execute: diagnoseMessagesIssue() no console do navegador

interface DiagnosticResult {
  step: string;
  status: 'OK' | 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

export const diagnoseMessagesIssue = async (): Promise<void> => {
  console.log('🔍 [DIAGNÓSTICO] Iniciando análise de mensagens não chegando...');
  console.log('='.repeat(60));
  
  const results: DiagnosticResult[] = [];
  
  // 1. Verificar se WebSocket está conectado
  console.log('1️⃣ Verificando conexão WebSocket...');
  try {
    const chatStore = (window as any).useChatStore?.getState?.();
    if (chatStore?.isConnected) {
      results.push({
        step: 'WebSocket Connection',
        status: 'OK',
        message: 'WebSocket conectado',
        details: { socketId: chatStore.socket?.id }
      });
      console.log('✅ WebSocket conectado:', chatStore.socket?.id);
    } else {
      results.push({
        step: 'WebSocket Connection',
        status: 'ERROR',
        message: 'WebSocket não conectado',
        details: { isConnected: chatStore?.isConnected, error: chatStore?.error }
      });
      console.log('❌ WebSocket não conectado');
    }
  } catch (error) {
    results.push({
      step: 'WebSocket Connection',
      status: 'ERROR',
      message: 'Erro ao verificar WebSocket',
      details: error
    });
    console.log('❌ Erro ao verificar WebSocket:', error);
  }
  
  // 2. Testar servidor WebSocket
  console.log('2️⃣ Testando servidor WebSocket...');
  try {
    const isLocal = window.location.hostname === 'localhost';
    const healthUrl = isLocal 
      ? 'http://localhost:4000/webhook/health'
      : 'https://websocket.bkcrm.devsible.com.br/webhook/health';
    
    const response = await fetch(healthUrl);
    const data = await response.json();
    
    if (data.status === 'healthy') {
      results.push({
        step: 'WebSocket Server',
        status: 'OK',
        message: 'Servidor WebSocket funcionando',
        details: data
      });
      console.log('✅ Servidor WebSocket OK:', data);
    } else {
      results.push({
        step: 'WebSocket Server',
        status: 'WARNING',
        message: 'Servidor com problemas',
        details: data
      });
      console.log('⚠️ Servidor com problemas:', data);
    }
  } catch (error) {
    results.push({
      step: 'WebSocket Server',
      status: 'ERROR',
      message: 'Servidor WebSocket inacessível',
      details: error
    });
    console.log('❌ Servidor WebSocket inacessível:', error);
  }
  
  // 3. Verificar webhook Evolution API
  console.log('3️⃣ Testando webhook Evolution API...');
  try {
    const isLocal = window.location.hostname === 'localhost';
    const webhookUrl = isLocal 
      ? 'http://localhost:4000/webhook/evolution'
      : 'https://websocket.bkcrm.devsible.com.br/webhook/evolution';
    
    // Enviar mensagem de teste
    const testPayload = {
      event: 'MESSAGES_UPSERT',
      instance: 'atendimento-ao-cliente-suporte',
      data: {
        key: {
          id: 'TEST_' + Date.now(),
          remoteJid: '5511999887766@s.whatsapp.net',
          fromMe: false
        },
        message: {
          conversation: '🧪 Teste de diagnóstico - ' + new Date().toLocaleTimeString()
        },
        messageTimestamp: Date.now(),
        pushName: 'Teste Diagnóstico'
      }
    };
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const data = await response.json();
    
    if (data.received && data.processed) {
      results.push({
        step: 'Webhook Evolution',
        status: 'OK',
        message: 'Webhook processando mensagens',
        details: data
      });
      console.log('✅ Webhook OK:', data);
    } else {
      results.push({
        step: 'Webhook Evolution',
        status: 'WARNING',
        message: 'Webhook recebeu mas não processou',
        details: data
      });
      console.log('⚠️ Webhook com problemas:', data);
    }
  } catch (error) {
    results.push({
      step: 'Webhook Evolution',
      status: 'ERROR',
      message: 'Erro no webhook Evolution API',
      details: error
    });
    console.log('❌ Erro no webhook:', error);
  }
  
  // 4. Verificar banco de dados
  console.log('4️⃣ Verificando mensagens no banco...');
  try {
    const { supabase } = await import('../lib/supabase');
    
    // Buscar mensagens recentes
    const { data: recentMessages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    results.push({
      step: 'Database Messages',
      status: 'OK',
      message: `${recentMessages?.length || 0} mensagens recentes encontradas`,
      details: recentMessages
    });
    console.log('✅ Mensagens no banco:', recentMessages?.length);
    
    if (recentMessages && recentMessages.length > 0) {
      console.log('📨 Últimas mensagens:', recentMessages);
    }
  } catch (error) {
    results.push({
      step: 'Database Messages',
      status: 'ERROR',
      message: 'Erro ao acessar banco de dados',
      details: error
    });
    console.log('❌ Erro no banco:', error);
  }
  
  // 5. Verificar tickets
  console.log('5️⃣ Verificando tickets...');
  try {
    const { supabase } = await import('../lib/supabase');
    
    // Buscar tickets recentes
    const { data: recentTickets, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    results.push({
      step: 'Database Tickets',
      status: 'OK',
      message: `${recentTickets?.length || 0} tickets recentes encontrados`,
      details: recentTickets
    });
    console.log('✅ Tickets no banco:', recentTickets?.length);
    
    if (recentTickets && recentTickets.length > 0) {
      console.log('🎫 Últimos tickets:', recentTickets);
    }
  } catch (error) {
    results.push({
      step: 'Database Tickets',
      status: 'ERROR',
      message: 'Erro ao acessar tickets',
      details: error
    });
    console.log('❌ Erro nos tickets:', error);
  }
  
  // 6. Resumo do diagnóstico
  console.log('='.repeat(60));
  console.log('📊 RESUMO DO DIAGNÓSTICO:');
  console.log('='.repeat(60));
  
  const errors = results.filter(r => r.status === 'ERROR');
  const warnings = results.filter(r => r.status === 'WARNING');
  const successes = results.filter(r => r.status === 'OK');
  
  console.log(`✅ Sucessos: ${successes.length}`);
  console.log(`⚠️ Avisos: ${warnings.length}`);
  console.log(`❌ Erros: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n🚨 PROBLEMAS CRÍTICOS ENCONTRADOS:');
    errors.forEach(error => {
      console.log(`❌ ${error.step}: ${error.message}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️ AVISOS:');
    warnings.forEach(warning => {
      console.log(`⚠️ ${warning.step}: ${warning.message}`);
    });
  }
  
  // 7. Recomendações
  console.log('\n💡 RECOMENDAÇÕES:');
  
  if (errors.some(e => e.step === 'WebSocket Connection')) {
    console.log('🔧 1. Reiniciar conexão WebSocket: useChatStore.getState().init()');
  }
  
  if (errors.some(e => e.step === 'WebSocket Server')) {
    console.log('🔧 2. Verificar se servidor WebSocket está rodando na porta 4000');
    console.log('   Execute: cd backend/webhooks && node webhook-evolution-websocket.js');
  }
  
  if (errors.some(e => e.step === 'Webhook Evolution')) {
    console.log('🔧 3. Verificar configuração do webhook na Evolution API');
    console.log('   URL deve ser: http://localhost:4000/webhook/evolution (local)');
    console.log('   ou: https://websocket.bkcrm.devsible.com.br/webhook/evolution (produção)');
  }
  
  if (errors.some(e => e.step.includes('Database'))) {
    console.log('🔧 4. Verificar conexão com Supabase e estrutura do banco');
  }
  
  console.log('\n🔍 Para mais detalhes, execute: diagnoseMessagesIssue()');
  
  // Expor resultados globalmente para análise
  (window as any).lastDiagnosticResults = results;
  
  return;
};

// Função para testar envio de mensagem específica
export const testMessageSending = async (ticketId: string, content: string = 'Teste de mensagem'): Promise<void> => {
  console.log('📤 [TESTE] Enviando mensagem de teste...');
  
  try {
    const chatStore = (window as any).useChatStore?.getState?.();
    
    if (chatStore?.send) {
      await chatStore.send(ticketId, content, false);
      console.log('✅ [TESTE] Mensagem enviada via chatStore');
    } else {
      console.log('❌ [TESTE] chatStore.send não disponível');
    }
  } catch (error) {
    console.error('❌ [TESTE] Erro ao enviar mensagem:', error);
  }
};

// Função para monitorar mensagens em tempo real
export const monitorMessages = (): void => {
  console.log('👁️ [MONITOR] Iniciando monitoramento de mensagens...');
  
  const chatStore = (window as any).useChatStore?.getState?.();
  
  if (chatStore?.socket) {
    // Monitorar eventos WebSocket
    chatStore.socket.on('new-message', (message: any) => {
      console.log('📨 [MONITOR] Nova mensagem recebida:', message);
    });
    
    chatStore.socket.on('messages-loaded', (data: any) => {
      console.log('📋 [MONITOR] Mensagens carregadas:', data);
    });
    
    console.log('✅ [MONITOR] Monitoramento ativo. Verifique o console para novas mensagens.');
  } else {
    console.log('❌ [MONITOR] WebSocket não conectado');
  }
};

// Expor funções globalmente
(window as any).diagnoseMessagesIssue = diagnoseMessagesIssue;
(window as any).testMessageSending = testMessageSending;
(window as any).monitorMessages = monitorMessages;

console.log('🔧 [DIAGNÓSTICO] Funções de diagnóstico carregadas:');
console.log('📊 diagnoseMessagesIssue() - Diagnóstico completo');
console.log('📤 testMessageSending(ticketId, content) - Testar envio');
console.log('👁️ monitorMessages() - Monitorar mensagens em tempo real'); 