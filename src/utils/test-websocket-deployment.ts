/**
 * 🧪 Test WebSocket Deployment
 * Utilitário para testar se o servidor WebSocket está funcionando após deploy
 */

import { io } from 'socket.io-client';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

export async function testWebSocketDeployment(): Promise<TestResult> {
  console.log('🧪 [WS Test] Iniciando teste de deploy do WebSocket...');
  
  const websocketUrl = 'https://ws.bkcrm.devsible.com.br';
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        success: false,
        message: 'Timeout - WebSocket não conectou em 10 segundos',
        timestamp: new Date().toISOString()
      });
    }, 10000);

    try {
      const socket = io(websocketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: true
      });

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ [WS Test] Conectado com sucesso!');
        
        // Testar join ticket
        socket.emit('join-ticket', { ticketId: 'test-deployment-123' });
        
        socket.on('joined-ticket', (data) => {
          console.log('🎯 [WS Test] Join ticket realizado:', data);
          socket.disconnect();
          
          resolve({
            success: true,
            message: 'WebSocket funcionando perfeitamente!',
            details: {
              socketId: socket.id,
              transport: socket.io.engine.transport.name,
              joinData: data
            },
            timestamp: new Date().toISOString()
          });
        });
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error('❌ [WS Test] Erro de conexão:', error);
        
        resolve({
          success: false,
          message: `Erro de conexão: ${error.message}`,
          details: { error: error.message },
          timestamp: new Date().toISOString()
        });
      });

    } catch (error) {
      clearTimeout(timeout);
      resolve({
        success: false,
        message: `Erro ao testar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date().toISOString()
      });
    }
  });
}

export async function testHealthEndpoint(): Promise<TestResult> {
  console.log('🏥 [Health Test] Testando endpoint de health...');
  
  try {
    const response = await fetch('https://ws.bkcrm.devsible.com.br/health', {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Health endpoint funcionando!',
        details: data,
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        success: false,
        message: `Health endpoint retornou ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao testar health: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      timestamp: new Date().toISOString()
    };
  }
}

export async function fullDeploymentTest(): Promise<{
  health: TestResult;
  websocket: TestResult;
  overall: boolean;
}> {
  console.log('🚀 [Full Test] Executando teste completo do deploy...');
  
  const health = await testHealthEndpoint();
  const websocket = await testWebSocketDeployment();
  
  const overall = health.success && websocket.success;
  
  console.log('📊 [Full Test] Resultados:');
  console.log('- Health:', health.success ? '✅' : '❌', health.message);
  console.log('- WebSocket:', websocket.success ? '✅' : '❌', websocket.message);
  console.log('- Geral:', overall ? '🎉 SUCESSO' : '🚨 FALHOU');
  
  return { health, websocket, overall };
}

export function debugWebSocketConnection() {
  console.log('🔍 [WS Debug] Informações de debug da conexão WebSocket:');
  
  const hostname = window.location.hostname;
  const expectedUrl = hostname === 'localhost' || hostname === '127.0.0.1' 
    ? 'http://localhost:4000' 
    : 'https://ws.bkcrm.devsible.com.br';
  
  console.table({
    'Hostname atual': hostname,
    'URL esperada': expectedUrl,
    'Ambiente': hostname === 'localhost' ? 'Desenvolvimento' : 'Produção',
    'Protocolo': expectedUrl.startsWith('https') ? 'HTTPS/WSS' : 'HTTP/WS'
  });
  
  // Testar URLs de produção
  console.log('🌐 [WS Debug] Testando URLs disponíveis...');
  
  const urlsToTest = [
    'https://ws.bkcrm.devsible.com.br/health',
    'https://bkcrm.devsible.com.br/health',
    'https://press-evolution-api.jhkbgs.easypanel.host/health'
  ];
  
  urlsToTest.forEach(async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log(`${response.ok ? '✅' : '❌'} ${url} - ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} - Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  });
}

// Expor funções globalmente para teste no console
declare global {
  interface Window {
    testWebSocketDeployment: typeof testWebSocketDeployment;
    testHealthEndpoint: typeof testHealthEndpoint;
    fullDeploymentTest: typeof fullDeploymentTest;
    debugWebSocketConnection: typeof debugWebSocketConnection;
  }
}

if (typeof window !== 'undefined') {
  window.testWebSocketDeployment = testWebSocketDeployment;
  window.testHealthEndpoint = testHealthEndpoint;
  window.fullDeploymentTest = fullDeploymentTest;
  window.debugWebSocketConnection = debugWebSocketConnection;
}

console.log('🧪 [WS Test] Funções de teste disponíveis:');
console.log('- testWebSocketDeployment() - Testar conexão WebSocket');
console.log('- testHealthEndpoint() - Testar endpoint de health');
console.log('- fullDeploymentTest() - Teste completo');
console.log('- debugWebSocketConnection() - Debug de conexão'); 