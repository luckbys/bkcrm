import { supabase } from '@/lib/supabase';
import { WebhookPayload } from './evolutionApiService';

// UUID fixo para sistema webhook (resolve problema mencionado nas memórias)
const WEBHOOK_SYSTEM_UUID = '00000000-0000-0000-0000-000000000001';

export interface ProcessedWebhookMessage {
  ticketId: string;
  messageId: string;
  content: string;
  sender: 'client' | 'agent' | 'system';
  senderName: string;
  senderPhone?: string;
  instanceName: string;
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location';
  mediaUrl?: string;
  mediaCaption?: string;
  quotedMessage?: {
    id: string;
    content: string;
    sender: string;
  };
  timestamp: string;
  isFromMe: boolean;
  messageStatus?: 'sent' | 'delivered' | 'read' | 'pending' | 'failed';
  metadata?: Record<string, any>;
}

export interface TicketCreationResult {
  ticketId: string;
  created: boolean;
  error?: string;
}

class WebhookResponseService {
  private messageQueue: ProcessedWebhookMessage[] = [];
  private isProcessing = false;
  private batchSize = 10;
  private batchTimeout = 2000; // 2 segundos

  constructor() {
    this.startBatchProcessor();
  }

  /**
   * Processar payload de webhook da Evolution API
   */
  async processWebhookPayload(payload: WebhookPayload): Promise<{
    success: boolean;
    message?: string;
    ticketId?: string;
    error?: string;
  }> {
    try {
      console.log('📥 Processando webhook:', payload.event, payload.instance);

      switch (payload.event) {
        case 'MESSAGES_UPSERT':
          return this.handleMessageUpsert(payload);
        
        case 'MESSAGES_UPDATE':
          return this.handleMessageUpdate(payload);
        
        case 'CONNECTION_UPDATE':
          return this.handleConnectionUpdate(payload);
        
        case 'QRCODE_UPDATED':
          return this.handleQRCodeUpdate(payload);
        
        case 'SEND_MESSAGE':
          return this.handleSendMessage(payload);
        
        default:
          console.log(`ℹ️ Evento não processado: ${payload.event}`);
          return {
            success: true,
            message: `Evento ${payload.event} recebido mas não processado`
          };
      }
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Processar mensagens recebidas/enviadas
   */
  private async handleMessageUpsert(payload: WebhookPayload): Promise<{
    success: boolean;
    message?: string;
    ticketId?: string;
    error?: string;
  }> {
    try {
      const messages = Array.isArray(payload.data) ? payload.data : [payload.data];
      let processedCount = 0;
      let lastTicketId = '';

      for (const messageData of messages) {
        if (!messageData?.key || !messageData?.message) {
          console.warn('⚠️ Dados de mensagem inválidos, ignorando:', messageData);
          continue;
        }

        // Extrair informações da mensagem
        const processedMessage = this.extractMessageInfo(messageData, payload.instance);
        
        if (processedMessage) {
          // Buscar ou criar ticket
          const ticketResult = await this.findOrCreateTicket(
            processedMessage.senderPhone!,
            processedMessage.senderName,
            payload.instance
          );

          if (ticketResult.ticketId) {
            processedMessage.ticketId = ticketResult.ticketId;
            lastTicketId = ticketResult.ticketId;
            
            // Adicionar à fila de processamento
            this.messageQueue.push(processedMessage);
            processedCount++;
          }
        }
      }

      console.log(`✅ ${processedCount} mensagem(s) adicionada(s) à fila de processamento`);
      
      return {
        success: true,
        message: `${processedCount} mensagem(s) processada(s)`,
        ticketId: lastTicketId
      };

    } catch (error) {
      console.error('❌ Erro ao processar MESSAGES_UPSERT:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar mensagens'
      };
    }
  }

  /**
   * Extrair informações relevantes da mensagem
   */
  private extractMessageInfo(messageData: any, instanceName: string): ProcessedWebhookMessage | null {
    try {
      const { key, message, messageTimestamp } = messageData;
      
      // Verificar se é uma mensagem válida
      if (!key?.remoteJid || (!message?.conversation && !message?.extendedTextMessage?.text && !this.hasMediaMessage(message))) {
        return null;
      }

      // Determinar tipo de mensagem e conteúdo
      const messageInfo = this.parseMessageContent(message);
      if (!messageInfo.content && !messageInfo.mediaUrl) {
        return null;
      }

      // Informações do remetente
      const senderPhone = this.extractPhoneFromJid(key.remoteJid);
      const senderName = messageData.pushName || 
                        messageData.verifiedBizName || 
                        this.formatPhoneNumber(senderPhone);

      // Verificar se é mensagem nossa ou do cliente
      const isFromMe = key.fromMe || false;

      return {
        ticketId: '', // Será preenchido após encontrar/criar ticket
        messageId: key.id || `msg_${Date.now()}`,
        content: messageInfo.content,
        sender: isFromMe ? 'agent' : 'client',
        senderName,
        senderPhone,
        instanceName,
        messageType: messageInfo.type,
        mediaUrl: messageInfo.mediaUrl,
        mediaCaption: messageInfo.caption,
        quotedMessage: messageInfo.quotedMessage,
        timestamp: new Date(messageTimestamp * 1000).toISOString(),
        isFromMe,
        messageStatus: 'delivered',
        metadata: {
          is_from_whatsapp: true,
          evolution_instance: instanceName,
          sender_phone: senderPhone,
          message_key: key,
          original_payload: messageData
        }
      };

    } catch (error) {
      console.error('❌ Erro ao extrair informações da mensagem:', error);
      return null;
    }
  }

  /**
   * Analisar conteúdo da mensagem
   */
  private parseMessageContent(message: any): {
    content: string;
    type: ProcessedWebhookMessage['messageType'];
    mediaUrl?: string;
    caption?: string;
    quotedMessage?: any;
  } {
    // Mensagem de texto simples
    if (message.conversation) {
      return {
        content: message.conversation,
        type: 'text'
      };
    }

    // Mensagem de texto estendida (com formatação)
    if (message.extendedTextMessage?.text) {
      return {
        content: message.extendedTextMessage.text,
        type: 'text',
        quotedMessage: message.extendedTextMessage.contextInfo?.quotedMessage ? {
          id: message.extendedTextMessage.contextInfo.stanzaId,
          content: this.extractQuotedContent(message.extendedTextMessage.contextInfo.quotedMessage),
          sender: message.extendedTextMessage.contextInfo.participant || 'Desconhecido'
        } : undefined
      };
    }

    // Mensagens de mídia
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
    
    for (const mediaType of mediaTypes) {
      if (message[mediaType]) {
        const mediaMessage = message[mediaType];
        return {
          content: mediaMessage.caption || `[${this.getMediaTypeLabel(mediaType)}]`,
          type: this.mapMediaType(mediaType),
          mediaUrl: mediaMessage.url,
          caption: mediaMessage.caption
        };
      }
    }

    // Mensagem de localização
    if (message.locationMessage) {
      return {
        content: `📍 Localização: ${message.locationMessage.degreesLatitude}, ${message.locationMessage.degreesLongitude}`,
        type: 'location'
      };
    }

    return {
      content: '[Mensagem não suportada]',
      type: 'text'
    };
  }

  /**
   * Buscar ou criar ticket para o contato
   */
  private async findOrCreateTicket(
    phoneNumber: string, 
    contactName: string, 
    instanceName: string
  ): Promise<TicketCreationResult> {
    try {
      // Primeiro, tentar encontrar ticket existente
      const { data: existingTickets, error: searchError } = await supabase
        .from('tickets')
        .select('id, status, metadata')
        .or(`metadata->>client_phone.eq.${phoneNumber},metadata->>anonymous_contact.eq.${contactName}`)
        .in('status', ['pendente', 'atendimento'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (searchError) {
        console.error('❌ Erro ao buscar tickets existentes:', searchError);
      }

      if (existingTickets && existingTickets.length > 0) {
        const ticket = existingTickets[0];
        console.log('📋 Ticket existente encontrado:', ticket.id);
        return {
          ticketId: ticket.id,
          created: false
        };
      }

      // Criar novo ticket
      console.log('🆕 Criando novo ticket para:', contactName, phoneNumber);

      const newTicketData = {
        title: `Conversa WhatsApp - ${contactName}`,
        subject: `Atendimento WhatsApp de ${contactName}`,
        description: `Ticket criado automaticamente para conversa WhatsApp com ${contactName}`,
        status: 'pendente' as const,
        priority: 'normal' as const,
        channel: 'whatsapp' as const,
        metadata: {
          client_name: contactName,
          client_phone: phoneNumber,
          anonymous_contact: contactName,
          evolution_instance_name: instanceName,
          created_from_whatsapp: true,
          auto_created: true,
          creation_timestamp: new Date().toISOString()
        },
        unread: true,
        tags: ['whatsapp', 'auto-created'],
        is_internal: false,
        last_message_at: new Date().toISOString()
      };

      const { data: newTicket, error: createError } = await supabase
        .from('tickets')
        .insert(newTicketData)
        .select('id')
        .single();

      if (createError) {
        console.error('❌ Erro ao criar ticket:', createError);
        return {
          ticketId: '',
          created: false,
          error: createError.message
        };
      }

      console.log('✅ Novo ticket criado:', newTicket.id);
      return {
        ticketId: newTicket.id,
        created: true
      };

    } catch (error) {
      console.error('❌ Erro ao buscar/criar ticket:', error);
      return {
        ticketId: '',
        created: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  /**
   * Processar fila de mensagens em batches
   */
  private startBatchProcessor() {
    setInterval(async () => {
      if (this.messageQueue.length > 0 && !this.isProcessing) {
        await this.processBatch();
      }
    }, this.batchTimeout);
  }

  /**
   * Processar batch de mensagens
   */
  private async processBatch() {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;
    const batch = this.messageQueue.splice(0, this.batchSize);

    console.log(`🔄 Processando batch de ${batch.length} mensagem(s)`);

    try {
      const messagesToInsert = batch.map(msg => ({
        ticket_id: msg.ticketId,
        sender_id: msg.isFromMe ? null : WEBHOOK_SYSTEM_UUID, // Usar UUID fixo para sistema
        content: msg.content,
        type: msg.messageType,
        is_internal: false,
        sender_name: msg.senderName,
        sender_email: null,
        file_url: msg.mediaUrl,
        file_name: msg.mediaCaption,
        file_type: msg.messageType !== 'text' ? msg.messageType : null,
        file_size: null,
        is_read: false,
        metadata: {
          ...msg.metadata,
          webhook_response: true,
          message_id: msg.messageId,
          sender_phone: msg.senderPhone,
          quoted_message: msg.quotedMessage
        },
        created_at: msg.timestamp
      }));

      // Usar fallback para busca se metadata falhar
      const { data: insertedMessages, error } = await supabase
        .from('messages')
        .insert(messagesToInsert)
        .select();

      if (error) {
        console.error('❌ Erro ao inserir mensagens:', error);
        // Recolocar mensagens na fila para retry
        this.messageQueue.unshift(...batch);
      } else {
        console.log(`✅ ${insertedMessages.length} mensagem(s) inserida(s) com sucesso`);
        
        // Atualizar último timestamp dos tickets
        await this.updateTicketsLastMessage(batch);
      }

    } catch (error) {
      console.error('❌ Erro no processamento do batch:', error);
      // Recolocar mensagens na fila
      this.messageQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Atualizar último timestamp das mensagens nos tickets
   */
  private async updateTicketsLastMessage(messages: ProcessedWebhookMessage[]) {
    const ticketUpdates = messages.reduce((acc, msg) => {
      if (!acc[msg.ticketId] || acc[msg.ticketId] < msg.timestamp) {
        acc[msg.ticketId] = msg.timestamp;
      }
      return acc;
    }, {} as Record<string, string>);

    for (const [ticketId, lastMessage] of Object.entries(ticketUpdates)) {
      try {
        await supabase
          .from('tickets')
          .update({ 
            last_message_at: lastMessage,
            unread: true
          })
          .eq('id', ticketId);
      } catch (error) {
        console.error(`❌ Erro ao atualizar ticket ${ticketId}:`, error);
      }
    }
  }

  /**
   * Processar atualização de status da mensagem
   */
  private async handleMessageUpdate(payload: WebhookPayload) {
    // Implementar lógica para atualização de status (lida, entregue, etc.)
    console.log('📱 Atualização de mensagem recebida:', payload.data);
    
    return {
      success: true,
      message: 'Status de mensagem atualizado'
    };
  }

  /**
   * Processar mudança de conexão
   */
  private async handleConnectionUpdate(payload: WebhookPayload) {
    const connectionStatus = payload.data?.state || 'unknown';
    console.log(`🔗 Status de conexão ${payload.instance}: ${connectionStatus}`);

    // Aqui você pode implementar lógica para notificar usuários sobre mudanças de conexão
    
    return {
      success: true,
      message: `Status de conexão atualizado: ${connectionStatus}`
    };
  }

  /**
   * Processar atualização de QR Code
   */
  private async handleQRCodeUpdate(payload: WebhookPayload) {
    console.log(`📱 QR Code atualizado para ${payload.instance}`);
    
    return {
      success: true,
      message: 'QR Code atualizado'
    };
  }

  /**
   * Processar confirmação de envio
   */
  private async handleSendMessage(payload: WebhookPayload) {
    console.log(`📤 Confirmação de envio para ${payload.instance}:`, payload.data);
    
    return {
      success: true,
      message: 'Confirmação de envio processada'
    };
  }

  // Métodos utilitários
  private extractPhoneFromJid(jid: string): string {
    return jid.split('@')[0];
  }

  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('55') && cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    
    return `+${cleaned}`;
  }

  private hasMediaMessage(message: any): boolean {
    const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage', 'stickerMessage'];
    return mediaTypes.some(type => message[type]);
  }

  private mapMediaType(mediaType: string): ProcessedWebhookMessage['messageType'] {
    const mapping: Record<string, ProcessedWebhookMessage['messageType']> = {
      'imageMessage': 'image',
      'videoMessage': 'video',
      'audioMessage': 'audio',
      'documentMessage': 'document',
      'stickerMessage': 'sticker'
    };
    
    return mapping[mediaType] || 'document';
  }

  private getMediaTypeLabel(mediaType: string): string {
    const labels: Record<string, string> = {
      'imageMessage': 'Imagem',
      'videoMessage': 'Vídeo',
      'audioMessage': 'Áudio',
      'documentMessage': 'Documento',
      'stickerMessage': 'Figurinha'
    };
    
    return labels[mediaType] || 'Mídia';
  }

  private extractQuotedContent(quotedMessage: any): string {
    if (quotedMessage.conversation) return quotedMessage.conversation;
    if (quotedMessage.extendedTextMessage?.text) return quotedMessage.extendedTextMessage.text;
    if (quotedMessage.imageMessage?.caption) return quotedMessage.imageMessage.caption;
    return '[Mensagem citada]';
  }

  // Métodos públicos para uso externo
  async getQueueStatus() {
    return {
      queueLength: this.messageQueue.length,
      isProcessing: this.isProcessing,
      batchSize: this.batchSize
    };
  }

  async clearQueue() {
    this.messageQueue = [];
    console.log('🧹 Fila de mensagens limpa');
  }

  async processSupabaseResponses(ticketId: string, response: string) {
    // Método de fallback para busca por metadata->webhook_response
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('metadata->>webhook_response', 'true')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Erro na busca por metadata:', error);
        
        // Fallback: busca por sender_id
        const { data: fallbackMessages, error: fallbackError } = await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', WEBHOOK_SYSTEM_UUID)
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (fallbackError) {
          console.error('❌ Erro no fallback:', fallbackError);
          return { success: false, error: fallbackError.message };
        }

        return { success: true, messages: fallbackMessages || [] };
      }

      return { success: true, messages: messages || [] };
    } catch (error) {
      console.error('❌ Erro ao processar respostas Supabase:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }
}

// Instância singleton
const webhookResponseService = new WebhookResponseService();

// Função global para receber payload do n8n (mencionada nas memórias)
(globalThis as any).receiveN8nWebhookResponse = async (payload: {
  ticketId: string;
  response: string;
  sender: string;
  confidence?: number;
}) => {
  console.log('📥 Recebendo resposta do n8n:', payload);
  
  try {
    const result = await webhookResponseService.processSupabaseResponses(
      payload.ticketId, 
      payload.response
    );

    if (result.success) {
      console.log('✅ Resposta do n8n processada com sucesso');
      return { success: true, message: 'Resposta processada' };
    } else {
      console.error('❌ Erro ao processar resposta do n8n:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Erro na função global:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
};

export default webhookResponseService;
export { WebhookResponseService };

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