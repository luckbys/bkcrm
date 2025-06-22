import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from './use-toast';
import { ChatMessage } from '../types/chat';

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

interface UseWebSocketMessagesReturn {
  messages: ChatMessage[];
  isConnected: boolean;
  isConnecting: boolean;
  typingUsers: TypingUser[];
  sendMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessageStatus: (messageId: string, status: 'sent' | 'delivered' | 'read' | 'failed') => void;
  startTyping: () => void;
  stopTyping: () => void;
  connectionError: string | null;
  reconnect: () => void;
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

  // 🔧 Configurações para Easypanel
  const WEBSOCKET_URL = process.env.VITE_WEBSOCKET_URL || (process.env.NODE_ENV === 'production' 
    ? 'wss://ws.bkcrm.devsible.com.br'  // Usar wss:// em produção
    : 'ws://localhost:4000');  // Usar ws:// em desenvolvimento
    
  console.log(`🔗 [WS] Ambiente: ${process.env.NODE_ENV}, URL: ${WEBSOCKET_URL}`);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000;
  const PING_INTERVAL = 30000; // 30 segundos

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

      socket.on('joined-ticket', (data) => {
        console.log(`✅ [WS] Conectado ao ticket ${data.ticketId}`);
        setIsLoading(false);
      });

      socket.on('messages-loaded', (data) => {
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
          ticket_id: message.ticket_id
        });
        
        setMessages(prev => {
          // Evitar duplicatas
          if (prev.some(m => m.id === message.id)) {
            console.log(`⚠️ [WS] Mensagem duplicada ignorada: ${message.id}`);
            return prev;
          }
          console.log(`✅ [WS] Adicionando nova mensagem ao state. Total: ${prev.length + 1}`);
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

// Hook para Mensagens em Tempo Real via WebSocket
export const useWebSocketMessagesRealTime = ({
  ticketId,
  wsUrl = 'ws://localhost:4000',
  autoReconnect = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseWebSocketMessagesOptions): UseWebSocketMessagesReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
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
              const newMessage: ChatMessage = {
                ...data.payload,
                timestamp: new Date(data.payload.timestamp)
              };
              
              setMessages(prev => {
                // Evitar duplicatas
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) return prev;
                
                // Inserir mensagem na ordem cronológica
                const updated = [...prev, newMessage];
                return updated.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
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
  const sendMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const messageWithId: ChatMessage = {
        ...message,
        id: `temp-${Date.now()}`,
        timestamp: new Date(),
        status: 'sending'
      };

      // Adicionar mensagem otimisticamente
      setMessages(prev => [...prev, messageWithId]);

      // Enviar via WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'send-message',
        payload: messageWithId
      }));
    } else {
      console.error('❌ WebSocket não conectado');
    }
  }, []);

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

  return {
    messages,
    isConnected,
    isConnecting,
    typingUsers,
    sendMessage,
    updateMessageStatus,
    startTyping,
    stopTyping,
    connectionError,
    reconnect
  };
}; 