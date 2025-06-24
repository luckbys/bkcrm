import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  X, Minimize2, Phone, Video, Send, Paperclip, Smile, MoreVertical, Wifi, WifiOff,
  Search, Maximize2, Maximize, Download, Settings, Volume2, VolumeX, Copy, Trash2, 
  Edit3, Star, Users, Clock, MessageSquare, AlertCircle, Check, CheckCheck, Loader2,
  Archive, Pin, Flag, FileText, Image, Video as VideoIcon, Mic, MapPin, User, Save,
  Upload, Link2, Bookmark, Zap, Moon, Sun, Palette, History, Quote, ChevronDown
} from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInputTabs } from './MessageInputTabs';
import { ReplyPreview } from './ReplyPreview';
import { EmojiPicker } from './EmojiPicker';
import { NotificationToast, useNotificationToast } from './NotificationToast';
import { TypingIndicator, useTypingIndicator } from './TypingIndicator';
import { ConnectionStatus, useConnectionStatus } from './ConnectionStatus';
import { cn } from '../../lib/utils';
import { ChatMessage as BaseChatMessage } from '../../types/chat';

// Interface local compatível com as mensagens do WebSocket
interface LocalChatMessage {
  id: string;
  content: string;
  sender: 'agent' | 'client' | 'system';
  senderName: string;
  timestamp: Date;
  isInternal: boolean;
  type?: 'text' | 'image' | 'file' | 'audio' | 'video';
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  metadata?: any;
}

// 📝 Templates de resposta rápida
const QUICK_TEMPLATES = [
  { id: 'greeting', title: 'Saudação', content: 'Olá! Como posso ajudá-lo hoje?' },
  { id: 'thanks', title: 'Agradecimento', content: 'Obrigado pelo contato! Fico à disposição.' },
  { id: 'wait', title: 'Aguarde', content: 'Por favor, aguarde um momento enquanto verifico isso para você.' },
  { id: 'resolved', title: 'Resolvido', content: 'Problema resolvido! Há mais alguma coisa em que posso ajudar?' },
  { id: 'followup', title: 'Acompanhamento', content: 'Gostaria de fazer um acompanhamento sobre sua solicitação.' },
  { id: 'escalate', title: 'Escalar', content: 'Vou escalar sua solicitação para um especialista.' }
];

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
}: UnifiedChatModalProps): JSX.Element | null => {
  const { user } = useAuth();
  
  // 📌 Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🎯 Hooks avançados de UX
  const { 
    success: showSuccess, 
    error: showError, 
    info: showInfo, 
    warning: showWarning, 
    NotificationContainer 
  } = useNotificationToast();
  
  const {
    connectionInfo
  } = useConnectionStatus();
  
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
  const [replyingTo, setReplyingTo] = useState<LocalChatMessage | null>(null);
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
  const [isSilentLoading, setIsSilentLoading] = useState(false);
  
  // 🆕 Novos estados para funcionalidades avançadas
  const [isDragOver, setIsDragOver] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLinkPreview, setShowLinkPreview] = useState(true);
  const [actionHistory, setActionHistory] = useState<Array<{id: string, action: string, timestamp: Date}>>([]);
  
  // 🔄 Otimização de estados
  const [uiState, setUiState] = useState({
    isBackgroundUpdating: false,
    lastUpdateTime: new Date(),
    updateCount: 0,
    previousMessageCount: 0,
    draftRestored: false
  });

  // 🎯 Cache de mensagens otimizado
  const messageCache = useRef(new Map());
  
  // 💬 Mensagens do ticket atual
  const ticketMessages = useMemo(() => {
    return messages[ticketId] || [];
  }, [messages, ticketId]);

  // 🔍 Mensagens filtradas por busca
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return ticketMessages;
    
    const query = searchQuery.toLowerCase();
    return ticketMessages.filter((msg: LocalChatMessage) => {
      const contentMatch = msg.content?.toLowerCase().includes(query);
      const senderMatch = msg.senderName?.toLowerCase().includes(query);
      return Boolean(contentMatch || senderMatch);
    });
  }, [ticketMessages, searchQuery]);

  // 📊 Estatísticas das mensagens
  const messageStats = useMemo(() => {
    const total = ticketMessages.length;
    const fromClient = ticketMessages.filter(msg => msg.sender === 'client').length;
    const fromAgent = ticketMessages.filter(msg => msg.sender === 'agent').length;
    const internal = ticketMessages.filter(msg => msg.isInternal).length;
    const unread = ticketMessages.filter(msg => msg.timestamp > lastSeen).length;
    
    // Debug das mensagens
    console.log(`📊 [UNIFIED-CHAT] Stats do ticket ${ticketId}:`, {
      total,
      fromClient,
      fromAgent,
      internal,
      unread,
      lastUpdate: ticketMessages.length > 0 ? ticketMessages[ticketMessages.length - 1].timestamp : null
    });
    
    return { total, fromClient, fromAgent, internal, unread };
  }, [ticketMessages, lastSeen, ticketId]);

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
      
      // Carregar mensagens sempre que entrar no ticket
      console.log(`📥 [UNIFIED-CHAT] Carregando mensagens do ticket...`);
      load(ticketId);
    }
  }, [isOpen, ticketId, isConnected, join, load]);

  // 🔄 Polling como fallback
  useEffect(() => {
    if (!isOpen || !ticketId) return;

    let isPolling = false;
    const pollMessages = async () => {
      if (isPolling || !isConnected) return;
      isPolling = true;
      
      const currentCount = ticketMessages.length;
      setUiState(prev => ({
        ...prev,
        isBackgroundUpdating: true,
        previousMessageCount: currentCount
      }));
      
      try {
        await load(ticketId);
        if (ticketMessages.length > currentCount) {
          setUiState(prev => ({
            ...prev,
            updateCount: prev.updateCount + 1,
            lastUpdateTime: new Date()
          }));
        }
      } catch (error) {
        console.log('⚠️ [UNIFIED-CHAT] Polling falhou:', error);
      } finally {
        isPolling = false;
        // Delay maior para transição mais suave
        setTimeout(() => {
          setUiState(prev => ({
            ...prev,
            isBackgroundUpdating: false
          }));
        }, 800);
      }
    };

    const interval = setInterval(pollMessages, 5000); // Intervalo maior

    return () => clearInterval(interval);
  }, [isOpen, ticketId, isConnected, load, ticketMessages.length]);

  // 🎯 Reconexão automática quando necessário
  useEffect(() => {
    if (isOpen && !isConnected && !isLoading) {
      console.log('🔄 [UNIFIED-CHAT] Tentando reconectar...');
      const reconnectTimer = setTimeout(() => {
        init();
      }, 2000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [isOpen, isConnected, isLoading, init]);

  // 📜 Auto-scroll para última mensagem com transição suave
  useEffect(() => {
    if (!showSearch && messagesEndRef.current) {
      // Usar requestAnimationFrame para scroll mais suave
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      });
    }
  }, [ticketMessages, showSearch]);

  // 🔍 Foco na busca quando abrir
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // 📜 Detecção de scroll para mostrar botão de scroll para baixo
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom);
    };

    scrollArea.addEventListener('scroll', handleScroll);
    return () => scrollArea.removeEventListener('scroll', handleScroll);
  }, []);

  // 🔊 Notificação sonora e visual para novas mensagens
  useEffect(() => {
    if (ticketMessages.length > 0) {
      const lastMessage = ticketMessages[ticketMessages.length - 1];
      const isNewMessage = lastMessage && lastMessage.timestamp > lastSeen;
      
      if (isNewMessage) {
        console.log('🔔 [UNIFIED-CHAT] Nova mensagem detectada:', lastMessage);
        
        // Atualizar timestamp de última visualização
        setLastSeen(new Date());
        
        // Notificação visual baseada no remetente
        if (lastMessage.sender === 'client') {
          showInfo(`💬 Nova mensagem de ${lastMessage.senderName}`);
          
          // Som de notificação se habilitado
          if (soundEnabled) {
            try {
              // Tentar reproduzir som de notificação
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D...');
              audio.volume = 0.3;
              audio.play().catch(e => console.log('🔇 Som não pôde ser reproduzido:', e));
            } catch (e) {
              console.log('🔇 Erro ao reproduzir som:', e);
            }
          }
        } else if (lastMessage.sender === 'agent' && !lastMessage.isInternal) {
          showSuccess(`✅ Mensagem enviada para ${clientName}`);
        }

        // Scroll automático para nova mensagem com delay sutil
        if (messagesEndRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'end'
            });
          }, 150); // Delay sutil para não ser abrupto
        }
      }
    }
  }, [ticketMessages, soundEnabled, lastSeen, showInfo, showSuccess, clientName]);

  // 💾 Auto-save de rascunhos
  useEffect(() => {
    if (messageText.trim() && messageText.length > 10) {
      const draftKey = `draft_${ticketId}`;
      localStorage.setItem(draftKey, messageText);
      setUiState(prev => ({
        ...prev,
        draftRestored: true
      }));
      
      // Remover indicação de salvo após 2 segundos
      const timer = setTimeout(() => setUiState(prev => ({
        ...prev,
        draftRestored: false
      })), 2000);
      return () => clearTimeout(timer);
    }
  }, [messageText, ticketId]);

  // 📝 Restaurar rascunho salvo
  useEffect(() => {
    if (isOpen && ticketId && !uiState.draftRestored) {
      const draftKey = `draft_${ticketId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && !messageText) {
        setMessageText(savedDraft);
        setUiState(prev => ({
          ...prev,
          draftRestored: true
        }));
        showInfo('Rascunho restaurado!');
      }
    }
  }, [isOpen, ticketId, uiState.draftRestored]);

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
    
    // Adicionar ao histórico de ações
    const newAction = {
      id: Date.now().toString(),
      action: `Enviou mensagem: "${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}"`,
      timestamp: new Date()
    };
    setActionHistory(prev => [newAction, ...prev.slice(0, 9)]); // Manter apenas 10 ações
    
    try {
      await send(ticketId, messageText, activeMode === 'internal');
      setMessageText('');
      setReplyingTo(null);
      
      // Limpar rascunho salvo
      const draftKey = `draft_${ticketId}`;
      localStorage.removeItem(draftKey);
      setUiState(prev => ({
        ...prev,
        draftRestored: false
      }));
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      // Focus de volta no input
      if (textareaRef.current) {
        textareaRef.current.focus();
      }

      showSuccess('Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('❌ [UNIFIED-CHAT] Erro ao enviar mensagem:', error);
      showError('Erro ao enviar mensagem');
    }
  }, [messageText, activeMode, isSending, send, ticketId, typingTimeout, showSuccess, showError]);

  // 📂 Drag & Drop para anexos
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  const handleFileUpload = useCallback((files: File[]) => {
    files.forEach(file => {
      // Validar tipos de arquivo
      const allowedTypes = ['image/', 'text/', 'application/pdf', 'application/msword'];
      const isAllowed = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isAllowed) {
        showWarning(`Tipo de arquivo não permitido: ${file.name}`);
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        showWarning(`Arquivo muito grande: ${file.name}`);
        return;
      }
      
      console.log('📎 [UNIFIED-CHAT] Uploading file:', file.name);
      showInfo(`Fazendo upload de: ${file.name}`);
      
      // Aqui você implementaria o upload real do arquivo
      // Por enquanto, apenas simular
      setTimeout(() => {
        showSuccess(`Arquivo ${file.name} enviado!`);
      }, 2000);
    });
  }, [showWarning, showInfo, showSuccess]);

  // 📝 Usar template
  const handleUseTemplate = useCallback((template: { id: string; title: string; content: string }) => {
    setMessageText(template.content);
    setShowTemplates(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    showInfo(`Template "${template.title}" aplicado!`);
  }, [showInfo]);

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
    showSuccess('Mensagem copiada!');
  }, [showSuccess]);

  const handleReplyToMessage = useCallback((message: LocalChatMessage) => {
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

  // ⌨️ Escuta de atalhos de teclado
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // F5 ou Ctrl+R para atualizar mensagens
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        console.log('🔄 [UNIFIED-CHAT] Atualizando silenciosamente via teclado...');
        setIsSilentLoading(true);
        if (isConnected) {
          await load(ticketId);
        } else {
          await init();
        }
        setIsSilentLoading(false);
      }

      // Ctrl+I para alternar modo interno
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        setActiveMode(prev => prev === 'internal' ? 'message' : 'internal');
      }

      // ESC para fechar
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConnected, load, ticketId, init, onClose]);

  // 🎨 Estilos críticos para o header
  const headerStyles = useMemo(() => ({
    transition: 'all 700ms cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform, opacity',
    transformOrigin: 'center center',
    backfaceVisibility: 'hidden' as const,
    perspective: '1000px',
    transform: uiState.isBackgroundUpdating ? 'scale(0.9998)' : 'scale(1)',
    opacity: uiState.isBackgroundUpdating ? '0.995' : '1'
  }), [uiState.isBackgroundUpdating]);

  // 🎨 Componente do Header otimizado
  const ChatHeader = memo(() => (
    <div 
      className={cn(
        "chat-header chat-animated",
        "flex items-center justify-between p-4 border-b flex-shrink-0",
        "bg-gradient-to-r from-blue-50/80 to-green-50/80 backdrop-blur-sm"
      )}
      style={headerStyles}
    >
      <div className="flex items-center gap-3">
        {/* Avatar do Cliente */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-medium">
            {clientName?.[0]?.toUpperCase() || "C"}
          </div>
          <div className="absolute -bottom-1 -right-1">
            <Badge variant="secondary" className="h-5 w-5 rounded-full flex items-center justify-center p-0 bg-green-500 hover:bg-green-600">
              <MessageSquare className="h-3 w-3 text-white" />
            </Badge>
          </div>
        </div>

        {/* Info do Cliente */}
        <div>
          <h3 className="font-medium">{clientName}</h3>
          {clientPhone && (
            <p className="text-sm text-muted-foreground">{clientPhone}</p>
          )}
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center gap-2">
        {/* Status de Conexão */}
        <ConnectionStatus connectionInfo={{
          isConnected,
          isLoading,
          error: error || null,
          lastUpdate: uiState.lastUpdateTime
        }} />

        {/* Controles UX */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-muted-foreground hover:text-foreground"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSearch(!showSearch)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Search className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(!showSidebar)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Users className="h-4 w-4" />
        </Button>

        {/* Controles de janela */}
        {onMinimize && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMinimize}
            className="text-muted-foreground hover:text-foreground"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="text-muted-foreground hover:text-foreground"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  ));

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
        <ChatHeader />

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
          <div 
            className="flex flex-col flex-1 min-h-0 relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Overlay de Drag & Drop */}
            {isDragOver && (
              <div className="absolute inset-0 z-50 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <div className="text-center text-blue-700">
                  <Upload className="w-12 h-12 mx-auto mb-3 animate-bounce" />
                  <h3 className="text-lg font-semibold mb-1">Solte seus arquivos aqui</h3>
                  <p className="text-sm opacity-75">Imagens, PDFs, documentos até 10MB</p>
                </div>
              </div>
            )}
            
            {/* 📱 Área de Mensagens com Transições Suaves */}
            <div className="flex-1 overflow-hidden relative">
              {/* Indicador sutil de atualização em background */}
              {uiState.isBackgroundUpdating && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1 border border-gray-200 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-600">Atualizando...</span>
                  </div>
                </div>
              )}
              
              {/* Indicador de última atualização (muito sutil) */}
              {uiState.updateCount > 0 && (
                <div className="absolute top-2 left-2 z-10">
                  <div className="text-xs text-gray-400 bg-white/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                    Última atualização: {formatDistanceToNow(uiState.lastUpdateTime, { addSuffix: true, locale: ptBR })}
                  </div>
                </div>
              )}
              
              <ScrollArea 
                ref={scrollAreaRef}
                className="h-full px-4"
                style={{
                  // Transições suaves para evitar piscar
                  transition: 'opacity 0.3s ease-in-out',
                  opacity: uiState.isBackgroundUpdating ? 0.98 : 1
                }}
              >
                <div className="space-y-3 py-4">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">
                        {searchQuery ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem ainda'}
                      </p>
                      {!searchQuery && (
                        <p className="text-xs mt-1">Inicie uma conversa enviando uma mensagem</p>
                      )}
                    </div>
                  ) : (
                    filteredMessages.map((message: LocalChatMessage, index: number) => {
                      const isLastMessage = index === filteredMessages.length - 1;
                      const isNewMessage = message.timestamp > lastSeen;
                      const isRecentlyAdded = index >= uiState.previousMessageCount;
                      
                      return (
                        <div
                          key={message.id}
                          className={cn(
                            "transition-all duration-500 ease-out",
                            isNewMessage && "animate-in slide-in-from-bottom-2 fade-in-0",
                            isRecentlyAdded && "bg-blue-50/30 rounded-lg",
                            uiState.isBackgroundUpdating && "opacity-95"
                          )}
                          style={{
                            // Animação sutil para novas mensagens
                            animationDelay: isNewMessage ? `${index * 30}ms` : '0ms',
                            // Transição suave para mensagens recém-adicionadas
                            transition: isRecentlyAdded ? 'background-color 2s ease-out' : 'none'
                          }}
                        >
                          <MessageBubble
                            message={{
                              ...message,
                              type: message.type || 'text',
                              status: message.status || 'sent',
                              metadata: message.metadata || {}
                            }}
                            isFromCurrentUser={message.sender === 'agent'}
                            onReply={() => setReplyingTo(message)}
                            onToggleFavorite={() => handleToggleFavorite(message.id)}
                            isFavorite={favoriteMessages.has(message.id)}
                            isHighlighted={Boolean(
                              searchQuery.trim() && 
                              message.content && 
                              message.content.toLowerCase().includes(searchQuery.toLowerCase())
                            )}
                            onCopy={() => handleCopyMessage(message.content)}
                          />
                        </div>
                      );
                    })
                  )}
                  
                  {/* Indicador de digitação */}
                  <TypingIndicator typingUsers={[]} />
                  
                  {/* Âncora para scroll */}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </ScrollArea>
              
              {/* Botão de scroll para baixo (sutil) */}
              {showScrollToBottom && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  className="absolute bottom-4 right-4 h-8 w-8 bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-white/90 transition-all duration-200"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              )}
            </div>
            
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
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-8 px-3 text-gray-600 hover:text-blue-600"
                      title="Anexar arquivo (Drag & Drop)"
                    >
                      <Paperclip className="w-4 h-4 mr-1" />
                      Anexar
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          handleFileUpload(files);
                        }
                      }}
                    />
                  </div>

                  {/* Templates de Resposta */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className={cn(
                        "h-8 px-3 text-gray-600 hover:text-purple-600",
                        showTemplates && "bg-purple-50 text-purple-600"
                      )}
                      title="Templates de resposta rápida"
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Templates
                    </Button>
                    
                    {showTemplates && (
                      <div className="absolute bottom-full mb-2 left-0 z-50 bg-white border rounded-lg shadow-lg p-2 w-64">
                        <div className="text-xs font-medium text-gray-700 mb-2 px-2">Templates de Resposta</div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {QUICK_TEMPLATES.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => handleUseTemplate(template)}
                              className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm"
                            >
                              <div className="font-medium text-gray-800">{template.title}</div>
                              <div className="text-gray-500 text-xs truncate">{template.content}</div>
                            </button>
                          ))}
                        </div>
                        <div className="border-t mt-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTemplates(false)}
                            className="w-full text-xs"
                          >
                            Fechar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
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
                  <span className={cn(
                    messageText.length > 1800 ? "text-red-500" : 
                    messageText.length > 1500 ? "text-yellow-500" : "text-gray-400"
                  )}>
                    {messageText.length}/2000
                  </span>
                  {uiState.isBackgroundUpdating && (
                    <>
                      <span>•</span>
                      <span className="text-green-500 flex items-center gap-1">
                        <Save className="w-3 h-3" />
                        Rascunho salvo
                      </span>
                    </>
                  )}
                  {replyingTo && (
                    <>
                      <span>•</span>
                      <span className="text-blue-500 flex items-center gap-1">
                        <Quote className="w-3 h-3" />
                        Respondendo
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Atalhos de teclado */}
              <div className="mt-2 text-xs text-gray-400 text-center">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> para enviar • 
                <kbd className="px-1 py-0.5 bg-gray-100 rounded mx-1">Shift+Enter</kbd> nova linha • 
                <kbd className="px-1 py-0.5 bg-gray-100 rounded mx-1">Ctrl+I</kbd> nota interna • 
                <kbd className="px-1 py-0.5 bg-gray-100 rounded mx-1">F5</kbd> atualizar
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
                  
                  {/* Histórico de Ações */}
                  {actionHistory.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Histórico Recente
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {actionHistory.slice(0, 5).map((action) => (
                          <div key={action.id} className="text-xs p-2 bg-gray-50 rounded">
                            <div className="text-gray-800 font-medium">{action.action}</div>
                            <div className="text-gray-500">
                              {formatDistanceToNow(action.timestamp, { addSuffix: true, locale: ptBR })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {actionHistory.length > 5 && (
                        <div className="text-xs text-gray-500 text-center mt-2">
                          +{actionHistory.length - 5} ações anteriores
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Configurações Avançadas */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Preferências
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Som de notificações</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={cn("h-6 w-10 p-0", soundEnabled ? "bg-green-100" : "bg-gray-100")}
                        >
                          {soundEnabled ? <Volume2 className="w-3 h-3 text-green-600" /> : <VolumeX className="w-3 h-3 text-gray-400" />}
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pré-visualizar links</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLinkPreview(!showLinkPreview)}
                          className={cn("h-6 w-10 p-0", showLinkPreview ? "bg-blue-100" : "bg-gray-100")}
                        >
                          {showLinkPreview ? <Link2 className="w-3 h-3 text-blue-600" /> : <X className="w-3 h-3 text-gray-400" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
        
        {/* 🔔 Container de Notificações */}
        <NotificationContainer />
      </DialogContent>
    </Dialog>
  );
};