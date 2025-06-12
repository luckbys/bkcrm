import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { Toaster } from '@/components/ui/toaster'

// Importar helpers para desenvolvimento
import './utils/dev-helpers'
import './utils/migration-helpers'

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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster />
  </React.StrictMode>,
)
