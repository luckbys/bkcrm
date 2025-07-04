import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
export const useCustomerAutoLink = () => {
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    // Extrair dados do cliente do ticket
    const extractClientDataFromTicket = useCallback((ticket) => {
        if (!ticket)
            return {};
        const metadata = ticket.metadata || {};
        const isWhatsApp = Boolean(metadata.is_whatsapp ||
            metadata.whatsapp_phone ||
            metadata.enhanced_processing ||
            ticket.channel === 'whatsapp');
        let clientData = {};
        if (isWhatsApp) {
            // Dados do WhatsApp
            clientData.name = metadata.client_name ||
                metadata.whatsapp_name ||
                (typeof metadata.anonymous_contact === 'object'
                    ? metadata.anonymous_contact?.name
                    : metadata.anonymous_contact) ||
                ticket.client ||
                '';
            clientData.phone = metadata.client_phone ||
                metadata.whatsapp_phone ||
                (typeof metadata.anonymous_contact === 'object'
                    ? metadata.anonymous_contact?.phone
                    : null) ||
                ticket.phone ||
                '';
            clientData.whatsappJid = metadata.whatsapp_jid ||
                metadata.whatsapp_phone + '@s.whatsapp.net';
            clientData.instanceName = metadata.instance_name;
            // Gerar email temporário se não tiver
            if (clientData.phone && !clientData.email) {
                clientData.email = `whatsapp-${clientData.phone.replace(/\D/g, '')}@auto-generated.com`;
            }
        }
        else {
            // Dados normais
            clientData.name = ticket.client || ticket.customer_name || '';
            clientData.phone = ticket.customerPhone || ticket.customer_phone || '';
            clientData.email = ticket.customerEmail || ticket.customer_email || '';
        }
        clientData.metadata = metadata;
        return clientData;
    }, []);
    // Buscar cliente existente com múltiplos critérios
    const findExistingCustomer = useCallback(async (clientData) => {
        try {
            const { data: customers, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'customer')
                .eq('is_active', true);
            if (error)
                throw error;
            if (!customers || customers.length === 0) {
                return { customer: null, confidence: 0, method: 'no_customers' };
            }
            // Converter para formato Customer
            const formattedCustomers = customers.map(profile => {
                const metadata = profile.metadata || {};
                return {
                    id: profile.id,
                    name: profile.name || 'Cliente',
                    email: profile.email,
                    phone: metadata.phone || '',
                    document: metadata.document || '',
                    documentType: metadata.document_type || 'cpf',
                    company: metadata.company || '',
                    position: metadata.position || '',
                    address: metadata.address || {
                        street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
                    },
                    status: metadata.status || 'prospect',
                    category: metadata.category || 'bronze',
                    channel: metadata.channel || 'whatsapp',
                    tags: metadata.tags || [],
                    notes: metadata.notes || '',
                    customerSince: profile.created_at,
                    lastInteraction: metadata.last_whatsapp_contact || profile.created_at,
                    totalOrders: metadata.total_orders || 0,
                    totalValue: metadata.total_value || 0,
                    averageTicket: metadata.average_ticket || 0,
                    responsibleAgent: metadata.responsible_agent || '',
                    createdAt: profile.created_at,
                    updatedAt: profile.updated_at
                };
            });
            // 1. Busca por telefone (mais confiável para WhatsApp)
            if (clientData.phone) {
                const phoneClean = clientData.phone.replace(/\D/g, '');
                const phoneMatches = formattedCustomers.filter(customer => {
                    const customerPhone = customer.phone.replace(/\D/g, '');
                    return customerPhone && phoneClean && (customerPhone === phoneClean ||
                        customerPhone.endsWith(phoneClean.slice(-9)) || // Últimos 9 dígitos (celular BR)
                        phoneClean.endsWith(customerPhone.slice(-9)));
                });
                if (phoneMatches.length > 0) {
                    return {
                        customer: phoneMatches[0],
                        confidence: 95,
                        method: 'phone_match'
                    };
                }
            }
            // 2. Busca por email exato
            if (clientData.email && !clientData.email.includes('@auto-generated.com')) {
                const emailMatch = formattedCustomers.find(customer => customer.email.toLowerCase() === clientData.email?.toLowerCase());
                if (emailMatch) {
                    return {
                        customer: emailMatch,
                        confidence: 90,
                        method: 'email_match'
                    };
                }
            }
            // 3. Busca por nome exato
            if (clientData.name) {
                const nameMatch = formattedCustomers.find(customer => customer.name.toLowerCase() === clientData.name?.toLowerCase());
                if (nameMatch) {
                    return {
                        customer: nameMatch,
                        confidence: 70,
                        method: 'exact_name_match'
                    };
                }
            }
            // 4. Busca fuzzy por nome (similaridade)
            if (clientData.name && clientData.name.length > 3) {
                const fuzzyMatches = formattedCustomers.filter(customer => {
                    const similarity = calculateNameSimilarity(customer.name, clientData.name);
                    return similarity > 0.8;
                });
                if (fuzzyMatches.length > 0) {
                    return {
                        customer: fuzzyMatches[0],
                        confidence: 60,
                        method: 'fuzzy_name_match'
                    };
                }
            }
            return { customer: null, confidence: 0, method: 'no_match' };
        }
        catch (error) {
            console.error('❌ Erro ao buscar cliente existente:', error);
            return { customer: null, confidence: 0, method: 'error' };
        }
    }, []);
    // Criar novo cliente automaticamente
    const createNewCustomer = useCallback(async (clientData) => {
        try {
            if (!clientData.name || !clientData.email) {
                console.warn('⚠️ Dados insuficientes para criar cliente:', clientData);
                return null;
            }
            // Preparar metadata enriquecida
            const enrichedMetadata = {
                phone: clientData.phone || '',
                whatsapp_jid: clientData.whatsappJid,
                instance_name: clientData.instanceName,
                source: 'auto_created_from_ticket',
                category: 'bronze',
                status: 'active',
                tags: ['auto-created', 'whatsapp'],
                created_via: 'customer_auto_link',
                original_metadata: clientData.metadata,
                first_contact: new Date().toISOString(),
                auto_generated_email: clientData.email?.includes('@auto-generated.com') || false
            };
            // Inserir no banco
            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert({
                name: clientData.name,
                email: clientData.email,
                role: 'customer',
                is_active: true,
                metadata: enrichedMetadata
            })
                .select()
                .single();
            if (error)
                throw error;
            // Converter para formato Customer
            const newCustomer = {
                id: newProfile.id,
                name: newProfile.name,
                email: newProfile.email,
                phone: clientData.phone || '',
                document: '',
                documentType: 'cpf',
                company: '',
                position: '',
                address: {
                    street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: ''
                },
                status: 'active',
                category: 'bronze',
                channel: 'whatsapp',
                tags: ['auto-created', 'whatsapp'],
                notes: `Cliente criado automaticamente via ${clientData.instanceName || 'WhatsApp'}`,
                customerSince: newProfile.created_at,
                lastInteraction: newProfile.created_at,
                totalOrders: 0,
                totalValue: 0,
                averageTicket: 0,
                responsibleAgent: '',
                createdAt: newProfile.created_at,
                updatedAt: newProfile.updated_at
            };
            console.log('✅ Novo cliente criado automaticamente:', newCustomer.id);
            return newCustomer;
        }
        catch (error) {
            console.error('❌ Erro ao criar novo cliente:', error);
            return null;
        }
    }, []);
    // Função principal de vinculação automática
    const autoLinkCustomerToTicket = useCallback(async (ticket) => {
        try {
            setIsProcessing(true);
            // 1. Extrair dados do cliente do ticket
            const clientData = extractClientDataFromTicket(ticket);
            if (!clientData.name && !clientData.phone && !clientData.email) {
                return {
                    success: false,
                    confidence: 0,
                    method: 'exact_match',
                    reason: 'Dados insuficientes no ticket para vinculação'
                };
            }
            console.log('🔍 Iniciando vinculação automática:', clientData);
            // 2. Buscar cliente existente
            const { customer: existingCustomer, confidence, method } = await findExistingCustomer(clientData);
            if (existingCustomer && confidence >= 70) {
                // Cliente encontrado com boa confiança
                console.log(`✅ Cliente encontrado (${confidence}%):`, existingCustomer.name);
                return {
                    success: true,
                    customer: existingCustomer,
                    confidence,
                    method: method,
                    reason: `Cliente encontrado por ${method} com ${confidence}% de confiança`
                };
            }
            // 3. Criar novo cliente se não encontrado
            if (!existingCustomer && clientData.name && clientData.email) {
                console.log('➕ Criando novo cliente automaticamente...');
                const newCustomer = await createNewCustomer(clientData);
                if (newCustomer) {
                    return {
                        success: true,
                        customer: newCustomer,
                        confidence: 100,
                        method: 'created_new',
                        reason: 'Novo cliente criado automaticamente'
                    };
                }
            }
            return {
                success: false,
                confidence: 0,
                method: 'exact_match',
                reason: 'Não foi possível criar ou encontrar cliente adequado'
            };
        }
        catch (error) {
            console.error('❌ Erro na vinculação automática:', error);
            return {
                success: false,
                confidence: 0,
                method: 'exact_match',
                reason: `Erro técnico: ${error.message}`
            };
        }
        finally {
            setIsProcessing(false);
        }
    }, [extractClientDataFromTicket, findExistingCustomer, createNewCustomer]);
    // Atualizar metadados do cliente com informações do ticket
    const enrichCustomerWithTicketData = useCallback(async (customerId, ticketData) => {
        try {
            const clientData = extractClientDataFromTicket(ticketData);
            // Buscar dados atuais do cliente
            const { data: currentProfile, error } = await supabase
                .from('profiles')
                .select('metadata')
                .eq('id', customerId)
                .single();
            if (error)
                throw error;
            const currentMetadata = currentProfile?.metadata || {};
            // Enriquecer metadados
            const enrichedMetadata = {
                ...currentMetadata,
                last_whatsapp_contact: new Date().toISOString(),
                last_instance: clientData.instanceName,
                total_tickets: (currentMetadata.total_tickets || 0) + 1,
                last_ticket_id: ticketData.id,
                contact_history: [
                    ...(currentMetadata.contact_history || []).slice(-9), // Manter últimos 10
                    {
                        date: new Date().toISOString(),
                        ticket_id: ticketData.id,
                        instance: clientData.instanceName,
                        method: 'whatsapp'
                    }
                ]
            };
            // Atualizar no banco
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                metadata: enrichedMetadata,
                updated_at: new Date().toISOString()
            })
                .eq('id', customerId);
            if (updateError)
                throw updateError;
            console.log('✅ Cliente enriquecido com dados do ticket');
            return true;
        }
        catch (error) {
            console.error('❌ Erro ao enriquecer cliente:', error);
            return false;
        }
    }, [extractClientDataFromTicket]);
    return {
        isProcessing,
        autoLinkCustomerToTicket,
        extractClientDataFromTicket,
        findExistingCustomer,
        createNewCustomer,
        enrichCustomerWithTicketData
    };
};
// Função auxiliar para calcular similaridade entre nomes
function calculateNameSimilarity(name1, name2) {
    const cleanName1 = name1.toLowerCase().trim();
    const cleanName2 = name2.toLowerCase().trim();
    if (cleanName1 === cleanName2)
        return 1;
    // Algoritmo de Levenshtein simplificado
    const matrix = Array(cleanName2.length + 1).fill(null).map(() => Array(cleanName1.length + 1).fill(null));
    for (let i = 0; i <= cleanName1.length; i++)
        matrix[0][i] = i;
    for (let j = 0; j <= cleanName2.length; j++)
        matrix[j][0] = j;
    for (let j = 1; j <= cleanName2.length; j++) {
        for (let i = 1; i <= cleanName1.length; i++) {
            const cost = cleanName1[i - 1] === cleanName2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
        }
    }
    const maxLength = Math.max(cleanName1.length, cleanName2.length);
    return 1 - (matrix[cleanName2.length][cleanName1.length] / maxLength);
}
