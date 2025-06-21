import React, { useState, useCallback, useEffect } from 'react';
import { 
  Send, 
  Minimize2, 
  X, 
  Phone, 
  Mail, 
  User, 
  MessageSquare, 
  Paperclip, 
  Smile, 
  Search, 
  Star, 
  Settings, 
  Copy, 
  Reply, 
  Heart, 
  FileText, 
  Image, 
  Mic, 
  Info,
  Wifi,
  WifiOff,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useTicketChat } from '../../hooks/useTicketChat';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../hooks/useAuth';

interface TicketChatProps {
  ticket: any;
  onClose: () => void;
  onMinimize?: () => void;
}

/**
 * TicketChatRefactored - Componente de chat aprimorado com integração WebSocket Evolution API
 * 
 * MELHORIAS IMPLEMENTADAS:
 * 🔗 WebSocket Integration: Conexão em tempo real com servidor WebSocket na porta 4000
 * 📱 Evolution API: Integração completa para envio/recebimento de mensagens WhatsApp
 * 🔔 Notificações: Sistema de notificações push e toasts para novas mensagens
 * 📊 Status em Tempo Real: Indicadores visuais de conexão, latência e estatísticas
 * ⌨️ Indicador de Digitação: Feedback visual quando usuário está digitando
 * 🔊 Controles de Áudio: Toggle para ativar/desativar sons de notificação
 * 📈 Métricas de Performance: Monitoramento de latência e status da conexão
 * 🎨 UI/UX Aprimorada: Interface moderna com animações e feedback visual
 */
const TicketChatRefactored: React.FC<TicketChatProps> = ({ ticket, onClose, onMinimize }) => {
  // 🔧 DEBUG: Log do estado completo do chat
  console.log('🚀 [DEBUG] TicketChatRefactored renderizado:', {
    hasTicket: !!ticket,
    ticketId: ticket?.id,
    ticketTitle: ticket?.title || ticket?.subject,
    timestamp: new Date().toISOString()
  });

  // 🚀 INTEGRAÇÃO COM SISTEMA REAL DE MENSAGENS + WEBSOCKET EVOLUTION API
  const chatState = useTicketChat(ticket);
  const { toast } = useToast();
  const { user } = useAuth();

  // Estados locais para UX aprimorada
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 🔧 DEBUG: Log do estado do chatState
  console.log('🔧 [DEBUG] chatState completo:', {
    hasRealTimeMessages: !!chatState.realTimeMessages,
    messagesLength: chatState.realTimeMessages?.length || 0,
    isLoadingHistory: chatState.isLoadingHistory,
    isRealtimeConnected: chatState.isRealtimeConnected,
    connectionStatus: chatState.connectionStatus,
    currentTicket: chatState.currentTicket?.id || 'sem ticket'
  });

  // Templates de resposta rápida
  const quickTemplates = [
    { id: 1, title: 'Saudação', content: 'Olá! Como posso ajudá-lo hoje?', category: 'greeting' },
    { id: 2, title: 'Aguarde', content: 'Um momento, por favor. Estou verificando as informações...', category: 'status' },
    { id: 3, title: 'Informações', content: 'Preciso de algumas informações adicionais para melhor atendê-lo.', category: 'request' },
    { id: 4, title: 'Finalização', content: 'Obrigado por entrar em contato! Há mais alguma coisa em que posso ajudar?', category: 'closing' }
  ];

  // Emojis disponíveis
  const availableEmojis = ['👍', '❤️', '😊', '😢', '😮', '😡', '🎉', '👏', '🔥', '💯'];

  // 🚀 FUNÇÃO PARA OBTER INFORMAÇÕES DO CLIENTE (antes de usar em callbacks)
  const clientInfo = chatState.extractClientInfo(chatState.currentTicket);

  // 🔍 FUNÇÃO DE DIAGNÓSTICO PARA DEBUGAR MENSAGENS
  const debugMessageSystem = useCallback(() => {
    console.log('🔍 [DEBUG] === DIAGNÓSTICO DO SISTEMA DE MENSAGENS ===');
    console.log('📊 [DEBUG] Estatísticas:', {
      totalMessages: chatState.realTimeMessages.length,
      clientMessages: chatState.realTimeMessages.filter(m => m.sender === 'client').length,
      agentMessages: chatState.realTimeMessages.filter(m => m.sender === 'agent').length,
      internalMessages: chatState.realTimeMessages.filter(m => m.isInternal).length,
      connectionStatus: chatState.connectionStatus,
      isConnected: chatState.isRealtimeConnected
    });
    
    console.log('🎯 [DEBUG] Últimas 5 mensagens:', 
      chatState.realTimeMessages.slice(-5).map(msg => ({
        id: msg.id,
        content: msg.content.substring(0, 30) + '...',
        sender: msg.sender,
        senderName: msg.senderName,
        timestamp: msg.timestamp,
        isInternal: msg.isInternal
      }))
    );
    
    console.log('📱 [DEBUG] Informações do ticket:', {
      ticketId: chatState.currentTicket?.id,
      channel: chatState.currentTicket?.channel,
      isWhatsApp: clientInfo.isWhatsApp,
      clientName: clientInfo.clientName,
      clientPhone: clientInfo.clientPhone
    });
    
    toast({
      title: "🔍 Diagnóstico executado",
      description: `${chatState.realTimeMessages.length} mensagens total. Verifique o console.`,
      duration: 5000
    });
  }, [chatState, clientInfo, toast]);

  // Expor função de diagnóstico globalmente para debug
  useEffect(() => {
    (window as any).debugChatMessages = debugMessageSystem;
    return () => {
      delete (window as any).debugChatMessages;
    };
  }, [debugMessageSystem]);

  // 🚀 FUNÇÃO PARA OBTER NOME DO AGENTE LOGADO
  const getAgentName = useCallback(() => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Atendente';
  }, [user]);

  // 🚀 TODOS OS HOOKS useCallback ANTES DE QUALQUER RENDERIZAÇÃO CONDICIONAL
  // Funções de interação com mensagens
  const toggleStarMessage = useCallback((messageId: number) => {
    chatState.toggleMessageFavorite(messageId);
  }, [chatState]);

  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const replyToMessage = useCallback((messageId: number) => {
    const messageToReply = chatState.realTimeMessages.find(m => m.id === messageId);
    if (messageToReply) {
      chatState.setMessage(`@${messageToReply.senderName}: `);
    }
  }, [chatState]);

  const handleTemplateSelect = useCallback((template: any) => {
    chatState.setMessage(template.content);
    setShowTemplates(false);
  }, [chatState]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    chatState.setMessage(chatState.message + emoji);
    setShowEmojiPicker(false);
  }, [chatState]);

  // Filtrar mensagens baseado na busca
  const getFilteredMessages = useCallback(() => {
    // 🔧 DEBUG: Log para diagnosticar problema das mensagens
    console.log('🔍 [DEBUG] getFilteredMessages chamada:', {
      totalMessages: chatState.realTimeMessages.length,
      searchTerm: chatState.messageSearchTerm,
      isLoading: chatState.isLoadingHistory,
      isConnected: chatState.isRealtimeConnected,
      connectionStatus: chatState.connectionStatus,
      ticketId: ticket?.id || 'sem ticket',
      rawMessages: chatState.realTimeMessages.slice(0, 3) // Primeiras 3 mensagens
    });

    if (!chatState.messageSearchTerm) {
      console.log('🔍 [DEBUG] Retornando todas as mensagens:', chatState.realTimeMessages.length);
      return chatState.realTimeMessages;
    }
    
    const filtered = chatState.realTimeMessages.filter(msg => 
      msg.content.toLowerCase().includes(chatState.messageSearchTerm.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(chatState.messageSearchTerm.toLowerCase())
    );
    
    console.log('🔍 [DEBUG] Mensagens filtradas:', filtered.length);
    return filtered;
  }, [chatState.realTimeMessages, chatState.messageSearchTerm, chatState.isLoadingHistory, chatState.isRealtimeConnected, chatState.connectionStatus, ticket?.id]);

  // 🔄 FUNÇÕES DE INTEGRAÇÃO WEBSOCKET EVOLUTION API
  const handleTypingIndicator = useCallback((message: string) => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    setIsTyping(message.length > 0);
    
    if (message.length > 0) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 2000);
      setTypingTimeout(timeout);
    }
  }, [typingTimeout]);

  // Função aprimorada para obter status da conexão WebSocket
  const getConnectionStatus = useCallback(() => {
    if (!chatState.isRealtimeConnected) {
      return {
        status: 'disconnected',
        color: 'text-red-500',
        icon: WifiOff,
        text: 'Desconectado'
      };
    }
    
    if (chatState.connectionStatus === 'connecting') {
      return {
        status: 'connecting',
        color: 'text-yellow-500',
        icon: Activity,
        text: 'Conectando...'
      };
    }
    
    return {
      status: 'connected',
      color: 'text-green-500',
      icon: Wifi,
      text: 'Conectado'
    };
  }, [chatState.isRealtimeConnected, chatState.connectionStatus]);

  // Função para calcular latência da conexão
  const getConnectionLatency = useCallback(() => {
    if (!chatState.lastUpdateTime) return null;
    
    const now = new Date();
    const lastUpdate = new Date(chatState.lastUpdateTime);
    const diff = now.getTime() - lastUpdate.getTime();
    
    if (diff < 1000) return '<1s';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s`;
    return `${Math.floor(diff / 60000)}m`;
  }, [chatState.lastUpdateTime]);

  // 🚀 FUNÇÕES DAS AÇÕES RÁPIDAS
  const handleWhatsAppCall = useCallback(() => {
    if (clientInfo.isWhatsApp && clientInfo.clientPhone !== 'Telefone não informado') {
      const whatsappUrl = `https://wa.me/${clientInfo.clientPhone.replace(/\D/g, '')}`;
      window.open(whatsappUrl, '_blank');
      
      toast({
        title: "📱 WhatsApp aberto",
        description: `Chamada iniciada para ${clientInfo.clientPhoneFormatted}`,
        duration: 3000
      });
    }
  }, [clientInfo, toast]);

  const handleShowHistory = useCallback(() => {
    setShowHistoryModal(true);
    toast({
      title: "📋 Histórico completo",
      description: "Carregando histórico detalhado...",
      duration: 2000
    });
  }, [toast]);

  const handleAssignCustomer = useCallback(() => {
    // Esta função pode ser expandida para abrir um modal de seleção de cliente
    toast({
      title: "👤 Atribuir Cliente",
      description: "Funcionalidade em desenvolvimento",
      duration: 3000
    });
  }, [toast]);

  const handleExportChat = useCallback(() => {
    try {
      const chatData = {
        ticket: chatState.currentTicket,
        messages: chatState.realTimeMessages,
        client: clientInfo,
        exportDate: new Date().toISOString(),
        totalMessages: chatState.realTimeMessages.length,
        favorites: Array.from(chatState.favoriteMessages)
      };

      const blob = new Blob([JSON.stringify(chatData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-ticket-${chatState.currentTicket?.id}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "📥 Chat exportado",
        description: "Dados do chat salvos com sucesso",
        duration: 3000
      });
    } catch (error) {
      console.error('Erro ao exportar chat:', error);
      toast({
        title: "❌ Erro na exportação",
        description: "Não foi possível exportar o chat",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [chatState, clientInfo, toast]);

  // 🔔 EFEITO PARA NOTIFICAÇÕES DE NOVAS MENSAGENS VIA WEBSOCKET
  useEffect(() => {
    if (chatState.realTimeMessages.length > 0 && soundEnabled) {
      const lastMessage = chatState.realTimeMessages[chatState.realTimeMessages.length - 1];
      
      // Só notificar se a mensagem não é do usuário atual e é recente (menos de 5 segundos)
      const messageTime = new Date(lastMessage.timestamp || Date.now());
      const now = new Date();
      const timeDiff = now.getTime() - messageTime.getTime();
      
      if (timeDiff < 5000 && lastMessage.sender !== 'agent') {
        // Toast para mensagens de clientes
        toast({
          title: `📱 ${lastMessage.senderName || 'Cliente'}`,
          description: lastMessage.content.length > 60 
            ? lastMessage.content.substring(0, 60) + '...' 
            : lastMessage.content,
          duration: 4000,
        });
        
        // Som de notificação (se suportado pelo navegador)
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Nova mensagem de ${lastMessage.senderName || 'Cliente'}`, {
            body: lastMessage.content,
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, [chatState.realTimeMessages.length, soundEnabled, toast]);

  // 🔔 SOLICITAR PERMISSÃO PARA NOTIFICAÇÕES
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 🚀 RENDERIZAÇÃO CONDICIONAL APÓS TODOS OS HOOKS

  // Verificar se chat está carregado
  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Nenhum ticket selecionado</p>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // Loading state aprimorado com informações de conexão
  if (chatState.isLoadingHistory) {
    const connectionInfo = getConnectionStatus();
    
    return (
      <div className="flex items-center justify-center h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 max-w-md">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <h3 className="text-blue-700 font-bold text-lg mb-2">Carregando Chat</h3>
          <p className="text-blue-600 mb-4">Conectando com {chatState.currentTicket?.client || 'cliente'}</p>
          
          {/* Status da conexão WebSocket */}
          <div className="bg-white/50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-center space-x-2">
              <connectionInfo.icon className={`w-4 h-4 ${connectionInfo.color}`} />
              <span className={`text-sm font-medium ${connectionInfo.color}`}>
                {connectionInfo.text}
              </span>
            </div>
            
            {chatState.lastUpdateTime && (
              <p className="text-xs text-blue-500 mt-1">
                Última atualização: {getConnectionLatency()} atrás
              </p>
            )}
          </div>
          
          {/* Informações do ticket */}
          {clientInfo.isWhatsApp && (
            <div className="bg-green-100 rounded-lg p-2 text-green-700 text-sm">
              📱 Chat WhatsApp • Evolution API
            </div>
          )}
        </div>
      </div>
    );
  }

  // Funções de utilidade
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'atendimento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'finalizado': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp': return '📱';
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'web': return '🌐';
      default: return '💬';
    }
  };

  const formatTime = (date: Date | string | number) => {
    try {
      // Converter para Date se necessário
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // Verificar se é uma data válida
      if (isNaN(dateObj.getTime())) {
        return 'Agora';
      }
      
      return dateObj.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.warn('⚠️ Erro ao formatar timestamp:', { date, error });
      return 'Agora';
    }
  };

  return (
    <div className="chat-container flex h-full w-full bg-gray-50 overflow-hidden">
      {/* Chat Principal */}
      <div className={`chat-main-content flex flex-col bg-white transition-all duration-300 h-full overflow-hidden ${
        chatState.showSidebar ? 'flex-1 min-w-0' : 'w-full'
      }`}>
        {/* Header - Altura fixa */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Informações do Cliente */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{clientInfo.clientName}</h3>
                <p className="text-gray-500 text-sm flex items-center space-x-2">
                  <span>{getChannelIcon(chatState.currentTicket?.channel)} {chatState.currentTicket?.channel || 'Chat'}</span>
                  {clientInfo.isWhatsApp && (
                    <span className="text-green-600 text-xs font-medium">• WhatsApp</span>
                  )}
                  <span className={`w-2 h-2 rounded-full ${chatState.isRealtimeConnected ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                  <span className="text-xs">{chatState.isRealtimeConnected ? 'Online' : 'Conectando...'}</span>
                </p>
              </div>
            </div>

            {/* Controles do Header */}
            <div className="flex items-center space-x-2">
              {/* Indicador de conexão WebSocket */}
              <div className="flex items-center space-x-1 bg-gray-50 rounded-lg px-2 py-1">
                {(() => {
                  const connectionInfo = getConnectionStatus();
                  return (
                    <>
                      <connectionInfo.icon className={`w-3 h-3 ${connectionInfo.color}`} />
                      <span className="text-xs text-gray-600">{connectionInfo.text}</span>
                      {chatState.lastUpdateTime && (
                        <span className="text-xs text-gray-400">({getConnectionLatency()})</span>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* Barra de Busca */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar mensagens..."
                  value={chatState.messageSearchTerm}
                  onChange={(e) => chatState.setMessageSearchTerm(e.target.value)}
                  className={`bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                    chatState.showSidebar ? 'w-32 lg:w-40' : 'w-48 lg:w-64'
                  }`}
                />
                <Search className="absolute right-2 top-2 w-4 h-4 text-gray-400" />
              </div>
              
              {/* Botões de Ação */}
              <button 
                onClick={chatState.toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                title="Informações do ticket"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {onMinimize && (
                <button 
                  onClick={onMinimize}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                  title="Minimizar"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-red-500"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Informações do Ticket */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-600">
              <span className="font-medium">#{chatState.currentTicket?.id}</span>
              <span>{chatState.currentTicket?.subject || chatState.currentTicket?.title || 'Atendimento Geral'}</span>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(chatState.currentTicket?.status)}`}>
              {chatState.currentTicket?.status || 'Ativo'}
            </div>
          </div>

          {/* Indicador de digitação minimalista */}
          {isTyping && (
            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-1">
              <span>Digitando</span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Área de Mensagens */}
        <div className="chat-messages-area flex-1 p-4 overflow-y-auto bg-gray-50 min-h-0">
          <div className={`space-y-4 mx-auto transition-all duration-300 ${
            chatState.showSidebar ? 'max-w-2xl' : 'max-w-4xl'
          }`}>
            {/* Estado vazio */}
            {getFilteredMessages().length === 0 && !chatState.isLoadingHistory && (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {chatState.messageSearchTerm ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem ainda'}
                </h3>
                <p className="text-gray-600">
                  {chatState.messageSearchTerm 
                    ? 'Tente ajustar sua busca para encontrar mensagens.'
                    : 'Inicie a conversa enviando uma mensagem.'
                  }
                </p>
              </div>
            )}

            {/* 🔧 DEBUG: Log antes da renderização */}
            {(() => {
              const messages = getFilteredMessages();
              console.log('📋 [DEBUG] Renderizando mensagens:', {
                total: messages.length,
                ticket: ticket?.id,
                loading: chatState.isLoadingHistory,
                connected: chatState.isRealtimeConnected,
                firstMessages: messages.slice(0, 2).map(m => ({
                  id: m.id,
                  content: m.content?.substring(0, 30) + '...',
                  sender: m.sender
                }))
              });
              return null;
            })()}

            {/* Mensagens REAIS do sistema com separação visual MINIMALISTA E SOFISTICADA */}
            {getFilteredMessages().map((msg, index) => {
              // Verificação de segurança para evitar erros
              if (!msg || !msg.id) {
                return null;
              }

              // 🎯 LÓGICA CORRETA PARA IDENTIFICAR REMETENTE
              const isFromAgent = msg.sender === 'agent';
              const isFromClient = msg.sender === 'client';
              const isInternalNote = msg.isInternal;

              // Verificar se deve mostrar separador temporal
              const previousMsg = index > 0 ? getFilteredMessages()[index - 1] : null;
              const currentTime = new Date(msg.timestamp || Date.now());
              const previousTime = previousMsg ? new Date(previousMsg.timestamp || Date.now()) : null;
              const showTimeSeparator = previousTime && (currentTime.getTime() - previousTime.getTime()) > 300000; // 5 minutos

              return (
                <React.Fragment key={msg.id}>
                  {/* Separador temporal minimalista */}
                  {showTimeSeparator && (
                    <div className="flex items-center justify-center my-8">
                      <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full font-medium">
                        {formatTime(currentTime)}
                      </div>
                    </div>
                  )}

                  {/* 🎨 CONTAINER DA MENSAGEM MINIMALISTA */}
                  <div className={`flex mb-4 group ${
                    isInternalNote 
                      ? 'justify-center' 
                      : isFromAgent 
                        ? 'justify-end pl-12' 
                        : 'justify-start pr-12'
                  }`}>
                    
                    {/* 👤 AVATAR MINIMALISTA DO CLIENTE */}
                    {isFromClient && !isInternalNote && (
                      <div className="flex-shrink-0 mr-3 flex flex-col items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                          {clientInfo.clientName?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                      </div>
                    )}

                    {/* 💬 BALÃO DA MENSAGEM SOFISTICADO */}
                    <div className={`relative transition-all duration-200 ${
                      isInternalNote ? 'max-w-2xl' : 'max-w-md'
                    }`}>
                      
                      {/* 🔒 NOTA INTERNA MINIMALISTA */}
                      {isInternalNote ? (
                        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-4 shadow-sm">
                          <div className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-amber-600 text-xs">🔒</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-amber-700 mb-1">
                                {getAgentName()} • Nota interna
                              </div>
                              <p className="text-sm text-amber-900 leading-relaxed message-text-break">
                                {msg.content || 'Mensagem sem conteúdo'}
                              </p>
                              <div className="text-xs text-amber-600 mt-2">
                                {formatTime(msg.timestamp || new Date())}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* 💬 MENSAGENS NORMAIS MINIMALISTAS */
                        <div className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden ${
                          isFromAgent 
                            ? 'bg-blue-500 text-white ml-auto' 
                            : 'bg-white border border-gray-200 text-gray-800'
                        }`}>
                          
                          {/* Nome do remetente discreto */}
                          <div className={`text-xs mb-1 font-medium ${
                            isFromAgent 
                              ? 'text-blue-100' 
                              : 'text-gray-500'
                          }`}>
                            {isFromAgent 
                              ? getAgentName()
                              : (msg.senderName || clientInfo.clientName || 'Cliente')
                            }
                            {clientInfo.isWhatsApp && isFromClient && (
                              <span className="ml-2 text-green-600">via WhatsApp</span>
                            )}
                          </div>
                          
                          {/* Conteúdo da mensagem */}
                          <p className={`text-sm leading-relaxed message-text-break ${
                            isFromAgent ? 'text-white' : 'text-gray-800'
                          }`}>
                            {msg.content || 'Mensagem sem conteúdo'}
                          </p>
                          
                          {/* Timestamp discreto */}
                          <div className={`text-xs mt-2 flex items-center justify-between ${
                            isFromAgent 
                              ? 'text-blue-100' 
                              : 'text-gray-400'
                          }`}>
                            <span>{formatTime(msg.timestamp || new Date())}</span>
                            {isFromAgent && (
                              <span className="text-blue-200">✓</span>
                            )}
                          </div>

                          {/* Indicador de favorito minimalista */}
                          {chatState.favoriteMessages.has(msg.id) && (
                            <div className="absolute -top-1 -right-1">
                              <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                <Star className="w-2 h-2 text-white fill-current" />
                              </div>
                            </div>
                          )}

                          {/* Ações no hover minimalistas */}
                          <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex space-x-1">
                            <button 
                              onClick={() => toggleStarMessage(msg.id)}
                              className={`p-1.5 hover:bg-gray-50 rounded transition-colors ${
                                chatState.favoriteMessages.has(msg.id) ? 'text-yellow-500' : 'text-gray-400'
                              }`}
                              title="Favoritar"
                            >
                              <Star className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => copyMessage(msg.content)}
                              className="p-1.5 hover:bg-gray-50 rounded transition-colors text-gray-400"
                              title="Copiar"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => replyToMessage(msg.id)}
                              className="p-1.5 hover:bg-gray-50 rounded transition-colors text-gray-400"
                              title="Responder"
                            >
                              <Reply className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 👨‍💼 AVATAR MINIMALISTA DO AGENTE */}
                    {isFromAgent && !isInternalNote && (
                      <div className="flex-shrink-0 ml-3 flex flex-col items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                          {getAgentName()?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Área de Input - Altura fixa */}
        <div className="chat-input-area border-t bg-white p-4 flex-shrink-0 relative z-10">
          <div className={`mx-auto transition-all duration-300 ${
            chatState.showSidebar ? 'max-w-2xl' : 'max-w-4xl'
          }`}>
            {/* Templates de Resposta Rápida */}
            {showTemplates && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Templates de Resposta</h4>
                <div className="grid grid-cols-2 gap-2">
                  {quickTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-800">{template.title}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">{template.content}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Picker de Emoji */}
            {showEmojiPicker && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Emojis</h4>
                <div className="flex flex-wrap gap-2">
                  {availableEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-lg hover:scale-110 transition-transform p-2 rounded-lg hover:bg-white"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Barra de ferramentas */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                {/* Toggle para nota interna */}
                <div className="flex items-center space-x-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={chatState.isInternal}
                      onChange={(e) => chatState.setIsInternal(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    <span className={`ml-2 text-sm font-medium ${chatState.isInternal ? 'text-blue-600' : 'text-gray-600'}`}>
                      {chatState.isInternal ? 'Nota interna' : 'Resposta pública'}
                    </span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`p-2 rounded-lg transition-colors ${
                      showTemplates ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'
                    }`}
                    title="Templates"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 rounded-lg transition-colors ${
                      showEmojiPicker ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-500'
                    }`}
                    title="Emojis"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500" title="Anexar arquivo">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500" title="Gravar áudio">
                    <Mic className="w-4 h-4" />
                  </button>
                  
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-500" title="Imagem">
                    <Image className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-400">
                {chatState.message.length}/1000 • {chatState.message.split(' ').filter(w => w.trim()).length} palavras
                {chatState.isSending && <span className="ml-2 text-blue-500">Enviando...</span>}
              </div>
            </div>

            {/* Input principal */}
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={chatState.message}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    chatState.setMessage(newValue);
                    handleTypingIndicator(newValue);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      chatState.handleSendMessage();
                    }
                  }}
                  placeholder={chatState.isInternal ? "Digite uma nota interna..." : "Digite sua mensagem..."}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none min-h-[48px] max-h-32 transition-all duration-200"
                  rows={1}
                  disabled={chatState.isSending}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                />
                
                {/* Indicador de caracteres minimalista */}
                {chatState.message.length > 800 && (
                  <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded-full ${
                    chatState.message.length > 950 
                      ? 'bg-red-50 text-red-600' 
                      : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {1000 - chatState.message.length}
                  </div>
                )}
              </div>
              
              {/* Botão de envio minimalista */}
              <button
                onClick={chatState.handleSendMessage}
                disabled={!chatState.message.trim() || chatState.isSending}
                className={`${
                  chatState.isInternal 
                    ? 'bg-amber-500 hover:bg-amber-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } disabled:bg-gray-300 text-white p-3 rounded-xl transition-all shadow-sm hover:shadow-md disabled:cursor-not-allowed flex items-center justify-center min-w-[48px]`}
              >
                {chatState.isSending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Atalhos de teclado discretos */}
            <div className="mt-2 text-xs text-gray-400 text-center">
              <span className="inline-flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Enter</kbd>
                <span>Enviar</span>
                <span className="mx-2">•</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Shift + Enter</kbd>
                <span>Nova linha</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {chatState.showSidebar && (
        <>
          {/* Overlay para mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={chatState.toggleSidebar}
          ></div>
          
          {/* Sidebar */}
          <div className="chat-sidebar w-80 bg-white border-l border-gray-200 flex flex-col relative z-50 lg:relative lg:z-auto transition-all duration-300 fixed right-0 top-0 h-full lg:static lg:h-auto flex-shrink-0">
            {/* Header da Sidebar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-800">Informações</h3>
                </div>
                <button
                  onClick={chatState.toggleSidebar}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Conteúdo da Sidebar */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Informações do Cliente */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Cliente
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {clientInfo.clientName?.charAt(0) || 'C'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{clientInfo.clientName}</p>
                      <p className="text-xs text-gray-500">
                        {chatState.isRealtimeConnected ? 'Online' : 'Conectando...'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    {clientInfo.clientPhone !== 'Telefone não informado' && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-3 h-3 mr-2" />
                        <span>{clientInfo.clientPhoneFormatted}</span>
                        {clientInfo.isWhatsApp && (
                          <span className="ml-2 bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs">
                            📱 WhatsApp
                          </span>
                        )}
                      </div>
                    )}
                    {chatState.currentTicket?.customerEmail && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-3 h-3 mr-2" />
                        <span>{chatState.currentTicket.customerEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detalhes do Ticket */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Detalhes
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">ID</label>
                    <p className="font-medium">#{chatState.currentTicket?.id}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Assunto</label>
                    <p className="font-medium">{chatState.currentTicket?.subject || chatState.currentTicket?.title || 'Atendimento Geral'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Canal</label>
                    <div className="flex items-center space-x-2">
                      <span>{getChannelIcon(chatState.currentTicket?.channel)}</span>
                      <span className="font-medium">{chatState.currentTicket?.channel || 'Chat'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Status</label>
                    <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(chatState.currentTicket?.status)}`}>
                      {chatState.currentTicket?.status || 'Ativo'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">Última atualização</label>
                    <p className="font-medium">
                      {chatState.lastUpdateTime ? formatTime(chatState.lastUpdateTime) : 'Agora'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estatísticas do Chat */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Estatísticas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 uppercase tracking-wide">Mensagens</p>
                    <p className="text-lg font-bold text-blue-700">{chatState.realTimeMessages.length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 uppercase tracking-wide">Favoritas</p>
                    <p className="text-lg font-bold text-green-700">
                      {chatState.favoriteMessages.size}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 uppercase tracking-wide">Internas</p>
                    <p className="text-lg font-bold text-purple-700">
                      {chatState.realTimeMessages.filter(m => m.isInternal).length}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    chatState.isRealtimeConnected ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <p className={`text-xs uppercase tracking-wide ${
                      chatState.isRealtimeConnected ? 'text-green-600' : 'text-red-600'
                    }`}>WebSocket</p>
                    <p className={`text-lg font-bold ${
                      chatState.isRealtimeConnected ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {chatState.isRealtimeConnected ? 'Conectado' : 'Desconectado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Ações Rápidas</h4>
                <div className="space-y-2">
                  {clientInfo.isWhatsApp && clientInfo.clientPhone !== 'Telefone não informado' && (
                    <button 
                      onClick={handleWhatsAppCall}
                      className="w-full text-left p-2 hover:bg-green-50 rounded-lg transition-colors flex items-center space-x-2 border border-green-200"
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">Chamar no WhatsApp</span>
                    </button>
                  )}
                  <button 
                    onClick={handleAssignCustomer}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Atribuir Cliente</span>
                  </button>
                  <button 
                    onClick={handleShowHistory}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <MessageSquare className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Histórico Completo</span>
                  </button>
                  <button 
                    onClick={handleExportChat}
                    className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Exportar Chat</span>
                  </button>
                  <button 
                    onClick={chatState.refreshMessages}
                    className="w-full text-left p-2 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Settings className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Atualizar Mensagens</span>
                  </button>
                  
                  <button 
                    onClick={debugMessageSystem}
                    className="w-full text-left p-2 hover:bg-orange-50 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Diagnóstico de Mensagens</span>
                  </button>
                  
                  {/* Controles de áudio */}
                  <button 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-full text-left p-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2 ${
                      soundEnabled ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span className="text-sm">{soundEnabled ? 'Som Ativado' : 'Som Desativado'}</span>
                  </button>
                  
                  {/* Informações de conexão detalhadas */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="font-medium text-gray-700 mb-2">Conexão WebSocket</h5>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={chatState.isRealtimeConnected ? 'text-green-600' : 'text-red-600'}>
                          {chatState.connectionStatus}
                        </span>
                      </div>
                      {chatState.lastUpdateTime && (
                        <div className="flex justify-between">
                          <span>Última atualização:</span>
                          <span>{getConnectionLatency()} atrás</span>
                        </div>
                      )}
                      {clientInfo.isWhatsApp && (
                        <div className="flex justify-between">
                          <span>Evolution API:</span>
                          <span className="text-green-600">Integrado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de Histórico */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Histórico Completo do Chat</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              <div className="space-y-4">
                {/* Estatísticas do histórico */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{chatState.realTimeMessages.length}</p>
                    <p className="text-sm text-blue-600">Total de Mensagens</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {chatState.realTimeMessages.filter(m => m.sender === 'client').length}
                    </p>
                    <p className="text-sm text-green-600">Do Cliente</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {chatState.realTimeMessages.filter(m => m.sender === 'agent').length}
                    </p>
                    <p className="text-sm text-purple-600">Do Atendente</p>
                  </div>
                </div>

                {/* Lista de mensagens */}
                <div className="space-y-2">
                  {chatState.realTimeMessages.map((msg, index) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-lg border ${
                        msg.sender === 'agent' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          msg.sender === 'agent' ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {msg.sender === 'agent' ? (msg.senderName || getAgentName()) : (msg.senderName || clientInfo.clientName || 'Cliente')}
                          {msg.isInternal && (
                            <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                              PRIVADA
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(msg.timestamp || new Date())}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border-t bg-gray-50">
              <span className="text-sm text-gray-600">
                Ticket #{chatState.currentTicket?.id} • {clientInfo.isWhatsApp ? '📱 WhatsApp' : '💬 Chat'}
              </span>
              <button
                onClick={handleExportChat}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Exportar Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketChatRefactored; 