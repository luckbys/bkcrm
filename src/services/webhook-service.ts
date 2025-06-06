interface WebhookMessageData {
  ticket_id: string;
  message_id: string;
  content: string;
  sender_type: 'agent' | 'client';
  sender_id?: string;
  sender_name: string;
  sender_email?: string;
  is_internal: boolean;
  timestamp: string;
  message_type: string;
  ticket_info?: {
    id: string;
    subject: string;
    client: string;
    client_phone?: string;
    status: string;
    priority: string;
    channel: string;
  };
}

class WebhookService {
  private webhookUrl = 'https://press-n8n.jhkbgs.easypanel.host/webhook-test/recebe';
  private fallbackEnabled = true;

  async sendMessage(data: WebhookMessageData): Promise<boolean> {
    try {
      console.log('📤 [WEBHOOK] Iniciando envio para n8n:', {
        url: this.webhookUrl,
        ticket_id: data.ticket_id,
        message_id: data.message_id,
        sender_type: data.sender_type,
        content: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '')
      });

      console.log('📋 [WEBHOOK] Payload completo:', JSON.stringify(data, null, 2));

      // Converter dados para query parameters para requisição GET
      const params = new URLSearchParams();
      params.append('ticket_id', data.ticket_id);
      params.append('message_id', data.message_id);
      params.append('content', data.content);
      params.append('sender_type', data.sender_type);
      params.append('sender_name', data.sender_name);
      if (data.sender_id) params.append('sender_id', data.sender_id);
      if (data.sender_email) params.append('sender_email', data.sender_email);
      params.append('is_internal', data.is_internal.toString());
      params.append('timestamp', data.timestamp);
      params.append('message_type', data.message_type);
      
             // Adicionar informações do ticket se disponíveis
       if (data.ticket_info) {
         params.append('ticket_subject', data.ticket_info.subject);
         params.append('ticket_client', data.ticket_info.client);
         if (data.ticket_info.client_phone) params.append('ticket_client_phone', data.ticket_info.client_phone);
         params.append('ticket_status', data.ticket_info.status);
         params.append('ticket_priority', data.ticket_info.priority);
         params.append('ticket_channel', data.ticket_info.channel);
       }

      const webhookUrlWithParams = `${this.webhookUrl}?${params.toString()}`;
      console.log('🔗 [WEBHOOK] URL com parâmetros:', webhookUrlWithParams);

      const response = await fetch(webhookUrlWithParams, {
        method: 'GET'
      });

      console.log('📡 [WEBHOOK] Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ [WEBHOOK] Sucesso! Resposta:', responseText);
        return true;
      } else {
        const errorText = await response.text();
        
        // Tratamento específico para webhooks em modo teste
        if (response.status === 404 && errorText.includes('test mode')) {
          console.warn('🔧 [WEBHOOK] Webhook em modo teste - precisa ser ativado no n8n primeiro');
          console.log('💡 [WEBHOOK] Para ativar: Clique no botão "Test workflow" no n8n');
        } else if (response.status === 404 && errorText.includes('not registered for POST')) {
          console.warn('📝 [WEBHOOK] Webhook configurado apenas para GET requests');
        } else {
          console.warn('⚠️ [WEBHOOK] Erro no webhook n8n:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          });
        }
        
        // Log dos dados que não puderam ser enviados
        console.log('📊 [WEBHOOK] Dados não enviados:', {
          ticket_id: data.ticket_id,
          message_id: data.message_id,
          content_preview: data.content.substring(0, 100) + '...'
        });
        
        return false;
      }
    } catch (error) {
      console.error('❌ [WEBHOOK] Erro ao enviar para webhook n8n:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('❌ [WEBHOOK] Possível problema de conectividade ou CORS');
      }
      
      // Fallback: Salvar dados localmente para debug
      if (this.fallbackEnabled) {
        this.saveToLocalStorage(data);
      }
      
      return false;
    }
  }

  // Método fallback para salvar dados localmente quando webhook falha
  private saveToLocalStorage(data: WebhookMessageData): void {
    try {
      const key = `webhook_queue_${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(data));
      console.log('💾 [WEBHOOK] Dados salvos localmente para debug:', key);
      
      // Manter apenas os últimos 10 registros
      const keys = Object.keys(localStorage).filter(k => k.startsWith('webhook_queue_'));
      if (keys.length > 10) {
        keys.sort().slice(0, keys.length - 10).forEach(k => localStorage.removeItem(k));
      }
    } catch (error) {
      console.warn('⚠️ [WEBHOOK] Não foi possível salvar dados localmente:', error);
    }
  }

  // Método para recuperar dados salvos localmente
  getQueuedMessages(): WebhookMessageData[] {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('webhook_queue_'));
      return keys.map(key => {
        try {
          return JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch {
      return [];
    }
  }

  // Método para limpar dados salvos localmente
  clearQueue(): void {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('webhook_queue_'));
      keys.forEach(key => localStorage.removeItem(key));
      console.log('🧹 [WEBHOOK] Fila local limpa');
    } catch (error) {
      console.warn('⚠️ [WEBHOOK] Erro ao limpar fila local:', error);
    }
  }

  // Método auxiliar para criar dados de webhook a partir de mensagem do ticket
  createMessageData(
    ticketId: string,
    messageId: string,
    content: string,
    senderType: 'agent' | 'client',
    senderName: string,
    options: {
      senderId?: string;
      senderEmail?: string;
      isInternal?: boolean;
      messageType?: string;
      ticketInfo?: WebhookMessageData['ticket_info'];
    } = {}
  ): WebhookMessageData {
    return {
      ticket_id: ticketId,
      message_id: messageId,
      content,
      sender_type: senderType,
      sender_id: options.senderId,
      sender_name: senderName,
      sender_email: options.senderEmail,
      is_internal: options.isInternal || false,
      timestamp: new Date().toISOString(),
      message_type: options.messageType || 'text',
      ticket_info: options.ticketInfo
    };
  }
}

export const webhookService = new WebhookService();
export type { WebhookMessageData }; 