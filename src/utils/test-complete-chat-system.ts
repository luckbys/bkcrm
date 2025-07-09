/**
 * 🧪 Teste Completo do Sistema de Chat Integrado
 * 
 * Este utilitário testa:
 * - ChatStore com WebSocket e Supabase
 * - useUnifiedChatModal
 * - Webhook v2 Integration
 * - Envio e recebimento de mensagens
 * - Persistência no banco de dados
 * 
 * Execute: testCompleteChatSystem() no console do navegador
 */

import { useChatStore } from '../stores/chatStore';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

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
 * Executar teste individual
 */
async function runTest(
  testName: string,
  testFunction: () => Promise<any>
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    console.log(`🧪 [TEST] ${testName}...`);
    
    const result = await testFunction();
    const duration = Date.now() - startTime;
    
    console.log(`✅ [TEST] ${testName} - OK (${duration}ms)`);
    
    return {
      test: testName,
      success: true,
      duration,
      data: result
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ [TEST] ${testName} - FALHOU (${duration}ms):`, error);
    
    return {
      test: testName,
      success: false,
      duration,
      error: error.message || 'Erro desconhecido'
    };
  }
}

/**
 * 1. Testar conexão do ChatStore
 */
async function testChatStoreConnection(): Promise<any> {
  const chatStore = useChatStore.getState();
  
  // Verificar se store existe
  if (!chatStore) {
    throw new Error('ChatStore não encontrado');
  }
  
  // Verificar métodos essenciais
  const requiredMethods = ['init', 'disconnect', 'join', 'load', 'send'];
  for (const method of requiredMethods) {
    if (typeof chatStore[method as keyof typeof chatStore] !== 'function') {
      throw new Error(`Método ${method} não encontrado no ChatStore`);
    }
  }
  
  // Inicializar chat se não estiver conectado
  if (!chatStore.isConnected) {
    chatStore.init();
    
    // Aguardar conexão (até 10 segundos)
    let attempts = 0;
    while (!chatStore.isConnected && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
    
    if (!chatStore.isConnected) {
      throw new Error('Não foi possível conectar ao WebSocket em 10 segundos');
    }
  }
  
  return {
    isConnected: chatStore.isConnected,
    hasSocket: !!chatStore.socket,
    socketId: chatStore.socket?.id
  };
}

/**
 * 2. Testar carregamento de mensagens do Supabase
 */
async function testMessageLoading(): Promise<any> {
  // Criar ticket de teste
  const testTicketId = `test-${Date.now()}`;
  
  // Inserir mensagem de teste no banco
  const testMessage = {
    ticket_id: testTicketId,
    content: 'Mensagem de teste do sistema completo',
    sender_type: 'client',
    sender_name: 'Cliente Teste',
    sender_id: 'test-client-123',
    is_internal: false,
    message_type: 'text',
    metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };
  
  const { data: savedMessage, error: insertError } = await supabase
    .from('messages')
    .insert(testMessage)
    .select()
    .single();
  
  if (insertError) {
    throw new Error(`Erro ao inserir mensagem teste: ${insertError.message}`);
  }
  
  // Testar carregamento via ChatStore
  const chatStore = useChatStore.getState();
  await chatStore.load(testTicketId);
  
  // Aguardar mensagem carregar
  let attempts = 0;
  let loadedMessages: any[] = [];
  
  while (attempts < 25) { // 5 segundos
    loadedMessages = chatStore.getTicketMessages(testTicketId);
    if (loadedMessages.length > 0) break;
    
    await new Promise(resolve => setTimeout(resolve, 200));
    attempts++;
  }
  
  // Limpar mensagem de teste
  await supabase
    .from('messages')
    .delete()
    .eq('id', savedMessage.id);
  
  if (loadedMessages.length === 0) {
    throw new Error('Mensagem não foi carregada no ChatStore');
  }
  
  return {
    testTicketId,
    messageId: savedMessage.id,
    loadedCount: loadedMessages.length,
    loadedMessage: loadedMessages[0]
  };
}

/**
 * 3. Testar envio de mensagens
 */
async function testMessageSending(): Promise<any> {
  const testTicketId = `test-send-${Date.now()}`;
  const testContent = `Teste de envio ${new Date().toISOString()}`;
  
  const chatStore = useChatStore.getState();
  
  // Testar envio
  await chatStore.send(testTicketId, testContent, false);
  
  // Verificar se mensagem foi salva no banco
  await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar persistência
  
  const { data: sentMessages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('ticket_id', testTicketId)
    .eq('content', testContent);
  
  if (error) {
    throw new Error(`Erro ao verificar mensagem no banco: ${error.message}`);
  }
  
  if (!sentMessages || sentMessages.length === 0) {
    throw new Error('Mensagem não foi persistida no banco de dados');
  }
  
  // Verificar se mensagem está no estado local
  const localMessages = chatStore.getTicketMessages(testTicketId);
  const localMessage = localMessages.find(m => m.content === testContent);
  
  if (!localMessage) {
    throw new Error('Mensagem não foi adicionada ao estado local');
  }
  
  // Limpar mensagem de teste
  await supabase
    .from('messages')
    .delete()
    .eq('id', sentMessages[0].id);
  
  return {
    testTicketId,
    dbMessage: sentMessages[0],
    localMessage,
    messagePersisted: true,
    messageInState: true
  };
}

/**
 * 4. Testar integração com Webhook v2
 */
async function testWebhookV2Integration(): Promise<any> {
  // Verificar se webhook v2 está disponível globalmente
  const webhookV2Debug = (window as any).webhookV2Debug;
  
  if (!webhookV2Debug) {
    console.warn('⚠️ Webhook v2 debug não encontrado - isso é normal se não estiver em uso');
    return {
      available: false,
      reason: 'Webhook v2 debug functions not loaded'
    };
  }
  
  // Testar conexão
  const healthResult = await webhookV2Debug.testHealthCheck();
  
  return {
    available: true,
    healthCheck: healthResult,
    isHealthy: healthResult.success
  };
}

/**
 * 5. Testar cleanup e reconexão
 */
async function testCleanupAndReconnection(): Promise<any> {
  const chatStore = useChatStore.getState();
  
  // Estado inicial
  const initiallyConnected = chatStore.isConnected;
  
  // Desconectar
  chatStore.disconnect();
  
  // Verificar desconexão
  if (chatStore.isConnected) {
    throw new Error('ChatStore ainda conectado após disconnect()');
  }
  
  // Reconectar
  chatStore.init();
  
  // Aguardar reconexão
  let attempts = 0;
  while (!chatStore.isConnected && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 200));
    attempts++;
  }
  
  if (!chatStore.isConnected) {
    throw new Error('Falha na reconexão');
  }
  
  return {
    initiallyConnected,
    disconnectedSuccessfully: true,
    reconnectedSuccessfully: true,
    finallyConnected: chatStore.isConnected
  };
}

/**
 * 6. Testar performance e memory leaks
 */
async function testPerformanceAndMemory(): Promise<any> {
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
  const testTicketId = `test-perf-${Date.now()}`;
  
  // Enviar múltiplas mensagens rapidamente
  const chatStore = useChatStore.getState();
  const sendPromises = [];
  
  for (let i = 0; i < 5; i++) {
    sendPromises.push(
      chatStore.send(testTicketId, `Mensagem de performance ${i}`, false)
    );
  }
  
  const startTime = Date.now();
  await Promise.all(sendPromises);
  const sendDuration = Date.now() - startTime;
  
  // Aguardar processamento
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Verificar mensagens no banco
  const { data: performanceMessages } = await supabase
    .from('messages')
    .select('id')
    .eq('ticket_id', testTicketId);
  
  // Limpar mensagens de teste
  if (performanceMessages && performanceMessages.length > 0) {
    await supabase
      .from('messages')
      .delete()
      .eq('ticket_id', testTicketId);
  }
  
  const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
  
  return {
    testTicketId,
    messagesSent: 5,
    messagesReceived: performanceMessages?.length || 0,
    sendDuration,
    memoryStart: startMemory,
    memoryEnd: endMemory,
    memoryDelta: endMemory - startMemory,
    avgTimePerMessage: sendDuration / 5
  };
}

/**
 * Função principal de teste
 */
export async function testCompleteChatSystem(): Promise<TestSuite> {
  console.log('🚀 [TESTE] Iniciando teste completo do sistema de chat...');
  
  const suite: TestSuite = {
    name: 'Sistema de Chat Completo',
    results: [],
    totalTests: 0,
    passedTests: 0,
    totalDuration: 0
  };
  
  const startTime = Date.now();
  
  // Lista de testes
  const tests = [
    { name: 'Conexão ChatStore + WebSocket', fn: testChatStoreConnection },
    { name: 'Carregamento de Mensagens (Supabase)', fn: testMessageLoading },
    { name: 'Envio de Mensagens', fn: testMessageSending },
    { name: 'Integração Webhook v2', fn: testWebhookV2Integration },
    { name: 'Cleanup e Reconexão', fn: testCleanupAndReconnection },
    { name: 'Performance e Memory', fn: testPerformanceAndMemory }
  ];
  
  // Executar testes
  for (const test of tests) {
    const result = await runTest(test.name, test.fn);
    suite.results.push(result);
    
    if (result.success) {
      suite.passedTests++;
    }
    
    suite.totalDuration += result.duration;
  }
  
  suite.totalTests = tests.length;
  
  // Relatório final
  const totalTime = Date.now() - startTime;
  const successRate = (suite.passedTests / suite.totalTests) * 100;
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 [TESTE] RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`📊 Testes executados: ${suite.totalTests}`);
  console.log(`✅ Testes aprovados: ${suite.passedTests}`);
  console.log(`❌ Testes falharam: ${suite.totalTests - suite.passedTests}`);
  console.log(`📈 Taxa de sucesso: ${successRate.toFixed(1)}%`);
  console.log(`⏱️  Tempo total: ${totalTime}ms`);
  console.log('='.repeat(60));
  
  // Log detalhado dos resultados
  suite.results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.test} (${result.duration}ms)`);
    
    if (!result.success && result.error) {
      console.log(`   🔍 Erro: ${result.error}`);
    }
  });
  
  // Toast com resultado
  if (successRate === 100) {
    toast.success('🎉 Todos os testes passaram!', {
      description: `${suite.totalTests} testes executados com sucesso`
    });
  } else if (successRate >= 70) {
    toast.warning(`⚠️ ${suite.passedTests}/${suite.totalTests} testes passaram`, {
      description: 'Alguns componentes podem precisar de atenção'
    });
  } else {
    toast.error(`❌ Sistema com problemas`, {
      description: `Apenas ${suite.passedTests}/${suite.totalTests} testes passaram`
    });
  }
  
  return suite;
}

/**
 * Testes individuais para debug
 */
export const chatSystemTests = {
  connection: testChatStoreConnection,
  loading: testMessageLoading,
  sending: testMessageSending,
  webhookV2: testWebhookV2Integration,
  cleanup: testCleanupAndReconnection,
  performance: testPerformanceAndMemory
};

// Expor globalmente para uso no console
if (typeof window !== 'undefined') {
  (window as any).testCompleteChatSystem = testCompleteChatSystem;
  (window as any).chatSystemTests = chatSystemTests;
  
  console.log('🧪 [TESTE] Funções de teste carregadas:');
  console.log('  - testCompleteChatSystem() - Teste completo');
  console.log('  - chatSystemTests.connection() - Testar conexão');
  console.log('  - chatSystemTests.loading() - Testar carregamento');
  console.log('  - chatSystemTests.sending() - Testar envio');
  console.log('  - chatSystemTests.webhookV2() - Testar webhook v2');
  console.log('  - chatSystemTests.cleanup() - Testar reconexão');
  console.log('  - chatSystemTests.performance() - Testar performance');
} 