import { supabase } from '../../config/supabase.js';
import { generateUUID } from '../../utils/uuid.js';
import { logger } from '../../utils/logger.js';

export class TicketService {
  static async findExistingTicket(clientPhone, departmentId = null) {
    try {
      const { data: existingTickets, error: ticketSearchError } = await supabase
        .rpc('find_existing_ticket_webhook', {
          p_client_phone: clientPhone,
          p_department_id: departmentId
        });

      if (ticketSearchError) {
        logger.warn('⚠️ Erro na busca RPC de ticket:', ticketSearchError.message);
        return null;
      }

      if (existingTickets && existingTickets.length > 0) {
        const ticket = existingTickets[0];
        logger.info('✅ [TICKET] Ticket existente encontrado via RPC:', ticket.id);
        return ticket;
      }

      return null;
    } catch (error) {
      logger.error('❌ Erro na busca de ticket:', error);
      return null;
    }
  }

  static async createTicket(ticketInfo) {
    try {
      logger.info('🎫 [TICKET AVANÇADO] Criando ticket com dados completos:', {
        cliente: ticketInfo.clientData.name,
        telefone: ticketInfo.clientData.phoneFormatted,
        phoneRaw: ticketInfo.clientData.phone,
        customerId: ticketInfo.customerId,
        departmentId: ticketInfo.departmentId,
        instancia: ticketInfo.instanceName,
        canReply: ticketInfo.clientData.responseData.canReply
      });

      const title = `WhatsApp: ${ticketInfo.clientData.name}`;
      
      // Preparar metadata enriquecida
      const enhancedMetadata = {
        client_name: ticketInfo.clientData.name,
        client_phone: ticketInfo.clientData.phone,
        whatsapp_phone: ticketInfo.clientData.phone,
        phone_formatted: ticketInfo.clientData.phoneFormatted,
        whatsapp_jid: ticketInfo.clientData.whatsappJid,
        instance_name: ticketInfo.instanceName,
        initial_message: ticketInfo.messageContent,
        response_data: ticketInfo.clientData.responseData,
        whatsapp_metadata: ticketInfo.clientData.whatsappMetadata,
        phone_info: {
          country: ticketInfo.phoneInfo.country,
          format: ticketInfo.phoneInfo.format,
          is_mobile: ticketInfo.phoneInfo.format.includes('mobile'),
          extracted_at: ticketInfo.phoneInfo.extractedAt
        },
        source: 'webhook_evolution_enhanced',
        created_via: 'whatsapp_enhanced',
        can_reply: true,
        reply_method: 'evolution_api',
        auto_response_enabled: true,
        first_message_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
        is_whatsapp: true,
        has_phone_number: true,
        client_verified: true,
        enhanced_processing: true
      };
      
      // Tentar criar ticket via RPC primeiro
      try {
        const { data: newTicket, error: ticketCreateError } = await supabase
          .rpc('create_ticket_webhook', {
            p_client_name: ticketInfo.clientData.name,
            p_client_phone: ticketInfo.clientData.phone,
            p_customer_id: ticketInfo.customerId,
            p_department_id: ticketInfo.departmentId,
            p_instance_name: ticketInfo.instanceName,
            p_message_content: ticketInfo.messageContent,
            p_title: title
          })
          .single();

        if (!ticketCreateError && newTicket) {
          logger.info('✅ [TICKET] Ticket criado via RPC:', newTicket.id);
          return newTicket;
        }
      } catch (rpcError) {
        logger.warn('⚠️ Erro ao criar ticket via RPC, tentando método direto:', rpcError.message);
      }
      
      // Se RPC falhar, criar ticket diretamente
      const { data: newTicket, error: createError } = await supabase
        .from('tickets')
        .insert([{
          id: generateUUID(),
          title: title,
          description: ticketInfo.messageContent || 'Mensagem via WhatsApp',
          status: 'open',
          priority: 'medium',
          customer_id: ticketInfo.customerId,
          department_id: ticketInfo.departmentId,
          channel: 'whatsapp',
          phone: ticketInfo.clientData.phone,
          metadata: enhancedMetadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id, title, status, channel, metadata')
        .single();

      if (createError) {
        logger.error('❌ Erro ao criar ticket no banco:', createError);
        
        // Retornar ticket local com UUID válido como fallback
        return {
          id: generateUUID(),
          title: title,
          status: 'open',
          channel: 'whatsapp',
          metadata: {
            client_phone: ticketInfo.clientData.phone,
            phone_formatted: ticketInfo.clientData.phoneFormatted,
            can_reply: true
          },
          isLocal: true
        };
      }

      logger.info('✅ [TICKET] Ticket criado com dados completos:', {
        id: newTicket.id,
        title: newTicket.title,
        phone: newTicket.metadata.client_phone,
        phoneFormatted: newTicket.metadata.phone_formatted,
        canReply: newTicket.metadata.can_reply
      });

      return newTicket;

    } catch (error) {
      logger.error('❌ Erro ao criar ticket:', error);
      
      // Retornar ticket local com UUID válido
      return {
        id: generateUUID(),
        title: `WhatsApp: ${ticketInfo.clientData.name}`,
        status: 'open',
        channel: 'whatsapp',
        metadata: {
          client_phone: ticketInfo.clientData.phone,
          phone_formatted: ticketInfo.clientData.phoneFormatted,
          can_reply: true,
          error: error.message
        },
        isLocal: true
      };
    }
  }

  static async vinculateCustomerToTicket(ticketId, customerId) {
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ customer_id: customerId })
        .eq('id', ticketId);

      if (updateError) {
        logger.error('❌ Erro ao vincular cliente ao ticket:', updateError);
        return false;
      }

      logger.info('✅ Cliente vinculado ao ticket com sucesso');
      return true;
    } catch (error) {
      logger.error('❌ Erro ao vincular cliente:', error);
      return false;
    }
  }
} 