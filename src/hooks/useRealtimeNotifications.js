import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
export function useRealtimeNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    // Adicionar nova notificação
    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now().toString(),
            timestamp: new Date(),
            read: false,
            ...notification
        };
        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Manter últimas 50
    }, []);
    // Marcar como lida
    const markAsRead = useCallback((id) => {
        setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, read: true } : notif));
    }, []);
    // Marcar todas como lidas
    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    }, []);
    // Limpar notificações
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);
    // Contador de não lidas
    const unreadCount = notifications.filter(n => !n.read).length;
    // Configurar real-time subscriptions do Supabase
    useEffect(() => {
        const setupRealtimeSubscriptions = async () => {
            try {
                // Inscrever para mudanças em tickets
                const ticketsChannel = supabase
                    .channel('tickets-notifications')
                    .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'tickets'
                }, (payload) => {
                    addNotification({
                        title: '🎫 Novo Ticket',
                        message: `Novo ticket criado: ${payload.new.title || 'Sem título'}`,
                        type: 'info',
                        metadata: { ticketId: payload.new.id, type: 'new_ticket' }
                    });
                })
                    .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'tickets'
                }, (payload) => {
                    if (payload.old.status !== payload.new.status) {
                        addNotification({
                            title: '📊 Status do Ticket Atualizado',
                            message: `Ticket ${payload.new.title} alterado para: ${payload.new.status}`,
                            type: 'info',
                            metadata: { ticketId: payload.new.id, type: 'status_change' }
                        });
                    }
                })
                    .subscribe();
                // Inscrever para mudanças em mensagens
                const messagesChannel = supabase
                    .channel('messages-notifications')
                    .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                }, (payload) => {
                    // Só notificar se for mensagem de cliente (sem sender_id)
                    if (!payload.new.sender_id) {
                        addNotification({
                            title: '💬 Nova Mensagem',
                            message: `Mensagem recebida de cliente`,
                            type: 'success',
                            metadata: { messageId: payload.new.id, type: 'new_message' }
                        });
                    }
                })
                    .subscribe();
                setIsConnected(true);
                // Cleanup
                return () => {
                    supabase.removeChannel(ticketsChannel);
                    supabase.removeChannel(messagesChannel);
                };
            }
            catch (error) {
                console.error('❌ Erro ao configurar notificações realtime:', error);
                setIsConnected(false);
            }
        };
        const cleanup = setupRealtimeSubscriptions();
        return () => {
            cleanup.then(cleanupFn => cleanupFn && cleanupFn());
        };
    }, [addNotification]);
    // Adicionar notificação de boas-vindas na inicialização
    useEffect(() => {
        addNotification({
            title: '🚀 Sistema BKCRM',
            message: 'Sistema de notificações ativado!',
            type: 'success'
        });
    }, [addNotification]);
    return {
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        addNotification
    };
}
