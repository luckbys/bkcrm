import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from './use-toast';

// 📨 INTERFACES WEBSOCKET
interface WebSocketMessage {
  id: string;
  ticket_id: string;
  content: string;
  sender_id?: string;
  sender_name: string;
  is_internal: boolean;
  created_at: string;
  type: string;
  metadata?: any;
}

interface ConnectionStats {
  totalConnections: number;
  activeTickets: number;
  connectionsByTicket: Record<string, number>;
}

interface UseWebSocketMessagesProps {
  ticketId?: string;
  userId?: string;
  enabled?: boolean;
}

interface UseWebSocketMessagesReturn {
  // Estados
  messages: WebSocketMessage[];
  isConnected: boolean;
  isLoading: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastUpdateTime: Date | null;
  connectionStats: ConnectionStats | null;
  
  // Ações
  sendMessage: (content: string, isInternal?: boolean) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
  clearMessages: () => void;
  
  // Utilitários
  retry: () => void;
}

/**
 * Hook para gerenciar mensagens via WebSocket
 * Substitui o sistema de realtime do Supabase
 */
export const useWebSocketMessages = ({
  ticketId,
  userId,
  enabled = true
}: UseWebSocketMessagesProps): UseWebSocketMessagesReturn => {
  
  // 🔗 Estados
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  
  // 🔗 Refs
  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // 🔧 Configurações
  const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
    ? 'https://bkcrm.devsible.com.br' 
    : 'http://localhost:4000';

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;
  const PING_INTERVAL = 30000; // 30 segundos

  // 🔌 Conectar WebSocket
  const connect = useCallback(() => {
    if (!enabled || !ticketId || socketRef.current?.connected) {
      return;
    }

    console.log(`🔗 [WS] Conectando ao WebSocket... (ticket: ${ticketId})`);
    setConnectionStatus('connecting');
    setIsLoading(true);

    try {
      // Criar nova conexão
      const socket = io(WEBSOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      socketRef.current = socket;

      // 📡 Event Listeners
      socket.on('connect', () => {
        if (!mountedRef.current) return;
        
        console.log(`✅ [WS] Conectado ao WebSocket (${socket.id})`);
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Entrar no ticket
        socket.emit('join-ticket', { ticketId, userId });
        
        // Solicitar mensagens existentes
        socket.emit('request-messages', { ticketId, limit: 50 });
        
        toast({
          title: "🔗 Conectado",
          description: "Sistema de mensagens em tempo real ativo",
          duration: 2000,
        });
      });

      socket.on('disconnect', () => {
        if (!mountedRef.current) return;
        
        console.log(`❌ [WS] Desconectado do WebSocket`);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Tentar reconectar
        scheduleReconnect();
      });

      socket.on('joined-ticket', (data) => {
        console.log(`✅ [WS] Conectado ao ticket ${data.ticketId}`);
        setIsLoading(false);
      });

      socket.on('messages-loaded', (data) => {
        if (!mountedRef.current || data.ticketId !== ticketId) return;
        
        console.log(`📥 [WS] ${data.messages.length} mensagens carregadas`);
        setMessages(data.messages);
        setLastUpdateTime(new Date());
        setIsLoading(false);
      });

      socket.on('new-message', (message: WebSocketMessage) => {
        if (!mountedRef.current || message.ticket_id !== ticketId) return;
        
        console.log(`📨 [WS] Nova mensagem recebida:`, message.content.substring(0, 50));
        
        setMessages(prev => {
          // Evitar duplicatas
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        
        setLastUpdateTime(new Date());
        
        // Toast apenas para mensagens de outros usuários
        if (message.sender_id !== userId) {
          toast({
            title: `📱 ${message.sender_name}`,
            description: message.content.length > 60 
              ? message.content.substring(0, 60) + '...' 
              : message.content,
            duration: 4000,
          });
        }
      });

      socket.on('connection-stats', (stats: ConnectionStats) => {
        setConnectionStats(stats);
      });

      socket.on('error', (error) => {
        console.error('❌ [WS] Erro WebSocket:', error);
        setConnectionStatus('error');
        
        toast({
          title: "❌ Erro de Conexão",
          description: error.message || "Erro na conexão WebSocket",
          variant: "destructive",
          duration: 3000,
        });
      });

      socket.on('pong', (data) => {
        console.log(`🏓 [WS] Pong recebido (latência: ${Date.now() - data.timestamp}ms)`);
      });

      // Configurar ping
      setupPing(socket);

    } catch (error) {
      console.error('❌ [WS] Erro ao conectar:', error);
      setConnectionStatus('error');
      setIsLoading(false);
      scheduleReconnect();
    }
  }, [enabled, ticketId, userId, WEBSOCKET_URL, toast]);

  // 🔄 Reconectar
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && enabled && ticketId) {
        console.log('🔄 [WS] Tentando reconectar...');
        connect();
      }
    }, RECONNECT_DELAY);
  }, [connect, enabled, ticketId]);

  // 🏓 Configurar ping para manter conexão viva
  const setupPing = useCallback((socket: Socket) => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    pingIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, PING_INTERVAL);
  }, []);

  // 📨 Enviar mensagem
  const sendMessage = useCallback(async (content: string, isInternal = false): Promise<boolean> => {
    if (!socketRef.current?.connected || !ticketId) {
      console.error('❌ [WS] Não conectado para enviar mensagem');
      toast({
        title: "❌ Erro",
        description: "Não conectado ao sistema de mensagens",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }

    try {
      console.log(`📤 [WS] Enviando mensagem... (${content.length} chars)`);
      
      // Emitir mensagem via WebSocket
      socketRef.current.emit('send-message', {
        ticketId,
        content,
        isInternal,
        userId,
        senderName: 'Agente' // TODO: Pegar do contexto do usuário
      });

      return true;

    } catch (error) {
      console.error('❌ [WS] Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
        duration: 3000,
      });
      return false;
    }
  }, [ticketId, userId, toast]);

  // 🔄 Atualizar mensagens
  const refreshMessages = useCallback(async () => {
    if (!socketRef.current?.connected || !ticketId) return;
    
    console.log('🔄 [WS] Solicitando atualização de mensagens...');
    setIsLoading(true);
    
    socketRef.current.emit('request-messages', { ticketId, limit: 50 });
  }, [ticketId]);

  // 🧹 Limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastUpdateTime(null);
  }, []);

  // 🔄 Retry manual
  const retry = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect]);

  // 🔗 Efeito principal de conexão
  useEffect(() => {
    if (!enabled || !ticketId) {
      setIsLoading(false);
      setConnectionStatus('disconnected');
      return;
    }

    connect();

    return () => {
      // Cleanup ao desmontar ou mudar ticket
      if (socketRef.current) {
        console.log('🔌 [WS] Desconectando WebSocket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setMessages([]);
    };
  }, [enabled, ticketId, connect]);

  // 🧹 Cleanup geral
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // Estados
    messages,
    isConnected,
    isLoading,
    connectionStatus,
    lastUpdateTime,
    connectionStats,
    
    // Ações
    sendMessage,
    refreshMessages,
    clearMessages,
    
    // Utilitários
    retry
  };
}; 