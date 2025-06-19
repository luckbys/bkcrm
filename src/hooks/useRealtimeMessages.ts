import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { LocalMessage } from '../types/ticketChat';
import { useToast } from './use-toast';

interface RealtimeMessage {
  id: string;
  ticket_id: string;
  content: string;
  sender_id: string | null;
  sender_name: string;
  type: string;
  is_internal: boolean;
  metadata: any;
  created_at: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
}

interface UseRealtimeMessagesOptions {
  ticketId: string | null;
  pollingInterval?: number;
  enableRealtime?: boolean;
  enablePolling?: boolean;
  maxRetries?: number;
}

interface UseRealtimeMessagesReturn {
  messages: LocalMessage[];
  isLoading: boolean;
  isConnected: boolean;
  lastUpdateTime: Date | null;
  unreadCount: number;
  refreshMessages: () => Promise<void>;
  markAsRead: () => void;
  addMessage: (message: LocalMessage) => void;
  updateMessage: (messageId: number, updates: Partial<LocalMessage>) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
}

// 🛡️ CIRCUIT BREAKER PARA EVITAR LOOPS INFINITOS
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private maxFailures = 3,
    private timeoutMs = 30000 // 30 segundos
  ) {}

  canExecute(): boolean {
    if (this.state === 'closed') return true;
    
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeoutMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    
    return true;
  }

  onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'open';
    }
  }
}

export const useRealtimeMessages = (options: UseRealtimeMessagesOptions): UseRealtimeMessagesReturn => {
  const { toast } = useToast();
  const {
    ticketId,
    pollingInterval = 10000, // 10 segundos - mais conservador
    enableRealtime = true,
    enablePolling = true,
    maxRetries = 2
  } = options;

  // 🔒 VALIDAÇÃO DE ENTRADA
  const isValidTicketId = useCallback((id: string | null): boolean => {
    if (!id || typeof id !== 'string') return false;
    if (id.trim().length === 0) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const numberRegex = /^\d+$/;
    return uuidRegex.test(id) || numberRegex.test(id);
  }, []);

  // 🛡️ REFS DE CONTROLE
  const circuitBreakerRef = useRef(new CircuitBreaker(3, 30000));
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);
  const mountedRef = useRef(true);

  // Estados
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');

  // 🎯 FUNÇÃO PARA GERAR ID ÚNICO
  const generateUniqueId = useCallback((messageId: string): number => {
    try {
      const numMatch = messageId.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0]);
        if (!isNaN(num) && num > 0) return num;
      }
      
      let hash = 0;
      for (let i = 0; i < Math.min(messageId.length, 10); i++) {
        hash = ((hash << 5) - hash) + messageId.charCodeAt(i);
        hash = hash & hash;
      }
      
      return Math.abs(hash) || Date.now();
    } catch (error) {
      return Date.now();
    }
  }, []);

  // 🔄 CONVERSÃO DE MENSAGEM
  const convertToLocalMessage = useCallback((msg: RealtimeMessage): LocalMessage => {
    try {
      return {
        id: generateUniqueId(msg.id),
        content: msg.content || '',
        sender: msg.sender_id ? 'agent' : 'client',
        senderName: msg.sender_name || (msg.sender_id ? 'Agente' : 'Cliente'),
        timestamp: new Date(msg.created_at),
        type: (msg.type as any) || 'text',
        status: 'sent' as const,
        isInternal: Boolean(msg.is_internal),
        attachments: msg.file_url ? [{
          id: `${generateUniqueId(msg.id)}_file`,
          name: msg.file_name || 'Arquivo',
          url: msg.file_url,
          type: msg.file_type || 'file',
          size: (msg.file_size || 0).toString()
        }] : []
      };
    } catch (error) {
      return {
        id: Date.now(),
        content: 'Erro ao carregar mensagem',
        sender: 'system' as any,
        senderName: 'Sistema',
        timestamp: new Date(),
        type: 'text',
        status: 'error' as any,
        isInternal: false,
        attachments: []
      };
    }
  }, [generateUniqueId]);

  // 📥 CARREGAMENTO DE MENSAGENS
  const loadMessages = useCallback(async (silent = false) => {
    if (!mountedRef.current) return;
    if (!isValidTicketId(ticketId)) {
      if (!silent) setMessages([]);
      return;
    }
    if (!circuitBreakerRef.current.canExecute()) {
      setConnectionStatus('error');
      return;
    }

    if (!silent) setIsLoading(true);

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        circuitBreakerRef.current.onFailure();
        setConnectionStatus('error');
        throw error;
      }

      if (!mountedRef.current) return;

      const localMessages = (messagesData || [])
        .map(convertToLocalMessage)
        .filter(msg => msg.id && msg.content);

      setMessages(localMessages);
      setLastUpdateTime(new Date());
      setConnectionStatus('connected');
      circuitBreakerRef.current.onSuccess();

    } catch (error) {
      if (!mountedRef.current) return;
      circuitBreakerRef.current.onFailure();
      setConnectionStatus('error');
    } finally {
      if (!silent && mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [ticketId, convertToLocalMessage, isValidTicketId]);

  // 🔌 REALTIME SUBSCRIPTION
  const setupRealtimeSubscription = useCallback(() => {
    if (!isValidTicketId(ticketId) || !enableRealtime || !mountedRef.current) {
      return;
    }

    setConnectionStatus('connecting');

    try {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }

      subscriptionRef.current = supabase
        .channel(`ticket_messages_${ticketId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`
        }, () => {
          if (mountedRef.current) {
            setTimeout(() => loadMessages(true), 1000);
          }
        })
        .subscribe((status) => {
          if (!mountedRef.current) return;
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setConnectionStatus('connected');
          } else if (status === 'CLOSED') {
            setIsConnected(false);
            setConnectionStatus('disconnected');
          }
        });

    } catch (error) {
      circuitBreakerRef.current.onFailure();
      setConnectionStatus('error');
      setIsConnected(false);
    }
  }, [ticketId, enableRealtime, loadMessages, isValidTicketId]);

  // ⏰ POLLING
  const setupPolling = useCallback(() => {
    if (!isValidTicketId(ticketId) || !enablePolling || !mountedRef.current) {
      return;
    }

    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    const poll = () => {
      if (!mountedRef.current || !circuitBreakerRef.current.canExecute()) {
        return;
      }

      loadMessages(true).finally(() => {
        if (mountedRef.current && enablePolling) {
          pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
        }
      });
    };

    pollingTimeoutRef.current = setTimeout(poll, pollingInterval);
  }, [ticketId, enablePolling, pollingInterval, loadMessages, isValidTicketId]);

  // 🎯 EFEITO PRINCIPAL
  useEffect(() => {
    if (!mountedRef.current || !isValidTicketId(ticketId)) {
      setMessages([]);
      setConnectionStatus('disconnected');
      return;
    }

    loadMessages(false);

    if (enableRealtime) {
      setupRealtimeSubscription();
    }

    if (enablePolling) {
      setupPolling();
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [ticketId, enableRealtime, enablePolling, isValidTicketId, loadMessages, setupRealtimeSubscription, setupPolling]);

  // 🧹 CLEANUP
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 📤 FUNÇÕES EXPOSTAS
  const refreshMessages = useCallback(async () => {
    await loadMessages(false);
  }, [loadMessages]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const addMessage = useCallback((message: LocalMessage) => {
    if (!mountedRef.current) return;
    
    setMessages(prev => {
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
    setLastUpdateTime(new Date());
  }, []);

  const updateMessage = useCallback((messageId: number, updates: Partial<LocalMessage>) => {
    if (!mountedRef.current) return;
    
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  }, []);

  return {
    messages,
    isLoading,
    isConnected,
    lastUpdateTime,
    unreadCount,
    refreshMessages,
    markAsRead,
    addMessage,
    updateMessage,
    connectionStatus
  };
}; 