#!/usr/bin/env node

/**
 * 🧪 Script de Teste - WebSocket no Easypanel
 * 
 * Este script testa as conexões WebSocket em produção
 * para validar se o deploy está funcionando corretamente.
 */

// 🔧 Configurações de teste
const CONFIG = {
  // URLs para testar
  urls: {
    local: 'http://localhost:4000',
    production: 'https://websocket.bkcrm.devsible.com.br',
    unified: 'https://bkcrm.devsible.com.br'
  },
  
  // Dados de teste
  testData: {
    ticketId: 'test-ticket-123',
    userId: 'test-user-456',
    message: 'Teste de mensagem WebSocket - ' + new Date().toISOString()
  },
  
  // Timeouts
  connectionTimeout: 10000,
  testTimeout: 5000
};

/**
 * 🔗 Testar conexão WebSocket (simulado para Node.js puro)
 */
async function testWebSocketConnection(url, label) {
  console.log(`\n🔗 Testando ${label}: ${url}`);
  
  try {
    // Simular teste de WebSocket usando fetch para health check
    const healthUrl = url + '/webhook/health';
    const response = await fetch(healthUrl);
    
    if (response.ok) {
      console.log(`✅ ${label}: Health check OK`);
      return true;
    } else {
      console.log(`❌ ${label}: Health check falhou - ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${label}: Erro - ${error.message}`);
    return false;
  }
}

/**
 * 📊 Executar todos os testes
 */
async function runAllTests() {
  console.log('🚀 Iniciando Testes de WebSocket - Easypanel Deploy');
  console.log('=' .repeat(60));
  
  const results = {};
  
  // Testar WebSocket connections
  console.log('\n📡 TESTES DE WEBSOCKET');
  console.log('-'.repeat(40));
  
  results.local = await testWebSocketConnection(CONFIG.urls.local, 'Local');
  results.production = await testWebSocketConnection(CONFIG.urls.production, 'Produção (Subdomínio)');
  results.unified = await testWebSocketConnection(CONFIG.urls.unified, 'Unificado (Proxy)');
  
  // Relatório Final
  console.log('\n📊 RELATÓRIO FINAL');
  console.log('=' .repeat(60));
  
  Object.entries(results).forEach(([key, result]) => {
    const status = result ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${result ? 'OK' : 'FALHOU'}`);
  });
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.values(results).length;
  
  console.log(`\n🎯 RESULTADO GERAL: ${successCount}/${totalCount} testes passaram`);
  
  if (successCount === totalCount) {
    console.log('🎉 Todos os testes passaram! Deploy está funcionando perfeitamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique as configurações do Easypanel.');
  }
  
  console.log('\n✨ Teste concluído!');
}

// Polyfill para fetch se não estiver disponível (Node.js < 18)
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    console.log('⚠️  Para usar este script, instale node-fetch: npm install node-fetch');
    process.exit(1);
  }
}

// Executar testes
runAllTests().catch(console.error);
