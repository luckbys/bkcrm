// 🚀 STORE ZUSTAND PARA CHAT COM WEBSOCKET
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, MessageStatus } from '../types/chat';
import { supabase } from '../lib/supabase';
import React from 'react';

// 🎯 Tipos específicos do WebSocket
interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface ChatSocketEvents {
  // Eventos recebidos
  newMessage: (message: any) => void;
  messageStatusUpdate: (data: { messageId: string; status: MessageStatus }) => void;
  userTyping: (data: { userId: string; userName: string; isTyping: boolean }) => void;
  userJoined: (data: { userId: string; userName: string }) => void;
  userLeft: (data: { userId: string; userName: string }) => void;
  
  // Eventos enviados
  joinRoom: (ticketId: string) => void;
  leaveRoom: (ticketId: string) => void;
  sendMessage: (message: any) => void;
  typing: (data: { isTyping: boolean; userName: string }) => void;
}

// 🏪 Interface do Store
interface ChatStore {
  // Estado das mensagens
  messages: Record<string, ChatMessage[]>; // ticketId -> mensagens
  currentTicketId: string | null;
  
  // Estado do WebSocket
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  
  // Estado de digitação
  typingUsers: Record<string, TypingUser[]>; // ticketId -> usuários digitando
  
  // Estado de loading
  isLoading: boolean;
  isSending: boolean;
  
  // Canned Responses
  cannedResponses: Array<{
    id: string;
    title: string;
    content: string;
    category?: string;
  }>;
  
  // Ações
  initializeSocket: () => void;
  disconnectSocket: () => void;
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
  sendMessage: (ticketId: string, content: string, isInternal?: boolean) => Promise<void>;
  loadMessages: (ticketId: string) => Promise<void>;
  startTyping: (userName: string) => void;
  stopTyping: () => void;
  updateMessageStatus: (ticketId: string, messageId: string, status: MessageStatus) => void;
  loadCannedResponses: () => Promise<void>;
  addCannedResponse: (response: { title: string; content: string; category?: string }) => Promise<void>;
  
  // Utilitários
  getCurrentMessages: () => ChatMessage[];
  getTypingUsers: () => TypingUser[];
  cleanupExpiredTyping: () => void;
}

// 🔧 Configurações
const WEBSOCKET_URL = 'ws://localhost:4000';
const TYPING_TIMEOUT = 3000; // 3 segundos

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => ({
    // 📊 Estado inicial
    messages: {},
    currentTicketId: null,
    socket: null,
    isConnected: false,
    connectionError: null,
    typingUsers: {},
    isLoading: false,
    isSending: false,
    cannedResponses: [],

    // 🔌 Inicializar WebSocket
    initializeSocket: () => {
      const { socket: existingSocket } = get();
      
      // Evitar múltiplas conexões
      if (existingSocket?.connected) {
        console.log('🔗 [WebSocket] Já conectado');
        return;
      }

      console.log('🔗 [WebSocket] Conectando ao servidor...');
      
      const socket = io(WEBSOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      // ✅ Conexão estabelecida
      socket.on('connect', () => {
        console.log('✅ [WebSocket] Conectado:', socket.id);
        set({ 
          socket, 
          isConnected: true, 
          connectionError: null 
        });
      });

      // ❌ Erro de conexão
      socket.on('connect_error', (error) => {
        console.error('❌ [WebSocket] Erro de conexão:', error);
        set({ 
          isConnected: false, 
          connectionError: error.message 
        });
      });

      // 🔌 Desconectado
      socket.on('disconnect', (reason) => {
        console.log('🔌 [WebSocket] Desconectado:', reason);
        set({ 
          isConnected: false,
          connectionError: reason === 'io server disconnect' ? 'Servidor desconectou' : null
        });
      });

      // 📨 Nova mensagem recebida
      socket.on('newMessage', (messageData) => {
        console.log('📨 [WebSocket] Nova mensagem:', messageData);
        
        const { messages } = get();
        const { ticketId, ...messageInfo } = messageData;
        
        const newMessage: ChatMessage = {
          id: messageInfo.id || `msg-${Date.now()}`,
          content: messageInfo.content,
          type: messageInfo.type || 'text',
          sender: messageInfo.sender_type === 'agent' ? 'agent' : 'client',
          senderName: messageInfo.sender_name || (messageInfo.sender_type === 'agent' ? 'Atendente' : 'Cliente'),
          senderId: messageInfo.sender_id,
          timestamp: new Date(messageInfo.created_at || messageInfo.timestamp),
          isInternal: Boolean(messageInfo.is_internal),
          status: messageInfo.status || 'delivered',
          metadata: messageInfo.metadata
        };

        set({
          messages: {
            ...messages,
            [ticketId]: [...(messages[ticketId] || []), newMessage]
          }
        });
      });

      // 📊 Atualização de status da mensagem
      socket.on('messageStatusUpdate', ({ messageId, status, ticketId }) => {
        console.log('📊 [WebSocket] Status atualizado:', { messageId, status });
        
        const { messages } = get();
        const ticketMessages = messages[ticketId] || [];
        
        const updatedMessages = ticketMessages.map(msg => 
          msg.id === messageId ? { ...msg, status } : msg
        );

        set({
          messages: {
            ...messages,
            [ticketId]: updatedMessages
          }
        });
      });

      // ⌨️ Usuário digitando
      socket.on('userTyping', ({ userId, userName, isTyping, ticketId }) => {
        const { typingUsers, currentTicketId } = get();
        
        if (ticketId !== currentTicketId) return;

        const currentTyping = typingUsers[ticketId] || [];
        
        if (isTyping) {
          // Adicionar usuário digitando
          const newTypingUser: TypingUser = {
            userId,
            userName,
            timestamp: Date.now()
          };
          
          const filteredTyping = currentTyping.filter(u => u.userId !== userId);
          
          set({
            typingUsers: {
              ...typingUsers,
              [ticketId]: [...filteredTyping, newTypingUser]
            }
          });
        } else {
          // Remover usuário digitando
          set({
            typingUsers: {
              ...typingUsers,
              [ticketId]: currentTyping.filter(u => u.userId !== userId)
            }
          });
        }
      });

      set({ socket });
    },

    // 🔌 Desconectar WebSocket
    disconnectSocket: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
        set({ 
          socket: null, 
          isConnected: false, 
          connectionError: null 
        });
      }
    },

    // 🎯 Entrar em um ticket
    joinTicket: (ticketId: string) => {
      const { socket, currentTicketId } = get();
      
      // Sair do ticket anterior
      if (currentTicketId && currentTicketId !== ticketId) {
        get().leaveTicket(currentTicketId);
      }

      if (socket?.connected) {
        console.log('🎯 [WebSocket] Entrando no ticket:', ticketId);
        socket.emit('joinTicket', { ticketId });
        set({ currentTicketId: ticketId });
        
        // Carregar mensagens se não existirem
        const { messages } = get();
        if (!messages[ticketId]) {
          get().loadMessages(ticketId);
        }
      }
    },

    // 🚪 Sair de um ticket
    leaveTicket: (ticketId: string) => {
      const { socket } = get();
      if (socket?.connected) {
        console.log('🚪 [WebSocket] Saindo do ticket:', ticketId);
        socket.emit('leaveTicket', { ticketId });
      }
    },

    // 📤 Enviar mensagem
    sendMessage: async (ticketId: string, content: string, isInternal = false) => {
      const { socket, messages } = get();
      
      if (!content.trim()) return;
      
      set({ isSending: true });

      try {
        // Criar mensagem otimista
        const tempMessage: ChatMessage = {
          id: `temp-${Date.now()}`,
          content,
          type: 'text',
          sender: 'agent',
          senderName: 'Você',
          timestamp: new Date(),
          isInternal,
          status: 'sending'
        };

        // Atualizar UI otimisticamente
        set({
          messages: {
            ...messages,
            [ticketId]: [...(messages[ticketId] || []), tempMessage]
          }
        });

        // Enviar via WebSocket se conectado
        if (socket?.connected) {
          socket.emit('sendMessage', {
            ticketId,
            content,
            isInternal,
            type: 'text'
          });
        } else {
          // Fallback para HTTP/Supabase
          const { error } = await supabase
            .from('messages')
            .insert({
              ticket_id: ticketId,
              content,
              sender_type: 'agent',
              is_internal: isInternal,
              type: 'text'
            });

          if (error) throw error;
        }

      } catch (error) {
        console.error('❌ [Chat] Erro ao enviar mensagem:', error);
        
        // Atualizar status para erro
        const { messages: currentMessages } = get();
        const updatedMessages = currentMessages[ticketId]?.map(msg => 
          msg.id.startsWith('temp-') ? { ...msg, status: 'failed' as MessageStatus } : msg
        ) || [];

        set({
          messages: {
            ...currentMessages,
            [ticketId]: updatedMessages
          }
        });

        throw error;
      } finally {
        set({ isSending: false });
      }
    },

    // 📥 Carregar mensagens do banco
    loadMessages: async (ticketId: string) => {
      set({ isLoading: true });

      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        if (data) {
          const convertedMessages: ChatMessage[] = data.map(msg => ({
            id: msg.id.toString(),
            content: msg.content || '',
            type: 'text',
            sender: msg.sender_type === 'agent' ? 'agent' : 'client',
            senderName: msg.sender_name || (msg.sender_type === 'agent' ? 'Atendente' : 'Cliente'),
            senderId: msg.sender_id,
            timestamp: new Date(msg.created_at),
            isInternal: Boolean(msg.is_internal),
            status: 'delivered',
            metadata: msg.metadata
          }));

          const { messages } = get();
          set({
            messages: {
              ...messages,
              [ticketId]: convertedMessages
            }
          });
        }
      } catch (error) {
        console.error('❌ [Chat] Erro ao carregar mensagens:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    // ⌨️ Iniciar digitação
    startTyping: (userName: string) => {
      const { socket, currentTicketId } = get();
      if (socket?.connected && currentTicketId) {
        socket.emit('typing', { 
          ticketId: currentTicketId,
          isTyping: true, 
          userName 
        });
      }
    },

    // ⌨️ Parar digitação
    stopTyping: () => {
      const { socket, currentTicketId } = get();
      if (socket?.connected && currentTicketId) {
        socket.emit('typing', { 
          ticketId: currentTicketId,
          isTyping: false 
        });
      }
    },

    // 📊 Atualizar status da mensagem
    updateMessageStatus: (ticketId: string, messageId: string, status: MessageStatus) => {
      const { messages } = get();
      const ticketMessages = messages[ticketId] || [];
      
      const updatedMessages = ticketMessages.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      );

      set({
        messages: {
          ...messages,
          [ticketId]: updatedMessages
        }
      });
    },

    // 📝 Carregar respostas rápidas
    loadCannedResponses: async () => {
      try {
        // Aqui você faria a requisição para seu backend
        // Por enquanto, vamos simular algumas respostas
        const responses = [
          {
            id: '1',
            title: 'Saudação',
            content: 'Olá! Como posso ajudá-lo hoje?',
            category: 'geral'
          },
          {
            id: '2', 
            title: 'Agradecimento',
            content: 'Obrigado por entrar em contato conosco!',
            category: 'geral'
          },
          {
            id: '3',
            title: 'Informações de Contato',
            content: 'Para mais informações, entre em contato pelo telefone (11) 1234-5678 ou email contato@empresa.com',
            category: 'contato'
          }
        ];

        set({ cannedResponses: responses });
      } catch (error) {
        console.error('❌ [Chat] Erro ao carregar respostas rápidas:', error);
      }
    },

    // ➕ Adicionar resposta rápida
    addCannedResponse: async (response) => {
      try {
        // Aqui você faria a requisição POST para seu backend
        const newResponse = {
          id: Date.now().toString(),
          ...response
        };

        const { cannedResponses } = get();
        set({
          cannedResponses: [...cannedResponses, newResponse]
        });
      } catch (error) {
        console.error('❌ [Chat] Erro ao adicionar resposta rápida:', error);
      }
    },

    // 🛠️ Utilitários
    getCurrentMessages: () => {
      const { messages, currentTicketId } = get();
      return currentTicketId ? messages[currentTicketId] || [] : [];
    },

    getTypingUsers: () => {
      const { typingUsers, currentTicketId } = get();
      return currentTicketId ? typingUsers[currentTicketId] || [] : [];
    },

    cleanupExpiredTyping: () => {
      const { typingUsers } = get();
      const now = Date.now();
      const cleanedTyping: Record<string, TypingUser[]> = {};

      Object.entries(typingUsers).forEach(([ticketId, users]) => {
        cleanedTyping[ticketId] = users.filter(
          user => now - user.timestamp < TYPING_TIMEOUT
        );
      });

      set({ typingUsers: cleanedTyping });
    }
  }))
);

// 🎣 Hook personalizado para usar o store
export const useChatSocket = () => {
  const store = useChatStore();
  
  // Cleanup de digitação expirada a cada 1 segundo
  React.useEffect(() => {
    const interval = setInterval(() => {
      store.cleanupExpiredTyping();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return store;
}; 