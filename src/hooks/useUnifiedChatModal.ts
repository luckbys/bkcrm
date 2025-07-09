import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChatStore, ChatMessage } from '../stores/chatStore';
import { useWebhookV2Integration } from './useWebhookV2Integration';
import { MessagePayload } from '../services/webhookServerV2';
import { toast } from 'sonner';

interface UseUnifiedChatModalProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
}

interface UseUnifiedChatModalReturn {
  // Estado básico
  isLoading: boolean;
  error: string | null;
  
  // Mensagens
  messages: ChatMessage[];
  filteredMessages: ChatMessage[];
  messageStats: {
    total: number;
    fromClient: number;
    fromAgent: number;
    internal: number;
    unread: number;
  };
  
  // Estados da UI
  showSearch: boolean;
  searchTerm: string;
  showSidebar: boolean;
  soundEnabled: boolean;
  modalSize: 'normal' | 'expanded' | 'fullscreen';
  activeMode: 'message' | 'internal';
  messageText: string;
  replyingTo: ChatMessage | null;
  
  // Estados de input
  isTyping: boolean;
  isSending: boolean;
  showEmojiPicker: boolean;
  
  // Estados webhook v2
  webhookV2Connected: boolean;
  webhookV2QueuedMessages: number;
  
  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement>;
  searchInputRef: React.RefObject<HTMLInputElement>;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  
  // Funções de controle
  toggleSearch: () => void;
  toggleSidebar: () => void;
  toggleSound: () => void;
  setModalSize: (size: 'normal' | 'expanded' | 'fullscreen') => void;
  clearSearch: () => void;
  
  // Funções de mensagem
  sendMessage: () => Promise<void>;
  replyToMessage: (message: ChatMessage) => void;
  cancelReply: () => void;
  copyMessage: (content: string) => void;
  favoriteMessage: (messageId: string) => void;
  
  // Funções webhook v2
  testWebhookV2: () => Promise<void>;
  retryWebhookV2Messages: () => Promise<void>;
  
  // Funções de input
  setSearchTerm: (term: string) => void;
  setActiveMode: (mode: 'message' | 'internal') => void;
  setMessageText: (text: string) => void;
  toggleEmojiPicker: () => void;
  insertEmoji: (emoji: string) => void;
  
  // Estados computados
  hasUnreadMessages: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  searchResultsCount: number;
  
  // Funcionalidades avançadas
  handleKeyboardShortcuts: (e: KeyboardEvent) => void;
  scrollToMessage: (messageId: string) => void;
  exportChat: () => void;
  retryConnection: () => void;
  
  // Debug e utilitários
  forceReload: () => void;
  reconnectChat: () => void;
}

export const useUnifiedChatModal = ({
  ticketId,
  isOpen,
  onClose,
  onMinimize
}: UseUnifiedChatModalProps): UseUnifiedChatModalReturn => {
  
  // ===== STORES E HOOKS =====
  
  // Store do chat principal (novo)
  const {
    isConnected,
    isLoading,
    isSending,
    error,
    messages: allMessages,
    init: initChat,
    disconnect: disconnectChat,
    join: joinTicket,
    load: loadMessages,
    send: sendChatMessage,
    clearError,
    getTicketMessages
  } = useChatStore();

  // Integração webhook v2
  const webhookV2 = useWebhookV2Integration({
    enableAutoRetry: true,
    healthCheckInterval: 30000,
    onMessageSent: (payload, response) => {
      console.log('✅ [UNIFIED-CHAT] Webhook v2 enviou mensagem:', payload.ticketId);
    },
    onMessageFailed: (payload, error) => {
      console.error('❌ [UNIFIED-CHAT] Webhook v2 falhou:', error);
    },
    onConnectionChange: (isConnected) => {
      console.log(`🔌 [UNIFIED-CHAT] Webhook v2 ${isConnected ? 'conectado' : 'desconectado'}`);
    }
  });

  // ===== ESTADOS LOCAIS =====
  
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modalSize, setModalSizeState] = useState<'normal' | 'expanded' | 'fullscreen'>('normal');
  const [activeMode, setActiveMode] = useState<'message' | 'internal'>('message');
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Date>(new Date());

  // ===== REFS =====
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // ===== COMPUTED VALUES =====
  
  // Obter mensagens do ticket atual
  const messages = useMemo(() => {
    return getTicketMessages(ticketId);
  }, [getTicketMessages, ticketId, allMessages]);

  // Mensagens filtradas por busca
  const filteredMessages = useMemo(() => {
    if (!searchTerm) return messages;
    
    const term = searchTerm.toLowerCase();
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(term) ||
      msg.senderName.toLowerCase().includes(term)
    );
  }, [messages, searchTerm]);

  // Estatísticas das mensagens
  const messageStats = useMemo(() => {
    return {
      total: messages.length,
      fromClient: messages.filter(m => m.sender === 'client').length,
      fromAgent: messages.filter(m => m.sender === 'agent' && !m.isInternal).length,
      internal: messages.filter(m => m.isInternal).length,
      unread: messages.filter(m => new Date(m.timestamp) > lastSeen && m.sender === 'client').length
    };
  }, [messages, lastSeen]);

  // Status de conexão
  const connectionStatus = useMemo(() => {
    if (error) return 'error';
    if (isLoading) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  }, [isConnected, isLoading, error]);

  // Mensagens não lidas
  const hasUnreadMessages = messageStats.unread > 0;
  const searchResultsCount = searchTerm ? filteredMessages.length : 0;

  // ===== EFFECTS =====
  
  // Inicializar chat quando modal abre
  useEffect(() => {
    if (isOpen && ticketId) {
      console.log('🚀 [UNIFIED-CHAT] Modal aberto, inicializando chat para ticket:', ticketId);
      
      // Garantir que o chat está conectado
      if (!isConnected) {
        console.log('🔄 [UNIFIED-CHAT] Chat não conectado, inicializando...');
        initChat();
      }
      
      // Aguardar conexão e depois entrar no ticket
      const waitForConnection = () => {
        if (isConnected) {
          console.log('🎯 [UNIFIED-CHAT] Entrando no ticket:', ticketId);
          joinTicket(ticketId);
          
          console.log('📥 [UNIFIED-CHAT] Carregando mensagens...');
          loadMessages(ticketId);
        } else {
          // Tentar novamente em 1 segundo
          setTimeout(waitForConnection, 1000);
        }
      };
      
      waitForConnection();
    } else if (!isOpen) {
      // Opcional: desconectar quando fechar (ou manter conexão)
      console.log('🔌 [UNIFIED-CHAT] Modal fechado');
    }
  }, [isOpen, ticketId, isConnected, initChat, joinTicket, loadMessages]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (!showSearch && messagesEndRef.current && isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, showSearch, isNearBottom]);

  // Foco automático na busca
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Marcar como visto
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'client' && new Date(lastMessage.timestamp) > lastSeen) {
        setLastSeen(new Date());
      }
    }
  }, [messages, isOpen, lastSeen]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ===== FUNÇÕES DE CONTROLE =====
  
  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
    if (!showSearch) {
      setSearchTerm('');
    }
  }, [showSearch]);

  const toggleSidebar = useCallback(() => {
    setShowSidebar(prev => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  const setModalSize = useCallback((size: 'normal' | 'expanded' | 'fullscreen') => {
    setModalSizeState(size);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setShowSearch(false);
  }, []);

  // ===== FUNÇÕES DE MENSAGEM =====
  
  // Função principal de envio
  const sendMessage = useCallback(async () => {
    if (!messageText.trim() || isSending) return;

    const content = messageText.trim();
    console.log('📤 [UNIFIED-CHAT] Enviando mensagem:', { content, isInternal: activeMode === 'internal' });

    try {
      // 1. Enviar via sistema principal (ChatStore)
      const primarySendPromise = sendChatMessage(ticketId, content, activeMode === 'internal');

      // 2. Enviar via webhook v2 (paralelo)
      let webhookV2SendPromise = Promise.resolve({ success: false });
      
      if (webhookV2.isConnected) {
        const webhookPayload: MessagePayload = {
          ticketId: ticketId,
          content: content,
          sender: 'agent',
          messageType: 'text',
          isInternal: activeMode === 'internal',
          metadata: {
            replyTo: replyingTo?.id,
            timestamp: new Date().toISOString(),
            source: 'unified-chat-modal'
          }
        };
        
        webhookV2SendPromise = webhookV2.sendMessage(webhookPayload);
      }

      // Aguardar ambos os envios
      const [primaryResult, webhookResult] = await Promise.allSettled([
        primarySendPromise,
        webhookV2SendPromise
      ]);

      // Log dos resultados
      if (primaryResult.status === 'fulfilled') {
        console.log('✅ [UNIFIED-CHAT] Mensagem enviada via sistema principal');
      } else {
        console.error('❌ [UNIFIED-CHAT] Falha no sistema principal:', primaryResult.reason);
      }

      if (webhookResult.status === 'fulfilled' && webhookResult.value.success) {
        console.log('✅ [UNIFIED-CHAT] Mensagem processada via webhook v2');
      }

      // Limpar formulário
      setMessageText('');
      setReplyingTo(null);
      setShowEmojiPicker(false);
      
      // Focar novamente no input
      if (textareaRef.current) {
        textareaRef.current.focus();
      }

      // Toast de confirmação
      const webhookSuccess = webhookResult.status === 'fulfilled' && webhookResult.value.success;
      toast.success('Mensagem enviada', {
        description: webhookSuccess ? 'Processada por ambos os sistemas' : 'Salva no sistema principal'
      });

    } catch (error: any) {
      console.error('❌ [UNIFIED-CHAT] Erro ao enviar mensagem:', error);
      toast.error('Erro no envio', {
        description: error.message
      });
    }
  }, [messageText, isSending, activeMode, replyingTo, ticketId, sendChatMessage, webhookV2]);

  // Funções webhook v2
  const testWebhookV2 = useCallback(async () => {
    try {
      const result = await webhookV2.webhookService.testConnection();
      
      if (result.success) {
        toast.success('Webhook v2 funcionando!');
      } else {
        toast.error('Webhook v2 indisponível', {
          description: result.error
        });
      }
    } catch (error: any) {
      toast.error('Erro no teste', {
        description: error.message
      });
    }
  }, [webhookV2]);

  const retryWebhookV2Messages = useCallback(async () => {
    await webhookV2.retryFailedMessages();
  }, [webhookV2]);

  // Outras funções de mensagem
  const replyToMessage = useCallback((message: ChatMessage) => {
    setReplyingTo(message);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('Mensagem copiada');
    });
  }, []);

  const favoriteMessage = useCallback((messageId: string) => {
    setFavoriteMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  // ===== FUNÇÕES DE INPUT =====
  
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  }, [isTyping]);

  const setMessageTextWithTyping = useCallback((text: string) => {
    setMessageText(text);
    handleTyping();
  }, [handleTyping]);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker(prev => !prev);
  }, []);

  const insertEmoji = useCallback((emoji: string) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // ===== FUNCIONALIDADES AVANÇADAS =====
  
  const handleKeyboardShortcuts = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (true) {
      case e.key === 'Escape':
        e.preventDefault();
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else if (showSearch) {
          toggleSearch();
        } else if (replyingTo) {
          cancelReply();
        } else {
          onClose();
        }
        break;

      case e.ctrlKey && e.key === 'f':
        e.preventDefault();
        toggleSearch();
        break;

      case e.ctrlKey && e.key === 'i':
        e.preventDefault();
        setActiveMode(activeMode === 'message' ? 'internal' : 'message');
        break;

      case e.key === 'Enter' && !e.shiftKey && document.activeElement === textareaRef.current:
        e.preventDefault();
        sendMessage();
        break;
    }
  }, [isOpen, showEmojiPicker, showSearch, replyingTo, activeMode, onClose, toggleSearch, cancelReply, sendMessage]);

  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const exportChat = useCallback(() => {
    if (messages.length === 0) return;

    const chatText = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const sender = msg.sender === 'client' ? 'Cliente' : 'Atendente';
      const internal = msg.isInternal ? '[INTERNO] ' : '';
      return `[${time}] ${internal}${sender}: ${msg.content}`;
    }).join('\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_ticket_${ticketId}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, ticketId]);

  const retryConnection = useCallback(() => {
    console.log('🔄 [UNIFIED-CHAT] Reconectando chat...');
    clearError();
    initChat();
  }, [clearError, initChat]);

  // ===== FUNÇÕES DE DEBUG =====
  
  const forceReload = useCallback(() => {
    console.log('🔄 [UNIFIED-CHAT] Forçando recarregamento de mensagens...');
    loadMessages(ticketId);
  }, [loadMessages, ticketId]);

  const reconnectChat = useCallback(() => {
    console.log('🔄 [UNIFIED-CHAT] Reconectando chat completamente...');
    disconnectChat();
    setTimeout(() => {
      initChat();
      setTimeout(() => {
        if (isConnected) {
          joinTicket(ticketId);
          loadMessages(ticketId);
        }
      }, 2000);
    }, 1000);
  }, [disconnectChat, initChat, isConnected, joinTicket, loadMessages, ticketId]);

  // ===== RETURN =====
  
  return {
    // Estado básico
    isLoading,
    error,
    
    // Mensagens
    messages,
    filteredMessages,
    messageStats,
    
    // Estados da UI
    showSearch,
    searchTerm,
    showSidebar,
    soundEnabled,
    modalSize,
    activeMode,
    messageText,
    replyingTo,
    
    // Estados de input
    isTyping,
    isSending,
    showEmojiPicker,
    
    // Estados webhook v2
    webhookV2Connected: webhookV2.isConnected,
    webhookV2QueuedMessages: webhookV2.messageQueue.length,
    
    // Refs
    messagesEndRef,
    searchInputRef,
    textareaRef,
    
    // Funções de controle
    toggleSearch,
    toggleSidebar,
    toggleSound,
    setModalSize,
    clearSearch,
    
    // Funções de mensagem
    sendMessage,
    replyToMessage,
    cancelReply,
    copyMessage,
    favoriteMessage,
    
    // Funções webhook v2
    testWebhookV2,
    retryWebhookV2Messages,
    
    // Funções de input
    setSearchTerm,
    setActiveMode,
    setMessageText: setMessageTextWithTyping,
    toggleEmojiPicker,
    insertEmoji,
    
    // Estados computados
    hasUnreadMessages,
    connectionStatus,
    searchResultsCount,
    
    // Funcionalidades avançadas
    handleKeyboardShortcuts,
    scrollToMessage,
    exportChat,
    retryConnection,
    
        // Debug e utilitários
    forceReload,
    reconnectChat
  };
}; 