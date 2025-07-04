import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useChatStore } from '../stores/chatStore';
export const useUnifiedChatModal = ({ ticketId, isOpen, onClose, onMinimize }) => {
    // Store do chat
    const { connect, disconnect, joinTicket, sendMessage: storeSendMessage, messages, isConnected, isLoading, error, currentTicket, addMessage } = useChatStore();
    // Estados locais da UI
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [modalSize, setModalSizeState] = useState('normal');
    const [activeMode, setActiveMode] = useState('message');
    const [messageText, setMessageText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [favoriteMessages, setFavoriteMessages] = useState(new Set());
    const [lastSeen, setLastSeen] = useState(new Date());
    // Refs
    const messagesEndRef = useRef(null);
    const searchInputRef = useRef(null);
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    // Mensagens filtradas por busca
    const filteredMessages = useMemo(() => {
        if (!searchTerm || !messages)
            return messages || [];
        const term = searchTerm.toLowerCase();
        return messages.filter(msg => msg.content.toLowerCase().includes(term) ||
            (msg.sender === 'client' ? 'cliente' : 'agente').includes(term));
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
        if (error)
            return 'error';
        if (isLoading)
            return 'connecting';
        if (isConnected)
            return 'connected';
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
        }
        else if (!isOpen) {
            disconnect();
        }
    }, [isOpen, ticketId, isConnected, connect, disconnect, joinTicket]);
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
    const setModalSize = useCallback((size) => {
        setModalSizeState(size);
    }, []);
    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setShowSearch(false);
    }, []);
    // Função para enviar mensagem
    const sendMessage = useCallback(async () => {
        if (!messageText.trim() || isSending || !currentTicket)
            return;
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
        }
        catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
        }
        finally {
            setIsSending(false);
        }
    }, [messageText, isSending, currentTicket, activeMode, replyingTo, storeSendMessage]);
    // Funções de mensagem
    const replyToMessage = useCallback((message) => {
        setReplyingTo(message);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);
    const cancelReply = useCallback(() => {
        setReplyingTo(null);
    }, []);
    const copyMessage = useCallback((content) => {
        navigator.clipboard.writeText(content).then(() => {
            console.log('📋 Mensagem copiada para área de transferência');
        });
    }, []);
    const favoriteMessage = useCallback((messageId) => {
        setFavoriteMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            }
            else {
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
    const setMessageTextWithTyping = useCallback((text) => {
        setMessageText(text);
        handleTyping();
    }, [handleTyping]);
    // Controle do emoji picker
    const toggleEmojiPicker = useCallback(() => {
        setShowEmojiPicker(prev => !prev);
    }, []);
    const insertEmoji = useCallback((emoji) => {
        setMessageText(prev => prev + emoji);
        setShowEmojiPicker(false);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);
    // Atalhos de teclado
    const handleKeyboardShortcuts = useCallback((e) => {
        if (!isOpen)
            return;
        switch (true) {
            case e.key === 'Escape':
                e.preventDefault();
                if (showEmojiPicker) {
                    setShowEmojiPicker(false);
                }
                else if (showSearch) {
                    toggleSearch();
                }
                else if (replyingTo) {
                    cancelReply();
                }
                else {
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
    const scrollToMessage = useCallback((messageId) => {
        const element = document.querySelector(`[data-message-id="${messageId}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, []);
    const exportChat = useCallback(() => {
        if (!messages || messages.length === 0)
            return;
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
    const handleNewMessage = useCallback((message) => {
        console.log('🔔 [UNIFIED-CHAT-HOOK] Nova mensagem recebida:', {
            ticketId: message.ticket_id,
            sender: message.sender,
            isFromClient: message.metadata?.is_from_client,
            content: message.content?.substring(0, 50),
            metadata: message.metadata
        });
        if (!message || !message.ticket_id) {
            console.warn('⚠️ [UNIFIED-CHAT-HOOK] Mensagem inválida:', message);
            return;
        }
        // Processar a mensagem
        const processedMessage = {
            ...message,
            sender: message.sender || (message.metadata?.is_from_client ? 'client' : 'agent'),
            senderName: message.sender_name || (message.sender === 'client' ? 'Cliente' : 'Agente')
        };
        console.log('✅ [UNIFIED-CHAT-HOOK] Mensagem processada:', {
            ticketId: processedMessage.ticket_id,
            sender: processedMessage.sender,
            senderName: processedMessage.senderName
        });
        addMessage(processedMessage);
    }, [addMessage]);
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
