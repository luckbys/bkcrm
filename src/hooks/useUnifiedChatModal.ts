import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChatStore } from '../stores/chatStore';
import { ChatMessage } from '../types';

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
  const {
    connect,
    disconnect,
    joinTicket,
    sendMessage: storeSendMessage,
    messages,
    isConnected,
    isLoading,
    error,
    currentTicket
  } = useChatStore();

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

  // Mensagens filtradas por busca
  const filteredMessages = useMemo(() => {
    if (!searchTerm || !messages) return messages || [];
    
    const term = searchTerm.toLowerCase();
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(term) ||
      (msg.sender === 'client' ? 'cliente' : 'agente').includes(term)
    );
  }, [messages, searchTerm]);

  // Estatísticas das mensagens
  const messageStats = useMemo(() => {
    const msgs = messages || [];
    return {
      total: msgs.length,
      fromClient: msgs.filter(m => m.sender === 'client').length,
      fromAgent: msgs.filter(m => m.sender === 'agent' && !m.isInternal).length,
      internal: msgs.filter(m => m.isInternal).length,
      unread: msgs.filter(m => m.timestamp > lastSeen && m.sender === 'client').length
    };
  }, [messages, lastSeen]);

  // Status de conexão
  const connectionStatus = useMemo(() => {
    if (error) return 'error';
    if (isLoading) return 'connecting';
    if (isConnected) return 'connected';
    return 'disconnected';
  }, [isConnected, isLoading, error]);

  // Controle de exibição de mensagens não lidas
  const hasUnreadMessages = messageStats.unread > 0;

  // Número de resultados da busca
  const searchResultsCount = searchTerm ? filteredMessages.length : 0;

  // Conectar automaticamente quando o modal abrir
  useEffect(() => {
    if (isOpen && ticketId) {
      console.log('🔌 Conectando ao chat para ticket:', ticketId);
      connect();
      
      // Aguardar conexão antes de entrar no ticket
      if (isConnected) {
        joinTicket(ticketId);
      }
    } else if (!isOpen) {
      disconnect();
    }
  }, [isOpen, ticketId, isConnected, connect, disconnect, joinTicket]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (!showSearch && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, showSearch]);

  // Foco automático na busca quando ativada
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Marcar como visto quando houver novas mensagens
  useEffect(() => {
    if (isOpen && messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'client' && lastMessage.timestamp > lastSeen) {
        setLastSeen(new Date());
      }
    }
  }, [messages, isOpen, lastSeen]);

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

  // Função para enviar mensagem
  const sendMessage = useCallback(async () => {
    if (!messageText.trim() || isSending || !currentTicket) return;

    setIsSending(true);
    
    try {
      console.log('📤 Enviando mensagem:', { 
        content: messageText,
        isInternal: activeMode === 'internal',
        replyTo: replyingTo?.id 
      });

      await storeSendMessage({
        content: messageText.trim(),
        isInternal: activeMode === 'internal',
        replyTo: replyingTo?.id
      });

      // Limpar formulário
      setMessageText('');
      setReplyingTo(null);
      setShowEmojiPicker(false);
      
      // Focar novamente no input
      if (textareaRef.current) {
        textareaRef.current.focus();
      }

    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
    } finally {
      setIsSending(false);
    }
  }, [messageText, isSending, currentTicket, activeMode, replyingTo, storeSendMessage]);

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
    if (!messages || messages.length === 0) return;

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
  }, [messages, ticketId]);

  const retryConnection = useCallback(() => {
    console.log('🔄 Tentando reconectar...');
    connect();
  }, [connect]);

  return {
    // Estado básico
    isLoading,
    error,
    
    // Mensagens
    messages: messages || [],
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