// 🎣 HOOK PERSONALIZADO PARA WEBSOCKET DO CHAT
import { useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useAuth } from '../hooks/useAuth';

// 🎯 Tipos locais para evitar conflitos de importação
interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface ConnectionStatus {
  status: 'connected' | 'error' | 'connecting';
  text: string;
  color: string;
}

interface ChatStats {
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
  }, []);

  // 📝 Carregar respostas rápidas quando conectar
  useEffect(() => {
    if (isConnected) {
      loadCannedResponses();
    }
  }, [isConnected]);

  // ⌨️ Gerenciar digitação com debounce
  const handleTypingStart = () => {
    if (!user?.user_metadata?.name) return;

    startTyping(user.user_metadata.name);

    // Limpar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Parar digitação após 3 segundos
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    stopTyping();
  };

  // 📤 Enviar mensagem com tratamento de erro
  const handleSendMessage = async (content: string, isInternal = false) => {
    if (!currentTicketId || !content.trim()) return;

    try {
      await sendMessage(currentTicketId, content, isInternal);
      handleTypingStop(); // Parar digitação após enviar
    } catch (error) {
      console.error('❌ [useChatSocket] Erro ao enviar mensagem:', error);
      throw error;
    }
  };

  // 🎯 Entrar em um ticket específico
  const handleJoinTicket = (ticketId: string) => {
    if (ticketId !== currentTicketId) {
      joinTicket(ticketId);
      loadMessages(ticketId);
    }
  };

  // 🚪 Sair do ticket atual
  const handleLeaveTicket = () => {
    if (currentTicketId) {
      leaveTicket(currentTicketId);
    }
  };

  // 🔗 Status da conexão formatado
  const getConnectionStatus = (): ConnectionStatus => {
    if (isConnected) return { status: 'connected', text: 'Conectado', color: 'green' };
    if (connectionError) return { status: 'error', text: 'Erro', color: 'red' };
    return { status: 'connecting', text: 'Conectando...', color: 'yellow' };
  };

  // 📊 Estatísticas do chat
  const getChatStats = (): ChatStats => {
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
  };

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