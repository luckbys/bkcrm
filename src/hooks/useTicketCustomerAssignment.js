import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './use-toast';
export const useTicketCustomerAssignment = () => {
    const { toast } = useToast();
    const [isAssigning, setIsAssigning] = useState(false);
    // Função para verificar se a vinculação existe no banco
    const verifyAssignment = useCallback(async (ticketId) => {
        try {
            console.log('🔍 [VERIFICAÇÃO] Verificando vinculação existente para ticket:', ticketId);
            const { data: ticket, error } = await supabase
                .from('tickets')
                .select(`
          id,
          customer_id,
          metadata,
          customer:profiles!tickets_customer_id_fkey (
            id,
            name,
            email,
            metadata
          )
        `)
                .eq('id', ticketId)
                .single();
            if (error) {
                console.error('❌ [VERIFICAÇÃO] Erro ao buscar ticket:', error);
                return { customerId: null, customerData: null };
            }
            if (ticket?.customer_id && ticket.customer) {
                console.log('✅ [VERIFICAÇÃO] Vinculação encontrada:', {
                    ticketId,
                    customerId: ticket.customer_id,
                    customerName: ticket.customer.name
                });
                return {
                    customerId: ticket.customer_id,
                    customerData: ticket.customer
                };
            }
            console.log('❌ [VERIFICAÇÃO] Nenhuma vinculação encontrada');
            return { customerId: null, customerData: null };
        }
        catch (error) {
            console.error('❌ [VERIFICAÇÃO] Erro na verificação:', error);
            return { customerId: null, customerData: null };
        }
    }, []);
    // Função principal para atribuir cliente ao ticket
    const assignCustomer = useCallback(async (ticketId, customer, onSuccess) => {
        try {
            setIsAssigning(true);
            console.log('🎯 [VINCULAÇÃO] Iniciando vinculação:', {
                ticketId,
                customerId: customer.id,
                customerName: customer.name
            });
            // 1. Primeiro, verificar se o ticket existe
            const { data: existingTicket, error: checkError } = await supabase
                .from('tickets')
                .select('id, customer_id, metadata')
                .eq('id', ticketId)
                .single();
            if (checkError) {
                throw new Error(`Ticket não encontrado: ${checkError.message}`);
            }
            console.log('📋 [VINCULAÇÃO] Ticket encontrado:', existingTicket);
            // 2. Preparar metadados enriquecidos
            const updatedMetadata = {
                ...existingTicket.metadata,
                customer_assigned: true,
                customer_assigned_at: new Date().toISOString(),
                customer_assigned_by: 'manual_assignment',
                customer_data: {
                    id: customer.id,
                    name: customer.name,
                    email: customer.email,
                    phone: customer.phone,
                    category: customer.category,
                    company: customer.company
                },
                // Manter dados originais se existirem
                original_client_data: existingTicket.metadata?.client_name ? {
                    client_name: existingTicket.metadata.client_name,
                    client_phone: existingTicket.metadata.client_phone,
                    whatsapp_phone: existingTicket.metadata.whatsapp_phone
                } : null
            };
            // 3. Atualizar ticket no banco com todas as informações
            const { data: updatedTicket, error: updateError } = await supabase
                .from('tickets')
                .update({
                customer_id: customer.id,
                metadata: updatedMetadata,
                updated_at: new Date().toISOString()
            })
                .eq('id', ticketId)
                .select(`
          *,
          customer:profiles!tickets_customer_id_fkey (
            id,
            name,
            email,
            metadata
          )
        `)
                .single();
            if (updateError) {
                throw new Error(`Erro ao atualizar ticket: ${updateError.message}`);
            }
            console.log('✅ [VINCULAÇÃO] Ticket atualizado com sucesso:', updatedTicket);
            // 4. Verificar se a vinculação foi realmente salva
            const verification = await verifyAssignment(ticketId);
            if (!verification.customerId) {
                throw new Error('Vinculação não foi persistida corretamente no banco');
            }
            console.log('✅ [VINCULAÇÃO] Vinculação verificada e confirmada');
            // 5. Atualizar histórico do cliente
            await updateCustomerHistory(customer.id, ticketId);
            // 6. Executar callback de sucesso se fornecido
            if (onSuccess) {
                onSuccess(updatedTicket);
            }
            toast({
                title: "✅ Cliente vinculado",
                description: `${customer.name} foi vinculado ao ticket com sucesso`,
            });
            return {
                success: true,
                ticketData: updatedTicket
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('❌ [VINCULAÇÃO] Erro:', errorMessage);
            toast({
                title: "❌ Erro na vinculação",
                description: errorMessage,
                variant: "destructive"
            });
            return {
                success: false,
                error: errorMessage
            };
        }
        finally {
            setIsAssigning(false);
        }
    }, [toast, verifyAssignment]);
    // Função para remover vinculação
    const removeAssignment = useCallback(async (ticketId, onSuccess) => {
        try {
            setIsAssigning(true);
            console.log('🗑️ [REMOÇÃO] Removendo vinculação do ticket:', ticketId);
            // 1. Buscar dados atuais
            const { data: currentTicket, error: fetchError } = await supabase
                .from('tickets')
                .select('metadata, customer_id')
                .eq('id', ticketId)
                .single();
            if (fetchError) {
                throw new Error(`Erro ao buscar ticket: ${fetchError.message}`);
            }
            // 2. Atualizar metadados mantendo histórico
            const updatedMetadata = {
                ...currentTicket.metadata,
                customer_assigned: false,
                customer_removed_at: new Date().toISOString(),
                customer_removed_by: 'manual_removal',
                previous_customer_data: currentTicket.metadata?.customer_data || null
            };
            // 3. Remover vinculação
            const { data: updatedTicket, error: updateError } = await supabase
                .from('tickets')
                .update({
                customer_id: null,
                metadata: updatedMetadata,
                updated_at: new Date().toISOString()
            })
                .eq('id', ticketId)
                .select()
                .single();
            if (updateError) {
                throw new Error(`Erro ao remover vinculação: ${updateError.message}`);
            }
            console.log('✅ [REMOÇÃO] Vinculação removida com sucesso');
            // 4. Executar callback se fornecido
            if (onSuccess) {
                onSuccess(updatedTicket);
            }
            toast({
                title: "✅ Vinculação removida",
                description: "Cliente foi desvinculado do ticket",
            });
            return {
                success: true,
                ticketData: updatedTicket
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('❌ [REMOÇÃO] Erro:', errorMessage);
            toast({
                title: "❌ Erro na remoção",
                description: errorMessage,
                variant: "destructive"
            });
            return {
                success: false,
                error: errorMessage
            };
        }
        finally {
            setIsAssigning(false);
        }
    }, [toast]);
    // Atualizar histórico do cliente
    const updateCustomerHistory = useCallback(async (customerId, ticketId) => {
        try {
            const { data: customer, error } = await supabase
                .from('profiles')
                .select('metadata')
                .eq('id', customerId)
                .single();
            if (error) {
                console.warn('⚠️ [HISTÓRICO] Não foi possível atualizar histórico do cliente:', error);
                return;
            }
            const currentMetadata = customer?.metadata || {};
            const updatedMetadata = {
                ...currentMetadata,
                last_ticket_assignment: new Date().toISOString(),
                total_assignments: (currentMetadata.total_assignments || 0) + 1,
                assignment_history: [
                    ...(currentMetadata.assignment_history || []).slice(-9), // Manter últimos 10
                    {
                        ticket_id: ticketId,
                        assigned_at: new Date().toISOString(),
                        method: 'manual_assignment'
                    }
                ]
            };
            await supabase
                .from('profiles')
                .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString()
            })
                .eq('id', customerId);
            console.log('✅ [HISTÓRICO] Histórico do cliente atualizado');
        }
        catch (error) {
            console.warn('⚠️ [HISTÓRICO] Erro ao atualizar histórico:', error);
        }
    }, []);
    // Função para recarregar dados do ticket
    const reloadTicketData = useCallback(async (ticketId) => {
        try {
            console.log('🔄 [RELOAD] Recarregando dados do ticket:', ticketId);
            const { data: ticket, error } = await supabase
                .from('tickets')
                .select(`
          *,
          customer:profiles!tickets_customer_id_fkey (
            id,
            name,
            email,
            phone,
            metadata
          )
        `)
                .eq('id', ticketId)
                .single();
            if (error) {
                console.error('❌ [RELOAD] Erro ao recarregar:', error);
                return null;
            }
            console.log('✅ [RELOAD] Dados recarregados:', ticket);
            return ticket;
        }
        catch (error) {
            console.error('❌ [RELOAD] Erro no reload:', error);
            return null;
        }
    }, []);
    return {
        isAssigning,
        assignCustomer,
        removeAssignment,
        verifyAssignment,
        reloadTicketData
    };
};
