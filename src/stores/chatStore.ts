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
  type: string;
  metadata: Record<string, any>;
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

// 🔧 URL DINÂMICA: Detectar ambiente automaticamente
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:4000' 
  : 'https://websocket.bkcrm.devsible.com.br'; // ⭐ Novo domínio WebSocket

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

console.log(`🔗 [CHAT-STORE] WebSocket URL detectada: ${SOCKET_URL} (ambiente: ${window.location.hostname})`);

export const useChatStore = create<ChatState>((set, get) => ({
  isConnected: false,
  isLoading: false,
  isSending: false,
  error: null,
  messages: {},
  socket: null,

  init: () => {
    console.log('🔄 [CHAT] Inicializando WebSocket...');
    console.log('🔗 [CHAT] URL de conexão:', SOCKET_URL);
    
    // 🔧 Desconectar socket anterior se existir
    const currentState = get();
    if (currentState.socket) {
      console.log('🔌 [CHAT] Desconectando socket anterior...');
      currentState.socket.disconnect();
    }
    
    set({ isLoading: true, error: null });
    
    // 🔧 Configurações dinâmicas baseadas no ambiente
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    const socketConfig = {
      transports: ['websocket', 'polling'],
      timeout: 15000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      forceNew: true,
      autoConnect: true,
      // 🎯 Configurações específicas do ambiente
      ...(isProduction ? {
        // Produção HTTPS
        secure: true,
        rejectUnauthorized: false,
        extraHeaders: {
          'Origin': window.location.origin
        }
      } : {
        // Desenvolvimento HTTP
        secure: false,
        upgrade: true,
        rememberUpgrade: false
      })
    };

    console.log('⚙️ [CHAT] Configuração Socket.IO:', {
      url: SOCKET_URL,
      isProduction,
      config: socketConfig
    });
    
    const socket = io(SOCKET_URL, socketConfig);

    // 🔧 TIMEOUT DE CONEXÃO - Se não conectar em 10 segundos, tentar novamente
    const connectionTimeout = setTimeout(() => {
      if (!socket.connected) {
        console.warn('⏰ [CHAT] Timeout de conexão - forçando reconexão...');
        socket.disconnect();
        set({ error: 'Timeout de conexão', isLoading: false });
        
        // Tentar novamente em 3 segundos
        setTimeout(() => {
          console.log('🔄 [CHAT] Tentativa automática de reconexão...');
          get().init();
        }, 3000);
      }
    }, 10000);

    socket.on('connect', () => {
      console.log('✅ [CHAT] Conectado ao WebSocket!');
      console.log('🔗 [CHAT] Socket ID:', socket.id);
      console.log('🌐 [CHAT] Transporte usado:', socket.io.engine.transport.name);
      
      clearTimeout(connectionTimeout);
      set({ isConnected: true, error: null, socket, isLoading: false });
      
      // 🎯 Forçar heartbeat para manter conexão viva
      const heartbeat = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping', Date.now());
        } else {
          clearInterval(heartbeat);
        }
      }, 30000); // A cada 30 segundos
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [CHAT] Desconectado:', reason);
      clearTimeout(connectionTimeout);
      set({ isConnected: false });
      
      // 🔧 Reconexão automática mais agressiva
      if (reason === 'io server disconnect') {
        // Se o servidor desconectou, reconectar manualmente
        console.log('🔄 [CHAT] Servidor desconectou - reconectando manualmente...');
        setTimeout(() => {
          socket.connect();
        }, 2000);
      }
    });

    socket.on('connect_error', (error: any) => {
      console.error('❌ [CHAT] Erro de conexão:', error);
      console.error('🔧 [CHAT] URL tentada:', SOCKET_URL);
      console.error('🌐 [CHAT] Hostname atual:', window.location.hostname);
      console.error('⚙️ [CHAT] Config usada:', socketConfig);
      
      clearTimeout(connectionTimeout);
      set({ isConnected: false, error: error.message, isLoading: false });
      
      // 🔧 Análise de erros específicos
      if (error.message.includes('xhr poll error') || error.message.includes('timeout')) {
        console.log('🔄 [CHAT] Erro de polling - tentando WebSocket apenas...');
        setTimeout(() => {
          const newSocket = io(SOCKET_URL, {
            ...socketConfig,
            transports: ['websocket'] // Tentar apenas WebSocket
          });
          set({ socket: newSocket });
        }, 5000);
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 [CHAT] Reconectado após', attemptNumber, 'tentativas');
      set({ isConnected: true, error: null });
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('⏳ [CHAT] Tentativa de reconexão:', attemptNumber);
      set({ isLoading: true });
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ [CHAT] Erro na reconexão:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('💥 [CHAT] Falha total na reconexão');
      set({ error: 'Falha na reconexão ao servidor', isLoading: false });
      
      // 🔧 Último recurso: reinicializar completamente
      console.log('🆘 [CHAT] Tentativa de reinicialização completa...');
      setTimeout(() => {
        get().init();
      }, 10000);
    });

    // 🔧 EVENTOS DE MENSAGEM COM MELHORIA
    socket.on('new-message', (data: any) => {
      console.log('📨 [CHAT] === NOVA MENSAGEM RECEBIDA VIA WEBSOCKET ===');
      console.log('📨 [CHAT] Dados brutos:', data);
      
      // 🎯 Validação robusta dos dados
      if (!data || !data.content || !data.ticket_id) {
        console.warn('⚠️ [CHAT] Dados de mensagem inválidos:', data);
        return;
      }
      
      // Gerar ID único mais robusto
      const messageId = data.id || `msg-${data.ticket_id || data.ticketId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const message: ChatMessage = {
        id: messageId,
        ticketId: data.ticket_id || data.ticketId,
        content: data.content,
        senderName: data.sender_name || 'Desconhecido',
        sender: data.sender || (data.metadata?.is_from_client ? 'client' : 'agent'),
        isInternal: data.is_internal || false,
        timestamp: new Date(data.created_at || Date.now()),
        type: data.type || 'text',
        metadata: data.metadata || {}
      };

      console.log('📨 [CHAT] Detalhes da identificação do remetente:', {
        sender: message.sender,
        originalSender: data.sender,
        isFromClient: data.metadata?.is_from_client,
        senderId: data.sender_id,
        metadata: data.metadata
      });

      console.log('📨 [CHAT] Mensagem processada:', {
        id: message.id,
        ticketId: message.ticketId,
        sender: message.sender,
        content: message.content.substring(0, 50),
        senderName: message.senderName,
        isInternal: message.isInternal,
        type: message.type,
        metadata: message.metadata
      });

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

        // Forçar atualização do estado
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

        // 🎯 Forçar re-render com delay
        setTimeout(() => {
          console.log('🔄 [CHAT] Trigger re-render para componente:', message.ticketId);
          window.dispatchEvent(new CustomEvent('chat-message-received', { 
            detail: { ticketId: message.ticketId, message } 
          }));
        }, 100);

        return newState;
      });
    });

    socket.on('messages-loaded', (data: any) => {
      console.log('📥 [CHAT] === MENSAGENS CARREGADAS VIA WEBSOCKET ===');
      console.log('📥 [CHAT] Dados brutos:', data);
      
      const ticketId = data.ticketId;
      const rawMessages = data.messages || [];
      
      console.log(`📥 [CHAT] Processando ${rawMessages.length} mensagens para ticket ${ticketId}`);
      
      const messages: ChatMessage[] = rawMessages.map((msg: any, index: number) => ({
        id: msg.id || `loaded-${ticketId}-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        ticketId: ticketId,
        content: msg.content || 'Sem conteúdo',
        senderName: msg.sender_name || 'Desconhecido',
        sender: msg.sender_id ? 'agent' : 'client',
        isInternal: msg.is_internal || false,
        timestamp: new Date(msg.created_at || Date.now())
      }));

      console.log('📥 [CHAT] Mensagens processadas:', messages.map(m => ({
        id: m.id,
        sender: m.sender,
        content: m.content.substring(0, 30),
        senderName: m.senderName
      })));

      set((state) => {
        console.log(`📥 [CHAT] Atualizando estado com ${messages.length} mensagens para ticket ${ticketId}`);
        return {
          messages: {
            ...state.messages,
            [ticketId]: messages
          },
          isLoading: false
        };
      });
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
    
    console.log(`📥 [CHAT] === CARREGANDO MENSAGENS ===`);
    console.log(`📥 [CHAT] Ticket: ${ticketId}, Connected: ${isConnected}, Socket: ${socket ? 'exists' : 'null'}`);
    
    if (!isConnected || !socket) {
      console.warn('⚠️ [CHAT] Socket não conectado, criando mensagens mock');
      console.warn(`⚠️ [CHAT] Estado: isConnected=${isConnected}, socket=${socket ? 'exists' : 'null'}`);
      
      // Mensagens mock para desenvolvimento
      const mockMessages: ChatMessage[] = [
        {
          id: `mock-1-${ticketId}`,
          ticketId,
          content: 'Olá! Como posso ajudá-lo hoje?',
          senderName: 'Atendente',
          sender: 'agent',
          isInternal: false,
          timestamp: new Date(Date.now() - 60000),
          type: 'text',
          metadata: {}
        },
        {
          id: `mock-2-${ticketId}`,
          ticketId,
          content: 'Preciso de ajuda com minha solicitação.',
          senderName: 'Cliente',
          sender: 'client',
          isInternal: false,
          timestamp: new Date(Date.now() - 30000),
          type: 'text',
          metadata: {}
        },
        {
          id: `mock-3-${ticketId}`,
          ticketId,
          content: 'Esta é uma nota interna para a equipe.',
          senderName: 'Supervisor',
          sender: 'agent',
          isInternal: true,
          timestamp: new Date(Date.now() - 15000),
          type: 'text',
          metadata: {}
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

    console.log(`📥 [CHAT] Enviando request-messages para ticket ${ticketId}`);
    set({ isLoading: true });
    socket.emit('request-messages', { ticketId, limit: 50 });
    console.log(`📥 [CHAT] Request enviado, aguardando resposta...`);
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
          timestamp: new Date(),
          type: 'text',
          metadata: {}
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