// 🚀 STORE ZUSTAND PARA CHAT COM WEBSOCKET
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { ChatMessage, MessageStatus, SocketTypingUser } from '../types/chat';
import { supabase } from '../lib/supabase';
import { evolutionService } from '../services/evolutionService';
import { User } from '@supabase/supabase-js';
import React from 'react';

// 🎯 Tipos específicos do WebSocket
// A interface TypingUser foi movida para src/types/chat.ts como SocketTypingUser

interface ChatStore {
  // Estado das mensagens
  messages: Record<string, ChatMessage[]>;
  currentTicketId: string | null;
  
  // Estado do WebSocket
  socket: WebSocket | null;
  isConnected: boolean;
  connectionError: string | null;
  
  // Estado de digitação
  typingUsers: Record<string, SocketTypingUser[]>;
  
  // Estado de loading
  isLoading: boolean;
  isSending: boolean;
  
  // Usuário atual
  user: User | null;
  
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
  joinTicket: (ticketId: string | number) => void;
  leaveTicket: (ticketId: string | number) => void;
  sendMessage: (ticketId: string, content: string, isInternal?: boolean) => Promise<void>;
  loadMessages: (ticketId: string) => Promise<void>;
  startTyping: (userName: string) => void;
  stopTyping: () => void;
  updateMessageStatus: (ticketId: string, messageId: string, status: MessageStatus) => void;
  loadCannedResponses: () => Promise<void>;
  addCannedResponse: (response: { title: string; content: string; category?: string }) => Promise<void>;
  
  // Utilitários
  getCurrentMessages: () => ChatMessage[];
  getTypingUsers: () => SocketTypingUser[];
  cleanupExpiredTyping: () => void;
}

// 🔧 Configurações
const WEBSOCKET_URL = 'ws://localhost:4000';
const RECONNECT_DELAY = 3000; // 3 segundos
const MAX_RECONNECT_ATTEMPTS = 5;
const TYPING_TIMEOUT = 3000; // 3 segundos

console.log(`🔗 [WebSocket] Ambiente: ${process.env.NODE_ENV}, URL: ${WEBSOCKET_URL}`);

export const useChatStore = create<ChatStore>()(
  subscribeWithSelector((set, get) => {
    let reconnectAttempts = 0;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    // Inicializar usuário do Supabase
    const initializeUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('👤 [CHAT] Usuário carregado:', user?.email);
        set({ user });
      } catch (error) {
        console.error('❌ [CHAT] Erro ao carregar usuário:', error);
      }
    };

    // Inicializar usuário imediatamente
    initializeUser();

    const tryReconnect = () => {
      const { socket, isConnected } = get();
      
      if (isConnected || reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
      
      reconnectAttempts++;
      console.log(`🔄 [WebSocket] Tentativa de reconexão ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
      
      if (socket?.readyState === WebSocket.OPEN) {
        socket.close();
      }
      
      get().initializeSocket();
    };

    // Funções auxiliares para tratar eventos WebSocket
    const handleNewMessage = (data: any) => {
      const { messages } = get();
      const { ticketId, ...messageInfo } = data;
      
      const newMessage: ChatMessage = {
        id: messageInfo.id || `msg-${Date.now()}`,
        ticketId,
        content: messageInfo.content,
        type: messageInfo.type || 'text',
        sender: messageInfo.sender_type === 'agent' ? 'agent' : 'client',
        senderName: messageInfo.sender_name || (messageInfo.sender_type === 'agent' ? 'Atendente' : 'Cliente'),
        senderId: messageInfo.sender_id,
        timestamp: new Date(messageInfo.created_at || messageInfo.timestamp),
        isInternal: Boolean(messageInfo.is_internal),
        status: messageInfo.status || 'delivered',
        metadata: messageInfo.metadata || {}
      };

      set({
        messages: {
          ...messages,
          [ticketId]: [...(messages[ticketId] || []), newMessage]
        }
      });
    };

    const handleMessageStatus = (data: any) => {
      const { messages } = get();
      const { ticketId, messageId, status } = data;
      
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
    };

    const handleUserTyping = (data: any) => {
      const { typingUsers, currentTicketId } = get();
      const { userId, userName, isTyping, ticketId } = data;
      
      if (ticketId !== currentTicketId) return;

      const currentTyping = typingUsers[ticketId] || [];
      
      if (isTyping) {
        const newTypingUser: SocketTypingUser = {
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
        set({
          typingUsers: {
            ...typingUsers,
            [ticketId]: currentTyping.filter(u => u.userId !== userId)
          }
        });
      }
    };

    return {
      // 📊 Estado inicial
      messages: {},
      currentTicketId: null,
      socket: null,
      isConnected: false,
      connectionError: null,
      typingUsers: {},
      isLoading: false,
      isSending: false,
      user: null,
      cannedResponses: [],

      // 🔌 Inicializar WebSocket
      initializeSocket: () => {
        const { socket: existingSocket } = get();
        
        // Evitar múltiplas conexões
        if (existingSocket?.readyState === WebSocket.OPEN) {
          console.log('🔗 [WebSocket] Já conectado');
          return;
        }

        // Limpar timeout anterior se existir
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }

        console.log('🔗 [WebSocket] Conectando ao servidor...');
        
        try {
          const socket = new WebSocket(WEBSOCKET_URL);

          // ✅ Conexão estabelecida
          socket.onopen = () => {
            console.log('✅ [WebSocket] Conectado com sucesso');
            console.log('📊 [WebSocket] Estado:', {
              readyState: socket.readyState,
              url: socket.url,
              protocol: socket.protocol
            });
            reconnectAttempts = 0;
            set({ 
              socket, 
              isConnected: true, 
              connectionError: null 
            });

            // Reconectar tickets ativos
            const { currentTicketId } = get();
            if (currentTicketId) {
              console.log(`🔄 [WebSocket] Reconectando ao ticket ${currentTicketId}`);
              socket.send(JSON.stringify({
                type: 'join-ticket',
                payload: { ticketId: currentTicketId }
              }));
            }
          };

          // ❌ Erro de conexão
          socket.onerror = (error) => {
            console.error('❌ [WebSocket] Erro de conexão:', error);
            console.log('📊 [WebSocket] Estado:', {
              readyState: socket.readyState,
              url: socket.url,
              reconnectAttempts
            });
            set({ 
              isConnected: false, 
              connectionError: 'Erro de conexão com o servidor' 
            });

            // Tentar reconectar
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              console.log(`🔄 [WebSocket] Agendando reconexão em ${RECONNECT_DELAY}ms...`);
              reconnectTimeout = setTimeout(tryReconnect, RECONNECT_DELAY);
            } else {
              console.log('❌ [WebSocket] Máximo de tentativas de reconexão atingido');
              set({ connectionError: 'Não foi possível conectar ao servidor após várias tentativas' });
            }
          };

          // 🔌 Desconectado
          socket.onclose = (event) => {
            console.log('🔌 [WebSocket] Desconectado:', {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean
            });
            set({ 
              isConnected: false,
              socket: null,
              connectionError: event.wasClean ? null : 'Conexão perdida'
            });

            // Tentar reconectar se não foi um fechamento limpo
            if (!event.wasClean && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              console.log(`🔄 [WebSocket] Agendando reconexão em ${RECONNECT_DELAY}ms...`);
              reconnectTimeout = setTimeout(tryReconnect, RECONNECT_DELAY);
            }
          };

          // 📨 Nova mensagem recebida
          socket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('📨 [WebSocket] Mensagem recebida:', data);
              
              switch (data.type) {
                case 'new-message':
                  handleNewMessage(data.payload);
                  break;
                case 'message-status':
                  handleMessageStatus(data.payload);
                  break;
                case 'user-typing':
                  handleUserTyping(data.payload);
                  break;
                case 'connection-stats':
                  console.log('📊 [WebSocket] Estatísticas:', data.payload);
                  break;
                default:
                  console.log('❓ [WebSocket] Tipo de mensagem desconhecido:', data.type);
              }
            } catch (error) {
              console.error('❌ [WebSocket] Erro ao processar mensagem:', error);
            }
          };

          set({ socket });
        } catch (error) {
          console.error('❌ [WebSocket] Erro ao criar conexão:', error);
          set({ 
            connectionError: 'Erro ao criar conexão com o servidor',
            isConnected: false
          });
        }
      },

      // 🔌 Desconectar WebSocket
      disconnectSocket: () => {
        const { socket } = get();
        if (socket?.readyState === WebSocket.OPEN) {
          socket.close();
          set({ 
            socket: null, 
            isConnected: false, 
            connectionError: null 
          });
        }
        
        // Limpar timeout de reconexão
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        reconnectAttempts = 0;
      },

      // 🎯 Entrar em um ticket
      joinTicket: (ticketId: string | number) => {
        const { socket, currentTicketId } = get();
        
        const ticketIdStr = String(ticketId);
        
        // Sair do ticket anterior
        if (currentTicketId && currentTicketId !== ticketIdStr) {
          get().leaveTicket(currentTicketId);
        }

        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'join-ticket',
            payload: { ticketId: ticketIdStr }
          }));
          
          set({ currentTicketId: ticketIdStr });
          get().loadMessages(ticketIdStr);
        }
      },

      // 🚪 Sair do ticket
      leaveTicket: (ticketId: string | number) => {
        const { socket } = get();
        
        const ticketIdStr = String(ticketId);
        
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'leave-ticket',
            payload: { ticketId: ticketIdStr }
          }));
          
          set({ currentTicketId: null });
        }
      },

      // 📤 Enviar mensagem
      sendMessage: async (ticketId: string, content: string, isInternal = false) => {
        const { socket, messages, user } = get();
        
        if (!socket || socket.readyState !== WebSocket.OPEN || !ticketId || !content.trim()) {
          console.error('❌ [CHAT] Erro ao enviar mensagem: Socket desconectado ou dados inválidos');
          return;
        }

        set({ isSending: true });

        try {
          // Criar objeto da mensagem
          const messageData: ChatMessage = {
            id: `msg-${Date.now()}`,
            ticketId,
            content: content.trim(),
            type: 'text',
            sender: 'agent',
            senderName: user?.user_metadata?.name || 'Atendente',
            senderId: user?.id,
            timestamp: new Date(),
            isInternal,
            status: 'sending',
            metadata: {}
          };

          // Enviar via WebSocket
          socket.send(JSON.stringify({
            type: 'send-message',
            payload: messageData
          }));

          // Se não for nota interna, enviar também via Evolution API
          if (!isInternal) {
            // Buscar ticket atual
            const ticket = messages[ticketId]?.[0]?.metadata?.ticket;
            
            if (ticket) {
              const phone = evolutionService.extractPhoneFromTicket(ticket);
              
              if (phone) {
                await evolutionService.sendMessage({
                  phone,
                  text: content,
                  options: {
                    delay: 1000,
                    presence: 'composing'
                  }
                });
              } else {
                console.warn('⚠️ [CHAT] Não foi possível enviar via WhatsApp: Telefone não encontrado');
              }
            }
          }

          // Adicionar mensagem localmente
          const ticketMessages = messages[ticketId] || [];
          set({
            messages: {
              ...messages,
              [ticketId]: [...ticketMessages, messageData]
            }
          });

          console.log('✅ [CHAT] Mensagem enviada com sucesso');
          
        } catch (error) {
          console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
          throw error;
          
        } finally {
          set({ isSending: false });
        }
      },

      // 📥 Carregar mensagens do banco
      loadMessages: async (ticketId: string) => {
        set({ isLoading: true });
        
        try {
          console.log(`📥 [CHAT] Carregando mensagens para ticket ${ticketId}`);
          
          // Para tickets mockados (IDs numéricos), criar mensagens de exemplo
          if (!ticketId.includes('-') && /^\d+$/.test(ticketId)) {
            console.log(`🎭 [CHAT] Ticket mockado detectado (${ticketId}), criando mensagens de exemplo`);
            
            const mockMessages: ChatMessage[] = [
              {
                id: `mock-msg-1-${ticketId}`,
                ticketId,
                content: 'Olá! Como posso ajudá-lo hoje?',
                type: 'text',
                sender: 'agent',
                senderName: 'Atendente',
                senderId: 'agent-1',
                timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 min atrás
                isInternal: false,
                status: 'delivered',
                metadata: {}
              },
              {
                id: `mock-msg-2-${ticketId}`,
                ticketId,
                content: 'Preciso de ajuda com minha conta',
                type: 'text',
                sender: 'client',
                senderName: 'Cliente',
                senderId: 'client-1',
                timestamp: new Date(Date.now() - 8 * 60 * 1000), // 8 min atrás
                isInternal: false,
                status: 'delivered',
                metadata: {}
              },
              {
                id: `mock-msg-3-${ticketId}`,
                ticketId,
                content: 'Claro! Vou verificar sua conta agora.',
                type: 'text',
                sender: 'agent',
                senderName: 'Atendente',
                senderId: 'agent-1',
                timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 min atrás
                isInternal: false,
                status: 'delivered',
                metadata: {}
              }
            ];

            set(state => ({
              messages: {
                ...state.messages,
                [ticketId]: mockMessages
              }
            }));

            console.log(`✅ [CHAT] ${mockMessages.length} mensagens mockadas criadas para ticket ${ticketId}`);
            return;
          }

          // Para tickets reais (UUIDs), buscar no banco
          console.log(`🗄️ [CHAT] Buscando mensagens reais no banco para ticket ${ticketId}`);
          
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

          if (error) {
            console.error('❌ [CHAT] Erro ao buscar mensagens no banco:', error);
            throw error;
          }

          const messages = (data || []).map(msg => ({
            id: msg.id,
            ticketId: msg.ticket_id,
            content: msg.content,
            type: msg.type || 'text',
            sender: msg.sender_type === 'agent' ? 'agent' : 'client',
            senderName: msg.sender_name || (msg.sender_type === 'agent' ? 'Atendente' : 'Cliente'),
            senderId: msg.sender_id,
            timestamp: new Date(msg.created_at),
            isInternal: Boolean(msg.is_internal),
            status: msg.status || 'delivered',
            metadata: msg.metadata || {}
          })) as ChatMessage[];

          set(state => ({
            messages: {
              ...state.messages,
              [ticketId]: messages
            }
          }));

          console.log(`✅ [CHAT] ${messages.length} mensagens reais carregadas do banco para ticket ${ticketId}`);
          
        } catch (error) {
          console.error('❌ [CHAT] Erro ao carregar mensagens:', error);
          
          // Em caso de erro, criar mensagem de erro
          const errorMessage: ChatMessage = {
            id: `error-msg-${Date.now()}`,
            ticketId,
            content: 'Erro ao carregar mensagens. Tente novamente.',
            type: 'text',
            sender: 'agent',
            senderName: 'Sistema',
            senderId: 'system',
            timestamp: new Date(),
            isInternal: true,
            status: 'failed',
            metadata: {}
          };

          set(state => ({
            messages: {
              ...state.messages,
              [ticketId]: [errorMessage]
            }
          }));
          
        } finally {
          set({ isLoading: false });
        }
      },

      // ⌨️ Iniciar digitação
      startTyping: (userName: string) => {
        const { socket, currentTicketId } = get();
        if (socket?.readyState === WebSocket.OPEN && currentTicketId) {
          socket.send(JSON.stringify({
            type: 'user-typing',
            payload: {
              ticketId: currentTicketId,
              isTyping: true,
              userName
            }
          }));
        }
      },

      // ⌨️ Parar digitação
      stopTyping: () => {
        const { socket, currentTicketId } = get();
        if (socket?.readyState === WebSocket.OPEN && currentTicketId) {
          socket.send(JSON.stringify({
            type: 'user-typing',
            payload: {
              ticketId: currentTicketId,
              isTyping: false
            }
          }));
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
        const cleanedTyping: Record<string, SocketTypingUser[]> = {};

        Object.entries(typingUsers).forEach(([ticketId, users]) => {
          cleanedTyping[ticketId] = users.filter(
            user => now - user.timestamp < TYPING_TIMEOUT
          );
        });

        set({ typingUsers: cleanedTyping });
      }
    };
  })
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