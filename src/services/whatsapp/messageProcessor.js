import { CustomerService } from '../database/customerService.js';
import { TicketService } from '../database/ticketService.js';
import { MessageService } from '../database/messageService.js';
import { logger } from '../../utils/logger.js';

export class WhatsAppMessageProcessor {
  static async processMessage(payload) {
    try {
      // Extrair dados básicos da mensagem
      const messageData = this.extractMessageData(payload);
      if (!messageData) {
        logger.error('❌ Dados da mensagem inválidos ou ausentes');
        return { success: false, message: 'Dados da mensagem inválidos' };
      }

      // Processar dados do cliente
      const clientInfo = await this.prepareClientInfo(messageData);
      
      // Criar ou encontrar cliente
      const { id: customerId, isNew } = await CustomerService.findOrCreateCustomer(clientInfo);
      logger.info(`✅ [CLIENTE] ${isNew ? 'Criado' : 'Encontrado'} via CustomerService:`, customerId);

      // Buscar ticket existente ou criar novo
      const ticket = await this.handleTicket(messageData, customerId, clientInfo);
      if (!ticket) {
        logger.error('❌ Não foi possível processar o ticket');
        return { success: false, message: 'Erro ao processar ticket' };
      }

      // Salvar mensagem
      const messageResult = await MessageService.saveMessage({
        ticketId: ticket.id,
        content: messageData.content,
        senderName: clientInfo.name,
        senderPhone: clientInfo.phone,
        messageId: messageData.messageId,
        timestamp: messageData.timestamp,
        instanceName: messageData.instanceName,
        enhanced: true,
        senderPhoneFormatted: clientInfo.phoneFormatted,
        whatsappJid: clientInfo.whatsappMetadata.whatsappJid,
        clientData: clientInfo,
        phoneInfo: messageData.phoneInfo
      });

      if (!messageResult.success) {
        logger.error('❌ Erro ao salvar mensagem:', messageResult.message);
        return messageResult;
      }

      return {
        success: true,
        message: 'Mensagem processada com sucesso',
        ticket: ticket,
        messageId: messageResult.messageId
      };

    } catch (error) {
      logger.error('❌ Erro ao processar mensagem:', error);
      return {
        success: false,
        message: `Erro ao processar: ${error.message}`
      };
    }
  }

  static extractMessageData(payload) {
    try {
      const {
        key: { remoteJid, id: messageId },
        pushName,
        messageTimestamp,
        message
      } = payload.messages[0];

      // Extrair conteúdo da mensagem
      const content = this.extractMessageContent(message);
      if (!content) {
        logger.warn('⚠️ Conteúdo da mensagem vazio ou inválido');
        return null;
      }

      // Extrair e normalizar telefone
      const phoneInfo = this.extractPhoneInfo(remoteJid, pushName);
      if (!phoneInfo.phone) {
        logger.warn('⚠️ Telefone inválido:', remoteJid);
        return null;
      }

      return {
        messageId,
        content,
        timestamp: new Date(messageTimestamp * 1000).toISOString(),
        instanceName: payload.instance.instanceName,
        ...phoneInfo
      };

    } catch (error) {
      logger.error('❌ Erro ao extrair dados da mensagem:', error);
      return null;
    }
  }

  static extractMessageContent(message) {
    if (!message) return null;

    // Texto simples
    if (message.conversation) {
      return message.conversation;
    }

    // Mensagem extendida
    if (message.extendedTextMessage?.text) {
      return message.extendedTextMessage.text;
    }

    // Outros tipos (imagem, vídeo, etc)
    if (message.imageMessage) {
      return '[Imagem]' + (message.imageMessage.caption || '');
    }
    if (message.videoMessage) {
      return '[Vídeo]' + (message.videoMessage.caption || '');
    }
    if (message.documentMessage) {
      return '[Documento]' + (message.documentMessage.fileName || '');
    }
    if (message.audioMessage) {
      return '[Áudio]';
    }
    if (message.stickerMessage) {
      return '[Sticker]';
    }
    if (message.contactMessage) {
      return '[Contato]';
    }
    if (message.locationMessage) {
      return '[Localização]';
    }

    return null;
  }

  static extractPhoneInfo(remoteJid, pushName) {
    try {
      // Remover sufixo @s.whatsapp.net ou @g.us
      const phone = remoteJid.split('@')[0];
      
      // Validar formato básico
      if (!/^\d{10,}$/.test(phone)) {
        return { error: 'Formato de telefone inválido' };
      }

      // Formatar telefone
      const phoneFormatted = phone.length === 13 
        ? `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`
        : phone;

      return {
        phone,
        phoneFormatted,
        pushName: pushName || 'Cliente',
        whatsappMetadata: {
          whatsappJid: remoteJid,
          country: phone.slice(0, 2),
          phoneFormat: 'mobile',
          extractedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('❌ Erro ao extrair informações do telefone:', error);
      return { error: error.message };
    }
  }

  static async prepareClientInfo(messageData) {
    return {
      phone: messageData.phone,
      phoneFormatted: messageData.phoneFormatted,
      name: messageData.pushName,
      instanceName: messageData.instanceName,
      whatsappMetadata: messageData.whatsappMetadata,
      responseData: {
        canReply: true,
        replyMethod: 'evolution_api',
        lastResponse: new Date().toISOString()
      }
    };
  }

  static async handleTicket(messageData, customerId, clientInfo) {
    // Buscar ticket existente
    const existingTicket = await TicketService.findExistingTicket(messageData.phone);
    
    if (existingTicket) {
      logger.info('✅ [TICKET] Usando ticket existente:', existingTicket.id);
      return existingTicket;
    }

    // Criar novo ticket
    const ticketInfo = {
      clientData: clientInfo,
      customerId: customerId,
      departmentId: null, // Pode ser configurado baseado na instância
      messageContent: messageData.content,
      instanceName: messageData.instanceName,
      phoneInfo: messageData.whatsappMetadata
    };

    const newTicket = await TicketService.createTicket(ticketInfo);
    logger.info('✅ [TICKET] Novo ticket criado:', newTicket.id);
    
    return newTicket;
  }
} 