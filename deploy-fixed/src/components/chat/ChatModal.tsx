// 🎯 MODAL DE CHAT MODERNO
// Componente principal com arquitetura robusta

import React, { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { 
  X, 
  Minimize2,
  Settings,
  Phone,
  Video,
  Search,
  Info,
  MoreVertical,
  Wifi,
  WifiOff,
  Activity,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChatProvider, useChat } from '../../contexts/ChatContextV2';
import { ChatMessage, ChatModalProps, ChatConfiguration, ChatChannel, ChatParticipant } from '../../types/chat';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';

// 🎨 Componente interno que usa o contexto
const ChatModalContent: React.FC<Omit<ChatModalProps, 'ticketId'>> = ({
  isOpen,
  onClose,
  onMinimize,
  className
}) => {
  const { store } = useChat();
  const { messages, state, configuration, actions } = store;
  
  // 🎛️ Estados da UI
  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCompactMode, setIsCompactMode] = useState(false);
  
  // 🔍 Mensagens filtradas
  const filteredMessages = useMemo(() => {
    return actions.searchMessages(searchQuery);
  }, [messages, searchQuery, actions]);
  
  // 📞 Handlers de ações
  const handleCall = useCallback(() => {
    console.log('🔧 [Chat] Iniciar chamada');
  }, []);
  
  const handleVideoCall = useCallback(() => {
    console.log('🔧 [Chat] Iniciar vídeo chamada');
  }, []);
  
  const handleSettings = useCallback(() => {
    setShowSidebar(!showSidebar);
  }, [showSidebar]);
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  // 🎯 Participante principal (cliente)
  const clientParticipant = configuration.participants.find(p => p.role === 'client');
  
  return (
    <DialogContent 
      className={cn(
        "max-w-6xl w-full h-[95vh] p-0 gap-0 overflow-hidden bg-white border-none shadow-2xl",
        className
      )}
    >
      {/* 🔇 Acessibilidade */}
      <DialogTitle className="sr-only">
        Chat com {clientParticipant?.name || 'Cliente'}
      </DialogTitle>
      <DialogDescription className="sr-only">
        Interface de chat para comunicação em tempo real
      </DialogDescription>
      
      {/* 🏗️ Layout principal */}
      <div className="flex h-full">
        {/* 📱 Área principal do chat */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* 🎨 Header */}
          <ChatHeader
            participant={clientParticipant || {
              id: 'unknown',
              name: 'Cliente',
              role: 'client',
              isOnline: false
            }}
            channel={configuration.channel}
            state={state}
            onClose={onClose}
            onMinimize={onMinimize}
            onSettings={handleSettings}
            onCall={handleCall}
            onVideoCall={handleVideoCall}
            onSearch={handleSearch}
            searchQuery={searchQuery}
            isCompactMode={isCompactMode}
            onToggleCompact={() => setIsCompactMode(!isCompactMode)}
          />
          
          {/* 💬 Área de mensagens */}
          <ChatMessages
            messages={filteredMessages}
            isLoading={state.isLoading}
            isTyping={state.isTyping}
            typingUsers={state.typingUsers}
            searchQuery={searchQuery}
            isCompactMode={isCompactMode}
                         onReply={(message: ChatMessage) => console.log('🔧 Reply:', message)}
             onEdit={(message: ChatMessage) => console.log('🔧 Edit:', message)}
             onDelete={(message: ChatMessage) => console.log('🔧 Delete:', message)}
             onReaction={(message: ChatMessage, emoji: string) => console.log('🔧 Reaction:', message, emoji)}
          />
          
          {/* ⌨️ Área de input */}
          <ChatInput
            onSend={actions.sendMessage}
            isLoading={state.isLoading}
            placeholder="Digite sua mensagem..."
            maxLength={configuration.settings.maxMessageLength}
            allowFileUpload={configuration.settings.allowedFileTypes.length > 0}
            allowEmojis={configuration.channel.settings.allowEmojis}
            onTyping={actions.setTyping}
          />
        </div>
        
        {/* 📊 Sidebar opcional */}
        {showSidebar && (
          <ChatSidebar
            participant={clientParticipant}
            configuration={configuration}
            state={state}
            onClose={() => setShowSidebar(false)}
            messagesCount={messages.length}
            unreadCount={state.unreadCount}
          />
        )}
      </div>
      
      {/* 🔄 Indicador de conexão flutuante */}
      {state.connectionStatus !== 'connected' && (
        <div className="absolute top-4 right-4 z-50">
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-2 animate-pulse",
              state.connectionStatus === 'connecting' && "border-yellow-300 bg-yellow-50 text-yellow-700",
              state.connectionStatus === 'disconnected' && "border-red-300 bg-red-50 text-red-700",
              state.connectionStatus === 'error' && "border-red-500 bg-red-100 text-red-800"
            )}
          >
            {state.connectionStatus === 'connecting' && (
              <>
                <Activity className="w-3 h-3 animate-spin" />
                Conectando...
              </>
            )}
            {state.connectionStatus === 'disconnected' && (
              <>
                <WifiOff className="w-3 h-3" />
                Desconectado
              </>
            )}
            {state.connectionStatus === 'error' && (
              <>
                <X className="w-3 h-3" />
                Erro de conexão
              </>
            )}
          </Badge>
        </div>
      )}
    </DialogContent>
  );
};

// 🎯 Componente principal com Provider
export const ChatModal: React.FC<ChatModalProps> = ({
  ticketId,
  isOpen,
  onClose,
  onMinimize,
  className
}) => {
  // 🏗️ Configuração do chat baseada no ticket
  const configuration: ChatConfiguration = useMemo(() => ({
    ticketId,
    channel: {
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
    },
    participants: [
      {
        id: 'client-1',
        name: 'Cliente',
        role: 'client',
        isOnline: true
      },
      {
        id: 'agent-1',
        name: 'Atendente',
        role: 'agent',
        isOnline: true
      }
    ],
    settings: {
      realTimeEnabled: true,
      fallbackToDatabase: true,
      autoSave: true,
      maxMessageLength: 2000,
      allowedFileTypes: ['image/*', 'application/pdf', '.doc', '.docx'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      showTimestamps: true,
      showReadReceipts: true,
      enableReactions: true,
      enableReplies: true
    }
  }), [ticketId]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ChatProvider configuration={configuration}>
        <ChatModalContent
          isOpen={isOpen}
          onClose={onClose}
          onMinimize={onMinimize}
          className={className}
        />
      </ChatProvider>
    </Dialog>
  );
}; 