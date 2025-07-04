import { supabase } from '@/lib/supabase';
/**
 * Processa webhooks recebidos da Evolution API
 */
export class EvolutionWebhookProcessor {
    /**
     * Processa um payload de webhook da Evolution API
     */
    static async processWebhook(payload) {
        try {
            console.log('📨 Processando webhook Evolution API:', {
                event: payload.event,
                instance: payload.instance,
                timestamp: payload.date_time
            });
            switch (payload.event) {
                case 'MESSAGES_UPSERT':
                    await this.handleMessageUpsert(payload);
                    break;
                case 'CONNECTION_UPDATE':
                    await this.handleConnectionUpdate(payload);
                    break;
                case 'QRCODE_UPDATED':
                    await this.handleQRCodeUpdate(payload);
                    break;
                case 'SEND_MESSAGE':
                    await this.handleSendMessage(payload);
                    break;
                default:
                    console.log('📦 Evento não processado:', payload.event);
            }
        }
        catch (error) {
            console.error('❌ Erro ao processar webhook:', error);
            throw error;
        }
    }
    /**
     * Processa mensagens recebidas/enviadas
     */
    static async handleMessageUpsert(payload) {
        try {
            const messageData = payload.data;
            const instanceName = payload.instance;
            // Verificar se é uma mensagem válida
            if (!messageData || !messageData.key) {
                console.warn('⚠️ Dados de mensagem inválidos:', messageData);
                return;
            }
            const isFromMe = messageData.key.fromMe;
            const remoteJid = messageData.key.remoteJid;
            const messageId = messageData.key.id;
            // Processar apenas mensagens de clientes (não enviadas por nós)
            if (isFromMe) {
                console.log('📤 Mensagem enviada confirmada, ignorando processamento');
                return;
            }
            // Extrair número do cliente
            const clientPhone = this.extractPhoneFromJid(remoteJid);
            if (!clientPhone) {
                console.warn('⚠️ Não foi possível extrair telefone do JID:', remoteJid);
                return;
            }
            // Extrair conteúdo da mensagem
            const messageContent = this.extractMessageContent(messageData.message);
            if (!messageContent.text && !messageContent.mediaUrl) {
                console.warn('⚠️ Mensagem sem conteúdo válido:', messageData.message);
                return;
            }
            const senderName = messageData.pushName || clientPhone;
            console.log('📩 Processando mensagem recebida:', {
                from: senderName,
                phone: clientPhone,
                content: messageContent.text?.substring(0, 50) + '...',
                instance: instanceName
            });
            // Buscar ticket existente
            let ticketId = await this.findExistingTicket(clientPhone, instanceName);
            // Se não encontrou ticket, criar automaticamente
            if (!ticketId) {
                console.log('🆕 Criando novo ticket automaticamente...');
                const autoTicket = {
                    clientName: senderName,
                    clientPhone: clientPhone,
                    instanceName: instanceName,
                    firstMessage: messageContent.text || '[Mídia recebida]',
                    messageId: messageId
                };
                ticketId = await this.createTicketAutomatically(autoTicket);
            }
            if (!ticketId) {
                console.error('❌ Não foi possível criar ou encontrar ticket para a mensagem');
                return;
            }
            // Salvar mensagem no banco
            await this.saveIncomingMessage({
                ticketId,
                messageId,
                content: messageContent.text || '[Mídia]',
                sender: 'client',
                senderName,
                senderPhone: clientPhone,
                instanceName,
                timestamp: new Date().toISOString(),
                messageType: messageContent.type,
                mediaUrl: messageContent.mediaUrl,
                mediaCaption: messageContent.caption,
                isFromMe: false
            });
            // TODO: Implementar função markMessageAsRead no evolutionApi se necessário
            console.log('📨 Mensagem processada, ignorando marcação de lida por enquanto');
            console.log('✅ Mensagem processada com sucesso');
        }
        catch (error) {
            console.error('❌ Erro ao processar MESSAGES_UPSERT:', error);
            throw error;
        }
    }
    /**
     * Processa atualizações de conexão
     */
    static async handleConnectionUpdate(payload) {
        const instanceName = payload.instance;
        const connectionState = payload.data?.state;
        console.log('🔗 Atualização de conexão:', {
            instance: instanceName,
            state: connectionState
        });
        // Aqui você pode atualizar o status da instância no seu banco de dados
        // Por exemplo, marcar como conectada/desconectada
    }
    /**
     * Processa atualizações do QR Code
     */
    static async handleQRCodeUpdate(payload) {
        const instanceName = payload.instance;
        const qrCode = payload.data?.qrcode;
        console.log('📱 QR Code atualizado para instância:', instanceName);
        // Aqui você pode emitir um evento para o frontend atualizar o QR Code
        // ou salvar no cache/banco para exibição
    }
    /**
     * Processa confirmação de envio de mensagem
     */
    static async handleSendMessage(payload) {
        const messageData = payload.data;
        const instanceName = payload.instance;
        console.log('📤 Confirmação de envio:', {
            instance: instanceName,
            messageId: messageData?.key?.id
        });
        // Aqui você pode atualizar o status da mensagem no banco como "delivered"
    }
    /**
     * Extrai número de telefone do JID do WhatsApp
     */
    static extractPhoneFromJid(jid) {
        try {
            // JID format: 5511999998888@s.whatsapp.net
            const phoneMatch = jid.match(/^(\d+)@/);
            return phoneMatch ? phoneMatch[1] : null;
        }
        catch (error) {
            console.error('Erro ao extrair telefone do JID:', error);
            return null;
        }
    }
    /**
     * Extrai conteúdo de diferentes tipos de mensagem
     */
    static extractMessageContent(message) {
        if (!message) {
            return { type: 'unknown' };
        }
        // Mensagem de texto simples
        if (message.conversation) {
            return {
                text: message.conversation,
                type: 'text'
            };
        }
        // Mensagem de texto extendida
        if (message.extendedTextMessage?.text) {
            return {
                text: message.extendedTextMessage.text,
                type: 'text'
            };
        }
        // Imagem
        if (message.imageMessage) {
            return {
                text: message.imageMessage.caption || '[Imagem]',
                type: 'image',
                mediaUrl: message.imageMessage.url,
                caption: message.imageMessage.caption
            };
        }
        // Vídeo
        if (message.videoMessage) {
            return {
                text: message.videoMessage.caption || '[Vídeo]',
                type: 'video',
                mediaUrl: message.videoMessage.url,
                caption: message.videoMessage.caption
            };
        }
        // Áudio
        if (message.audioMessage) {
            return {
                text: '[Áudio]',
                type: 'audio',
                mediaUrl: message.audioMessage.url
            };
        }
        // Documento
        if (message.documentMessage) {
            return {
                text: `[Documento: ${message.documentMessage.fileName || 'arquivo'}]`,
                type: 'document',
                mediaUrl: message.documentMessage.url
            };
        }
        return {
            text: '[Mensagem não suportada]',
            type: 'unknown'
        };
    }
    /**
     * Busca ticket existente baseado no telefone e instância
     */
    static async findExistingTicket(clientPhone, instanceName) {
        try {
            const { data: tickets, error } = await supabase
                .from('tickets')
                .select('id')
                .eq('metadata->>client_phone', clientPhone)
                .eq('metadata->>evolution_instance_name', instanceName)
                .eq('status', 'pendente')
                .order('created_at', { ascending: false })
                .limit(1);
            if (error) {
                console.error('Erro ao buscar ticket existente:', error);
                return null;
            }
            return tickets?.[0]?.id || null;
        }
        catch (error) {
            console.error('Erro ao buscar ticket:', error);
            return null;
        }
    }
    /**
     * Cria um novo ticket automaticamente (método público para dashboard)
     */
    static async createTicketAutomatically(data) {
        try {
            console.log('🎫 Criando ticket automaticamente:', {
                client: data.clientName,
                phone: data.clientPhone,
                instance: data.instanceName
            });
            const ticketData = {
                title: `WhatsApp - ${data.clientName}`,
                subject: `Conversa via WhatsApp - ${data.clientPhone}`,
                description: `Ticket criado automaticamente a partir de mensagem recebida no WhatsApp.\n\nPrimeira mensagem: "${data.firstMessage}"`,
                status: 'pendente',
                priority: 'normal',
                channel: 'chat', // Usando 'chat' ao invés de 'whatsapp'
                metadata: {
                    client_name: data.clientName,
                    client_phone: data.clientPhone,
                    evolution_instance_name: data.instanceName,
                    evolution_message_id: data.messageId,
                    auto_created: true,
                    created_from_whatsapp: true,
                    anonymous_contact: data.clientName
                },
                unread: true,
                tags: ['whatsapp', 'auto-created'],
                is_internal: false,
                last_message_at: new Date().toISOString()
            };
            const { data: ticket, error } = await supabase
                .from('tickets')
                .insert([ticketData])
                .select('id')
                .single();
            if (error) {
                console.error('❌ Erro ao criar ticket automaticamente:', error);
                return null;
            }
            console.log('✅ Ticket criado automaticamente:', ticket.id);
            return ticket.id;
        }
        catch (error) {
            console.error('❌ Erro ao criar ticket automático:', error);
            return null;
        }
    }
    /**
     * Salva mensagem recebida no banco de dados
     */
    static async saveIncomingMessage(message) {
        try {
            const messageData = {
                ticket_id: message.ticketId,
                content: message.content,
                sender_name: message.senderName,
                type: message.messageType,
                is_internal: false,
                is_read: false,
                metadata: {
                    evolution_instance: message.instanceName,
                    evolution_message_id: message.messageId,
                    sender_phone: message.senderPhone,
                    is_from_whatsapp: true,
                    media_url: message.mediaUrl,
                    media_caption: message.mediaCaption
                },
                created_at: message.timestamp
            };
            const { error } = await supabase
                .from('messages')
                .insert([messageData]);
            if (error) {
                console.error('❌ Erro ao salvar mensagem:', error);
                throw error;
            }
            // Atualizar último timestamp do ticket
            await supabase
                .from('tickets')
                .update({
                last_message_at: message.timestamp,
                unread: true
            })
                .eq('id', message.ticketId);
            console.log('✅ Mensagem salva no banco de dados');
        }
        catch (error) {
            console.error('❌ Erro ao salvar mensagem:', error);
            throw error;
        }
    }
    /**
     * Formata número de telefone para busca no banco
     */
    static formatPhoneForSearch(phone) {
        // Remove código do país se presente
        const cleanPhone = phone.replace(/^55/, '');
        // Formata com parênteses e hífen se for celular brasileiro
        if (cleanPhone.length === 11) {
            const ddd = cleanPhone.substring(0, 2);
            const firstPart = cleanPhone.substring(2, 7);
            const secondPart = cleanPhone.substring(7);
            return `(${ddd}) ${firstPart}-${secondPart}`;
        }
        return phone;
    }
}
export default EvolutionWebhookProcessor;
