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
  payload?: any;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: Date;
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
  sendMessage: (message: Omit<WebSocketMessage, 'id' | 'created_at'>) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
  clearMessages: () => void;
  
  // Utilitários
  retry: () => void;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface UseWebSocketMessagesOptions {
  ticketId: string;
  wsUrl?: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// 🔧 Configurações
const WEBSOCKET_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 3000,
  PING_INTERVAL: 30000
} as const;

// Ordenar mensagens por timestamp
const sortMessages = (messages: WebSocketMessage[]): WebSocketMessage[] => {
  return [...messages].sort((a, b) => {
    const aTime = a.timestamp?.getTime() || new Date(a.created_at).getTime();
    const bTime = b.timestamp?.getTime() || new Date(b.created_at).getTime();
    return aTime - bTime;
  });
};

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

  // 🔧 Configurações para Easypanel
  const WEBSOCKET_URL = process.env.VITE_WEBSOCKET_URL || (process.env.NODE_ENV === 'production' 
    ? 'wss://websocket.bkcrm.devsible.com.br'  // Usar wss:// em produção
    : 'ws://localhost:4000');  // Usar ws:// em desenvolvimento
    
  console.log(`🔗 [WS] Ambiente: ${process.env.NODE_ENV}, URL: ${WEBSOCKET_URL}`);

  // 🔌 Conectar WebSocket
  const connect = useCallback(() => {
    if (!enabled || !ticketId || socketRef.current?.connected) {
      return;
    }

    console.log(`🔗 [WS] Conectando ao WebSocket... (ticket: ${ticketId})`);
    console.log(`🔗 [WS] URL: ${WEBSOCKET_URL}`);
    console.log(`🔗 [WS] Ambiente: ${process.env.NODE_ENV}`);
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
        
        // 🔧 DEBUG: Logs detalhados para diagnosticar
        console.log(`🔗 [WS] Entrando no ticket:`, { ticketId, userId });
        
        // Entrar no ticket
        socket.emit('join-ticket', { ticketId, userId });
        
        // Solicitar mensagens existentes - COM LOGS DETALHADOS
        console.log(`📋 [WS] Solicitando mensagens do ticket: ${ticketId}`);
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

      socket.on('joined-ticket', (data: { ticketId: string }) => {
        console.log(`✅ [WS] Conectado ao ticket ${data.ticketId}`);
        setIsLoading(false);
      });

      socket.on('messages-loaded', (data: { ticketId: string; messages: WebSocketMessage[] }) => {
        if (!mountedRef.current || data.ticketId !== ticketId) {
          console.log(`⚠️ [WS] messages-loaded ignorado:`, {
            mounted: mountedRef.current,
            dataTicketId: data.ticketId,
            expectedTicketId: ticketId,
            match: data.ticketId === ticketId
          });
          return;
        }
        console.log(`📥 [WS] ${data.messages?.length || 0} mensagens carregadas para ticket ${ticketId}:`, {
          messages: data.messages?.slice(0, 3)?.map(m => ({
            id: m.id,
            content: m.content?.substring(0, 30) + '...',
            sender_name: m.sender_name
          })) || []
        });
        
        setMessages(data.messages || []);
        setLastUpdateTime(new Date());
        setIsLoading(false);
      });

      socket.on('new-message', (message: WebSocketMessage) => {
        if (!mountedRef.current || message.ticket_id !== ticketId) {
          console.log(`⚠️ [WS] Mensagem ignorada - mounted: ${mountedRef.current}, ticket match: ${message.ticket_id === ticketId}`);
          return;
        }
        
        console.log(`📨 [WS] Nova mensagem recebida:`, {
          id: message.id,
          content: message.content.substring(0, 50) + '...',
          sender_id: message.sender_id,
          sender_name: message.sender_name,
          is_internal: message.is_internal
        });
        
        setMessages(prev => {
          // Evitar duplicatas
          const exists = prev.some(msg => msg.id === message.id);
          if (exists) return prev;
          
          // Inserir mensagem na ordem cronológica
          return sortMessages([...prev, message]);
        });
        setLastUpdateTime(new Date());
        
        // Notificar apenas se não for mensagem interna
        if (!message.is_internal) {
          toast({
            title: `💬 ${message.sender_name}`,
            description: message.content.substring(0, 80) + (message.content.length > 80 ? '...' : ''),
            duration: 5000
          });
        }
      });

      socket.on('error', (error: Error) => {
        console.error(`❌ [WS] Erro no WebSocket:`, error);
        setConnectionStatus('error');
        toast({
          title: "❌ Erro de Conexão",
          description: error.message,
          variant: "destructive",
          duration: 5000
        });
      });

      socket.on('connection-stats', (stats: ConnectionStats) => {
        setConnectionStats(stats);
      });

    } catch (error) {
      console.error(`❌ [WS] Erro ao conectar:`, error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  }, [enabled, ticketId, userId, WEBSOCKET_URL, toast]);

  // 📨 Enviar mensagem
  const sendMessage = useCallback(async (message: Omit<WebSocketMessage, 'id' | 'created_at'>): Promise<boolean> => {
    if (!socketRef.current?.connected || !ticketId) {
      console.error('❌ [WS] Não conectado para enviar mensagem');
      toast({
        title: "❌ Erro ao Enviar",
        description: "Conexão indisponível. Tentando reconectar...",
        variant: "destructive",
        duration: 3000
      });
      connect();
      return false;
    }

    try {
      console.log(`📤 [WS] Enviando mensagem... (${message.content.length} chars)`);
      
      // Emitir mensagem via WebSocket
      socketRef.current.emit('send-message', {
        ticketId,
        content: message.content,
        isInternal: message.is_internal,
        userId,
        senderName: message.sender_name,
        type: message.type || 'text',
        metadata: message.metadata
      });

      return true;
    } catch (error) {
      console.error('❌ [WS] Erro ao enviar mensagem:', error);
      toast({
        title: "❌ Erro ao Enviar",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
        duration: 3000
      });
      return false;
    }
  }, [ticketId, userId, connect, toast]);

  // 🔄 Atualizar mensagens
  const refreshMessages = useCallback(async () => {
    if (!socketRef.current?.connected || !ticketId) {
      console.error('❌ [WS] Não conectado para atualizar mensagens');
      return;
    }
    
    setIsLoading(true);
    socketRef.current.emit('request-messages', { ticketId, limit: 50 });
  }, [ticketId]);

  // 🗑️ Limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastUpdateTime(null);
  }, []);

  // 🔄 Tentar reconectar
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 [WS] Tentando reconectar...');
      connect();
    }, WEBSOCKET_CONFIG.RECONNECT_DELAY);
  }, [connect]);

  // 🔄 Retry manual
  const retry = useCallback(() => {
    console.log('🔄 [WS] Retry manual...');
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
      connect();
  }, [connect]);

  // 🏗️ Setup inicial
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled && ticketId) {
    connect();
    }

    return () => {
      mountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [enabled, ticketId, connect]);

  // 🔄 Reconexão automática
  useEffect(() => {
    if (!isConnected && enabled && ticketId) {
      scheduleReconnect();
    }
  }, [isConnected, enabled, ticketId, scheduleReconnect]);

  return {
    messages,
    isConnected,
    isLoading,
    connectionStatus,
    lastUpdateTime,
    connectionStats,
    sendMessage,
    refreshMessages,
    clearMessages,
    retry
  };
};

// Hook para Mensagens em Tempo Real via WebSocket
export const useWebSocketMessagesRealTime = ({
  ticketId,
  wsUrl = 'ws://localhost:4000',
  autoReconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseWebSocketMessagesOptions): UseWebSocketMessagesReturn => {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      const ws = new WebSocket(`${wsUrl}/chat/${ticketId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 WebSocket conectado para ticket:', ticketId);
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          switch (data.type) {
            case 'new-message':
              const newMessage: WebSocketMessage = {
                ...data.payload,
                timestamp: new Date(data.payload.timestamp || data.payload.created_at)
              };
              
              setMessages(prev => {
                // Evitar duplicatas
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                
                // Inserir mensagem na ordem cronológica
                return sortMessages([...prev, newMessage]);
              });
              break;

            case 'message-status-update':
              setMessages(prev => prev.map(msg => 
                msg.id === data.payload.messageId 
                  ? { ...msg, status: data.payload.status }
                  : msg
              ));
              break;

            case 'typing-start':
              setTypingUsers(prev => {
                const filtered = prev.filter(u => u.userId !== data.payload.userId);
                return [...filtered, {
                  userId: data.payload.userId,
                  userName: data.payload.userName,
                  timestamp: Date.now()
                }];
              });
              break;

            case 'typing-stop':
              setTypingUsers(prev => prev.filter(u => u.userId !== data.payload.userId));
              break;

            case 'user-online':
            case 'user-offline':
              console.log(`👤 Usuario ${data.payload.userId} ficou ${data.type.split('-')[1]}`);
              break;

            default:
              console.log('📨 Mensagem WebSocket desconhecida:', data);
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem WebSocket:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket desconectado:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Auto-reconectar se necessário
        if (autoReconnect && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 Tentando reconectar (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Máximo de tentativas de reconexão atingido');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ Erro WebSocket:', error);
        setConnectionError('Erro de conexão WebSocket');
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('❌ Erro ao criar WebSocket:', error);
      setConnectionError('Falha ao criar conexão WebSocket');
      setIsConnecting(false);
    }
  }, [ticketId, wsUrl, autoReconnect, reconnectInterval, maxReconnectAttempts]);

  // Enviar mensagem
  const sendMessage = useCallback(async (message: Omit<WebSocketMessage, 'id' | 'created_at'>): Promise<boolean> => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageWithId: WebSocketMessage = {
        ...message,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
        ticket_id: ticketId,
        status: 'sent'
      };

      // Adicionar mensagem otimisticamente
      setMessages(prev => [...prev, messageWithId]);

      // Enviar via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'send-message',
        payload: messageWithId
      }));

      return true;
    } else {
      console.error('❌ WebSocket não conectado');
      return false;
    }
  }, [ticketId]);

  // Atualizar status da mensagem
  const updateMessageStatus = useCallback((messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed') => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update-message-status',
        payload: { messageId, status }
      }));
    }

    // Atualizar localmente também
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    ));
  }, []);

  // Indicar que está digitando
  const startTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing-start',
        payload: { ticketId }
      }));

      // Parar de digitar automaticamente após 3 segundos
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    }
  }, [ticketId]);

  // Parar de digitar
  const stopTyping = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing-stop',
        payload: { ticketId }
      }));
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [ticketId]);

  // Reconectar manualmente
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    reconnectAttempts.current = 0;
    setConnectionError(null);
    connect();
  }, [connect]);

  // Limpar usuários digitando antigos
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => prev.filter(user => (now - user.timestamp) < 5000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Conectar ao montar
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [connect]);

  // Atualizar mensagens
  const refreshMessages = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'request-messages',
        payload: { ticketId }
      }));
    }
  }, [ticketId]);

  // Limpar mensagens
  const clearMessages = useCallback(() => {
    setMessages([]);
    setLastUpdateTime(null);
  }, []);

  // Retry manual
  const retry = useCallback(() => {
    reconnect();
  }, [reconnect]);

  return {
    messages,
    isConnected,
    isLoading,
    connectionStatus,
    lastUpdateTime,
    connectionStats,
    sendMessage,
    refreshMessages,
    clearMessages,
    retry
  };
}; 