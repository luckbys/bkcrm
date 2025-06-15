import React, { useRef, useEffect } from 'react';
import { Check, CheckCheck, MessageCircle, Loader2, Eye, Star, StarOff, Copy, Reply } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { LocalMessage, UseTicketChatReturn } from '../../../types/ticketChat';

interface TicketChatMessagesProps {
  chatState: UseTicketChatReturn;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

export const TicketChatMessages: React.FC<TicketChatMessagesProps> = ({
  chatState,
  textareaRef
}) => {
  const {
    realTimeMessages: messages,
    messageSearchTerm: searchTerm,
    isLoadingHistory: isLoading,
    favoriteMessages,
    toggleMessageFavorite,
    autoScrollEnabled: autoScroll,
    compactMode
  } = chatState;

  // Funções auxiliares
  const onToggleFavorite = (messageId: string) => {
    const numericId = parseInt(messageId);
    if (!isNaN(numericId)) {
      toggleMessageFavorite(numericId);
    }
  };

  const onCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const onReplyToMessage = (message: LocalMessage) => {
    // Implementar lógica de resposta se necessário
    console.log('Responder à mensagem:', message);
  };
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index.toString()} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : <span key={index.toString()}>{part}</span>
    );
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Carregando mensagens...</span>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Nenhuma mensagem ainda</h3>
        <p className="text-sm text-center max-w-sm">
          Inicie a conversa enviando uma mensagem
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => {
        const messageId = typeof message.id === 'number' ? message.id : parseInt(String(message.id));
        const isFavorite = favoriteMessages.has(messageId);
        const isAgent = message.sender === 'agent';
        const isInternal = message.type === 'internal';

        return (
          <div
            key={messageId.toString()}
            className={cn(
              "group relative transition-all duration-200 hover:scale-[1.02]",
              isAgent ? "flex justify-end" : "flex justify-start"
            )}
          >
            {/* Ring visual para mensagens favoritas */}
            {isFavorite && (
              <div className="absolute inset-0 rounded-lg ring-2 ring-yellow-400 ring-opacity-50 pointer-events-none" />
            )}

            <div
              className={cn(
                "max-w-[70%] rounded-lg shadow-sm transition-all duration-200",
                compactMode ? "px-3 py-2" : "px-4 py-3",
                isAgent
                  ? isInternal
                    ? "bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"
                    : "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
                "hover:shadow-md"
              )}
            >
              {/* Header da mensagem */}
              <div className={cn(
                "flex items-center justify-between mb-1",
                compactMode ? "text-xs" : "text-sm"
              )}>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-medium",
                    isAgent
                      ? isInternal
                        ? "text-orange-700 dark:text-orange-300"
                        : "text-white"
                      : "text-gray-900 dark:text-gray-100"
                  )}>
                    {isAgent ? (isInternal ? 'Nota Interna' : 'Agente') : 'Cliente'}
                  </span>
                  {isInternal && (
                    <Eye className="w-3 h-3 text-orange-500" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-xs",
                    isAgent && !isInternal ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                  )}>
                    {compactMode 
                      ? new Date(message.timestamp).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : new Date(message.timestamp).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                    }
                  </span>
                  {isAgent && getMessageStatusIcon(message.status || 'sent')}
                </div>
              </div>

              {/* Conteúdo da mensagem */}
              <div className={cn(
                "whitespace-pre-wrap break-words",
                compactMode ? "text-sm" : "text-base",
                isAgent && !isInternal ? "text-white" : "text-gray-900 dark:text-gray-100"
              )}>
                {highlightText(message.content, searchTerm)}
              </div>

              {/* Ações hover */}
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <button
                  onClick={() => onToggleFavorite(messageId.toString())}
                  className={cn(
                    "p-1 rounded-full shadow-sm transition-colors duration-200",
                    isFavorite
                      ? "bg-yellow-400 text-white hover:bg-yellow-500"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  )}
                  title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  {isFavorite ? (
                    <Star className="w-3 h-3 fill-current" />
                  ) : (
                    <StarOff className="w-3 h-3" />
                  )}
                </button>

                <button
                  onClick={() => onCopyMessage(message.content)}
                  className="p-1 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors duration-200"
                  title="Copiar mensagem"
                >
                  <Copy className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onReplyToMessage(message)}
                  className="p-1 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors duration-200"
                  title="Responder"
                >
                  <Reply className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}; 