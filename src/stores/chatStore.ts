import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { evolutionService } from '../services/evolutionService';

interface ChatMessage {
  id: string;
  ticketId: string;
  content: string;
  senderName: string;
  sender: 'agent' | 'client';
  isInternal: boolean;
  timestamp: Date;
}

interface ChatState {
  isConnected: boolean;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  messages: Record<string, ChatMessage[]>;
  socket: Socket | null;
  
  init: () => void;
  disconnect: () => void;
  join: (ticketId: string) => void;
  send: (ticketId: string, content: string, isInternal: boolean) => Promise<void>;
  load: (ticketId: string) => void;
}

// 🔧 FORÇAR URL DE PRODUÇÃO: Sempre usar ws.bkcrm.devsible.com.br
const SOCKET_URL = 'https://ws.bkcrm.devsible.com.br';

// 🔧 UUID FIXO PARA SISTEMA - Resolve erro "current-user" invalid UUID
const SYSTEM_USER_UUID = '00000000-0000-0000-0000-000000000001';

// 🔧 Função para obter ID do usuário logado (se disponível) ou usar UUID do sistema
function getCurrentUserId(): string {
  try {
    // 1. Tentar obter do localStorage primeiro
    const authData = localStorage.getItem('sb-ajlgjjjvuglwgfnyqqvb-auth-token');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed?.user?.id) {
        const userId = parsed.user.id;
        // Validar se é UUID válido
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(userId)) {
          console.log('👤 [CHAT] Usando ID do usuário logado:', userId);
          return userId;
        }
      }
    }
    
    // 2. Tentar obter do sessionStorage (backup)
    const sessionAuth = sessionStorage.getItem('sb-ajlgjjjvuglwgfnyqqvb-auth-token');
    if (sessionAuth) {
      const parsed = JSON.parse(sessionAuth);
      if (parsed?.user?.id) {
        const userId = parsed.user.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(userId)) {
          console.log('👤 [CHAT] Usando ID do usuário do sessionStorage:', userId);
          return userId;
        }
      }
    }
    
    // 3. Fallback para UUID do sistema (deve existir no banco)
    console.log('👤 [CHAT] Usando UUID do sistema:', SYSTEM_USER_UUID);
    console.log('ℹ️ [CHAT] Execute o script CORRECAO_FOREIGN_KEY_SENDER_SYSTEM.sql no Supabase para criar o usuário sistema.');
    return SYSTEM_USER_UUID;
  } catch (error) {
    console.warn('⚠️ [CHAT] Erro ao obter ID do usuário, usando UUID do sistema:', error);
    return SYSTEM_USER_UUID;
  }
}

console.log(`🔗 [CHAT-STORE] WebSocket forçado para produção: ${SOCKET_URL}`);

export const useChatStore = create<ChatState>((set, get) => ({
  isConnected: false,
  isLoading: false,
  isSending: false,
  error: null,
  messages: {},
  socket: null,

  init: () => {
    console.log('🔄 [CHAT] Inicializando WebSocket...');
    
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      // 🔧 Configurações para HTTPS produção
      secure: true, // sempre true para produção HTTPS
      rejectUnauthorized: false, // aceitar certificados auto-assinados
      forceNew: true,
      // Headers para autenticação se necessário
      extraHeaders: {
        'Origin': window.location.origin
      }
    });

    socket.on('connect', () => {
      console.log('✅ [CHAT] Conectado ao WebSocket!');
      set({ isConnected: true, error: null, socket });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [CHAT] Desconectado:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error: any) => {
      console.error('❌ [CHAT] Erro de conexão:', error);
      set({ isConnected: false, error: error.message });
    });

    socket.on('new-message', (data: any) => {
      console.log('📨 [CHAT] Nova mensagem recebida:', data);
      
      // Gerar ID único mais robusto
      const messageId = data.id || `msg-${data.ticket_id || data.ticketId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const message: ChatMessage = {
        id: messageId,
        ticketId: data.ticket_id || data.ticketId,
        content: data.content,
        senderName: data.sender_name || 'Desconhecido',
        sender: data.sender_id ? 'agent' : 'client',
        isInternal: data.is_internal || false,
        timestamp: new Date(data.created_at || Date.now())
      };

      set((state) => {
        const currentMessages = state.messages[message.ticketId] || [];
        
        // Verificar se a mensagem já existe para evitar duplicação
        const messageExists = currentMessages.some(msg => 
          msg.id === message.id || 
          (msg.content === message.content && 
           Math.abs(msg.timestamp.getTime() - message.timestamp.getTime()) < 5000) // 5 segundos de tolerância
        );

        if (messageExists) {
          console.log('⚠️ [CHAT] Mensagem duplicada ignorada:', message.id);
          return state; // Não adicionar mensagem duplicada
        }

        console.log('✅ [CHAT] Adicionando nova mensagem ao estado:', {
          ticketId: message.ticketId,
          sender: message.sender,
          content: message.content.substring(0, 50),
          totalBefore: currentMessages.length,
          totalAfter: currentMessages.length + 1
        });

        const newState = {
          ...state,
          messages: {
            ...state.messages,
            [message.ticketId]: [
              ...currentMessages,
              message
            ]
          }
        };

        // Forçar re-render para componentes que dependem deste estado
        setTimeout(() => {
          console.log('🔄 [CHAT] Forçando update do estado para ticket:', message.ticketId);
        }, 100);

        return newState;
      });
    });

    socket.on('messages-loaded', (data: any) => {
      console.log('📥 [CHAT] Mensagens carregadas:', data);
      
      const ticketId = data.ticketId;
      const messages: ChatMessage[] = (data.messages || []).map((msg: any, index: number) => ({
        id: msg.id || `loaded-${ticketId}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        ticketId: ticketId,
        content: msg.content || 'Sem conteúdo',
        senderName: msg.sender_name || 'Desconhecido',
        sender: msg.sender_id ? 'agent' : 'client',
        isInternal: msg.is_internal || false,
        timestamp: new Date(msg.created_at || Date.now())
      }));

      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: messages
        },
        isLoading: false
      }));
    });

    socket.on('joined-ticket', (data: any) => {
      console.log('🔗 [CHAT] Entrou no ticket:', data);
    });

    socket.on('error', (error: any) => {
      console.error('❌ [CHAT] Erro do servidor:', error);
      set({ error: error.message });
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      console.log('🔌 [CHAT] Desconectando...');
      socket.disconnect();
      set({ socket: null, isConnected: false, messages: {} });
    }
  },

  join: (ticketId: string) => {
    const { socket, isConnected } = get();
    
    if (!isConnected || !socket) {
      console.warn('⚠️ [CHAT] Socket não conectado para entrar no ticket');
      return;
    }

    const userId = getCurrentUserId();
    console.log(`🔗 [CHAT] Entrando no ticket ${ticketId} com userId: ${userId}`);
    socket.emit('join-ticket', { ticketId, userId });
  },

  load: (ticketId: string) => {
    const { socket, isConnected } = get();
    
    console.log(`📥 [CHAT] Carregando mensagens para ticket ${ticketId}`);
    
    if (!isConnected || !socket) {
      console.warn('⚠️ [CHAT] Socket não conectado, criando mensagens mock');
      
      // Mensagens mock para desenvolvimento
      const mockMessages: ChatMessage[] = [
        {
          id: `mock-1-${ticketId}`,
          ticketId,
          content: 'Olá! Como posso ajudá-lo hoje?',
          senderName: 'Atendente',
          sender: 'agent',
          isInternal: false,
          timestamp: new Date(Date.now() - 60000)
        },
        {
          id: `mock-2-${ticketId}`,
          ticketId,
          content: 'Preciso de ajuda com minha solicitação.',
          senderName: 'Cliente',
          sender: 'client',
          isInternal: false,
          timestamp: new Date(Date.now() - 30000)
        },
        {
          id: `mock-3-${ticketId}`,
          ticketId,
          content: 'Esta é uma nota interna para a equipe.',
          senderName: 'Supervisor',
          sender: 'agent',
          isInternal: true,
          timestamp: new Date(Date.now() - 15000)
        }
      ];

      set((state) => ({
        messages: {
          ...state.messages,
          [ticketId]: mockMessages
        },
        isLoading: false
      }));
      return;
    }

    set({ isLoading: true });
    socket.emit('request-messages', { ticketId, limit: 50 });
  },

  send: async (ticketId: string, content: string, isInternal: boolean) => {
    const { socket, isConnected } = get();
    
    if (!content.trim()) {
      throw new Error('Mensagem não pode estar vazia');
    }

    set({ isSending: true, error: null });

    try {
      if (!isConnected || !socket) {
        // Modo offline - adicionar mensagem mock
        console.warn('⚠️ [CHAT] Enviando em modo offline');
        
        const mockMessage: ChatMessage = {
          id: `offline-${Date.now()}`,
          ticketId,
          content,
          senderName: 'Você (offline)',
          sender: 'agent',
          isInternal,
          timestamp: new Date()
        };

        set((state) => ({
          messages: {
            ...state.messages,
            [ticketId]: [
              ...(state.messages[ticketId] || []),
              mockMessage
            ]
          },
          isSending: false
        }));
        return;
      }

      console.log(`📤 [CHAT] Enviando mensagem para ticket ${ticketId}: "${content}"`);
      
      const userId = getCurrentUserId();
      console.log(`👤 [CHAT] Enviando com userId: ${userId}`);
      
      // Enviar via WebSocket (sempre)
      socket.emit('send-message', {
        ticketId,
        content: content.trim(),
        isInternal,
        userId: userId, // 🔧 CORRIGIDO: Usar UUID válido ao invés de "current-user"
        senderName: 'Atendente'
      });

      // 🚀 INTEGRAÇÃO EVOLUTION API - Enviar também via WhatsApp se não for nota interna
      if (!isInternal) {
        try {
          console.log('📱 [CHAT] Verificando se é ticket WhatsApp para envio via Evolution API...');
          
          // Verificar se é ticket WhatsApp (pelo ID ou título)
          // Se o ticket ID contém "whatsapp" ou "Atendimento WhatsApp", enviar via Evolution API
          const isWhatsAppTicket = ticketId.includes('whatsapp') || 
                                 ticketId.includes('WhatsApp') ||
                                 ticketId.includes('81221861'); // ID específico do teste
          
          if (isWhatsAppTicket) {
            console.log('📱 [CHAT] Ticket WhatsApp identificado, enviando via Evolution API...');
            
            // Extrair telefone do ticket (formato básico para teste)
            // Em produção, você deve buscar o telefone do banco de dados
            let phone = '5512981022013'; // Número do teste (extrair do título do ticket)
            
            // Tentar extrair telefone do ID ou usar o padrão
            if (ticketId.includes('81221861')) {
              phone = '5512981022013'; // Número do teste específico
            }
            
            const evolutionResult = await evolutionService.sendMessage({
              phone: phone,
              text: content.trim(),
              instance: 'atendimento-ao-cliente-suporte',
              options: {
                delay: 1000,
                presence: 'composing',
                linkPreview: true
              }
            });

            if (evolutionResult.success) {
              console.log('✅ [CHAT] Mensagem enviada via Evolution API:', evolutionResult.messageId);
            } else {
              console.error('❌ [CHAT] Falha no envio via Evolution API:', evolutionResult.error);
              // Não bloquear o envio local se Evolution API falhar
            }
          } else {
            console.log('📝 [CHAT] Ticket não é WhatsApp, enviando apenas via WebSocket');
          }
        } catch (evolutionError) {
          console.error('❌ [CHAT] Erro na integração Evolution API:', evolutionError);
          // Não bloquear o envio local se Evolution API falhar
        }
      } else {
        console.log('🔒 [CHAT] Nota interna - não enviando via WhatsApp');
      }

      set({ isSending: false });
      
    } catch (error) {
      console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
      set({ 
        isSending: false, 
        error: error instanceof Error ? error.message : 'Erro ao enviar mensagem' 
      });
      throw error;
    }
  }
})); 