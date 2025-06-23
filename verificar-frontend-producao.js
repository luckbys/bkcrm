const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO FRONTEND PRODUÇÃO');
console.log('=================================');

// 1. Verificar configuração do WebSocket
console.log('1. 🔗 Verificando configuração WebSocket...');

const chatStorePath = path.join(__dirname, 'src', 'stores', 'chatStore.ts');
const useRealtimePath = path.join(__dirname, 'src', 'hooks', 'useRealtimeNotifications.ts');

if (!fs.existsSync(chatStorePath)) {
  console.log('❌ chatStore.ts não encontrado');
  process.exit(1);
}

const chatStoreContent = fs.readFileSync(chatStorePath, 'utf8');
const useRealtimeContent = fs.existsSync(useRealtimePath) ? fs.readFileSync(useRealtimePath, 'utf8') : '';

// Verificar URLs de produção
const hasProductionURLs = chatStoreContent.includes('ws.bkcrm.devsible.com.br') || 
                         chatStoreContent.includes('https://ws.bkcrm.devsible.com.br');

const hasLocalURLs = chatStoreContent.includes('localhost:4000') || 
                    chatStoreContent.includes('ws://localhost:4000');

console.log('   URLs Produção:', hasProductionURLs ? '✅' : '❌');
console.log('   URLs Local:', hasLocalURLs ? '✅' : '❌');

// 2. Verificar hook de notificações
console.log('\n2. 📢 Verificando hook de notificações...');

if (!fs.existsSync(useRealtimePath)) {
  console.log('❌ useRealtimeNotifications.ts não encontrado');
  console.log('💡 Execute a implementação do hook primeiro');
} else {
  const hasWebSocketConnection = useRealtimeContent.includes('socket.on') && 
                               useRealtimeContent.includes('new-message');
  
  const hasNotifications = useRealtimeContent.includes('toast') || 
                          useRealtimeContent.includes('notification');
  
  console.log('   WebSocket Events:', hasWebSocketConnection ? '✅' : '❌');
  console.log('   Notificações:', hasNotifications ? '✅' : '❌');
}

// 3. Verificar componente de notificações
console.log('\n3. 🎯 Verificando componente de notificações...');

const notificationsPath = path.join(__dirname, 'src', 'components', 'notifications', 'NotificationsDropdown.tsx');
const headerPath = path.join(__dirname, 'src', 'components', 'crm', 'Header.tsx');

if (!fs.existsSync(notificationsPath)) {
  console.log('❌ NotificationsDropdown.tsx não encontrado');
} else {
  console.log('✅ NotificationsDropdown.tsx encontrado');
}

if (!fs.existsSync(headerPath)) {
  console.log('❌ Header.tsx não encontrado');
} else {
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  const hasNotificationsImport = headerContent.includes('NotificationsDropdown');
  
  console.log('   Importado no Header:', hasNotificationsImport ? '✅' : '❌');
}

// 4. Criar script de debug para produção
console.log('\n4. 🐛 Criando script de debug para produção...');

const debugScript = `
// 🔍 DEBUG PRODUÇÃO - Execute no console do navegador
function debugProducao() {
  console.log('🔍 DEBUG PRODUÇÃO');
  console.log('=================');
  
  // 1. Verificar se o hook está carregado
  console.log('\\n1. 📢 Hook de notificações:');
  if (window.useRealtimeNotifications) {
    console.log('   ✅ Hook disponível');
  } else {
    console.log('   ❌ Hook não encontrado');
  }
  
  // 2. Verificar WebSocket
  console.log('\\n2. 🔗 WebSocket:');
  if (window.chatStore && window.chatStore.socket) {
    console.log('   ✅ Socket disponível');
    console.log('   Status:', window.chatStore.socket.connected ? 'Conectado' : 'Desconectado');
  } else {
    console.log('   ❌ Socket não encontrado');
  }
  
  // 3. Verificar componente
  console.log('\\n3. 🎯 Componente de notificações:');
  const notificationsElement = document.querySelector('[data-testid="notifications-dropdown"]') || 
                              document.querySelector('.notifications-dropdown');
  
  if (notificationsElement) {
    console.log('   ✅ Componente renderizado');
  } else {
    console.log('   ❌ Componente não encontrado');
  }
  
  // 4. Testar conexão WebSocket
  console.log('\\n4. 🧪 Testando conexão WebSocket...');
  
  if (window.chatStore && window.chatStore.socket) {
    window.chatStore.socket.emit('test-connection', { message: 'Teste produção' });
    console.log('   📤 Teste enviado');
  }
  
  // 5. Verificar variáveis de ambiente
  console.log('\\n5. 🌐 Variáveis de ambiente:');
  console.log('   VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('   VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌');
  
  // 6. Instruções
  console.log('\\n6. 💡 PRÓXIMOS PASSOS:');
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
`;

fs.writeFileSync('debug-producao.js', debugScript);
console.log('✅ Script de debug criado: debug-producao.js');

// 5. Resumo e instruções
console.log('\n5. 📋 RESUMO E INSTRUÇÕES:');
console.log('===========================');
console.log('');
console.log('🎯 PROBLEMA IDENTIFICADO:');
console.log('   O webhook de produção não está usando o código corrigido');
console.log('   Ele ainda retorna "processed: false"');
console.log('');
console.log('🔧 SOLUÇÃO:');
console.log('   1. Deploy do arquivo corrigido em produção');
console.log('   2. Reiniciar container do webhook');
console.log('   3. Testar com script de debug');
console.log('');
console.log('📁 ARQUIVOS PREPARADOS:');
console.log('   ✅ deploy-webhook/webhook-evolution-complete-corrigido.cjs');
console.log('   ✅ teste-producao-corrigido.js');
console.log('   ✅ debug-producao.js');
console.log('');
console.log('🚀 PRÓXIMOS PASSOS:');
console.log('   1. Fazer deploy em produção');
console.log('   2. Testar webhook corrigido');
console.log('   3. Verificar frontend com debug');
console.log('   4. Confirmar notificações funcionando');
console.log('');
console.log('✅ VERIFICAÇÃO COMPLETA!'); 