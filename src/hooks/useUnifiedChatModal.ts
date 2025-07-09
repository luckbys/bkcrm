import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useWebhookV2Integration } from './useWebhookV2Integration';
import { MessagePayload } from '../services/webhookServerV2';
import { ChatMessage } from '../types';
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
}

export const useUnifiedChatModal = ({
  ticketId,
  isOpen,
  onClose,
  onMinimize
}: UseUnifiedChatModalProps): UseUnifiedChatModalReturn => {
  
  // Store do chat
  const chatStore = useChatStore();

  // Integração webhook v2
  const webhookV2 = useWebhookV2Integration({
    enableAutoRetry: true,
    healthCheckInterval: 30000,
    onMessageSent: (payload, response) => {
      console.log('✅ [CHAT-HOOK] Mensagem enviada via webhook v2:', payload.ticketId);
      toast.success('Mensagem processada pelo servidor', {
        description: 'Webhook v2 processou com sucesso'
      });
    },
    onMessageFailed: (payload, error) => {
      console.error('❌ [CHAT-HOOK] Falha no webhook v2:', error);
      toast.error('Falha no processamento', {
        description: 'Webhook v2 indisponível - mensagem salva localmente'
      });
    },
    onConnectionChange: (isConnected) => {
      console.log(`🔌 [CHAT-HOOK] Webhook v2 ${isConnected ? 'conectado' : 'desconectado'}`);
      if (isConnected) {
        toast.success('Webhook v2 conectado');
      } else {
        toast.warning('Webhook v2 desconectado');
      }
    }
  });

  // Estados locais da UI
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [modalSize, setModalSizeState] = useState<'normal' | 'expanded' | 'fullscreen'>('normal');
  const [activeMode, setActiveMode] = useState<'message' | 'internal'>('message');
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Date>(new Date());

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Verificar se está próximo ao final da lista de mensagens
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Mensagens filtradas por busca
  const filteredMessages = useMemo(() => {
    const allMessages = chatStore.messages || [];
    if (!searchTerm) return allMessages;
    
    const term = searchTerm.toLowerCase();
    return allMessages.filter(msg => 
      msg.content.toLowerCase().includes(term) ||
      (msg.sender === 'client' ? 'cliente' : 'agente').includes(term)
    );
  }, [chatStore.messages, searchTerm]);

  // Estatísticas das mensagens
  const messageStats = useMemo(() => {
    const msgs = chatStore.messages || [];
    return {
      total: msgs.length,
      fromClient: msgs.filter(m => m.sender === 'client').length,
      fromAgent: msgs.filter(m => m.sender === 'agent' && !m.isInternal).length,
      internal: msgs.filter(m => m.isInternal).length,
      unread: msgs.filter(m => new Date(m.timestamp) > lastSeen && m.sender === 'client').length
    };
  }, [chatStore.messages, lastSeen]);

  // Status de conexão
  const connectionStatus = useMemo(() => {
    if (chatStore.error) return 'error';
    if (chatStore.isLoading) return 'connecting';
    if (chatStore.isConnected) return 'connected';
    return 'disconnected';
  }, [chatStore.isConnected, chatStore.isLoading, chatStore.error]);

  // Controle de exibição de mensagens não lidas
  const hasUnreadMessages = messageStats.unread > 0;

  // Número de resultados da busca
  const searchResultsCount = searchTerm ? filteredMessages.length : 0;

  // Conectar automaticamente quando o modal abrir
  useEffect(() => {
    if (isOpen && ticketId) {
      console.log('🔌 Conectando ao chat para ticket:', ticketId);
      
      // Usar função do store se disponível
      if (typeof chatStore.connect === 'function') {
        chatStore.connect();
        
        // Aguardar conexão antes de entrar no ticket
        if (chatStore.isConnected && typeof chatStore.joinTicket === 'function') {
          chatStore.joinTicket(ticketId);
        }
      } else {
        console.warn('⚠️ Funções de chat store não disponíveis');
      }
    } else if (!isOpen) {
      if (typeof chatStore.disconnect === 'function') {
        chatStore.disconnect();
      }
    }
  }, [isOpen, ticketId, chatStore]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (!showSearch && messagesEndRef.current && isNearBottom) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, showSearch, isNearBottom]);

  // Foco automático na busca quando ativada
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Marcar como visto quando houver novas mensagens
  useEffect(() => {
    if (isOpen && chatStore.messages && chatStore.messages.length > 0) {
      const lastMessage = chatStore.messages[chatStore.messages.length - 1];
      if (lastMessage.sender === 'client' && new Date(lastMessage.timestamp) > lastSeen) {
        setLastSeen(new Date());
      }
    }
  }, [chatStore.messages, isOpen, lastSeen]);

  // Limpar timeout de digitação
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Funções de controle da UI
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

  // Função para enviar mensagem - ATUALIZADA COM WEBHOOK V2
  const sendMessage = useCallback(async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    
    try {
      console.log('📤 Enviando mensagem:', { 
        content: messageText,
        isInternal: activeMode === 'internal',
        replyTo: replyingTo?.id 
      });

      // Preparar payload para webhook v2
      const webhookPayload: MessagePayload = {
        ticketId: ticketId,
        content: messageText.trim(),
        sender: 'agent',
        messageType: 'text',
        isInternal: activeMode === 'internal',
        metadata: {
          replyTo: replyingTo?.id,
          timestamp: new Date().toISOString(),
          source: 'unified-chat-modal'
        }
      };

      // Enviar via sistema original (se disponível)
      let originalSendPromise = Promise.resolve();
      if (typeof chatStore.send === 'function') {
        originalSendPromise = chatStore.send(ticketId, messageText.trim(), activeMode === 'internal');
      } else {
        console.warn('⚠️ Função send não disponível no chatStore');
      }

      // Enviar via webhook v2 (paralelo)
      const webhookV2SendPromise = webhookV2.sendMessage(webhookPayload);

      // Aguardar ambos os envios
      const [originalResult, webhookResult] = await Promise.allSettled([
        originalSendPromise,
        webhookV2SendPromise
      ]);

      // Log dos resultados
      if (originalResult.status === 'fulfilled') {
        console.log('✅ Mensagem enviada via sistema original');
      } else {
        console.error('❌ Falha no sistema original:', originalResult.reason);
      }

      if (webhookResult.status === 'fulfilled' && webhookResult.value.success) {
        console.log('✅ Mensagem processada via webhook v2');
      } else {
        console.warn('⚠️ Webhook v2 falhou ou indisponível');
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
      toast.success('Mensagem enviada', {
        description: webhookResult.status === 'fulfilled' && webhookResult.value.success 
          ? 'Processada pelos 2 sistemas' 
          : 'Salva localmente'
      });

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro no envio', {
        description: 'Tente novamente'
      });
    } finally {
      setIsSending(false);
    }
  }, [messageText, isSending, activeMode, replyingTo, ticketId, webhookV2, chatStore]);

  // Funções webhook v2
  const testWebhookV2 = useCallback(async () => {
    try {
      const result = await webhookV2.webhookService.testConnection();
      
      if (result.success) {
        toast.success('Webhook v2 funcionando!', {
          description: 'Conectividade testada com sucesso'
        });
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

  // Funções de mensagem
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
      console.log('📋 Mensagem copiada para área de transferência');
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

  // Controlar digitação
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

  // Função para inserir texto no input
  const setMessageTextWithTyping = useCallback((text: string) => {
    setMessageText(text);
    handleTyping();
  }, [handleTyping]);

  // Controle do emoji picker
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

  // Atalhos de teclado
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

      case e.ctrlKey && e.key === 'b':
        e.preventDefault();
        toggleSidebar();
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
  }, [isOpen, showEmojiPicker, showSearch, replyingTo, activeMode, onClose, toggleSearch, toggleSidebar, cancelReply, sendMessage]);

  // Outras funções úteis
  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const exportChat = useCallback(() => {
    const messages = chatStore.messages || [];
    if (messages.length === 0) return;

    const chatText = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleString();
      const sender = msg.sender === 'client' ? 'Cliente' : 'Agente';
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
  }, [chatStore.messages, ticketId]);

  const retryConnection = useCallback(() => {
    console.log('🔄 Tentando reconectar...');
    if (typeof chatStore.connect === 'function') {
      chatStore.connect();
    }
  }, [chatStore]);

  return {
    // Estado básico
    isLoading: chatStore.isLoading || false,
    error: chatStore.error || null,
    
    // Mensagens
    messages: chatStore.messages || [],
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
    retryConnection
  };
}; 