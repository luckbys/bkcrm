// 💬 COMPONENTE DE PRÉVIA DE RESPOSTA (QUOTING)
import React from 'react';
import { X, Reply, User, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChatMessage } from '../../types/chat';

interface ReplyPreviewProps {
  replyingTo: ChatMessage;
  onCancel: () => void;
  className?: string;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  replyingTo,
  onCancel,
  className
}) => {
  // 📝 Truncar mensagem longa para prévia
  const truncateMessage = (content: string, maxLength = 80) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // 🎨 Configuração visual baseada no tipo da mensagem
  const getPreviewConfig = () => {
    if (replyingTo.isInternal) {
      return {
        borderColor: 'border-l-amber-400',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-800',
        iconColor: 'text-amber-600',
        icon: Lock
      };
    }

    const isFromCurrentUser = replyingTo.sender === 'agent';
    
    if (isFromCurrentUser) {
      return {
        borderColor: 'border-l-blue-400',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600',
        icon: Reply
      };
    }

    return {
      borderColor: 'border-l-green-400',
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
      icon: User
    };
  };

  const config = getPreviewConfig();
  const Icon = config.icon;

  // 📅 Formatação de tempo relativo simples
  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div className={cn(
      "border-l-4 p-3 m-4 mb-0 rounded-r-lg transition-all duration-200 animate-in slide-in-from-bottom-2",
      config.borderColor,
      config.bgColor,
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        {/* 🔍 Conteúdo da resposta */}
        <div className="flex-1 min-w-0">
          {/* Cabeçalho com ícone e info do remetente */}
          <div className="flex items-center gap-2 mb-2">
            <Icon className={cn("w-4 h-4", config.iconColor)} />
            <span className={cn("text-sm font-medium", config.textColor)}>
              {replyingTo.isInternal && "🔒 "}
              Respondendo a {replyingTo.senderName}
            </span>
            <span className="text-xs text-gray-500">
              • {getTimeAgo(replyingTo.timestamp)}
            </span>
          </div>
          
          {/* Prévia do conteúdo da mensagem */}
          <div className={cn(
            "text-sm leading-relaxed border-l-2 pl-3 py-1",
            config.borderColor.replace('border-l-', 'border-l-'),
            config.textColor,
            "opacity-80"
          )}>
            "{truncateMessage(replyingTo.content)}"
          </div>
        </div>

        {/* ❌ Botão de cancelar */}
        <button
          onClick={onCancel}
          className={cn(
            "p-1 rounded-full transition-all duration-200 hover:scale-110",
            "hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-1",
            config.iconColor.replace('text-', 'focus:ring-')
          )}
          title="Cancelar resposta"
          aria-label="Cancelar resposta"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
};
 