import React, { useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils';
import { 
  MessageCircle, 
  Loader2, 
  Star, 
  StarOff, 
  Copy, 
  Reply, 
  Check, 
  CheckCheck,
  Eye,
  EyeOff,
  Lock,
  Shield,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { LocalMessage, UseTicketChatReturn } from '../../../types/ticketChat';
import { ChatAnimations, ResponsiveAnimations } from './chatAnimations';

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

  // Componente para mensagem interna com design especial
  const InternalMessageBubble: React.FC<{
    message: LocalMessage;
    messageId: number;
    isFavorite: boolean;
    compactMode: boolean;
    searchTerm: string;
  }> = ({ message, messageId, isFavorite, compactMode, searchTerm }) => {
    return (
      <div className={cn(
        "flex justify-center mb-4",
        ChatAnimations.chat.messageEnter,
        ResponsiveAnimations.prefersReducedMotion.disable
      )}>
        <div className="max-w-[85%] w-full">
          {/* Header especial para mensagem interna */}
          <div className="flex items-center justify-center mb-2">
            <div className={cn(
              "flex items-center gap-2 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 px-4 py-2 rounded-full border border-orange-200 dark:border-orange-700 shadow-sm",
              ChatAnimations.transition.colors
            )}>
              <Shield className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                NOTA INTERNA
              </span>
              <Lock className="w-3 h-3 text-orange-500" />
            </div>
          </div>

          {/* Container da mensagem interna */}
          <div className="group relative">
            {/* Ring visual para mensagens favoritas */}
            {isFavorite && (
              <div className={cn(
                "absolute inset-0 rounded-xl ring-2 ring-yellow-400 ring-opacity-50 pointer-events-none",
                ChatAnimations.enter.scale
              )} />
            )}

            <div className={cn(
              "relative rounded-xl shadow-lg backdrop-blur-sm",
              "bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50",
              "dark:from-orange-900/20 dark:via-amber-900/20 dark:to-yellow-900/20",
              "border-2 border-dashed border-orange-300 dark:border-orange-600",
              ChatAnimations.transition.hoverGlow,
              compactMode ? "px-4 py-3" : "px-6 py-4"
            )}>
              {/* Padrão de fundo sutil */}
              <div className="absolute inset-0 opacity-5">
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl" />
              </div>

              {/* Ícone de canto */}
              <div className="absolute top-3 right-3">
                <div className={cn(
                  "flex items-center gap-1 bg-orange-200/80 dark:bg-orange-800/80 px-2 py-1 rounded-full",
                  ChatAnimations.transition.opacity
                )}>
                  <EyeOff className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                    Privado
                  </span>
                </div>
              </div>

              {/* Header da mensagem */}
              <div className={cn(
                "flex items-center justify-between mb-3 pr-20",
                compactMode ? "text-xs" : "text-sm"
              )}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-sm">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-orange-800 dark:text-orange-200">
                        {message.senderName || 'Agente'}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                          Apenas para equipe
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
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
                </div>
              </div>

              {/* Conteúdo da mensagem */}
              <div className={cn(
                "relative z-10 whitespace-pre-wrap break-words leading-relaxed",
                compactMode ? "text-sm" : "text-base",
                "text-orange-900 dark:text-orange-100 font-medium"
              )}>
                {highlightText(message.content, searchTerm)}
              </div>

              {/* Footer com aviso */}
              <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <Shield className="w-3 h-3" />
                    <span className="font-medium">
                      Esta nota não é visível para o cliente
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-2 h-2 bg-orange-400 rounded-full",
                      ChatAnimations.loading.breathe
                    )} />
                    <span className="text-xs text-orange-500 font-medium">Confidencial</span>
                  </div>
                </div>
              </div>

              {/* Ações hover - Animações mais suaves */}
              <div className={cn(
                "absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 flex gap-1",
                ChatAnimations.transition.opacity
              )}>
                <button
                  onClick={() => onToggleFavorite(messageId.toString())}
                  className={cn(
                    "p-2 rounded-full shadow-lg",
                    ChatAnimations.interactive.button,
                    isFavorite
                      ? "bg-yellow-400 text-white hover:bg-yellow-500"
                      : "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-600"
                  )}
                  title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  {isFavorite ? (
                    <Star className="w-4 h-4 fill-current" />
                  ) : (
                    <StarOff className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={() => onCopyMessage(message.content)}
                  className={cn(
                    "p-2 rounded-full bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-600 shadow-lg",
                    ChatAnimations.interactive.button
                  )}
                  title="Copiar nota interna"
                >
                  <Copy className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onReplyToMessage(message)}
                  className={cn(
                    "p-2 rounded-full bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-gray-600 shadow-lg",
                    ChatAnimations.interactive.button
                  )}
                  title="Responder nota"
                >
                  <Reply className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className={cn("w-5 h-5", ChatAnimations.loading.spin)} />
          <span>Carregando mensagens...</span>
        </div>
      </div>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <div className={cn(
        "flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400",
        ChatAnimations.enter.fade
      )}>
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
        const isInternal = message.isInternal || message.type === 'internal';

        // Renderizar mensagem interna com design especial
        if (isInternal) {
          return (
            <InternalMessageBubble
              key={messageId.toString()}
              message={message}
              messageId={messageId}
              isFavorite={isFavorite}
              compactMode={compactMode}
              searchTerm={searchTerm}
            />
          );
        }

        // Renderizar mensagem normal com animações minimalistas
        return (
          <div
            key={messageId.toString()}
            className={cn(
              "group relative",
              ChatAnimations.chat.messageEnter,
              ChatAnimations.chat.messageHover,
              ResponsiveAnimations.prefersReducedMotion.disable,
              isAgent ? "flex justify-end" : "flex justify-start"
            )}
          >
            {/* Ring visual para mensagens favoritas */}
            {isFavorite && (
              <div className={cn(
                "absolute inset-0 rounded-lg ring-2 ring-yellow-400 ring-opacity-50 pointer-events-none",
                ChatAnimations.enter.scale
              )} />
            )}

            <div
              className={cn(
                "max-w-[70%] rounded-lg shadow-sm",
                ChatAnimations.transition.hoverGlow,
                compactMode ? "px-3 py-2" : "px-4 py-3",
                isAgent
                  ? "bg-blue-500 text-white"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
                    isAgent ? "text-white" : "text-gray-900 dark:text-gray-100"
                  )}>
                    {message.senderName || (isAgent ? 'Agente' : 'Cliente')}
                  </span>
                  {!isAgent && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-full",
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    )}>
                      WhatsApp
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-xs",
                    isAgent ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
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
                isAgent ? "text-white" : "text-gray-900 dark:text-gray-100"
              )}>
                {highlightText(message.content, searchTerm)}
              </div>

              {/* Ações hover - Minimalistas e suaves */}
              <div className={cn(
                "absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 flex gap-1",
                ChatAnimations.transition.opacity
              )}>
                <button
                  onClick={() => onToggleFavorite(messageId.toString())}
                  className={cn(
                    "p-1 rounded-full shadow-sm",
                    ChatAnimations.interactive.icon,
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
                  className={cn(
                    "p-1 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm",
                    ChatAnimations.interactive.icon
                  )}
                  title="Copiar mensagem"
                >
                  <Copy className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onReplyToMessage(message)}
                  className={cn(
                    "p-1 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm",
                    ChatAnimations.interactive.icon
                  )}
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