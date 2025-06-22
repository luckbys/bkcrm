// 🪟 COMPONENTE PRINCIPAL DE CHAT COM WEBSOCKET
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { ChatHeader } from './ChatHeader';
import { MessageItem } from './MessageItem';
import { ChatInputEnhanced } from './ChatInputEnhanced';
import { ConnectionStatus } from './ConnectionStatus';
import { useChatSocket } from '../../hooks/useChatSocket';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../lib/utils';

interface ChatWindowProps {
  ticketId: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  ticketId,
  isOpen,
  onClose,
  className
}) => {
  const {
    messages,
    typingUsers,
    cannedResponses,
    isConnected,
    connectionError,
    isLoading,
    isSending,
    handleJoinTicket,
    handleLeaveTicket,
    handleSendMessage,
    handleTypingStart,
    handleTypingStop,
    getConnectionStatus,
    getChatStats
  } = useChatSocket();

  const [user] = useState({ id: 'current-user', name: 'Atendente' }); // Mock user

  // 🎯 Entrar no ticket quando o modal abrir
  useEffect(() => {
    if (isOpen && ticketId) {
      handleJoinTicket(ticketId);
    }

    return () => {
      if (ticketId) {
        handleLeaveTicket();
      }
    };
  }, [isOpen, ticketId]);

  // 📊 Auto-scroll para a última mensagem
  useEffect(() => {
    const scrollToBottom = () => {
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    };

    // Pequeno delay para garantir que o DOM foi atualizado
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  const connectionStatus = getConnectionStatus();
  const chatStats = getChatStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-4xl h-[90vh] flex flex-col p-0 gap-0",
        className
      )}>
        {/* Título acessível (hidden) */}
        <DialogTitle className="sr-only">
          Chat do Ticket {ticketId}
        </DialogTitle>

        {/* 📱 Header do Chat */}
        <ChatHeader
          participant={{
            id: 'client-1',
            name: 'Cliente WhatsApp',
            email: 'cliente@whatsapp.com',
            phone: '+55 11 99999-9999',
            role: 'client',
            isOnline: true
          }}
          channel={{
            id: 'whatsapp-1',
            type: 'whatsapp',
            name: 'WhatsApp',
            isActive: true,
            settings: {
              allowFileUpload: true,
              allowVoiceMessages: true,
              allowEmojis: true,
              autoTranslate: false,
              notifications: true
            }
          }}
          state={{
            isLoading,
            isConnected,
            connectionStatus: connectionStatus.status,
            lastActivity: new Date(),
            unreadCount: 0,
            isTyping: typingUsers.length > 0,
            typingUsers: typingUsers.map(u => u.userId),
            error: connectionError
          }}
          onClose={onClose}
        />

        {/* 🔗 Status de Conexão */}
        {(!isConnected || connectionError) && (
          <div className="px-4 py-2 border-b">
            <ConnectionStatus
              isConnected={isConnected}
              connectionError={connectionError}
              lastActivity={new Date()}
              className="text-sm"
            />
          </div>
        )}

        {/* 💬 Área de Mensagens */}
        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Loading inicial */}
              {isLoading && messages.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Carregando mensagens...</span>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">Nenhuma mensagem ainda</h3>
                  <p className="text-sm text-center">
                    Inicie a conversa enviando uma mensagem para o cliente.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isCurrentUser = message.sender === 'agent' && message.senderId === user.id;
                    const prevMessage = messages[index - 1];
                    const showAvatar = !prevMessage || 
                      prevMessage.sender !== message.sender || 
                      prevMessage.isInternal !== message.isInternal;

                    return (
                      <MessageItem
                        key={message.id}
                        message={message}
                        isCurrentUser={isCurrentUser}
                        showAvatar={showAvatar}
                      />
                    );
                  })}
                </>
              )}

              {/* Indicador de digitação */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-sm text-gray-500">
                    {typingUsers.length === 1 ? 
                      `${typingUsers[0].userName} está digitando...` : 
                      `${typingUsers.length} pessoas estão digitando...`
                    }
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ⌨️ Área de Input */}
        <ChatInputEnhanced
          onSendMessage={handleSendMessage}
          onTypingStart={handleTypingStart}
          onTypingStop={handleTypingStop}
          cannedResponses={cannedResponses}
          isLoading={isLoading}
          isSending={isSending}
          placeholder="Digite sua mensagem..."
          maxLength={2000}
        />

        {/* 📊 Footer com Estatísticas (debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>
                Total: {chatStats.total} | Cliente: {chatStats.clientMessages} | 
                Agente: {chatStats.agentMessages} | Internas: {chatStats.internalNotes}
              </span>
              <span className={cn(
                "px-2 py-1 rounded",
                isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {isConnected ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 