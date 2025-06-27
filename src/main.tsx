import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Importar helpers para desenvolvimento
import './utils/dev-helpers'
import './utils/migration-helpers'
import './utils/database-test'
import { testCustomerAssignment, testTicketWithCustomerLoading, cleanupTestData } from './utils/testCustomerAssignment'
import { debugTicketAssignment, debugCurrentTicket, forceTicketReload } from './utils/debugTicketAssignment'

// Importar teste de validação de telefone
import './utils/testeValidacaoTelefoneCompleto'

// Configurar endpoint global para receber respostas de webhook (mencionado nas memórias)
import webhookResponseService from './services/webhook-response-service'

// === TESTE DO NOVO SISTEMA DE CHAT ===
import { useChatStore } from './stores/chatStore'

// Função global para testar o novo chat
(globalThis as any).testNewChat = (ticketId = 'TEST-123') => {
  console.log('🧪 Testando novo sistema de chat...');
  
  const store = useChatStore.getState();
  
  console.log('📊 Status inicial:', {
    connected: store.isConnected,
    loading: store.isLoading,
    sending: store.isSending,
    error: store.error,
    messagesCount: Object.keys(store.messages).length
  });
  
  // Inicializar se não conectado
  if (!store.isConnected) {
    console.log('🔄 Inicializando conexão...');
    store.init();
  }
  
  // Aguardar conexão e testar
  setTimeout(() => {
    console.log('🔗 Entrando no ticket:', ticketId);
    store.join(ticketId);
    
    setTimeout(() => {
      console.log('📥 Carregando mensagens...');
      store.load(ticketId);
      
      setTimeout(() => {
        console.log('📤 Enviando mensagem de teste...');
        store.send(ticketId, 'Mensagem de teste do novo sistema!', false).catch(console.error);
      }, 1000);
    }, 1000);
  }, 2000);
};

// Função para debugar estado do chat
(globalThis as any).debugNewChat = () => {
  const store = useChatStore.getState();
  
  console.table({
    'Conectado': store.isConnected ? '✅' : '❌',
    'Carregando': store.isLoading ? '⏳' : '✅',
    'Enviando': store.isSending ? '📤' : '✅',
    'Erro': store.error || 'Nenhum',
    'Socket': store.socket ? 'Ativo' : 'Inativo',
    'Tickets': Object.keys(store.messages).length,
    'Total Mensagens': Object.values(store.messages).reduce((total, msgs) => total + msgs.length, 0)
  });
  
  console.log('📨 Mensagens por ticket:', store.messages);
  
  if (store.socket) {
    console.log('🔗 Socket conectado:', store.socket.connected);
    console.log('🆔 Socket ID:', store.socket.id);
  }
};

// Função para limpar estado do chat
(globalThis as any).clearNewChat = () => {
  const store = useChatStore.getState();
  store.disconnect();
  console.log('🧹 Estado do chat limpo');
};

// Função global para receber payload do n8n
(globalThis as any).receiveN8nWebhookResponse = async (payload: {
  ticketId: string;
  response: string;
  sender: string;
  confidence?: number;
}) => {
  console.log('📥 [Global] Recebendo resposta do n8n:', payload);
  
  try {
    const result = await webhookResponseService.processSupabaseResponses(
      payload.ticketId, 
      payload.response
    );

    if (result.success) {
      console.log('✅ [Global] Resposta do n8n processada com sucesso');
      return { success: true, message: 'Resposta processada' };
    } else {
      console.error('❌ [Global] Erro ao processar resposta do n8n:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ [Global] Erro na função global:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

// Comando para simulação de resposta N8N (para testes)
(globalThis as any).simulateN8nResponse = async (ticketId: string, response: string) => {
  console.log('🧪 Simulando resposta N8N...');
  
  const testPayload = {
    ticketId,
    response,
    sender: 'n8n_automation',
    confidence: 0.9
  };

  return await (globalThis as any).receiveN8nWebhookResponse(testPayload);
};

// Comando para teste rápido das correções (mencionado nas memórias)
(globalThis as any).testWebhookFix = async () => {
  console.log('🧪 Testando correções do webhook...');
  
  const testPayload = {
    ticketId: 'test-ticket-id',
    response: 'Resposta de teste do sistema webhook',
    sender: 'webhook_system',
    confidence: 0.95
  };

  const result = await (globalThis as any).receiveN8nWebhookResponse(testPayload);
  console.log('🧪 Resultado do teste:', result);
  
  return result;
};

// Função helper para debug do webhook
(globalThis as any).debugWebhookResponses = () => {
  console.log('🔍 Status do serviço de webhook:');
  console.log('- receiveN8nWebhookResponse:', typeof (globalThis as any).receiveN8nWebhookResponse);
  console.log('- simulateN8nResponse:', typeof (globalThis as any).simulateN8nResponse);
  console.log('- testWebhookFix:', typeof (globalThis as any).testWebhookFix);
  console.log('✅ Todos os endpoints estão configurados');
};

// Funções globais para teste de vinculação de clientes
(globalThis as any).testCustomerAssignment = testCustomerAssignment;
(globalThis as any).testTicketWithCustomerLoading = testTicketWithCustomerLoading;
(globalThis as any).cleanupTestData = cleanupTestData;

// Funções globais para debug de vinculação
(globalThis as any).debugTicketAssignment = debugTicketAssignment;
(globalThis as any).debugCurrentTicket = debugCurrentTicket;
(globalThis as any).forceTicketReload = forceTicketReload;

// Importar e registrar funções de teste de vinculação automática
// import '../backend/tests/TESTE_VINCULACAO_AUTOMATICA_TELEFONE.js'; // Removido para produção - arquivo não existe no build Docker

// Helper para debug de vinculação
(globalThis as any).debugCustomerAssignment = () => {
  console.log('🔍 Status das funções de teste e debug de vinculação:');
  console.log('\n📋 Funções de teste:');
  console.log('- testCustomerAssignment:', typeof (globalThis as any).testCustomerAssignment);
  console.log('- testTicketWithCustomerLoading:', typeof (globalThis as any).testTicketWithCustomerLoading);
  console.log('- cleanupTestData:', typeof (globalThis as any).cleanupTestData);
  
  console.log('\n🔍 Funções de debug:');
  console.log('- debugTicketAssignment:', typeof (globalThis as any).debugTicketAssignment);
  console.log('- debugCurrentTicket:', typeof (globalThis as any).debugCurrentTicket);
  console.log('- forceTicketReload:', typeof (globalThis as any).forceTicketReload);
  
  console.log('\n✅ Todas as funções estão disponíveis');
  console.log('\n🧪 Para testar vinculação:');
  console.log('testCustomerAssignment()');
  console.log('\n🔍 Para debugar vinculação:');
  console.log('debugTicketAssignment() // Busca tickets com clientes');
  console.log('debugTicketAssignment("ticket-id") // Debug de ticket específico');
  console.log('debugCurrentTicket() // Analisa estado atual');
};

// 📱 Importar testes do campo nunmsg
import './utils/test-nunmsg-integration'

// 🚀 Importar teste da correção do realtime
import './utils/test-realtime-fix'

// 🔧 Importar correções de QR Code e CSS
import './utils/fix-qr-code-and-css'

// 🔍 Importar verificação da Evolution API
import './utils/verify-evolution-config'

// 🚨 Importar tratamento global de erros
import './utils/error-handler'

// 🔧 Importar sistema de correção de mensagens de chat
import './utils/fix-chat-messages-debug'

// 🔧 Importar sistema de correção de duplicação de webhooks
import './utils/fix-webhook-duplication'

// 🔧 Importar debug do UnifiedChatModal
import './utils/debug-unified-chat'

// 🔧 Importar teste da correção UUID
import './utils/uuid-test'

// 🔗 Importar teste da integração Evolution API
import './utils/test-evolution-integration'

// 🧪 Importar teste de correção UUID vs ID numérico (removido - agora usa uuid-test.ts)

// 🌐 Importar teste de conexão WebSocket produção
import './utils/test-websocket-production'

// 🔗 Importar testes do sistema WebSocket
import './utils/test-websocket-system'

// 🔧 Importar debug para mensagens vazias
import './utils/debug-mensagens-vazias'

// 🔧 Importar correção completa do sistema de chat
import './utils/fix-chat-messages-debug'

// 🔧 Importar correção de duplicação de tickets
import './utils/fix-webhook-duplication'

// 🎭 Importar e inicializar correção de modais transparentes
import { forceModalVisibility, watchModalTransparency, enableContinuousModalFix } from './utils/fix-modal-transparency'

// 🧪 Importar testes de deployment WebSocket
import './utils/test-websocket-deployment'

// 🎭 Inicializar sistema de correção contínua de modais
console.log('🎭 [Main] Inicializando sistema avançado de correção de modais...');

// Aplicar correção inicial
forceModalVisibility();

// Habilitar correção contínua
const modalFixer = enableContinuousModalFix();

// Expor controle globalmente para debug
(globalThis as any).modalFixer = modalFixer;

// Função global para diagnóstico de modais
(globalThis as any).diagnoseModals = () => {
  console.log('🔍 [Global] Executando diagnóstico completo de modais...');
  const { diagnoseModalIssues } = require('./utils/fix-modal-transparency');
  return diagnoseModalIssues();
};

// Monitorar modais quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎭 [Main] DOM carregado - reaplicando correções de modais...');
  forceModalVisibility();
});

console.log('✅ [Main] Sistema de correção de modais totalmente ativo e monitorando!');

// 🔧 Importar diagnóstico WebSocket para debug em produção
import './utils/websocket-production-debug.ts'
import './utils/test-websocket-final.ts'
import './utils/supabase-debug-keys.ts'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
