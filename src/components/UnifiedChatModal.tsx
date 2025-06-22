import React, { useEffect, useCallback } from 'react';
import { evolutionService } from '../services/evolutionService';
import { ChatMessage } from '../types/chat';
import { useChatStore } from '../stores/chatStore';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface UnifiedChatModalProps {
  ticket: any; // Tipo será refinado depois
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

const UnifiedChatModal: React.FC<UnifiedChatModalProps> = ({ ticket, isOpen, onOpenChange }) => {
  const clientPhone = ticket ? evolutionService.extractPhoneFromTicket(ticket) : null;
  
  // Log detalhado do ticket recebido
  console.log('🎫 [CHAT] UnifiedChatModal recebeu ticket:', {
    ticket,
    ticketId: ticket?.id,
    ticketTitle: ticket?.subject || ticket?.title,
    ticketClient: ticket?.client,
    clientPhone,
    isOpen,
    ticketKeys: ticket ? Object.keys(ticket) : [],
    ticketStringified: JSON.stringify(ticket, null, 2)
  });
  
  // Usar chatStore
  const {
    isConnected,
    isLoading,
    isSending,
    messages,
    typingUsers,
    initializeSocket,
    joinTicket,
    leaveTicket,
    sendMessage,
    loadMessages,
    getCurrentMessages,
    getTypingUsers,
    connectionError
  } = useChatStore();

  // Log do estado do chat
  console.log('💬 [CHAT] Estado atual do chat:', {
    isConnected,
    isLoading,
    isSending,
    messagesCount: ticket?.id ? (messages[String(ticket.id)]?.length || 0) : 0,
    typingUsersCount: ticket?.id ? (typingUsers[String(ticket.id)]?.length || 0) : 0,
    connectionError,
    allMessages: Object.keys(messages),
    allTypingUsers: Object.keys(typingUsers)
  });
  
  // Verificar se o ticket tem informações válidas
  if (!ticket) {
    console.warn('⚠️ [CHAT] Ticket é null ou undefined');
  } else if (!ticket.id) {
    console.warn('⚠️ [CHAT] Ticket não tem ID:', ticket);
  }

  // Inicializar WebSocket uma única vez
  useEffect(() => {
    if (!isConnected) {
      console.log('🔄 [CHAT] Inicializando WebSocket...');
      initializeSocket();
    }
  }, [isConnected, initializeSocket]);

  // Entrar/sair do ticket
  useEffect(() => {
    const ticketId = ticket?.id ? String(ticket.id) : null;
    
    if (isOpen && ticketId && isConnected) {
      console.log(`🔗 [CHAT] Entrando no ticket ${ticketId}`);
      console.log(`📱 [CHAT] Telefone do cliente:`, clientPhone);
      console.log(`🔗 [CHAT] Status da conexão:`, {
        isConnected,
        isLoading,
        isSending,
        messages: messages[ticketId]?.length || 0,
        typingUsers: typingUsers[ticketId]?.length || 0
      });
      joinTicket(ticketId);
      
      // Carregar mensagens se não tiver nenhuma
      if (!messages[ticketId] || messages[ticketId].length === 0) {
        console.log(`📥 [CHAT] Carregando mensagens para ticket ${ticketId}`);
        loadMessages(ticketId).catch(error => {
          console.error(`❌ [CHAT] Erro ao carregar mensagens:`, error);
        });
      }
    }

    return () => {
      if (ticketId) {
        console.log(`🔌 [CHAT] Saindo do ticket ${ticketId}`);
        leaveTicket(ticketId);
      }
    };
  }, [isOpen, ticket?.id, isConnected, joinTicket, leaveTicket, loadMessages, messages]); // Adicionadas todas as dependências necessárias

  // Handler para enviar mensagem
  const handleSendMessage = useCallback(async (content: string, isInternal = false) => {
    const ticketId = ticket?.id ? String(ticket.id) : null;
    if (!ticketId || !content.trim()) return;
    
    try {
      await sendMessage(ticketId, content, isInternal);
    } catch (error) {
      console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
    }
  }, [ticket?.id, sendMessage]); // Simplificado para ticket?.id

  if (!ticket) {
    console.error('❌ [CHAT] Ticket não fornecido para UnifiedChatModal');
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="p-4 text-center">
            <h3 className="text-lg font-semibold text-red-600">Erro</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Nenhum ticket foi fornecido para o chat.
            </p>
            <button 
              onClick={() => onOpenChange(false)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Extrair informações do ticket de forma mais robusta
  const ticketInfo = {
    id: ticket.id,
    title: ticket.subject || ticket.title || ticket.client || `Ticket #${ticket.id}`,
    client: ticket.client || 'Cliente',
    phone: clientPhone,
    channel: ticket.channel || 'chat',
    status: ticket.status || 'pendente'
  };

  console.log('📋 [CHAT] Informações extraídas do ticket:', ticketInfo);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[80vh] flex flex-col p-0"
        aria-describedby="chat-description"
      >
        <div id="chat-description" className="sr-only">
          Chat com {ticketInfo.title} - {ticketInfo.phone || 'Sem telefone'}
        </div>
        
        <div className="flex flex-col h-full">
          {/* Header com número do cliente */}
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <span className="font-semibold text-lg">{ticketInfo.title}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  👤 {ticketInfo.client}
                </span>
                {ticketInfo.phone && (
                  <span className="text-sm text-muted-foreground">
                    📱 {ticketInfo.phone}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full ${
                  ticketInfo.channel === 'whatsapp' ? 'bg-green-100 text-green-800' :
                  ticketInfo.channel === 'email' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticketInfo.channel}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  ticketInfo.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                  ticketInfo.status === 'atendimento' ? 'bg-blue-100 text-blue-800' :
                  ticketInfo.status === 'finalizado' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticketInfo.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <span className="text-sm text-green-500 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="text-sm text-red-500 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  {connectionError || 'Offline'}
                </span>
              )}
            </div>
          </div>
          
          {/* Lista de mensagens */}
          <div 
            className="flex-1 overflow-y-auto p-4"
            role="log"
            aria-label="Histórico de mensagens"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-sm text-muted-foreground">Carregando mensagens...</p>
              </div>
            ) : (() => {
              const ticketId = ticket?.id ? String(ticket.id) : null;
              const ticketMessages = ticketId ? messages[ticketId] : [];
              
              return ticketMessages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>Nenhuma mensagem ainda</p>
                  <p className="text-sm">Comece a conversa enviando uma mensagem</p>
                </div>
              ) : (
                ticketMessages?.map((message: ChatMessage) => (
                  <div 
                    key={message.id} 
                    className={`mb-4 ${message.sender === 'agent' ? 'ml-auto' : 'mr-auto'} max-w-[70%]`}
                    role="article"
                  >
                    <div className={`rounded-lg p-3 ${
                      message.sender === 'agent' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <div className="message-content break-words">{message.content}</div>
                      <div className="mt-1 text-xs opacity-70 flex justify-between">
                        <span>{message.senderName}</span>
                        <span>{message.timestamp.toLocaleTimeString()}</span>
                        <span>{message.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              );
            })()}
          </div>
          
          {/* Input para nova mensagem */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <textarea 
                className="flex-1 min-h-[80px] p-2 rounded-md border resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Digite sua mensagem..."
                aria-label="Campo de mensagem"
                disabled={!isConnected || isSending}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <button
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  const input = document.querySelector('textarea');
                  if (input instanceof HTMLTextAreaElement) {
                    handleSendMessage(input.value);
                    input.value = '';
                  }
                }}
                disabled={!isConnected || isSending}
                aria-label="Enviar mensagem"
              >
                {isSending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedChatModal; 