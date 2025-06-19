import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from '@/components/ui/toaster'

// Importar helpers para desenvolvimento
import './utils/dev-helpers'
import './utils/migration-helpers'
import './utils/database-test'
import { testCustomerAssignment, testTicketWithCustomerLoading, cleanupTestData } from './utils/testCustomerAssignment'
import { debugTicketAssignment, debugCurrentTicket, forceTicketReload } from './utils/debugTicketAssignment'

// Importar diagnóstico de envio WhatsApp
import './utils/diagnosticoEnvioWhatsApp'

// Importar teste de validação de telefone
import './utils/testeValidacaoTelefoneCompleto'

// Configurar endpoint global para receber respostas de webhook (mencionado nas memórias)
import webhookResponseService from './services/webhook-response-service'

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
)
