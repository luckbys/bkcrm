import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface RealtimeMessage {
  id: string;
  ticket_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  is_internal: boolean;
  created_at: string;
  type: string;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  ticketId: string;
  senderName: string;
  timestamp: Date;
  isInternal: boolean;
}

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Configuração do WebSocket
  const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
    ? 'https://ws.bkcrm.devsible.com.br'
    : 'http://localhost:4000';

  // Conectar ao WebSocket
  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log('🔗 [NOTIFICATIONS] Conectando ao WebSocket:', WEBSOCKET_URL);
    
    socketRef.current = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    // Eventos de conexão
    socketRef.current.on('connect', () => {
      console.log('✅ [NOTIFICATIONS] Conectado ao WebSocket');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ [NOTIFICATIONS] Desconectado do WebSocket');
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ [NOTIFICATIONS] Erro de conexão:', error);
      setIsConnected(false);
    });

    // Escutar mensagens em tempo real
    socketRef.current.on('new-message', (message: RealtimeMessage) => {
      console.log('📨 [NOTIFICATIONS] Nova mensagem recebida:', message);
      
      // Atualizar última mensagem
      setLastMessage(message);
      
      // Criar notificação
      const notification: NotificationData = {
        id: `notification-${message.id}`,
        title: message.is_internal ? '📝 Nota Interna' : '💬 Nova Mensagem',
        message: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        ticketId: message.ticket_id,
        senderName: message.sender_name,
        timestamp: new Date(message.created_at),
        isInternal: message.is_internal
      };

      // Adicionar à lista de notificações
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Manter apenas 10 mais recentes
      
      // Incrementar contador não lidas
      setUnreadCount(prev => prev + 1);

      // Mostrar toast de notificação
      if (!message.is_internal) {
        toast({
          title: `💬 ${message.sender_name}`,
          description: message.content.substring(0, 80) + (message.content.length > 80 ? '...' : ''),
          duration: 5000
        });
      }

      // Notificação push do navegador (se permitido)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: message.ticket_id,
          requireInteraction: false
        });
      }
    });

    // Escutar atualizações de tickets
    socketRef.current.on('ticket-updated', (data: { ticketId: string, status: string }) => {
      console.log('🔄 [NOTIFICATIONS] Ticket atualizado:', data);
      
      toast({
        title: '🔄 Status Atualizado',
        description: `Ticket #${data.ticketId.slice(-8)} - ${data.status}`,
        duration: 3000
      });
    });

    // Escutar conexões de outros usuários
    socketRef.current.on('user-typing', (data: { ticketId: string, userName: string }) => {
      console.log('⌨️ [NOTIFICATIONS] Usuário digitando:', data);
      
      toast({
        title: '⌨️ Digitando...',
        description: `${data.userName} está digitando`,
        duration: 2000
      });
    });

  }, [WEBSOCKET_URL, toast]);

  // Desconectar WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 [NOTIFICATIONS] Desconectando WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Marcar notificações como lidas
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications([]);
  }, []);

  // Marcar notificação específica como lida
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Solicitar permissão para notificações push
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast({
            title: '🔔 Notificações Ativadas',
            description: 'Você receberá notificações de novas mensagens',
            duration: 3000
          });
        }
      }
    }
  }, [toast]);

  // Conectar quando componente montar
  useEffect(() => {
    if (user) {
      connectWebSocket();
      requestNotificationPermission();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [user, connectWebSocket, disconnectWebSocket, requestNotificationPermission]);

  // Reconectar automaticamente se desconectar
  useEffect(() => {
    if (!isConnected && user) {
      const timeout = setTimeout(() => {
        console.log('🔄 [NOTIFICATIONS] Tentando reconectar...');
        connectWebSocket();
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [isConnected, user, connectWebSocket]);

  return {
    notifications,
    unreadCount,
    isConnected,
    lastMessage,
    markAsRead,
    markNotificationAsRead,
    requestNotificationPermission,
    connectWebSocket,
    disconnectWebSocket
  };
} 