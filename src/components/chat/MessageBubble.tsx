// 💬 COMPONENTE DE BOLHA DE MENSAGEM APRIMORADO
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Check, 
  CheckCheck, 
  Reply, 
  MoreVertical, 
  Star, 
  StarOff, 
  Copy, 
  Trash2, 
  Edit3,
  Flag,
  AlertCircle,
  Lock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChatMessage } from '../../types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isFromCurrentUser: boolean;
  showAvatar?: boolean;
  onReply?: (message: ChatMessage) => void;
  onToggleFavorite?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
  isFavorite?: boolean;
  isHighlighted?: boolean;
  className?: string;
}

// 👤 Componente de Avatar
const MessageAvatar: React.FC<{ 
  senderName: string; 
  isFromCurrentUser: boolean;
  isInternal: boolean;
}> = ({ senderName, isFromCurrentUser, isInternal }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = () => {
    if (isInternal) return 'bg-amber-500';
    if (isFromCurrentUser) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className={cn(
      "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0",
      getAvatarColor()
    )}>
      {isInternal ? "🔒" : getInitials(senderName)}
    </div>
  );
};

// 📊 Componente de Status da Mensagem
const MessageStatus: React.FC<{ 
  status: ChatMessage['status']; 
  isFromCurrentUser: boolean;
}> = ({ status, isFromCurrentUser }) => {
  if (!isFromCurrentUser) return null;

  const statusConfig = {
    sending: { icon: Check, color: 'text-gray-400', opacity: 'opacity-50' },
    sent: { icon: Check, color: 'text-gray-500', opacity: 'opacity-75' },
    delivered: { icon: CheckCheck, color: 'text-gray-500', opacity: 'opacity-75' },
    read: { icon: CheckCheck, color: 'text-blue-500', opacity: 'opacity-100' },
    failed: { icon: Check, color: 'text-red-500', opacity: 'opacity-100' }
  };

  const config = statusConfig[status || 'sent'];
  const Icon = config.icon;

  return (
    <Icon 
      className={cn(
        "w-3 h-3 ml-1",
        config.color,
        config.opacity
      )} 
    />
  );
};

// 🎯 Componente Principal
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFromCurrentUser,
  showAvatar = true,
  onReply,
  onToggleFavorite,
  onCopy,
  onDelete,
  onEdit,
  isFavorite = false,
  isHighlighted = false,
  className
}) => {
  const [showActions, setShowActions] = React.useState(false);
  const [showMoreOptions, setShowMoreOptions] = React.useState(false);

  const getBubbleStyles = () => {
    if (message.isInternal) {
      return {
        container: "justify-center",
        bubble: "bg-amber-50 border border-amber-200 text-amber-800 max-w-[80%]",
        textAlign: "text-center" as const
      };
    }

    if (isFromCurrentUser) {
      return {
        container: "justify-end",
        bubble: "bg-blue-500 text-white max-w-[75%] rounded-br-sm",
        textAlign: "text-left" as const
      };
    }

    return {
      container: "justify-start",
      bubble: "bg-white border border-gray-200 text-gray-900 max-w-[75%] rounded-bl-sm",
      textAlign: "text-left" as const
    };
  };

  const styles = getBubbleStyles();
  const timestamp = formatDistanceToNow(message.timestamp, { 
    addSuffix: true, 
    locale: ptBR 
  });

  // Highlight texto de busca
  const highlightText = (text: string, query?: string) => {
    if (!query || !isHighlighted) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(message.id);
    }
  };

  return (
    <div className={cn(
      "flex w-full mb-4 transition-all duration-200",
      styles.container,
      isHighlighted && "bg-yellow-50 p-2 rounded-lg border border-yellow-200",
      className
    )}>
      <div className={cn(
        "flex gap-3 items-end",
        isFromCurrentUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* 👤 Avatar */}
        {showAvatar && (
          <MessageAvatar
            senderName={message.senderName}
            isFromCurrentUser={isFromCurrentUser}
            isInternal={message.isInternal}
          />
        )}

        {/* 💬 Bolha da Mensagem */}
        <div 
          className="relative group"
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {/* Nome do remetente (apenas para mensagens do cliente ou notas internas) */}
          {(!isFromCurrentUser || message.isInternal) && (
            <div className={cn(
              "text-xs font-medium mb-1 px-1",
              isFromCurrentUser ? "text-right text-gray-600" : "text-left text-gray-600"
            )}>
              {message.isInternal && "🔒 NOTA INTERNA • "}
              {message.senderName}
            </div>
          )}

          {/* Conteúdo da mensagem */}
          <div className={cn(
            "px-4 py-3 rounded-2xl shadow-sm relative transition-all duration-200",
            styles.bubble,
            isFavorite && "ring-2 ring-yellow-400 ring-opacity-50",
            isHighlighted && "ring-2 ring-yellow-300 ring-opacity-75"
          )}>
            <div className={cn("text-sm leading-relaxed whitespace-pre-wrap break-words", styles.textAlign)}>
              {highlightText(message.content)}
            </div>

            {/* Timestamp e Status */}
            <div className={cn(
              "flex items-center justify-between mt-2 text-xs",
              isFromCurrentUser ? "text-blue-100" : "text-gray-500"
            )}>
              <span className="opacity-75">
                {timestamp}
              </span>
              <div className="flex items-center gap-1">
                {isFavorite && (
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                )}
                <MessageStatus 
                  status={message.status} 
                  isFromCurrentUser={isFromCurrentUser} 
                />
              </div>
            </div>
          </div>

          {/* Ações da Mensagem (aparecem no hover) */}
          {showActions && (
            <div className={cn(
              "absolute top-0 flex items-center gap-1 z-10",
              isFromCurrentUser ? "-left-12" : "-right-12"
            )}>
              {/* Responder */}
              {onReply && (
                <button
                  onClick={() => onReply(message)}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="Responder à mensagem"
                >
                  <Reply className="w-4 h-4 text-gray-600" />
                </button>
              )}
              
              {/* Favoritar */}
              {onToggleFavorite && (
                <button
                  onClick={handleToggleFavorite}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  {isFavorite ? (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  ) : (
                    <StarOff className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}

              {/* Copiar */}
              <button
                onClick={handleCopy}
                className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                title="Copiar mensagem"
              >
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Mais opções */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="w-8 h-8 bg-white border border-gray-200 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
                  title="Mais opções"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>

                {/* Menu de opções */}
                {showMoreOptions && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
                    {onEdit && isFromCurrentUser && (
                      <button
                        onClick={() => {
                          onEdit(message.id, message.content);
                          setShowMoreOptions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Editar
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        handleCopy();
                        setShowMoreOptions(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copiar
                    </button>

                    <button
                      onClick={handleToggleFavorite}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      {isFavorite ? (
                        <>
                          <StarOff className="w-4 h-4" />
                          Remover favorito
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4" />
                          Favoritar
                        </>
                      )}
                    </button>

                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Flag className="w-4 h-4" />
                      Reportar
                    </button>

                    {onDelete && isFromCurrentUser && (
                      <button
                        onClick={() => {
                          onDelete(message.id);
                          setShowMoreOptions(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Badge especial para notas internas */}
          {message.isInternal && (
            <div className="text-center mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                <Lock className="w-3 h-3" />
                Nota Interna
              </span>
            </div>
          )}

          {/* Badge para mensagens favoritas */}
          {isFavorite && (
            <div className="absolute -top-2 -right-2">
              <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-3 h-3 text-white fill-current" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
