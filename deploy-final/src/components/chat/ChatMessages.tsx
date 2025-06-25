import React, { useEffect, useRef, useMemo } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle,
  Reply,
  MoreVertical,
  Shield,
  User
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { ChatMessage } from '../../types/chat';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  typingUsers: string[];
  searchQuery?: string;
  isCompactMode?: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReaction?: (message: ChatMessage, emoji: string) => void;
}

const MessageBubble: React.FC<{
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
}> = ({ message, isOwn, showAvatar, showTimestamp, onReply, onEdit, onDelete }) => {
  
  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: ptBR });
    } else if (isYesterday(date)) {
      return `Ontem ${format(date, 'HH:mm', { locale: ptBR })}`;
    } else {
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }
  };

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwn && "flex-row-reverse"
    )}>
      {/* 🎭 Avatar */}
      {showAvatar && (
        <div className="flex-shrink-0">
          <Avatar className="w-8 h-8">
            <AvatarFallback className={cn(
              "text-xs font-medium",
              isOwn ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            )}>
              {message.senderName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      {/* 💬 Bubble da mensagem */}
      <div className={cn(
        "flex flex-col max-w-[75%]",
        isOwn && "items-end"
      )}>
        {/* 👤 Nome do remetente */}
        {showAvatar && (
          <div className={cn(
            "flex items-center gap-2 mb-1 text-xs font-medium",
            isOwn ? "flex-row-reverse text-blue-700" : "text-gray-700"
          )}>
            <span>{message.senderName}</span>
            {message.isInternal && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                <Shield className="w-3 h-3 mr-1" />
                Interno
              </Badge>
            )}
          </div>
        )}
        
        {/* 📱 Conteúdo da mensagem */}
        <div className={cn(
          "relative group rounded-lg px-3 py-2 shadow-sm",
          isOwn 
            ? message.isInternal
              ? "bg-yellow-100 text-yellow-900 border border-yellow-200"
              : "bg-blue-500 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        )}>
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* 🕐 Timestamp e status */}
          {showTimestamp && (
            <div className={cn(
              "flex items-center gap-1 mt-1 text-xs opacity-70",
              isOwn ? "justify-end" : "justify-start"
            )}>
              <span>
                {formatTime(message.timestamp)}
              </span>
              {isOwn && getStatusIcon()}
            </div>
          )}
          
          {/* 🎛️ Menu de ações */}
          <div className={cn(
            "absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity",
            isOwn ? "left-0" : "right-0"
          )}>
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border p-1">
              {onReply && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Reply className="w-3 h-3" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TypingIndicator: React.FC<{ users: string[] }> = ({ users }) => {
  if (users.length === 0) return null;
  
  return (
    <div className="flex items-center gap-3 mb-4">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="bg-gray-100">
          <User className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-gray-100 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {users.length === 1 ? users[0] : `${users.length} pessoas`} digitando
          </span>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading,
  isTyping,
  typingUsers,
  searchQuery = '',
  isCompactMode = false,
  onReply,
  onEdit,
  onDelete,
  onReaction
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 🔍 Filtrar mensagens por busca
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    
    const query = searchQuery.toLowerCase();
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(query) ||
      msg.senderName.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);
  
  // 📜 Scroll automático para novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // 📅 Agrupar mensagens por data
  const groupedMessages = useMemo(() => {
    const groups: Array<{ date: string; messages: ChatMessage[] }> = [];
    let currentDate = '';
    let currentGroup: ChatMessage[] = [];
    
    filteredMessages.forEach(message => {
      const messageDate = format(message.timestamp, 'yyyy-MM-dd');
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  }, [filteredMessages]);
  
  const formatDateSeparator = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
          <p className="text-gray-600">Carregando mensagens...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-1"
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* 📝 Estado vazio */}
      {filteredMessages.length === 0 && !isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-6xl mb-4">💬</div>
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm">Inicie uma conversa!</p>
          </div>
        </div>
      )}
      
      {/* 📅 Mensagens agrupadas por data */}
      {groupedMessages.map(group => (
        <div key={group.date}>
          {/* 📅 Separador de data */}
          <div className="flex justify-center my-4">
            <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600">
              {formatDateSeparator(group.date)}
            </div>
          </div>
          
          {/* 💬 Mensagens do dia */}
          {group.messages.map((message, index) => {
            const prevMessage = group.messages[index - 1];
            const isOwn = message.sender === 'agent';
            const showAvatar = !prevMessage || prevMessage.sender !== message.sender || !isCompactMode;
            const showTimestamp = !isCompactMode || index === group.messages.length - 1;
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            );
          })}
        </div>
      ))}
      
      {/* ⌨️ Indicador de digitação */}
      {isTyping && <TypingIndicator users={typingUsers} />}
      
      {/* 📍 Referência para scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
}; 