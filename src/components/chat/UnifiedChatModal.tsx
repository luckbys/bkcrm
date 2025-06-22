import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { 
  X, Minimize2, Phone, Video, Send, Paperclip, Smile, MoreVertical, Wifi, WifiOff,
  Search, Maximize2, Maximize, Download, Settings, Volume2, VolumeX, Copy, Trash2, Edit3, Star
} from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInputTabs } from './MessageInputTabs';
import { ReplyPreview } from './ReplyPreview';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '../../lib/utils';
import { ChatMessage } from '../../types/chat';
import { useChatSocket } from '../../hooks/useChatSocket';
import { useAuth } from '../../hooks/useAuth';

interface UnifiedChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  ticketId: string;
  clientName?: string;
  clientPhone?: string;
  className?: string;
}

export const UnifiedChatModal: React.FC<UnifiedChatModalProps> = ({
  isOpen,
  onClose,
  onMinimize,
  ticketId,
  clientName = "Cliente",
  clientPhone,
  className
}) => {
  const { user } = useAuth();
  const {
    messages,
    typingUsers,
    isConnected,
    isLoading,
    isSending,
    handleJoinTicket,
    handleLeaveTicket,
    handleSendMessage: sendRealMessage,
    handleTypingStart,
    handleTypingStop,
  } = useChatSocket();

  const [messageText, setMessageText] = useState('');
  const [activeMode, setActiveMode] = useState<'message' | 'internal'>('message');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      console.log(`🔗 [CHAT] Entrando no ticket ${ticketId}`);
      console.log(`🔗 [CHAT] Status da conexão:`, {
        isConnected,
        isLoading,
        isSending,
        messages: messages?.length || 0,
        typingUsers: typingUsers?.length || 0
      });
      handleJoinTicket(ticketId);
    }
    return () => {
      if (isOpen && ticketId) {
        console.log(`🔌 [CHAT] Saindo do ticket ${ticketId}`);
        handleLeaveTicket();
      }
    };
  }, [isOpen, ticketId, handleJoinTicket, handleLeaveTicket, isConnected, isLoading, isSending, messages, typingUsers]);
  
  const filteredMessages = React.useMemo(() => {
    if (!searchQuery.trim()) return messages;
    return messages.filter(msg => 
      (msg.content && msg.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (msg.senderName && msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [messages, searchQuery]);

  useEffect(() => {
    if (!showSearch) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showSearch, filteredMessages]);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    console.log(`[CHAT] Enviando mensagem para ${ticketId}: "${messageText}"`);
    await sendRealMessage(messageText, activeMode === 'internal');
    setMessageText('');
    setReplyingTo(null);
    handleTypingStop();
  };
  
  const getClientInitials = () => clientName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'C';

  const getModalClasses = () => {
    const base = "p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white flex flex-col transition-all duration-300";
    if (isFullscreen) return cn(base, "w-screen h-screen max-w-none rounded-none");
    if (isExpanded) return cn(base, "max-w-7xl h-[95vh]");
    return cn(base, "max-w-5xl h-[90vh]");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={getModalClasses()}>
        <DialogTitle className="sr-only">Chat do Ticket {ticketId}</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              {getClientInitials()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{clientName}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {isConnected ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
                <span>{isConnected ? 'Online' : 'Offline'}</span>
                {typingUsers && typingUsers.length > 0 && <span className="text-blue-500 animate-pulse">digitando...</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setShowSearch(s => !s)}><Search className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}><Maximize className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)}><Maximize2 className="w-4 h-4" /></Button>
            {onMinimize && <Button variant="ghost" size="icon" onClick={onMinimize}><Minimize2 className="w-4 h-4" /></Button>}
            <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        {showSearch && (
          <div className="p-2 border-b">
            <Input ref={searchInputRef} placeholder="Buscar mensagens..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4 bg-gray-100">
            <div className="space-y-4">
              {isLoading && <p className="text-center text-gray-500">Carregando mensagens...</p>}
              {!isLoading && messages && filteredMessages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isFromCurrentUser={msg.senderId === user?.id}
                  onReply={() => setReplyingTo(msg)}
                  isHighlighted={searchQuery.trim() ? (msg.content && msg.content.toLowerCase().includes(searchQuery.toLowerCase())) : false}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {replyingTo && <ReplyPreview replyingTo={replyingTo} onCancel={() => setReplyingTo(null)} />}

          <div className="border-t p-4 bg-white">
            <MessageInputTabs
              activeMode={activeMode}
              onModeChange={setActiveMode}
              messageText={messageText}
              onMessageChange={(text) => {
                setMessageText(text);
                handleTypingStart();
              }}
              onSend={handleSendMessage}
              isLoading={isSending}
            />
             <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" title="Anexar"><Paperclip className="w-4 h-4" /></Button>
                  <div className="relative">
                    <Button variant="ghost" size="icon" onClick={() => setShowEmojiPicker(p => !p)} title="Emoji"><Smile className="w-4 h-4" /></Button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full mb-2 right-0 z-50">
                        <EmojiPicker onEmojiSelect={(emoji) => setMessageText(t => t + emoji)} onClose={() => setShowEmojiPicker(false)} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Ticket #{ticketId}
                </div>
              </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};