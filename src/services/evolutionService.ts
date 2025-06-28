// 🚀 SERVIÇO PARA COMUNICAÇÃO COM EVOLUTION API
interface SendMessageData {
  phone: string;
  text: string;
  instance?: string;
  options?: {
    delay?: number;
    presence?: 'composing' | 'recording' | 'paused';
    linkPreview?: boolean;
  };
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  timestamp: string;
  details?: any;
}

// Detectar ambiente automaticamente
const WEBHOOK_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:4000'  // Local
  : 'https://websocket.bkcrm.devsible.com.br'; // Produção

export const evolutionService = {
  /**
   * Enviar mensagem de texto simples
   */
  async sendMessage(data: SendMessageData): Promise<SendMessageResponse> {
    try {
      console.log('📤 [EVOLUTION] Enviando mensagem:', {
        phone: data.phone,
        text: data.text.substring(0, 50) + '...',
        instance: data.instance
      });

      const response = await fetch(`${WEBHOOK_BASE_URL}/webhook/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: data.phone,
          text: data.text,
          instance: data.instance || 'atendimento-ao-cliente-suporte',
          options: {
            delay: 1000,
            presence: 'composing',
            linkPreview: true,
            ...data.options
          }
        })
      });

      const result: SendMessageResponse = await response.json();

      if (result.success) {
        console.log('✅ [EVOLUTION] Mensagem enviada com sucesso:', result.messageId);
      } else {
        console.error('❌ [EVOLUTION] Erro ao enviar mensagem:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ [EVOLUTION] Erro na requisição:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro de conexão',
        timestamp: new Date().toISOString()
      };
    }
  },

  /**
   * Extrai o número de telefone do ticket usando múltiplas fontes
   */
  extractPhoneFromTicket(ticket: any): string | null {
    if (!ticket) return null;

    // Log para debug
    console.log('🔍 [EVOLUTION] Extraindo telefone do ticket:', {
      id: ticket.id,
      nunmsg: ticket.nunmsg,
      metadata: ticket.metadata,
      client_phone: ticket.client_phone,
      customerPhone: ticket.customerPhone
    });

    // Ordem de prioridade:
    // 1. Campo nunmsg (campo dedicado para número WhatsApp)
    // 2. metadata.client_phone ou metadata.whatsapp_phone
    // 3. Campo client_phone direto
    // 4. Campo customerPhone
    // 5. metadata.anonymous_contact?.phone

    let phone = null;

    // 1. Campo nunmsg
    if (ticket.nunmsg) {
      phone = ticket.nunmsg;
      console.log('📱 [EVOLUTION] Telefone encontrado em nunmsg:', phone);
    }
    
    // 2. Metadata
    else if (ticket.metadata) {
      phone = ticket.metadata.client_phone || ticket.metadata.whatsapp_phone;
      if (phone) console.log('📱 [EVOLUTION] Telefone encontrado em metadata:', phone);
    }
    
    // 3. Campo direto client_phone
    else if (ticket.client_phone) {
      phone = ticket.client_phone;
      console.log('📱 [EVOLUTION] Telefone encontrado em client_phone:', phone);
    }
    
    // 4. Campo customerPhone
    else if (ticket.customerPhone) {
      phone = ticket.customerPhone;
      console.log('📱 [EVOLUTION] Telefone encontrado em customerPhone:', phone);
    }
    
    // 5. Contato anônimo
    else if (ticket.metadata?.anonymous_contact?.phone) {
      phone = ticket.metadata.anonymous_contact.phone;
      console.log('📱 [EVOLUTION] Telefone encontrado em anonymous_contact:', phone);
    }

    // Se encontrou algum número, formatar para envio
    if (phone) {
      const formatted = this.formatPhoneForSending(phone);
      console.log('📱 [EVOLUTION] Telefone formatado para envio:', formatted);
      return formatted;
    }

    console.warn('⚠️ [EVOLUTION] Nenhum telefone encontrado no ticket');
    return null;
  },

  /**
   * Formata o número de telefone para envio
   */
  formatPhoneForSending(phone: string): string {
    // Remover todos os caracteres não numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Se começar com 55, manter como está
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }
    
    // Se tiver 11 dígitos (com DDD), adicionar 55
    if (cleaned.length === 11) {
      return `55${cleaned}`;
    }
    
    // Se tiver 10 dígitos (sem 9), adicionar 9 + 55
    if (cleaned.length === 10) {
      return `55${cleaned.slice(0,2)}9${cleaned.slice(2)}`;
    }

    // Se não se encaixar em nenhum padrão, retornar como está
    return cleaned;
  }
}; 