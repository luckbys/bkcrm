
// 🔍 DEBUG PRODUÇÃO - Execute no console do navegador
function debugProducao() {
  console.log('🔍 DEBUG PRODUÇÃO');
  console.log('=================');
  
  // 1. Verificar se o hook está carregado
  console.log('\n1. 📢 Hook de notificações:');
  if (window.useRealtimeNotifications) {
    console.log('   ✅ Hook disponível');
  } else {
    console.log('   ❌ Hook não encontrado');
  }
  
  // 2. Verificar WebSocket
  console.log('\n2. 🔗 WebSocket:');
  if (window.chatStore && window.chatStore.socket) {
    console.log('   ✅ Socket disponível');
    console.log('   Status:', window.chatStore.socket.connected ? 'Conectado' : 'Desconectado');
  } else {
    console.log('   ❌ Socket não encontrado');
  }
  
  // 3. Verificar componente
  console.log('\n3. 🎯 Componente de notificações:');
  const notificationsElement = document.querySelector('[data-testid="notifications-dropdown"]') || 
                              document.querySelector('.notifications-dropdown');
  
  if (notificationsElement) {
    console.log('   ✅ Componente renderizado');
  } else {
    console.log('   ❌ Componente não encontrado');
  }
  
  // 4. Testar conexão WebSocket
  console.log('\n4. 🧪 Testando conexão WebSocket...');
  
  if (window.chatStore && window.chatStore.socket) {
    window.chatStore.socket.emit('test-connection', { message: 'Teste produção' });
    console.log('   📤 Teste enviado');
  }
  
  // 5. Verificar variáveis de ambiente
  console.log('\n5. 🌐 Variáveis de ambiente:');
  console.log('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌');
  
  // 6. Instruções
  console.log('\n6. 💡 PRÓXIMOS PASSOS:');
  console.log('   - Se hook não encontrado: verificar import');
  console.log('   - Se socket não conectado: verificar URL');
  console.log('   - Se componente não renderizado: verificar Header.tsx');
  console.log('   - Se variáveis não carregadas: verificar .env');
}

// Função para testar notificação manual
function testarNotificacaoManual() {
  console.log('🧪 TESTANDO NOTIFICAÇÃO MANUAL');
  
  if (window.chatStore && window.chatStore.socket) {
    const testMessage = {
      id: 'test-' + Date.now(),
      content: '🧪 Teste notificação manual: ' + new Date().toLocaleString(),
      sender: 'client',
      senderName: 'Cliente Teste',
      timestamp: new Date().toISOString(),
      ticketId: 'test-ticket'
    };
    
    window.chatStore.socket.emit('new-message', testMessage);
    console.log('✅ Teste enviado via WebSocket');
  } else {
    console.log('❌ WebSocket não disponível');
  }
}

// Função para verificar logs do webhook
function verificarLogsWebhook() {
  console.log('📊 VERIFICANDO LOGS WEBHOOK');
  
  fetch('https://bkcrm.devsible.com.br/webhook/health')
    .then(response => response.json())
    .then(data => {
      console.log('   Status:', data.status);
      console.log('   Timestamp:', data.timestamp);
      console.log('   WebSocket:', data.websocket);
    })
    .catch(error => {
      console.log('❌ Erro:', error.message);
    });
}

// Expor funções globalmente
window.debugProducao = debugProducao;
window.testarNotificacaoManual = testarNotificacaoManual;
window.verificarLogsWebhook = verificarLogsWebhook;

console.log('🔧 Funções de debug carregadas:');
console.log('   debugProducao() - Debug completo');
console.log('   testarNotificacaoManual() - Teste manual');
console.log('   verificarLogsWebhook() - Verificar webhook');
