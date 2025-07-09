import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { supabase } from '../lib/supabase';
import { sendMessageEvolution } from '../services/evolutionApi';
import { toast } from 'sonner';
import { API_CONFIG } from '../config';

// Tipos atualizados
export interface ChatMessage {
  id: string;
  ticketId: string;
  content: string;
  senderName: string;
  sender: 'agent' | 'client';
  isInternal: boolean;
  timestamp: Date;
  type?: 'text' | 'image' | 'audio' | 'video' | 'document';
  metadata?: Record<string, any>;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface ChatState {
  // Estado da conexão
  isConnected: boolean;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  socket: Socket | null;
  
  // Mensagens por ticket
  messages: Record<string, ChatMessage[]>;
  
  // Ações
  init: () => void;
  disconnect: () => void;
  join: (ticketId: string) => void;
  load: (ticketId: string) => void;
  send: (ticketId: string, content: string, isInternal?: boolean) => Promise<void>;
  
  // Utilitários
  addMessage: (message: ChatMessage) => void;
  clearError: () => void;
  getTicketMessages: (ticketId: string) => ChatMessage[];
}

/**
 * Store principal do Chat com integração completa
 * - WebSocket para tempo real
 * - Supabase para persistência 
 * - Evolution API para WhatsApp
 */
export const useChatStore = create<ChatState>((set, get) => ({
  // Estado inicial
  isConnected: false,
  isLoading: false,
  isSending: false,
  error: null,
  socket: null,
  messages: {},

  /**
   * 🚀 Inicializar conexão WebSocket
   */
  init: () => {
    const { socket: existingSocket } = get();
    
    // Evitar múltiplas conexões
    if (existingSocket?.connected) {
      console.log('🔄 [CHAT] WebSocket já conectado');
      return;
    }

    console.log('🚀 [CHAT] Iniciando conexão WebSocket...');
    console.log('🔗 [CHAT] URL:', API_CONFIG.WEBSOCKET_URL);
    
    set({ isLoading: true, error: null });

    try {
      // Criar conexão Socket.IO
      const socket = io(API_CONFIG.WEBSOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000
      });

      // Eventos de conexão
      socket.on('connect', () => {
        console.log('✅ [CHAT] WebSocket conectado:', socket.id);
        set({ 
          isConnected: true, 
          isLoading: false, 
          error: null,
          socket 
        });

        toast.success('Chat conectado', {
          description: 'Sistema de mensagens ativo'
        });
      });

      socket.on('disconnect', (reason) => {
        console.log('❌ [CHAT] WebSocket desconectado:', reason);
        set({ 
          isConnected: false, 
          socket: null 
        });

        toast.warning('Chat desconectado', {
          description: 'Tentando reconectar...'
        });
      });

      socket.on('connect_error', (error) => {
        console.error('❌ [CHAT] Erro de conexão:', error);
        set({ 
          isConnected: false, 
          isLoading: false, 
          error: `Erro de conexão: ${error.message}`,
          socket: null
        });

        toast.error('Erro de conexão', {
          description: 'Não foi possível conectar ao chat'
        });
      });

      // Eventos de mensagens
      socket.on('new-message', (data: any) => {
        console.log('📥 [CHAT] Nova mensagem recebida:', data);
        
        try {
          const message: ChatMessage = {
            id: data.id || `received-${Date.now()}`,
            ticketId: data.ticketId || data.ticket_id,
            content: data.content || '',
            senderName: data.senderName || data.sender_name || 'Desconhecido',
            sender: data.sender || (data.sender_id ? 'agent' : 'client'),
            isInternal: Boolean(data.isInternal || data.is_internal),
            timestamp: new Date(data.timestamp || data.created_at || Date.now()),
            type: data.type || 'text',
            metadata: data.metadata || {},
            status: 'received'
          };

          get().addMessage(message);
          
          // Toast para novas mensagens de clientes
          if (message.sender === 'client') {
            toast.info('Nova mensagem', {
              description: `${message.senderName}: ${message.content.substring(0, 50)}...`
            });
          }
        } catch (error) {
          console.error('❌ [CHAT] Erro ao processar nova mensagem:', error);
        }
      });

      socket.on('messages-loaded', (data: any) => {
        console.log('📥 [CHAT] Mensagens carregadas via WebSocket:', data);
        
        try {
          const ticketId = data.ticketId;
          const rawMessages = data.messages || [];
          
          const messages: ChatMessage[] = rawMessages.map((msg: any, index: number) => ({
            id: msg.id || `loaded-${ticketId}-${Date.now()}-${index}`,
            ticketId: ticketId,
            content: msg.content || 'Sem conteúdo',
            senderName: msg.sender_name || msg.senderName || 'Desconhecido',
            sender: msg.sender || (msg.sender_id ? 'agent' : 'client'),
            isInternal: Boolean(msg.is_internal || msg.isInternal),
            timestamp: new Date(msg.created_at || msg.timestamp || Date.now()),
            type: msg.type || 'text',
            metadata: msg.metadata || {},
            status: 'sent'
          }));

          set((state) => ({
            messages: {
              ...state.messages,
              [ticketId]: messages
            },
            isLoading: false
          }));

          console.log(`✅ [CHAT] ${messages.length} mensagens carregadas para ticket ${ticketId}`);
        } catch (error) {
          console.error('❌ [CHAT] Erro ao processar mensagens carregadas:', error);
          set({ isLoading: false });
        }
      });

      socket.on('joined-ticket', (data: any) => {
        console.log('🎯 [CHAT] Entrou no ticket:', data.ticketId);
      });

      socket.on('error', (error: any) => {
        console.error('❌ [CHAT] Erro do servidor:', error);
        set({ error: error.message || 'Erro do servidor' });
      });

      // Salvar socket no estado
      set({ socket });

    } catch (error: any) {
      console.error('❌ [CHAT] Erro ao inicializar:', error);
      set({ 
        isLoading: false, 
        error: `Erro de inicialização: ${error.message}` 
      });
    }
  },

  /**
   * 🔌 Desconectar WebSocket
   */
  disconnect: () => {
    const { socket } = get();
    
    if (socket) {
      console.log('🔌 [CHAT] Desconectando WebSocket...');
      socket.disconnect();
      set({ 
        socket: null, 
        isConnected: false, 
        messages: {} 
      });
    }
  },

  /**
   * 🎯 Entrar em um ticket específico
   */
  join: (ticketId: string) => {
    const { socket, isConnected } = get();
    
    if (!isConnected || !socket) {
      console.warn('⚠️ [CHAT] Socket não conectado para entrar no ticket');
      
      // Tentar conectar automaticamente
      get().init();
      
      // Tentar novamente após delay
      setTimeout(() => {
        if (get().isConnected) {
          get().join(ticketId);
        }
      }, 2000);
      return;
    }

    console.log(`🎯 [CHAT] Entrando no ticket: ${ticketId}`);
    
    // Obter ID do usuário atual (você pode implementar esta função)
    const userId = getCurrentUserId();
    
    socket.emit('join-ticket', { 
      ticketId, 
      userId 
    });
  },

  /**
   * 📥 Carregar mensagens de um ticket
   */
  load: async (ticketId: string) => {
    const { socket, isConnected } = get();
    
    console.log(`📥 [CHAT] Carregando mensagens para ticket: ${ticketId}`);
    set({ isLoading: true, error: null });

    try {
      // 1. Tentar via WebSocket primeiro (tempo real)
      if (isConnected && socket) {
        console.log('📡 [CHAT] Solicitando mensagens via WebSocket...');
        socket.emit('request-messages', { 
          ticketId, 
          limit: 100 
        });
        
        // Aguardar resposta ou timeout
        const timeout = new Promise(resolve => setTimeout(resolve, 3000));
        const hasMessages = new Promise(resolve => {
          const check = () => {
            const currentMessages = get().messages[ticketId];
            if (currentMessages && currentMessages.length > 0) {
              resolve(true);
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });

        const result = await Promise.race([hasMessages, timeout]);
        
        if (result === true) {
          console.log('✅ [CHAT] Mensagens carregadas via WebSocket');
          return;
        }
      }

      // 2. Fallback: Carregar diretamente do Supabase
      console.log('📊 [CHAT] Carregando mensagens do Supabase...');
      
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        throw new Error(`Erro do Supabase: ${error.message}`);
      }

      // Converter para formato interno
      const chatMessages: ChatMessage[] = (messages || []).map((msg: any) => ({
        id: msg.id.toString(),
        ticketId: ticketId,
        content: msg.content || '',
        senderName: msg.sender_name || (msg.sender_type === 'agent' ? 'Atendente' : 'Cliente'),
        sender: msg.sender_type === 'agent' ? 'agent' : 'client',
        isInternal: Boolean(msg.is_internal),
        timestamp: new Date(msg.created_at),
        type: msg.message_type || 'text',
        metadata: msg.metadata || {},
        status: 'sent'
      }));

      // Atualizar estado
      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: chatMessages
        },
        isLoading: false
      }));

      console.log(`✅ [CHAT] ${chatMessages.length} mensagens carregadas do Supabase`);

    } catch (error: any) {
      console.error('❌ [CHAT] Erro ao carregar mensagens:', error);
      set({ 
        isLoading: false, 
        error: `Erro ao carregar mensagens: ${error.message}` 
      });

      toast.error('Erro ao carregar mensagens', {
        description: error.message
      });
    }
  },

  /**
   * 📤 Enviar mensagem
   */
  send: async (ticketId: string, content: string, isInternal: boolean = false) => {
    const { socket, isConnected } = get();
    
    if (!content.trim()) {
      throw new Error('Mensagem não pode estar vazia');
    }

    console.log(`📤 [CHAT] Enviando mensagem para ticket ${ticketId}:`, { content, isInternal });
    set({ isSending: true, error: null });

    const userId = getCurrentUserId();
    const userName = getCurrentUserName();

    // Criar mensagem temporária
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      ticketId,
      content: content.trim(),
      senderName: userName,
      sender: 'agent',
      isInternal,
      timestamp: new Date(),
      type: 'text',
      metadata: { userId },
      status: 'sending'
    };

    // Adicionar mensagem otimisticamente
    get().addMessage(tempMessage);

    try {
      // 1. Salvar no banco de dados
      console.log('💾 [CHAT] Salvando mensagem no banco...');
      
      const { data: savedMessage, error: dbError } = await supabase
        .from('messages')
        .insert({
          ticket_id: ticketId,
          content: content.trim(),
          sender_type: 'agent',
          sender_name: userName,
          sender_id: userId,
          is_internal: isInternal,
          message_type: 'text',
          metadata: { 
            source: 'web-chat',
            userId,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (dbError) {
        throw new Error(`Erro no banco: ${dbError.message}`);
      }

      // Atualizar mensagem com ID real
      const finalMessage: ChatMessage = {
        ...tempMessage,
        id: savedMessage.id.toString(),
        status: 'sent'
      };

      // Atualizar no estado
      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: state.messages[ticketId]?.map(msg => 
            msg.id === tempMessage.id ? finalMessage : msg
          ) || [finalMessage]
        }
      }));

      // 2. Enviar via WebSocket (se conectado)
      if (isConnected && socket) {
        console.log('📡 [CHAT] Enviando via WebSocket...');
        socket.emit('send-message', {
          ticketId,
          content: content.trim(),
          isInternal,
          userId,
          senderName: userName,
          messageId: finalMessage.id
        });
      }

      // 3. Enviar via Evolution API (se não for interno)
      if (!isInternal) {
        try {
          console.log('📱 [CHAT] Enviando via Evolution API...');
          
          // Buscar informações do ticket
          const { data: ticket } = await supabase
            .from('tickets')
            .select('customer_phone, whatsapp_instance')
            .eq('id', ticketId)
            .single();

          if (ticket?.customer_phone && ticket?.whatsapp_instance) {
            await sendMessageEvolution(
              ticket.whatsapp_instance,
              ticket.customer_phone,
              content.trim()
            );
            console.log('✅ [CHAT] Mensagem enviada via WhatsApp');
          }
        } catch (evolutionError: any) {
          console.warn('⚠️ [CHAT] Erro na Evolution API:', evolutionError.message);
          // Não bloquear o envio se Evolution falhar
        }
      }

      set({ isSending: false });
      
      toast.success('Mensagem enviada', {
        description: isInternal ? 'Nota interna salva' : 'Mensagem enviada ao cliente'
      });

      console.log('✅ [CHAT] Mensagem enviada com sucesso');

    } catch (error: any) {
      console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
      
      // Atualizar status da mensagem para falha
      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: state.messages[ticketId]?.map(msg => 
            msg.id === tempMessage.id ? { ...msg, status: 'failed' } : msg
          ) || []
        },
        isSending: false,
        error: error.message
      }));

      toast.error('Erro ao enviar mensagem', {
        description: error.message
      });

      throw error;
    }
  },

  /**
   * ➕ Adicionar mensagem ao estado
   */
  addMessage: (message: ChatMessage) => {
    set((state) => {
      const currentMessages = state.messages[message.ticketId] || [];
      
      // Verificar se mensagem já existe
      const exists = currentMessages.some(msg => 
        msg.id === message.id || 
        (msg.content === message.content && 
         Math.abs(msg.timestamp.getTime() - message.timestamp.getTime()) < 5000)
      );

      if (exists) {
        console.log('⚠️ [CHAT] Mensagem duplicada ignorada:', message.id);
        return state;
      }

      // Adicionar mensagem e ordenar por timestamp
      const updatedMessages = [...currentMessages, message].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      return {
        ...state,
        messages: {
          ...state.messages,
          [message.ticketId]: updatedMessages
        }
      };
    });
  },

  /**
   * 🧹 Limpar erro
   */
  clearError: () => {
    set({ error: null });
  },

  /**
   * 📋 Obter mensagens de um ticket
   */
  getTicketMessages: (ticketId: string) => {
    return get().messages[ticketId] || [];
  }
}));

/**
 * Utilitários para obter informações do usuário atual
 * Você pode implementar estas funções baseado no seu sistema de auth
 */
function getCurrentUserId(): string {
  // Implementar conforme seu sistema de autenticação
  return localStorage.getItem('userId') || 'user-' + Math.random().toString(36).substr(2, 9);
}

function getCurrentUserName(): string {
  // Implementar conforme seu sistema de autenticação
  return localStorage.getItem('userName') || 'Atendente';
}

// Inicializar automaticamente quando o store for criado
if (typeof window !== 'undefined') {
  // Aguardar um pouco para garantir que a aplicação foi carregada
  setTimeout(() => {
    const store = useChatStore.getState();
    if (!store.isConnected) {
      store.init();
    }
  }, 1000);
} 