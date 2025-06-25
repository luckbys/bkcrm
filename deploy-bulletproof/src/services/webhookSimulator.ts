import { TicketRoutingService, type IncomingMessage } from './ticketRoutingService';

/**
 * Simula o recebimento de webhooks da Evolution API para desenvolvimento
 * Em produção, isso seria substituído por um endpoint real
 */
export class WebhookSimulator {
  
  /**
   * Simula um webhook MESSAGES_UPSERT da Evolution API
   */
  static async simulateMessageWebhook(payload: {
    senderPhone: string;
    senderName: string;
    content: string;
    instanceName: string;
    messageType?: 'text' | 'image' | 'video' | 'audio' | 'document';
    mediaUrl?: string;
    mediaCaption?: string;
  }) {
    try {
      console.log('📨 [SIMULATOR] Webhook Evolution simulado:', payload);
      
      // Converter para formato interno
      const incomingMessage: IncomingMessage = {
        senderPhone: payload.senderPhone,
        senderName: payload.senderName,
        content: payload.content,
        instanceName: payload.instanceName,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        messageType: payload.messageType || 'text',
        mediaUrl: payload.mediaUrl,
        mediaCaption: payload.mediaCaption,
        timestamp: new Date().toISOString()
      };
      
      // Processar através do sistema de roteamento
      const result = await TicketRoutingService.routeMessage(incomingMessage);
      
      console.log('✅ [SIMULATOR] Resultado do processamento:', result);
      
      // Simular notificação no sistema
      if (result.action === 'created') {
        this.showNotification(`🎫 Novo ticket criado: #${result.ticketId}`, payload.content);
      } else if (result.action === 'updated') {
        this.showNotification(`💬 Nova mensagem no ticket #${result.ticketId}`, payload.content);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ [SIMULATOR] Erro ao processar webhook:', error);
      throw error;
    }
  }
  
  /**
   * Inicia simulação de conversa em tempo real
   */
  static startConversationSimulation(phone: string, instanceName: string = 'financeiro-encontra') {
    const messages = [
      { delay: 1000, content: 'Olá! Preciso de ajuda com meu pedido.', sender: 'Cliente' },
      { delay: 5000, content: 'Fiz um pedido ontem mas não recebi confirmação.', sender: 'Cliente' },
      { delay: 10000, content: 'O número do pedido é #12345', sender: 'Cliente' },
      { delay: 15000, content: 'Vocês podem verificar para mim?', sender: 'Cliente' },
    ];
    
    console.log(`🎭 [SIMULATOR] Iniciando simulação de conversa para ${phone}`);
    
    messages.forEach((msg, index) => {
      setTimeout(async () => {
        await this.simulateMessageWebhook({
          senderPhone: phone,
          senderName: `${msg.sender} ${phone.slice(-4)}`,
          content: msg.content,
          instanceName: instanceName
        });
      }, msg.delay);
    });
    
    console.log(`⏱️ [SIMULATOR] ${messages.length} mensagens agendadas em ${messages[messages.length - 1].delay / 1000} segundos`);
  }
  
  /**
   * Simula diferentes cenários de teste
   */
  static async runTestScenarios() {
    console.log('🎭 [SIMULATOR] Executando cenários de teste...');
    
    const scenarios = [
      {
        name: 'Cliente Novo',
        phone: '5511999887766',
        messages: [
          'Olá! Gostaria de conhecer seus serviços.',
          'Vocês atendem na região da Vila Madalena?'
        ]
      },
      {
        name: 'Cliente Retornando',
        phone: '5511999887755',
        messages: [
          'Oi, sou cliente e preciso de suporte.',
          'Meu último pedido teve problema na entrega.'
        ]
      },
      {
        name: 'Dúvida Técnica',
        phone: '5511999887744',
        messages: [
          'Tenho uma dúvida técnica sobre o produto.',
          'Como faço para configurar a integração?'
        ]
      }
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n🎯 [SIMULATOR] Cenário: ${scenario.name} (${scenario.phone})`);
      
      for (let i = 0; i < scenario.messages.length; i++) {
        const message = scenario.messages[i];
        
        console.log(`  📱 Mensagem ${i + 1}: ${message}`);
        
        await this.simulateMessageWebhook({
          senderPhone: scenario.phone,
          senderName: scenario.name,
          content: message,
          instanceName: 'financeiro-encontra'
        });
        
        // Aguardar um pouco entre mensagens
        if (i < scenario.messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Aguardar entre cenários
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('✅ [SIMULATOR] Todos os cenários executados!');
  }
  
  /**
   * Mostra notificação no sistema (toast ou similar)
   */
  private static showNotification(title: string, content: string) {
    // Tentar usar o sistema de toast se disponível
    if (typeof window !== 'undefined' && (window as any).showToast) {
      (window as any).showToast(title, content);
    } else {
      console.log(`🔔 [NOTIFICATION] ${title}: ${content.substring(0, 50)}...`);
    }
  }
  
  /**
   * Limpa dados de simulação
   */
  static async clearSimulationData() {
    try {
      const { TicketRoutingService } = await import('./ticketRoutingService');
      
      console.log('🧹 [SIMULATOR] Limpando dados de simulação...');
      
      const autoTickets = await TicketRoutingService.getAutoCreatedTickets(100);
      const simulationTickets = autoTickets.filter(ticket => 
        ticket.metadata?.evolution_message_id?.startsWith('sim_')
      );
      
      console.log(`📋 [SIMULATOR] Encontrados ${simulationTickets.length} tickets de simulação`);
      
      if (simulationTickets.length === 0) {
        console.log('✅ [SIMULATOR] Nenhum dado de simulação para limpar');
        return { success: true, cleaned: 0 };
      }
      
      const { supabase } = await import('@/lib/supabase');
      
      // Remover mensagens de simulação primeiro
      const ticketIds = simulationTickets.map(t => t.id);
      await supabase
        .from('messages')
        .delete()
        .in('ticket_id', ticketIds);
      
      // Remover tickets de simulação
      const { error } = await supabase
        .from('tickets')
        .delete()
        .in('id', ticketIds);
      
      if (error) {
        console.error('❌ [SIMULATOR] Erro ao limpar dados:', error);
        return { success: false, error };
      }
      
      console.log(`✅ [SIMULATOR] ${simulationTickets.length} tickets de simulação removidos`);
      return { success: true, cleaned: simulationTickets.length };
      
    } catch (error) {
      console.error('❌ [SIMULATOR] Erro na limpeza:', error);
      return { success: false, error };
    }
  }
}

// Expor para uso em dev-helpers
(window as any).WebhookSimulator = WebhookSimulator; 