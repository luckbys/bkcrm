import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
export function useTickets(userId, userRole) {
    const [state, setState] = useState({
        tickets: [],
        currentTicket: null,
        messages: [],
        loading: true,
        error: null,
    });
    useEffect(() => {
        if (userId) {
            loadTickets();
            // Subscribe to new tickets
            const newTicketsSubscription = supabase
                .channel('new-tickets')
                .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'tickets'
            }, (payload) => {
                const newTicket = payload.new;
                // Only add tickets that match the user's role
                let shouldAdd = false;
                if (userRole === 'admin') {
                    shouldAdd = true;
                }
                else if (userRole === 'customer' && newTicket.customer_id === userId) {
                    shouldAdd = true;
                }
                else if (userRole === 'agent' && newTicket.agent_id === userId) {
                    shouldAdd = true;
                }
                if (shouldAdd && newTicket && newTicket.id) {
                    setState(prev => ({
                        ...prev,
                        tickets: [...prev.tickets, newTicket]
                    }));
                }
            })
                .subscribe();
            return () => {
                newTicketsSubscription.unsubscribe();
            };
        }
    }, [userId, userRole]);
    const loadTickets = async () => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            let query = supabase
                .from('tickets')
                .select('*');
            // Filtrar tickets baseado no papel do usuário
            if (userRole === 'customer') {
                query = query.eq('customer_id', userId);
            }
            else if (userRole === 'agent') {
                query = query.eq('agent_id', userId);
            }
            // Admin pode ver todos os tickets
            const { data, error } = await query;
            if (error)
                throw error;
            setState(prev => ({
                ...prev,
                tickets: data || [],
                loading: false,
                error: null
            }));
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error
            }));
        }
    };
    const createTicket = async (ticket) => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            const { data, error } = await supabase
                .from('tickets')
                .insert([ticket])
                .select()
                .single();
            if (error)
                throw error;
            setState(prev => ({
                ...prev,
                tickets: [...prev.tickets, data],
                loading: false,
                error: null
            }));
            return data;
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error
            }));
            throw error;
        }
    };
    const updateTicket = async (ticketId, updates) => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            const { data, error } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', ticketId)
                .select()
                .single();
            if (error)
                throw error;
            setState(prev => ({
                ...prev,
                tickets: prev.tickets.map(t => t.id === ticketId ? data : t),
                currentTicket: prev.currentTicket?.id === ticketId ? data : prev.currentTicket,
                loading: false,
                error: null
            }));
            return data;
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error
            }));
            throw error;
        }
    };
    const selectTicket = async (ticketId) => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            // Carregar detalhes do ticket
            const { data: ticket, error: ticketError } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', ticketId)
                .single();
            if (ticketError)
                throw ticketError;
            // Carregar mensagens do ticket
            const { data: messages, error: messagesError } = await supabase
                .from('messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });
            if (messagesError)
                throw messagesError;
            setState(prev => ({
                ...prev,
                currentTicket: ticket,
                messages: messages || [],
                loading: false,
                error: null
            }));
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error
            }));
            throw error;
        }
    };
    const sendMessage = async (message) => {
        try {
            setState(prev => ({ ...prev, loading: true }));
            const { data, error } = await supabase
                .from('messages')
                .insert([message])
                .select()
                .single();
            if (error)
                throw error;
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, data],
                loading: false,
                error: null
            }));
            return data;
        }
        catch (error) {
            setState(prev => ({
                ...prev,
                loading: false,
                error: error
            }));
            throw error;
        }
    };
    // Inscrever-se para atualizações em tempo real
    useEffect(() => {
        if (!state.currentTicket)
            return;
        // Inscrever para atualizações do ticket atual
        const ticketSubscription = supabase
            .channel(`ticket:${state.currentTicket.id}`)
            .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `id=eq.${state.currentTicket.id}`
        }, (payload) => {
            const newTicket = payload.new;
            if (newTicket && newTicket.id) {
                setState(prev => ({
                    ...prev,
                    currentTicket: newTicket,
                    tickets: prev.tickets.map(t => t.id === newTicket.id ? newTicket : t)
                }));
            }
        })
            .subscribe();
        // Inscrever para novas mensagens
        const messagesSubscription = supabase
            .channel(`messages:${state.currentTicket.id}`)
            .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `ticket_id=eq.${state.currentTicket.id}`
        }, (payload) => {
            const newMessage = payload.new;
            if (newMessage && newMessage.id) {
                setState(prev => ({
                    ...prev,
                    messages: [...prev.messages, newMessage]
                }));
            }
        })
            .subscribe();
        return () => {
            ticketSubscription.unsubscribe();
            messagesSubscription.unsubscribe();
        };
    }, [state.currentTicket?.id]);
    return {
        tickets: state.tickets,
        currentTicket: state.currentTicket,
        messages: state.messages,
        loading: state.loading,
        error: state.error,
        loadTickets,
        createTicket,
        updateTicket,
        selectTicket,
        sendMessage
    };
}
