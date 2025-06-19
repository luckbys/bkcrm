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
  pollingInterval?: number; // Em milissegundos
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

export const useRealtimeMessages = (options: UseRealtimeMessagesOptions): UseRealtimeMessagesReturn => {
  const { toast } = useToast();
  const {
    ticketId,
    pollingInterval = 5000, // 5 segundos por padrão
    enableRealtime = true,
    enablePolling = true,
    maxRetries = 3
  } = options;

  // Estados
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');

  // Refs para controle
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const lastMessageCountRef = useRef(0);
  const isVisibleRef = useRef(true);

  // Função para gerar ID único para mensagens
  const generateUniqueId = useCallback((messageId: string): number => {
    return Math.abs(messageId.split('').reduce((hash, char) => {
      const chr = char.charCodeAt(0);
      hash = ((hash << 5) - hash) + chr;
      return hash & hash;
    }, 0));
  }, []);

  // Converter mensagem do banco para LocalMessage
  const convertToLocalMessage = useCallback((msg: RealtimeMessage): LocalMessage => {
    return {
      id: generateUniqueId(msg.id),
      content: msg.content,
      sender: msg.sender_id ? 'agent' : 'client',
      senderName: msg.sender_name || (msg.sender_id ? 'Agente' : 'Cliente'),
      timestamp: new Date(msg.created_at),
      type: msg.type as any || 'text',
      status: 'sent' as const,
      isInternal: msg.is_internal || false,
      attachments: msg.file_url ? [{
        id: generateUniqueId(msg.id + '_file').toString(),
        name: msg.file_name || 'Arquivo',
        url: msg.file_url,
        type: msg.file_type || 'file',
        size: (msg.file_size || 0).toString()
      }] : []
    };
  }, [generateUniqueId]);

  // Função para carregar mensagens do banco
  const loadMessages = useCallback(async (silent = false) => {
    if (!ticketId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
    }

    try {
      console.log('📥 [REALTIME] Carregando mensagens para ticket:', ticketId);

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
        .limit(100); // Limitar para performance

      if (error) {
        console.error('❌ [REALTIME] Erro ao carregar mensagens:', error);
        setConnectionStatus('error');
        throw error;
      }

      const localMessages = (messagesData || []).map(convertToLocalMessage);
      
      // Otimização: só atualizar se houve mudanças
      if (localMessages.length !== lastMessageCountRef.current) {
        setMessages(localMessages);
        setLastUpdateTime(new Date());
        lastMessageCountRef.current = localMessages.length;
        
        // Calcular não lidas (mensagens de clientes)
        const unread = localMessages.filter(msg => 
          msg.sender === 'client' && 
          !isVisibleRef.current
        ).length;
        setUnreadCount(unread);

        console.log(`✅ [REALTIME] ${localMessages.length} mensagens carregadas (${unread} não lidas)`);
        
        if (!silent && localMessages.length > 0) {
          toast({
            title: "📥 Mensagens atualizadas",
            description: `${localMessages.length} mensagens carregadas`,
          });
        }
      }

      setConnectionStatus('connected');
      retryCountRef.current = 0; // Reset contador de tentativas

    } catch (error) {
      console.error('❌ [REALTIME] Erro ao carregar mensagens:', error);
      setConnectionStatus('error');
      
      // Retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`🔄 [REALTIME] Tentativa ${retryCountRef.current}/${maxRetries}`);
        
        setTimeout(() => {
          loadMessages(silent);
        }, 2000 * retryCountRef.current); // Backoff exponencial
      } else {
        toast({
          title: "❌ Erro de conexão",
          description: "Não foi possível carregar mensagens após várias tentativas",
          variant: "destructive"
        });
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [ticketId, toast, convertToLocalMessage, maxRetries]);

  // Configurar realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!ticketId || !enableRealtime) {
      return;
    }

    console.log('🔌 [REALTIME] Configurando subscription para ticket:', ticketId);
    setConnectionStatus('connecting');

    try {
      // Remover subscription anterior se existir
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      // Criar nova subscription
      subscriptionRef.current = supabase
        .channel(`ticket_messages_${ticketId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`
        }, (payload) => {
          console.log('📨 [REALTIME] Nova mensagem recebida:', payload.new);
          
          const newMessage = convertToLocalMessage(payload.new as RealtimeMessage);
          
          setMessages(prev => {
            // Verificar se mensagem já existe (evitar duplicatas)
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('⚠️ [REALTIME] Mensagem duplicada ignorada:', newMessage.id);
              return prev;
            }
            
            const updated = [...prev, newMessage];
            console.log(`✅ [REALTIME] Mensagem adicionada (${updated.length} total)`);
            
            // Atualizar não lidas se não estiver visível
            if (newMessage.sender === 'client' && !isVisibleRef.current) {
              setUnreadCount(prev => prev + 1);
            }
            
            return updated;
          });
          
          setLastUpdateTime(new Date());
          
          // Notificação para novas mensagens de clientes
          if (newMessage.sender === 'client') {
            toast({
              title: "📱 Nova mensagem",
              description: `${newMessage.senderName}: ${newMessage.content.substring(0, 50)}...`,
            });
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `ticket_id=eq.${ticketId}`
        }, (payload) => {
          console.log('📝 [REALTIME] Mensagem atualizada:', payload.new);
          
          const updatedMessage = convertToLocalMessage(payload.new as RealtimeMessage);
          
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
          
          setLastUpdateTime(new Date());
        })
        .subscribe((status) => {
          console.log('🔌 [REALTIME] Status da subscription:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsConnected(true);
            setConnectionStatus('connected');
            console.log('✅ [REALTIME] Conectado ao realtime');
          } else if (status === 'CHANNEL_ERROR') {
            setIsConnected(false);
            setConnectionStatus('error');
            console.error('❌ [REALTIME] Erro na subscription');
          }
        });

    } catch (error) {
      console.error('❌ [REALTIME] Erro ao configurar subscription:', error);
      setConnectionStatus('error');
    }
  }, [ticketId, enableRealtime, convertToLocalMessage, toast]);

  // Configurar polling como fallback
  const setupPolling = useCallback(() => {
    if (!ticketId || !enablePolling) {
      return;
    }

    console.log(`⏰ [POLLING] Iniciando polling a cada ${pollingInterval}ms`);

    const poll = () => {
      if (ticketId) {
        loadMessages(true); // Silent loading para polling
      }
    };

    // Primeira carga
    poll();

    // Configurar interval
    pollingTimeoutRef.current = setInterval(poll, pollingInterval);

  }, [ticketId, enablePolling, pollingInterval, loadMessages]);

  // Função para marcar como lidas
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
    isVisibleRef.current = true;
  }, []);

  // Função para adicionar mensagem localmente
  const addMessage = useCallback((message: LocalMessage) => {
    setMessages(prev => {
      // Verificar duplicatas
      const exists = prev.some(msg => msg.id === message.id);
      if (exists) return prev;
      
      return [...prev, message];
    });
    setLastUpdateTime(new Date());
  }, []);

  // Função para atualizar mensagem
  const updateMessage = useCallback((messageId: number, updates: Partial<LocalMessage>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
    setLastUpdateTime(new Date());
  }, []);

  // Detectar visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (!document.hidden) {
        markAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [markAsRead]);

  // Configurar quando ticketId muda
  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      setIsLoading(false);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    // Limpar timers anteriores
    if (pollingTimeoutRef.current) {
      clearInterval(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // Configurar realtime subscription
    if (enableRealtime) {
      setupRealtimeSubscription();
    }

    // Configurar polling como fallback
    if (enablePolling) {
      setupPolling();
    }

    // Carregar mensagens iniciais
    loadMessages();

    // Cleanup
    return () => {
      if (pollingTimeoutRef.current) {
        clearInterval(pollingTimeoutRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [ticketId, enableRealtime, enablePolling, setupRealtimeSubscription, setupPolling, loadMessages]);

  return {
    messages,
    isLoading,
    isConnected,
    lastUpdateTime,
    unreadCount,
    refreshMessages: () => loadMessages(),
    markAsRead,
    addMessage,
    updateMessage,
    connectionStatus
  };
}; 