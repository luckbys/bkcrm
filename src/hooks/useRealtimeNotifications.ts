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

// Configurações padrão do Socket.IO
const defaultSocketOptions = {
  timeout: 10000,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10
};

export function useRealtimeNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Configuração do WebSocket
  const WEBSOCKET_URL = process.env.NODE_ENV === 'production'
    ? 'https://websocket.bkcrm.devsible.com.br'
    : 'http://localhost:4000';

  // Criar nova conexão Socket.IO
  const createSocket = useCallback((transportOptions: string[]) => {
    return io(WEBSOCKET_URL, {
      ...defaultSocketOptions,
      transports: transportOptions
    });
  }, [WEBSOCKET_URL]);

  // Conectar ao WebSocket
  const connectWebSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log('🔗 [NOTIFICATIONS] Conectando ao WebSocket:', WEBSOCKET_URL);
    
    // Desconectar socket existente se houver
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Criar nova conexão
    socketRef.current = createSocket(['websocket', 'polling']);

    // Eventos de conexão
    socketRef.current.on('connect', () => {
      console.log('✅ [NOTIFICATIONS] Conectado ao WebSocket');
      setIsConnected(true);
      reconnectAttempts.current = 0;
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('❌ [NOTIFICATIONS] Desconectado do WebSocket:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('❌ [NOTIFICATIONS] Erro de conexão:', error);
      setIsConnected(false);
      
      // Se falhar com websocket, tentar reconectar com nova instância usando apenas websocket
      if (error.message.includes('websocket')) {
        console.log('🔄 [NOTIFICATIONS] Tentando reconectar usando apenas websocket');
        
        // Desconectar socket atual
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
        
        // Criar nova conexão usando apenas websocket
        socketRef.current = createSocket(['websocket']);
      }
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

  }, [WEBSOCKET_URL, toast, createSocket]);

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
        if (reconnectAttempts.current < 10) {
          console.log(`🔄 [NOTIFICATIONS] Tentativa de reconexão ${reconnectAttempts.current + 1}/10`);
          reconnectAttempts.current++;
          connectWebSocket();
        } else {
          console.log('❌ [NOTIFICATIONS] Máximo de tentativas de reconexão atingido');
          toast({
            title: '❌ Erro de Conexão',
            description: 'Não foi possível reconectar ao servidor. Tente recarregar a página.',
            variant: 'destructive',
            duration: 5000
          });
        }
      }, Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000));

      return () => clearTimeout(timeout);
    }
  }, [isConnected, user, connectWebSocket, toast]);

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