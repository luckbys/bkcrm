import { supabase } from '../../config/supabase.js';
import { validateUUID, generateUUID } from '../../utils/uuid.js';
import { logger } from '../../utils/logger.js';

export class MessageService {
  static async saveMessage(data) {
    try {
      logger.info('💾 Salvando mensagem no banco:', {
        ticketId: data.ticketId,
        content: data.content.substring(0, 30) + '...',
        sender: data.senderName,
        timestamp: data.timestamp
      });

      // Validar e corrigir UUID do ticket se necessário
      let finalTicketId = data.ticketId;
      let usedFallback = false;

      if (!validateUUID(finalTicketId)) {
        logger.error('❌ UUID do ticket inválido:', finalTicketId);
        finalTicketId = generateUUID();
        usedFallback = true;
        logger.info('🔄 Usando UUID válido gerado:', finalTicketId);
      }

      // Preparar metadados enriquecidos
      const enhancedMessageMetadata = {
        whatsapp_phone: data.senderPhone,
        sender_name: data.senderName,
        instance_name: data.instanceName,
        message_id: data.messageId,
        timestamp: data.timestamp,
        source: data.enhanced ? 'webhook_enhanced' : 'webhook',
        
        ...(data.enhanced && {
          phone_formatted: data.senderPhoneFormatted,
          whatsapp_jid: data.whatsappJid,
          client_data: data.clientData,
          phone_info: data.phoneInfo,
          can_reply: true,
          reply_ready: true,
          enhanced_processing: true
        }),
        
        ...(usedFallback && {
          ticket_id_fallback: true,
          original_ticket_id: data.ticketId,
          fallback_reason: 'invalid_uuid_format'
        })
      };

      const messageData = {
        ticket_id: finalTicketId,
        content: data.content,
        sender_id: null,
        sender_type: 'customer',
        message_type: 'text',
        metadata: enhancedMessageMetadata,
        created_at: data.timestamp
      };
      
      const { data: message, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Erro ao salvar mensagem:', error);
        
        // Tentar salvar como mensagem órfã se erro de UUID
        if (error.code === '22P02' || error.message.includes('uuid')) {
          logger.info('🔄 Tentando salvar mensagem sem ticket_id (mensagem órfã)...');
          
          const orphanMessageData = {
            content: data.content,
            sender_id: null,
            sender_type: 'customer',
            message_type: 'text',
            metadata: {
              ...enhancedMessageMetadata,
              orphan_message: true,
              original_ticket_id: data.ticketId,
              error_reason: 'invalid_ticket_uuid'
            },
            created_at: data.timestamp
          };
          
          const { data: orphanMessage, error: orphanError } = await supabase
            .from('messages')
            .insert([orphanMessageData])
            .select()
            .single();
          
          if (!orphanError) {
            logger.info('✅ Mensagem órfã salva com sucesso:', orphanMessage.id);
            return {
              success: true,
              message: 'Mensagem salva como órfã (ticket UUID inválido)',
              messageId: orphanMessage.id,
              method: 'orphan'
            };
          }
        }
        
        return { 
          success: false, 
          message: `Erro ao salvar: ${error.message}`
        };
      }
      
      logger.info('✅ Mensagem salva com sucesso:', message.id);
      
      return {
        success: true,
        message: 'Mensagem salva no banco',
        messageId: message.id
      };

    } catch (error) {
      logger.error('❌ Erro geral ao salvar mensagem:', error);
      return { 
        success: false, 
        message: `Erro: ${error.message}`
      };
    }
  }
} 