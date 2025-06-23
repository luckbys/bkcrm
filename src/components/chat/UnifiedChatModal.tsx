import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  X, Minimize2, Phone, Video, Send, Paperclip, Smile, MoreVertical, Wifi, WifiOff,
  Search, Maximize2, Maximize, Download, Settings, Volume2, VolumeX, Copy, Trash2, 
  Edit3, Star, Users, Clock, MessageSquare, AlertCircle, Check, CheckCheck, Loader2,
  Archive, Pin, Flag, FileText, Image, Video as VideoIcon, Mic, MapPin, User
} from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInputTabs } from './MessageInputTabs';
import { ReplyPreview } from './ReplyPreview';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '../../lib/utils';
import { ChatMessage } from '../../types/chat';
import { useChatStore } from '../../stores/chatStore';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  
  // 🔗 Hook do Chat Store com WebSocket real
  const {
    isConnected,
    isLoading,
    isSending,
    error,
    messages,
    init,
    disconnect,
    join,
    send,
    load
  } = useChatStore();

  // 📝 Estados da UI
  const [messageText, setMessageText] = useState('');
  const [activeMode, setActiveMode] = useState<'message' | 'internal'>('message');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [favoriteMessages, setFavoriteMessages] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Date>(new Date());
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  
  // 📎 Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 💬 Mensagens do ticket atual
  const ticketMessages = useMemo(() => {
    return messages[ticketId] || [];
  }, [messages, ticketId]);

  // 🔍 Mensagens filtradas por busca
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return ticketMessages;
    
    return ticketMessages.filter((msg: ChatMessage) => 
      (msg.content && msg.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (msg.senderName && msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [ticketMessages, searchQuery]);

  // 📊 Estatísticas das mensagens
  const messageStats = useMemo(() => {
    const total = ticketMessages.length;
    const fromClient = ticketMessages.filter(msg => msg.sender === 'client').length;
    const fromAgent = ticketMessages.filter(msg => msg.sender === 'agent').length;
    const internal = ticketMessages.filter(msg => msg.isInternal).length;
    const unread = ticketMessages.filter(msg => msg.timestamp > lastSeen).length;
    
    return { total, fromClient, fromAgent, internal, unread };
  }, [ticketMessages, lastSeen]);

  // 🔄 Inicialização do WebSocket
  useEffect(() => {
    if (isOpen && !isConnected) {
      console.log('🚀 [UNIFIED-CHAT] Inicializando WebSocket...');
      init();
    }
  }, [isOpen, isConnected, init]);

  // 🔗 Entrar no ticket quando conectar
  useEffect(() => {
    if (isOpen && ticketId && isConnected) {
      console.log(`🎯 [UNIFIED-CHAT] Entrando no ticket ${ticketId}`);
      join(ticketId);
      
      // Carregar mensagens se não existirem
      if (ticketMessages.length === 0) {
        console.log(`📥 [UNIFIED-CHAT] Carregando mensagens do ticket...`);
        load(ticketId);
      }
    }
  }, [isOpen, ticketId, isConnected, join, load, ticketMessages.length]);

  // 📜 Auto-scroll para última mensagem
  useEffect(() => {
    if (!showSearch && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages, showSearch]);

  // 🔍 Foco na busca quando abrir
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // 🔊 Notificação sonora para novas mensagens
  useEffect(() => {
    if (soundEnabled && ticketMessages.length > 0) {
      const lastMessage = ticketMessages[ticketMessages.length - 1];
      if (lastMessage && lastMessage.sender === 'client' && lastMessage.timestamp > lastSeen) {
        // Simular som de notificação
        console.log('🔔 [UNIFIED-CHAT] Nova mensagem do cliente!');
      }
    }
  }, [ticketMessages, soundEnabled, lastSeen]);

  // ⌨️ Indicador de digitação
  const handleTypingStart = useCallback(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    const timeout = setTimeout(() => {
      // Parar indicador de digitação após 3 segundos
    }, 3000);
    
    setTypingTimeout(timeout);
  }, [typingTimeout]);

  // 📤 Enviar mensagem
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || isSending) return;
    
    console.log(`📤 [UNIFIED-CHAT] Enviando mensagem: "${messageText}" (interno: ${activeMode === 'internal'})`);
    
    try {
      await send(ticketId, messageText, activeMode === 'internal');
      setMessageText('');
      setReplyingTo(null);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      // Focus de volta no input
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('❌ [UNIFIED-CHAT] Erro ao enviar mensagem:', error);
    }
  }, [messageText, activeMode, isSending, send, ticketId, typingTimeout]);

  // ⌨️ Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // ESC para fechar
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Ctrl+I para alternar modo interno
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        setActiveMode(mode => mode === 'internal' ? 'message' : 'internal');
      }
      
      // Ctrl+F para buscar
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
      
      // Ctrl+B para sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        setShowSidebar(!showSidebar);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, showSidebar]);

  // 🎨 Funções auxiliares
  const getClientInitials = useCallback(() => {
    return clientName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CL';
  }, [clientName]);

  const getModalClasses = useCallback(() => {
    const base = "p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white flex flex-col transition-all duration-300";
    if (isFullscreen) return cn(base, "w-screen h-screen max-w-none rounded-none");
    if (isExpanded) return cn(base, "max-w-7xl h-[95vh]");
    return cn(base, "max-w-5xl h-[90vh]");
  }, [isFullscreen, isExpanded]);

  const handleToggleFavorite = useCallback((messageId: string) => {
    setFavoriteMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    console.log('📋 [UNIFIED-CHAT] Mensagem copiada');
  }, []);

  const handleReplyToMessage = useCallback((message: ChatMessage) => {
    setReplyingTo(message);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // 🎯 Status de conexão
  const connectionStatus = useMemo(() => {
    if (isLoading) return { icon: Loader2, text: 'Conectando...', color: 'text-yellow-500' };
    if (isConnected) return { icon: Wifi, text: 'Online', color: 'text-green-500' };
    if (error) return { icon: AlertCircle, text: 'Erro', color: 'text-red-500' };
    return { icon: WifiOff, text: 'Offline', color: 'text-gray-500' };
  }, [isLoading, isConnected, error]);

  // 🚫 Não renderizar se não estiver aberto
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={getModalClasses()}>
        <DialogTitle className="sr-only">
          Chat do Ticket {ticketId} - {clientName}
        </DialogTitle>
        
        {/* 🎨 Header Avançado */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-green-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar do Cliente */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white">
                {getClientInitials()}
              </div>
              {/* Status online */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                isConnected ? "bg-green-400" : "bg-gray-400"
              )}>
                {isConnected && <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />}
              </div>
            </div>
            
            {/* Informações do Cliente */}
            <div className="flex flex-col">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                {clientName}
                {clientPhone && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    📱 WhatsApp
                  </Badge>
                )}
              </h3>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {/* Status de Conexão */}
                <div className="flex items-center gap-1">
                  <connectionStatus.icon className={cn("w-3 h-3", connectionStatus.color)} />
                  <span className={connectionStatus.color}>{connectionStatus.text}</span>
                </div>
                
                {/* Telefone com ação WhatsApp */}
                {clientPhone && (
                  <>
                    <span className="text-gray-300">•</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 px-2 text-xs text-blue-600 hover:text-green-600 hover:bg-green-50"
                      onClick={() => window.open(`https://wa.me/${clientPhone.replace(/\D/g, '')}`, '_blank')}
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      {clientPhone}
                    </Button>
                  </>
                )}
                
                {/* Estatísticas */}
                <span className="text-gray-300">•</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {messageStats.total} mensagens
                </span>
                
                {messageStats.unread > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    {messageStats.unread} não lidas
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* 🎛️ Controles do Header */}
          <div className="flex items-center gap-1">
            {/* Busca */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className={cn("h-8 w-8", showSearch && "bg-blue-100 text-blue-600")}
              title="Buscar (Ctrl+F)"
            >
              <Search className="w-4 h-4" />
            </Button>
            
            {/* Som */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn("h-8 w-8", soundEnabled ? "text-green-600" : "text-gray-400")}
              title="Som de notificações"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            
            {/* Sidebar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
              className={cn("h-8 w-8", showSidebar && "bg-blue-100 text-blue-600")}
              title="Informações (Ctrl+B)"
            >
              <Users className="w-4 h-4" />
            </Button>
            
            {/* Expandir */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
              title="Expandir"
            >
              <Maximize className="w-4 h-4" />
            </Button>
            
            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8"
              title="Tela cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            
            {/* Minimizar */}
            {onMinimize && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMinimize}
                className="h-8 w-8"
                title="Minimizar"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            )}
            
            {/* Fechar */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Fechar (ESC)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 🔍 Barra de Busca */}
        {showSearch && (
          <div className="p-3 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                placeholder="Buscar mensagens, remetente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {searchQuery && (
              <div className="mt-2 text-xs text-gray-500">
                {filteredMessages.length} de {ticketMessages.length} mensagens encontradas
              </div>
            )}
          </div>
        )}

        {/* 🏗️ Layout Principal */}
        <div className="flex flex-1 min-h-0">
          {/* 💬 Área de Mensagens */}
          <div className="flex flex-col flex-1 min-h-0">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-gray-100">
              <div className="space-y-4">
                {/* Estado de carregamento */}
                {isLoading && ticketMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-3" />
                    <p>Carregando mensagens...</p>
                  </div>
                )}
                
                {/* Estado de erro */}
                {error && (
                  <div className="flex flex-col items-center justify-center py-12 text-red-500">
                    <AlertCircle className="w-8 h-8 mb-3" />
                    <p>Erro ao carregar mensagens</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => load(ticketId)}
                      className="mt-2"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                )}
                
                {/* Estado vazio */}
                {!isLoading && !error && ticketMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma mensagem ainda</h3>
                    <p className="text-sm text-center max-w-sm">
                      Esta é uma nova conversa com {clientName}. Seja o primeiro a enviar uma mensagem!
                    </p>
                  </div>
                )}
                
                {/* Lista de Mensagens */}
                {filteredMessages.map((message: ChatMessage) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isFromCurrentUser={message.sender === 'agent'}
                    onReply={() => handleReplyToMessage(message)}
                    onToggleFavorite={() => handleToggleFavorite(message.id)}
                    onCopy={() => handleCopyMessage(message.content)}
                    isFavorite={favoriteMessages.has(message.id)}
                    isHighlighted={searchQuery.trim() ? 
                      (message.content && message.content.toLowerCase().includes(searchQuery.toLowerCase())) : 
                      false
                    }
                    className="transition-all duration-200 hover:scale-[1.01]"
                  />
                ))}
                
                {/* Referência para scroll automático */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* 🔄 Preview de Resposta */}
            {replyingTo && (
              <ReplyPreview
                replyingTo={replyingTo}
                onCancel={() => setReplyingTo(null)}
              />
            )}

            {/* ⌨️ Área de Input */}
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
                ref={textareaRef}
              />
              
              {/* 🎛️ Controles do Input */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {/* Anexar */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 text-gray-600 hover:text-blue-600"
                    title="Anexar arquivo"
                  >
                    <Paperclip className="w-4 h-4 mr-1" />
                    Anexar
                  </Button>
                  
                  {/* Emoji */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={cn(
                        "h-8 px-3 text-gray-600 hover:text-yellow-600",
                        showEmojiPicker && "bg-yellow-50 text-yellow-600"
                      )}
                      title="Emojis"
                    >
                      <Smile className="w-4 h-4 mr-1" />
                      Emoji
                    </Button>
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-full mb-2 left-0 z-50">
                        <EmojiPicker
                          onEmojiSelect={(emoji) => {
                            setMessageText(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                          onClose={() => setShowEmojiPicker(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Informações adicionais */}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>Ticket #{ticketId}</span>
                  <span>•</span>
                  <span>{messageText.length}/2000</span>
                  {replyingTo && (
                    <>
                      <span>•</span>
                      <span className="text-blue-500">Respondendo</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Atalhos de teclado */}
              <div className="mt-2 text-xs text-gray-400 text-center">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> para enviar • 
                <kbd className="px-1 py-0.5 bg-gray-100 rounded mx-1">Shift+Enter</kbd> nova linha • 
                <kbd className="px-1 py-0.5 bg-gray-100 rounded mx-1">Ctrl+I</kbd> nota interna
              </div>
            </div>
          </div>
          
          {/* 📊 Sidebar Informativa */}
          {showSidebar && (
            <div className="w-80 border-l bg-white flex flex-col">
              {/* Header da Sidebar */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Informações</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSidebar(false)}
                    className="h-6 w-6"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Conteúdo da Sidebar */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                  {/* Informações do Cliente */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Cliente
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nome:</span>
                        <span className="font-medium">{clientName}</span>
                      </div>
                      {clientPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Telefone:</span>
                          <span className="font-medium text-blue-600">{clientPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Estatísticas */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Estatísticas
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{messageStats.total}</div>
                        <div className="text-gray-600">Total</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{messageStats.fromClient}</div>
                        <div className="text-gray-600">Cliente</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">{messageStats.fromAgent}</div>
                        <div className="text-gray-600">Agente</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">{messageStats.internal}</div>
                        <div className="text-gray-600">Internas</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Ações Rápidas */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Ações
                    </h4>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Archive className="w-4 h-4 mr-2" />
                        Arquivar conversa
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Pin className="w-4 h-4 mr-2" />
                        Fixar conversa
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Flag className="w-4 h-4 mr-2" />
                        Marcar importante
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Exportar chat
                      </Button>
                    </div>
                  </div>
                  
                  {/* Status da Conexão */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Wifi className="w-4 h-4" />
                      Conexão
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
                          {connectionStatus.text}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Última atualização:</span>
                        <span className="text-gray-800">
                          {formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      {error && (
                        <div className="p-2 bg-red-50 rounded text-red-700 text-xs">
                          {error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};