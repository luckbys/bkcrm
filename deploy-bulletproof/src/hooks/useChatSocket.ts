// 🎣 HOOK PERSONALIZADO PARA WEBSOCKET DO CHAT
import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useAuth } from '../hooks/useAuth';
import { SocketTypingUser, SocketConnectionStatus, SocketChatStats } from '../types/chat';

// 🎯 Tipos locais para evitar conflitos de importação
export interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export interface ConnectionStatus {
  status: 'connected' | 'error' | 'connecting';
  text: string;
  color: string;
}

export interface ChatStats {
  total: number;
  clientMessages: number;
  agentMessages: number;
  internalNotes: number;
}

export const useChatSocket = () => {
  const {
    socket,
    isConnected,
    connectionError,
    initializeSocket,
    disconnectSocket,
    joinTicket,
    leaveTicket,
    sendMessage,
    loadMessages,
    startTyping,
    stopTyping,
    getCurrentMessages,
    getTypingUsers,
    loadCannedResponses,
    addCannedResponse,
    cannedResponses,
    isLoading,
    isSending,
    currentTicketId
  } = useChatStore();

  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔄 Inicializar conexão WebSocket ao montar o componente
  useEffect(() => {
    initializeSocket();

    // Cleanup ao desmontar
    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, disconnectSocket]);

  // 📝 Carregar respostas rápidas quando conectar
  useEffect(() => {
    if (isConnected) {
      loadCannedResponses();
    }
  }, [isConnected, loadCannedResponses]);

  // ⌨️ Gerenciar digitação com debounce
  const handleTypingStart = useCallback(() => {
    if (!user?.user_metadata?.name) return;

    startTyping(user.user_metadata.name);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [user, startTyping, stopTyping]);

  const handleTypingStop = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    stopTyping();
  }, [stopTyping]);

  // 📤 Enviar mensagem com tratamento de erro
  const handleSendMessage = useCallback(async (content: string, isInternal = false) => {
    if (!currentTicketId || !content.trim()) return;

    try {
      await sendMessage(currentTicketId, content, isInternal);
      handleTypingStop();
    } catch (error) {
      console.error('❌ [useChatSocket] Erro ao enviar mensagem:', error);
      throw error;
    }
  }, [currentTicketId, sendMessage, handleTypingStop]);

  // 🎯 Entrar em um ticket específico
  const handleJoinTicket = useCallback((ticketId: string) => {
    if (ticketId !== currentTicketId) {
      joinTicket(ticketId);
      loadMessages(ticketId);
    }
  }, [currentTicketId, joinTicket, loadMessages]);

  // 🚪 Sair do ticket atual
  const handleLeaveTicket = useCallback(() => {
    if (currentTicketId) {
      leaveTicket(currentTicketId);
    }
  }, [currentTicketId, leaveTicket]);

  // 🔗 Status da conexão formatado
  const getConnectionStatus = useCallback((): SocketConnectionStatus => {
    if (isConnected) return { status: 'connected', text: 'Conectado', color: 'green' };
    if (connectionError) return { status: 'error', text: 'Erro', color: 'red' };
    return { status: 'connecting', text: 'Conectando...', color: 'yellow' };
  }, [isConnected, connectionError]);

  // 📊 Estatísticas do chat
  const getChatStats = useCallback((): SocketChatStats => {
    const messages = getCurrentMessages();
    const total = messages.length;
    const clientMessages = messages.filter(m => m.sender === 'client').length;
    const agentMessages = messages.filter(m => m.sender === 'agent').length;
    const internalNotes = messages.filter(m => m.isInternal).length;

    return {
      total,
      clientMessages,
      agentMessages,
      internalNotes
    };
  }, [getCurrentMessages]);

  return {
    // Estados
    socket,
    isConnected,
    connectionError,
    isLoading,
    isSending,
    currentTicketId,

    // Mensagens
    messages: getCurrentMessages(),
    typingUsers: getTypingUsers(),

    // Respostas rápidas
    cannedResponses,

    // Ações
    handleJoinTicket,
    handleLeaveTicket,
    handleSendMessage,
    handleTypingStart,
    handleTypingStop,
    loadMessages,
    addCannedResponse,

    // Utilitários
    getConnectionStatus,
    getChatStats,

    // Eventos diretos (para casos específicos)
    initializeSocket,
    disconnectSocket
  };
}; 