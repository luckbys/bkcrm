import { webhookServerV2, MessagePayload } from '@/services/webhookServerV2';
import { WEBHOOK_SERVER_V2_CONFIG } from '@/config';

/**
 * Utilitário completo para testar a integração Webhook V2
 * Execute: testWebhookV2Integration() no console do navegador
 */

interface TestResult {
  test: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  totalDuration: number;
}

/**
 * Realizar teste de saúde do servidor
 */
async function testHealthCheck(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🏥 [TEST] Testando health check...');
    
    const result = await webhookServerV2.healthCheck();
    
    return {
      test: 'Health Check',
      success: result.success,
      duration: Date.now() - startTime,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    return {
      test: 'Health Check',
      success: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Testar envio de mensagem simples
 */
async function testSimpleMessage(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('📤 [TEST] Testando envio de mensagem simples...');
    
    const payload: MessagePayload = {
      ticketId: 'test-ticket-001',
      content: 'Mensagem de teste - ' + new Date().toLocaleTimeString(),
      sender: 'agent',
      messageType: 'text',
      metadata: {
        testMode: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const result = await webhookServerV2.sendMessage(payload);
    
    return {
      test: 'Simple Message',
      success: result.success,
      duration: Date.now() - startTime,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    return {
      test: 'Simple Message',
      success: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Testar mensagem interna
 */
async function testInternalMessage(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔒 [TEST] Testando mensagem interna...');
    
    const payload: MessagePayload = {
      ticketId: 'test-ticket-002',
      content: 'Nota interna de teste - confidencial',
      sender: 'agent',
      messageType: 'text',
      isInternal: true,
      metadata: {
        testMode: true,
        confidential: true,
        timestamp: new Date().toISOString()
      }
    };
    
    const result = await webhookServerV2.sendMessage(payload);
    
    return {
      test: 'Internal Message',
      success: result.success,
      duration: Date.now() - startTime,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    return {
      test: 'Internal Message',
      success: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Testar timeout e retry
 */
async function testTimeoutHandling(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⏱️ [TEST] Testando tratamento de timeout...');
    
    // Simular URL inválida para forçar timeout
    const originalBaseUrl = webhookServerV2['baseUrl'];
    webhookServerV2['baseUrl'] = 'https://invalid-timeout-test.example';
    
    const payload: MessagePayload = {
      ticketId: 'test-timeout-001',
      content: 'Teste de timeout',
      sender: 'agent',
      messageType: 'text'
    };
    
    const result = await webhookServerV2.sendMessage(payload);
    
    // Restaurar URL original
    webhookServerV2['baseUrl'] = originalBaseUrl;
    
    return {
      test: 'Timeout Handling',
      success: !result.success, // Esperamos que falhe
      duration: Date.now() - startTime,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    return {
      test: 'Timeout Handling',
      success: true, // Erro esperado
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Testar configuração de webhook Evolution API
 */
async function testEvolutionConfiguration(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('⚙️ [TEST] Testando configuração Evolution API...');
    
    const result = await webhookServerV2.configureEvolutionWebhook('test-instance');
    
    return {
      test: 'Evolution Configuration',
      success: result.success,
      duration: Date.now() - startTime,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    return {
      test: 'Evolution Configuration',
      success: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Testar conexão básica
 */
async function testBasicConnection(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log('🔌 [TEST] Testando conexão básica...');
    
    const result = await webhookServerV2.testConnection();
    
    return {
      test: 'Basic Connection',
      success: result.success,
      duration: Date.now() - startTime,
      data: result.data,
      error: result.error
    };
  } catch (error: any) {
    return {
      test: 'Basic Connection',
      success: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Executar todos os testes
 */
async function runTestSuite(): Promise<TestSuite> {
  console.log('🚀 [WEBHOOK-V2-TEST] Iniciando suite de testes...');
  
  const testSuite: TestSuite = {
    name: 'Webhook V2 Integration Tests',
    results: [],
    totalTests: 0,
    passedTests: 0,
    totalDuration: 0
  };

  // Lista de testes para executar
  const tests = [
    testBasicConnection,
    testHealthCheck,
    testSimpleMessage,
    testInternalMessage,
    testEvolutionConfiguration,
    testTimeoutHandling
  ];

  // Executar cada teste
  for (const test of tests) {
    try {
      const result = await test();
      testSuite.results.push(result);
      
      if (result.success) {
        testSuite.passedTests++;
      }
      
      testSuite.totalDuration += result.duration;
      
      // Log individual do resultado
      const status = result.success ? '✅' : '❌';
      console.log(`${status} [TEST] ${result.test}: ${result.duration}ms`);
      
      if (result.error) {
        console.log(`   ❗ Erro: ${result.error}`);
      }
      
      // Delay entre testes
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error: any) {
      console.error(`💥 [TEST] Falha crítica no teste: ${error.message}`);
      
      testSuite.results.push({
        test: test.name,
        success: false,
        duration: 0,
        error: error.message
      });
    }
  }

  testSuite.totalTests = testSuite.results.length;
  
  return testSuite;
}

/**
 * Exibir relatório final dos testes
 */
function displayTestReport(testSuite: TestSuite): void {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 RELATÓRIO DE TESTES - ${testSuite.name}`);
  console.log('='.repeat(60));
  
  console.log(`✅ Testes Aprovados: ${testSuite.passedTests}/${testSuite.totalTests}`);
  console.log(`⏱️ Tempo Total: ${testSuite.totalDuration}ms`);
  console.log(`🏆 Taxa de Sucesso: ${((testSuite.passedTests / testSuite.totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 DETALHES DOS TESTES:');
  testSuite.results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test} (${result.duration}ms)`);
    
    if (result.error) {
      console.log(`   ❗ ${result.error}`);
    }
  });
  
  console.log('\n🔗 CONFIGURAÇÃO ATUAL:');
  console.log(`Base URL: ${WEBHOOK_SERVER_V2_CONFIG.BASE_URL}`);
  console.log(`Webhook URL: ${WEBHOOK_SERVER_V2_CONFIG.WEBHOOK_URL}`);
  console.log(`Health Check URL: ${WEBHOOK_SERVER_V2_CONFIG.HEALTH_CHECK_URL}`);
  console.log(`Timeout: ${WEBHOOK_SERVER_V2_CONFIG.TIMEOUT}ms`);
  console.log(`Retry Attempts: ${WEBHOOK_SERVER_V2_CONFIG.RETRY_ATTEMPTS}`);
  
  console.log('\n' + '='.repeat(60));
}

/**
 * Função principal de teste
 */
async function testWebhookV2Integration(): Promise<void> {
  try {
    const testSuite = await runTestSuite();
    displayTestReport(testSuite);
    
    // Retornar resultado para uso programático
    (window as any).lastWebhookV2TestResult = testSuite;
    
    if (testSuite.passedTests === testSuite.totalTests) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Webhook V2 está funcionando perfeitamente.');
    } else {
      console.log('⚠️ ALGUNS TESTES FALHARAM. Verifique a configuração do servidor webhook.');
    }
    
  } catch (error: any) {
    console.error('💥 FALHA CRÍTICA na execução dos testes:', error.message);
  }
}

/**
 * Testar apenas conectividade básica (teste rápido)
 */
async function quickWebhookV2Test(): Promise<void> {
  console.log('⚡ [QUICK-TEST] Teste rápido de conectividade...');
  
  try {
    const result = await testHealthCheck();
    
    if (result.success) {
      console.log('✅ Webhook V2 está online e respondendo!');
      console.log(`🕐 Tempo de resposta: ${result.duration}ms`);
    } else {
      console.log('❌ Webhook V2 está offline ou com problemas');
      console.log(`❗ Erro: ${result.error}`);
    }
  } catch (error: any) {
    console.log('💥 Erro no teste rápido:', error.message);
  }
}

/**
 * Limpar resultados de teste anteriores
 */
function clearWebhookV2TestResults(): void {
  delete (window as any).lastWebhookV2TestResult;
  console.log('🧹 Resultados de teste limpos');
}

// Expor funções globalmente para uso no console
declare global {
  interface Window {
    testWebhookV2Integration: () => Promise<void>;
    quickWebhookV2Test: () => Promise<void>;
    clearWebhookV2TestResults: () => void;
    lastWebhookV2TestResult?: TestSuite;
  }
}

window.testWebhookV2Integration = testWebhookV2Integration;
window.quickWebhookV2Test = quickWebhookV2Test;
window.clearWebhookV2TestResults = clearWebhookV2TestResults;

export {
  testWebhookV2Integration,
  quickWebhookV2Test,
  clearWebhookV2TestResults,
  type TestResult,
  type TestSuite
}; 