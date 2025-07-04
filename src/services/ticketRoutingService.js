import { supabase } from '../lib/supabase';
/**
 * Serviço para roteamento automático de tickets baseado em mensagens WhatsApp
 */
export class TicketRoutingService {
    /**
     * Processa uma mensagem recebida e roteia para ticket apropriado
     */
    static async routeMessage(message) {
        try {
            console.log('🎯 Roteando mensagem:', {
                from: message.senderPhone,
                content: message.content.substring(0, 50) + '...',
                instance: message.instanceName
            });
            // 1. Verificar se existe ticket em aberto para este número
            const existingTicket = await this.findOpenTicketByPhone(message.senderPhone);
            if (existingTicket) {
                console.log('📋 Ticket existente encontrado:', existingTicket.id);
                // Adicionar mensagem ao ticket existente
                await this.addMessageToTicket(existingTicket.id, message);
                return {
                    ticketId: existingTicket.id,
                    isNewTicket: false,
                    action: 'updated',
                    message: `Mensagem adicionada ao ticket #${existingTicket.id}`
                };
            }
            // 2. Criar novo ticket automaticamente
            console.log('🆕 Criando novo ticket para:', message.senderPhone);
            const newTicketId = await this.createTicketAutomatically(message);
            if (!newTicketId) {
                throw new Error('Falha ao criar ticket automaticamente');
            }
            return {
                ticketId: newTicketId,
                isNewTicket: true,
                action: 'created',
                message: `Novo ticket #${newTicketId} criado automaticamente`
            };
        }
        catch (error) {
            console.error('❌ Erro no roteamento de ticket:', error);
            return {
                ticketId: '',
                isNewTicket: false,
                action: 'error',
                message: error.message
            };
        }
    }
    /**
     * Busca ticket em aberto para um número de telefone
     */
    static async findOpenTicketByPhone(phone) {
        try {
            // Normalizar telefone para busca
            const normalizedPhone = this.normalizePhoneNumber(phone);
            console.log('🔍 Buscando ticket para telefone:', normalizedPhone);
            // Buscar tickets com status em aberto que tenham esse telefone
            const { data: tickets, error } = await supabase
                .from('tickets')
                .select('id, status, title, metadata')
                .in('status', ['pendente', 'atendimento']) // Status em aberto
                .or(`metadata->>client_phone.eq.${normalizedPhone},metadata->>client_phone.eq.${phone}`)
                .order('created_at', { ascending: false })
                .limit(1);
            if (error) {
                console.error('❌ Erro ao buscar ticket por telefone:', error);
                return null;
            }
            if (tickets && tickets.length > 0) {
                console.log('✅ Ticket encontrado:', tickets[0]);
                return tickets[0];
            }
            console.log('⚠️ Nenhum ticket em aberto encontrado para:', normalizedPhone);
            return null;
        }
        catch (error) {
            console.error('❌ Erro na busca de ticket:', error);
            return null;
        }
    }
    /**
     * Cria um novo ticket automaticamente baseado na mensagem
     */
    static async createTicketAutomatically(message) {
        try {
            // Buscar departamento da instância
            const { data: instance } = await supabase
                .from('evolution_instances')
                .select('department_id, department_name')
                .eq('instance_name', message.instanceName)
                .single();
            const ticketData = {
                title: `WhatsApp - ${message.senderName}`,
                subject: `Conversa WhatsApp - ${message.senderPhone}`,
                description: `Ticket criado automaticamente a partir de mensagem WhatsApp.\n\nPrimeira mensagem: "${message.content}"`,
                status: 'pendente',
                priority: 'normal',
                channel: 'chat',
                department_id: instance?.department_id || null,
                metadata: {
                    client_name: message.senderName,
                    client_phone: message.senderPhone,
                    evolution_instance_name: message.instanceName,
                    evolution_message_id: message.messageId,
                    auto_created: true,
                    created_from_whatsapp: true,
                    anonymous_contact: message.senderName,
                    first_message_content: message.content,
                    normalized_phone: this.normalizePhoneNumber(message.senderPhone)
                },
                unread: true,
                tags: ['whatsapp', 'auto-created'],
                is_internal: false,
                last_message_at: message.timestamp
            };
            console.log('📝 Criando ticket com dados:', ticketData);
            const { data: ticket, error } = await supabase
                .from('tickets')
                .insert([ticketData])
                .select('id')
                .single();
            if (error) {
                console.error('❌ Erro ao criar ticket:', error);
                return null;
            }
            console.log('✅ Ticket criado:', ticket.id);
            // Adicionar a primeira mensagem ao ticket
            await this.addMessageToTicket(ticket.id, message);
            return ticket.id;
        }
        catch (error) {
            console.error('❌ Erro ao criar ticket automático:', error);
            return null;
        }
    }
    /**
     * Adiciona uma mensagem a um ticket existente
     */
    static async addMessageToTicket(ticketId, message) {
        try {
            const messageData = {
                ticket_id: ticketId,
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
                    media_caption: message.mediaCaption,
                    normalized_phone: this.normalizePhoneNumber(message.senderPhone)
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
            // Atualizar timestamp do ticket e marcar como não lido
            await supabase
                .from('tickets')
                .update({
                last_message_at: message.timestamp,
                unread: true,
                updated_at: new Date().toISOString()
            })
                .eq('id', ticketId);
            console.log('✅ Mensagem adicionada ao ticket:', ticketId);
        }
        catch (error) {
            console.error('❌ Erro ao adicionar mensagem:', error);
            throw error;
        }
    }
    /**
     * Normaliza número de telefone para busca consistente
     */
    static normalizePhoneNumber(phone) {
        // Remove caracteres especiais e espaços
        const cleaned = phone.replace(/[^\d]/g, '');
        // Se o número tem 13 dígitos e começa com 55 (Brasil), remove o 55
        if (cleaned.length === 13 && cleaned.startsWith('55')) {
            return cleaned.substring(2);
        }
        // Se o número tem 12 dígitos (11 + código de área), mantém
        if (cleaned.length === 11) {
            return cleaned;
        }
        // Se o número tem 10 dígitos, adiciona 9 na frente (celular antigo)
        if (cleaned.length === 10) {
            return cleaned.substring(0, 2) + '9' + cleaned.substring(2);
        }
        return cleaned;
    }
    /**
     * Simula o recebimento de uma mensagem (para testes)
     */
    static async simulateIncomingMessage(testMessage) {
        const defaultMessage = {
            senderPhone: '5511999998888',
            senderName: 'Cliente Teste',
            content: 'Olá! Esta é uma mensagem de teste.',
            instanceName: 'financeiro-encontra',
            messageId: `test_${Date.now()}`,
            messageType: 'text',
            timestamp: new Date().toISOString(),
            ...testMessage
        };
        console.log('🧪 Simulando mensagem recebida:', defaultMessage);
        return await this.routeMessage(defaultMessage);
    }
    /**
     * Lista tickets criados automaticamente (para debug)
     */
    static async getAutoCreatedTickets(limit = 10) {
        try {
            const { data: tickets, error } = await supabase
                .from('tickets')
                .select('id, title, status, metadata, created_at')
                .eq('metadata->>auto_created', 'true')
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('❌ Erro ao buscar tickets automáticos:', error);
                return [];
            }
            return tickets || [];
        }
        catch (error) {
            console.error('❌ Erro ao listar tickets automáticos:', error);
            return [];
        }
    }
}
