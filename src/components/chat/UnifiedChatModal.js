import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { X, Minimize2, Paperclip, Smile, Wifi, WifiOff, Search, Maximize2, Maximize, Settings, Volume2, VolumeX, MessageSquare, AlertCircle, Loader2, Archive, Pin, Flag, FileText, User, Save, Upload, Link2, Zap, History, Quote, ChevronDown, Minus } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInputTabs } from './MessageInputTabs';
import { ReplyPreview } from './ReplyPreview';
import { EmojiPicker } from './EmojiPicker';
import { useNotificationToast } from './NotificationToast';
import { TypingIndicator } from './TypingIndicator';
import { ConnectionStatus, useConnectionStatus } from './ConnectionStatus';
import { cn } from '../../lib/utils';
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
export const UnifiedChatModal = ({ isOpen, onClose, onMinimize, ticketId, clientName = "Cliente", clientPhone, className }) => {
    // 🚫 EARLY RETURN - DEVE ESTAR ANTES DE TODOS OS HOOKS
    if (!isOpen) {
        return null;
    }
    const { user } = useAuth();
    // 📌 Refs
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    const searchInputRef = useRef(null);
    const scrollAreaRef = useRef(null);
    const fileInputRef = useRef(null);
    // 🎯 Hooks avançados de UX
    const { success: showSuccess, error: showError, info: showInfo, warning: showWarning, NotificationContainer } = useNotificationToast();
    const { connectionInfo } = useConnectionStatus();
    // 🔗 Hook do Chat Store com WebSocket real
    const { isConnected, isLoading, isSending, error, messages, init, disconnect, join, send, load } = useChatStore();
    // 📝 Estados da UI
    const [messageText, setMessageText] = useState('');
    const [activeMode, setActiveMode] = useState('message');
    const [replyingTo, setReplyingTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [favoriteMessages, setFavoriteMessages] = useState(new Set());
    const [lastSeen, setLastSeen] = useState(new Date());
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);
    const [isSilentLoading, setIsSilentLoading] = useState(false);
    const [isNearBottom, setIsNearBottom] = useState(true);
    // 🆕 Novos estados para funcionalidades avançadas
    const [isDragOver, setIsDragOver] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showLinkPreview, setShowLinkPreview] = useState(true);
    const [actionHistory, setActionHistory] = useState([]);
    // 🔄 Estados simplificados
    const [draftRestored, setDraftRestored] = useState(false);
    // 🎯 Cache de mensagens otimizado
    const messageCache = useRef(new Map());
    // 💬 Mensagens do ticket atual com debug melhorado
    const ticketMessages = useMemo(() => {
        const rawMessages = messages[ticketId] || [];
        console.log(`🔍 [UNIFIED-CHAT] Debug mensagens para ticket ${ticketId}:`, {
            ticketId,
            totalMessages: rawMessages.length,
            messagesKeys: Object.keys(messages),
            firstMessage: rawMessages[0],
            lastMessage: rawMessages[rawMessages.length - 1],
            allMessages: rawMessages
        });
        // Converter para o formato local se necessário
        const convertedMessages = rawMessages.map((msg) => {
            // Verificar se já está no formato correto
            if (msg.sender && msg.senderName && msg.timestamp instanceof Date) {
                return msg;
            }
            // Converter do formato do store para o formato local
            const converted = {
                id: msg.id || `msg-${Date.now()}-${Math.random()}`,
                content: msg.content || '',
                sender: msg.sender || (msg.metadata?.is_from_client ? 'client' : 'agent'),
                senderName: msg.senderName || (msg.sender === 'client' ? 'Cliente' : 'Agente'),
                timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp || Date.now()),
                isInternal: msg.isInternal || false,
                type: msg.type || 'text',
                status: msg.status || 'sent',
                metadata: msg.metadata || {}
            };
            console.log(`🔄 [UNIFIED-CHAT] Detalhes da conversão da mensagem:`, {
                original: {
                    sender: msg.sender,
                    isFromClient: msg.metadata?.is_from_client,
                    senderId: msg.sender_id,
                    metadata: msg.metadata
                },
                converted: {
                    sender: converted.sender,
                    senderName: converted.senderName,
                    isInternal: converted.isInternal
                }
            });
            return converted;
        });
        console.log(`✅ [UNIFIED-CHAT] ${convertedMessages.length} mensagens convertidas para ticket ${ticketId}`);
        return convertedMessages;
    }, [messages, ticketId]);
    // 🔍 Mensagens filtradas por busca
    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim())
            return ticketMessages;
        const query = searchQuery.toLowerCase();
        return ticketMessages.filter((msg) => {
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
    // 📜 Detecção de scroll e auto-scroll
    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea)
            return;
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = scrollArea;
            const scrollBottom = scrollHeight - scrollTop - clientHeight;
            const newIsNearBottom = scrollBottom < 100;
            const shouldShowButton = scrollBottom > 200;
            setIsNearBottom(newIsNearBottom);
            setShowScrollToBottom(shouldShowButton);
        };
        scrollArea.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial position
        return () => scrollArea.removeEventListener('scroll', handleScroll);
    }, []);
    // 🔄 Carregamento inicial apenas (sem polling automático)
    useEffect(() => {
        if (isOpen && ticketId && isConnected) {
            console.log(`🔍 [UNIFIED-CHAT] === DEBUG CARREGAMENTO INICIAL ===`);
            console.log(`📋 [UNIFIED-CHAT] Estado atual:`, {
                isOpen,
                ticketId,
                isConnected,
                isLoading,
                totalTicketsComMensagens: Object.keys(messages).length,
                mensagensDoTicketAtual: messages[ticketId]?.length || 0,
                todasMensagens: messages
            });
            // Carregar mensagens apenas uma vez quando abrir
            console.log(`📥 [UNIFIED-CHAT] Iniciando carregamento de mensagens do ticket ${ticketId}...`);
            load(ticketId);
            // Debug adicional - verificar mensagens após 2 segundos
            setTimeout(() => {
                const updatedMessages = messages[ticketId] || [];
                console.log(`🔍 [UNIFIED-CHAT] === DEBUG PÓS-CARREGAMENTO (2s) ===`);
                console.log(`📊 [UNIFIED-CHAT] Mensagens após carregamento:`, {
                    ticketId,
                    totalMensagens: updatedMessages.length,
                    primeirasMensagens: updatedMessages.slice(0, 3),
                    ultimasMensagens: updatedMessages.slice(-3)
                });
                if (updatedMessages.length === 0) {
                    console.warn(`⚠️ [UNIFIED-CHAT] PROBLEMA: Nenhuma mensagem carregada para ticket ${ticketId}`);
                    console.warn(`💡 [UNIFIED-CHAT] Possíveis causas: WebSocket não conectado, ticket não existe, erro no servidor`);
                }
            }, 2000);
        }
    }, [isOpen, ticketId, isConnected]);
    // 🔄 Polling para garantir mensagens em tempo real
    useEffect(() => {
        if (!isOpen || !ticketId)
            return;
        const pollingInterval = setInterval(() => {
            if (isConnected) {
                console.log(`🔄 [UNIFIED-CHAT] Polling mensagens do ticket ${ticketId}`);
                load(ticketId);
            }
        }, 3000); // Polling a cada 3 segundos
        return () => clearInterval(pollingInterval);
    }, [isOpen, ticketId, isConnected, load]);
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
        if (!showSearch && messagesEndRef.current && isNearBottom) {
            // Usar requestAnimationFrame para scroll mais suave
            requestAnimationFrame(() => {
                messagesEndRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            });
        }
    }, [ticketMessages, showSearch, isNearBottom]);
    // 🔍 Foco na busca quando abrir
    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);
    // 📜 Auto-scroll apenas para novas mensagens quando próximo ao fim
    useEffect(() => {
        if (ticketMessages.length > 0 && isNearBottom && messagesEndRef.current) {
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
                            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D...');
                            audio.volume = 0.3;
                            audio.play().catch(e => console.log('🔇 Som não pôde ser reproduzido:', e));
                        }
                        catch (e) {
                            console.log('🔇 Erro ao reproduzir som:', e);
                        }
                    }
                }
                // Scroll suave para a nova mensagem apenas se estiver próximo ao fim
                messagesEndRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            }
        }
    }, [ticketMessages, soundEnabled, lastSeen, showInfo, isNearBottom]);
    // 💾 Auto-save de rascunhos
    useEffect(() => {
        if (messageText.trim() && messageText.length > 10) {
            const draftKey = `draft_${ticketId}`;
            localStorage.setItem(draftKey, messageText);
        }
    }, [messageText, ticketId]);
    // 📝 Restaurar rascunho salvo
    useEffect(() => {
        if (isOpen && ticketId && !draftRestored) {
            const draftKey = `draft_${ticketId}`;
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft && !messageText) {
                setMessageText(savedDraft);
                setDraftRestored(true);
                showInfo('Rascunho restaurado!');
            }
        }
    }, [isOpen, ticketId, draftRestored, messageText, showInfo]);
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
        if (!messageText.trim() || isSending)
            return;
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
            setDraftRestored(false);
            if (typingTimeout) {
                clearTimeout(typingTimeout);
                setTypingTimeout(null);
            }
            // Focus de volta no input
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
            showSuccess('Mensagem enviada com sucesso!');
        }
        catch (error) {
            console.error('❌ [UNIFIED-CHAT] Erro ao enviar mensagem:', error);
            showError('Erro ao enviar mensagem');
        }
    }, [messageText, activeMode, isSending, send, ticketId, typingTimeout, showSuccess, showError]);
    // 📂 Drag & Drop para anexos
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileUpload(files);
        }
    }, []);
    const handleFileUpload = useCallback((files) => {
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
    const handleUseTemplate = useCallback((template) => {
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
        if (isFullscreen)
            return cn(base, "w-screen h-screen max-w-none rounded-none");
        if (isExpanded)
            return cn(base, "max-w-7xl h-[95vh]");
        return cn(base, "max-w-5xl h-[90vh]");
    }, [isFullscreen, isExpanded]);
    const handleToggleFavorite = useCallback((messageId) => {
        setFavoriteMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            }
            else {
                newSet.add(messageId);
            }
            return newSet;
        });
    }, []);
    const handleCopyMessage = useCallback((content) => {
        navigator.clipboard.writeText(content);
        showSuccess('Mensagem copiada!');
    }, [showSuccess]);
    const handleReplyToMessage = useCallback((message) => {
        setReplyingTo(message);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);
    // 🎯 Status de conexão
    const connectionStatus = useMemo(() => {
        if (isLoading)
            return { icon: Loader2, text: 'Conectando...', color: 'text-yellow-500' };
        if (isConnected)
            return { icon: Wifi, text: 'Online', color: 'text-green-500' };
        if (error)
            return { icon: AlertCircle, text: 'Erro', color: 'text-red-500' };
        return { icon: WifiOff, text: 'Offline', color: 'text-gray-500' };
    }, [isLoading, isConnected, error]);
    // ⌨️ Escuta de atalhos de teclado
    useEffect(() => {
        const handleKeyDown = async (e) => {
            if (!isOpen)
                return;
            // F5 ou Ctrl+R para atualizar mensagens
            if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
                e.preventDefault();
                console.log('🔄 [UNIFIED-CHAT] Atualizando silenciosamente via teclado...');
                setIsSilentLoading(true);
                if (isConnected) {
                    await load(ticketId);
                }
                else {
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
        backfaceVisibility: 'hidden',
        perspective: '1000px'
    }), []);
    // 🎨 Componente do Header otimizado
    const ChatHeader = () => (_jsxs("div", { className: "flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold", children: clientName.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-900", children: clientName }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-500", children: [_jsx("span", { children: clientPhone }), _jsx(ConnectionStatus, { connectionInfo: {
                                            status: isConnected ? 'connected' : 'disconnected',
                                            latency: isConnected ? 50 : undefined,
                                            quality: isConnected ? 'good' : undefined,
                                            lastSeen: isConnected ? undefined : new Date(),
                                            serverStatus: 'online',
                                            clientsOnline: isConnected ? 1 : 0
                                        } })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowSearch(!showSearch), className: cn("h-8 px-2", showSearch && "bg-blue-50 text-blue-600"), title: "Buscar mensagens", children: _jsx(Search, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSoundEnabled(!soundEnabled), className: cn("h-8 px-2", !soundEnabled && "text-gray-400"), title: soundEnabled ? "Desativar som" : "Ativar som", children: soundEnabled ? _jsx(Volume2, { className: "w-4 h-4" }) : _jsx(VolumeX, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowSidebar(!showSidebar), className: cn("h-8 px-2", showSidebar && "bg-purple-50 text-purple-600"), title: "Configura\u00E7\u00F5es e informa\u00E7\u00F5es", children: _jsx(Settings, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
                            if (isFullscreen) {
                                setIsFullscreen(false);
                                setIsExpanded(false);
                            }
                            else if (isExpanded) {
                                setIsFullscreen(true);
                            }
                            else {
                                setIsExpanded(true);
                            }
                        }, className: "h-8 px-2", title: isFullscreen ? "Sair da tela cheia" :
                            isExpanded ? "Tela cheia" :
                                "Expandir", children: isFullscreen ? (_jsx(Minimize2, { className: "w-4 h-4" })) : isExpanded ? (_jsx(Maximize2, { className: "w-4 h-4" })) : (_jsx(Maximize, { className: "w-4 h-4" })) }), onMinimize && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onMinimize, className: "h-8 px-2", title: "Minimizar", children: _jsx(Minus, { className: "w-4 h-4" }) })), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, className: "h-8 px-2 hover:text-red-600", title: "Fechar", children: _jsx(X, { className: "w-4 h-4" }) })] })] }));
    // 🔄 Sistema de debug avançado com force reload manual
    useEffect(() => {
        // Disponibilizar função de debug globalmente
        const debugUnifiedChat = () => {
            const currentState = {
                isOpen,
                ticketId,
                isConnected,
                isLoading,
                error,
                totalMessages: ticketMessages.length,
                messageStats,
                socketStatus: isConnected ? 'CONECTADO' : 'DESCONECTADO',
                allMessages: messages,
                currentTicketMessages: messages[ticketId] || []
            };
            console.log(`🔍 [DEBUG-UNIFIED-CHAT] === ESTADO COMPLETO ===`, currentState);
            // Forçar reload das mensagens
            if (isConnected && ticketId) {
                console.log(`🔄 [DEBUG-UNIFIED-CHAT] Forçando reload das mensagens...`);
                load(ticketId);
            }
            else {
                console.warn(`⚠️ [DEBUG-UNIFIED-CHAT] Não é possível recarregar: isConnected=${isConnected}, ticketId=${ticketId}`);
            }
            return currentState;
        };
        // Disponibilizar no console do navegador
        window.debugUnifiedChat = debugUnifiedChat;
        return () => {
            delete window.debugUnifiedChat;
        };
    }, [isOpen, ticketId, isConnected, isLoading, error, ticketMessages, messageStats, messages, load]);
    // 🔄 Debug das mensagens em tempo real
    useEffect(() => {
        console.log(`🔍 [UNIFIED-CHAT] === MUDANÇA NO ESTADO DAS MENSAGENS ===`);
        console.log(`📊 [UNIFIED-CHAT] Ticket ${ticketId}:`, {
            totalMensagens: ticketMessages.length,
            mensagensDetalhadas: ticketMessages.map(msg => ({
                id: msg.id,
                sender: msg.sender,
                content: msg.content.substring(0, 30),
                timestamp: msg.timestamp
            })),
            filteredCount: filteredMessages.length,
            searchActive: Boolean(searchQuery.trim())
        });
        // Se não há mensagens, fornecer debugging adicional
        if (ticketMessages.length === 0) {
            console.warn(`⚠️ [UNIFIED-CHAT] PROBLEMA: Zero mensagens para ticket ${ticketId}`);
            console.warn(`🔍 [UNIFIED-CHAT] Debug completo:`, {
                isSocketConnected: isConnected,
                isModalOpen: isOpen,
                allTicketsWithMessages: Object.keys(messages),
                rawMessagesFromStore: messages[ticketId],
                isLoading,
                error
            });
            // Tentar recarregar automaticamente se conectado
            if (isConnected && isOpen && !isLoading) {
                console.log(`🔄 [UNIFIED-CHAT] Auto-retry: Tentando recarregar mensagens automaticamente...`);
                setTimeout(() => {
                    load(ticketId);
                }, 1000);
            }
        }
    }, [ticketMessages, filteredMessages, ticketId, isConnected, isOpen, isLoading, error, messages, searchQuery, load]);
    // 🔄 Atualização em tempo real de mensagens
    useEffect(() => {
        const handleNewMessage = (event) => {
            const { ticketId: messageTicketId, message } = event.detail;
            if (messageTicketId === ticketId) {
                console.log('📨 [UNIFIED-CHAT] Nova mensagem recebida:', message);
                // Atualizar última visualização
                setLastSeen(new Date());
                // Notificação visual e sonora
                if (message.sender === 'client') {
                    showInfo(`💬 Nova mensagem de ${message.senderName}`);
                    // Som de notificação se habilitado
                    if (soundEnabled) {
                        try {
                            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAkUXrTp66hVFApGn+D...');
                            audio.volume = 0.3;
                            audio.play().catch(e => console.log('🔇 Som não pôde ser reproduzido:', e));
                        }
                        catch (e) {
                            console.log('🔇 Erro ao reproduzir som:', e);
                        }
                    }
                }
                // Scroll automático para nova mensagem apenas se estiver próximo ao fim
                if (messagesEndRef.current && isNearBottom) {
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'end'
                        });
                    }, 150);
                }
            }
        };
        // Registrar listener para eventos de nova mensagem
        window.addEventListener('chat-message-received', handleNewMessage);
        return () => {
            window.removeEventListener('chat-message-received', handleNewMessage);
        };
    }, [ticketId, soundEnabled, showInfo, showSuccess, isNearBottom]);
    // 🔌 WebSocket setup integrado com chatStore
    useEffect(() => {
        if (!ticketId || !isConnected)
            return;
        console.log('🔌 [CHAT] Iniciando integração WebSocket para ticket:', ticketId);
        // Configurar listener de novas mensagens
        const handleNewMessage = (event) => {
            const { ticketId: messageTicketId, message } = event.detail;
            if (messageTicketId === ticketId) {
                console.log('📨 [CHAT] Nova mensagem recebida via WebSocket:', message);
                // Auto-scroll se estiver próximo ao fim
                if (isNearBottom && messagesEndRef.current) {
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                }
            }
        };
        // Registrar listener
        window.addEventListener('chat-message-received', handleNewMessage);
        // Cleanup
        return () => {
            console.log('👋 [CHAT] Limpando listeners WebSocket');
            window.removeEventListener('chat-message-received', handleNewMessage);
        };
    }, [ticketId, isConnected, isNearBottom]);
    // Função para scroll
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);
    // Detectar proximidade com o fim
    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const bottomThreshold = 100; // pixels do fim
        setIsNearBottom(scrollHeight - (scrollTop + clientHeight) < bottomThreshold);
    }, []);
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: cn(getModalClasses(), "[&>button]:hidden"), children: [_jsxs(DialogTitle, { className: "sr-only", children: ["Chat do Ticket ", ticketId, " - ", clientName] }), _jsx(ChatHeader, {}), showSearch && (_jsxs("div", { className: "p-3 border-b bg-gray-50", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx(Input, { ref: searchInputRef, placeholder: "Buscar mensagens, remetente...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "pl-10 pr-10" }), searchQuery && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSearchQuery(''), className: "absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0", children: _jsx(X, { className: "w-3 h-3" }) }))] }), searchQuery && (_jsxs("div", { className: "mt-2 text-xs text-gray-500", children: [filteredMessages.length, " de ", ticketMessages.length, " mensagens encontradas"] }))] })), _jsxs("div", { className: "flex flex-1 min-h-0", children: [_jsxs("div", { className: "flex flex-col flex-1 min-h-0 relative", onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, children: [isDragOver && (_jsx("div", { className: "absolute inset-0 z-50 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center backdrop-blur-sm", children: _jsxs("div", { className: "text-center text-blue-700", children: [_jsx(Upload, { className: "w-12 h-12 mx-auto mb-3 animate-bounce" }), _jsx("h3", { className: "text-lg font-semibold mb-1", children: "Solte seus arquivos aqui" }), _jsx("p", { className: "text-sm opacity-75", children: "Imagens, PDFs, documentos at\u00E9 10MB" })] }) })), _jsxs("div", { className: "flex-1 overflow-hidden relative", children: [_jsx(ScrollArea, { ref: scrollAreaRef, className: "h-full px-4", onScroll: handleScroll, children: _jsxs("div", { className: "space-y-3 py-4", children: [filteredMessages.length === 0 ? (_jsxs("div", { className: "text-center py-8 text-gray-500", children: [_jsx(MessageSquare, { className: "w-12 h-12 mx-auto mb-3 opacity-50" }), _jsx("p", { className: "text-sm", children: searchQuery ? 'Nenhuma mensagem encontrada' : 'Nenhuma mensagem ainda' }), !searchQuery && (_jsx("p", { className: "text-xs mt-1", children: "Inicie uma conversa enviando uma mensagem" }))] })) : (filteredMessages.map((message, index) => {
                                                        return (_jsx("div", { className: "transition-all duration-300 ease-out", children: _jsx(MessageBubble, { message: {
                                                                    ...message,
                                                                    type: message.type || 'text',
                                                                    status: message.status || 'sent',
                                                                    metadata: message.metadata || {}
                                                                }, isFromCurrentUser: message.sender === 'agent', onReply: () => setReplyingTo(message), onToggleFavorite: () => handleToggleFavorite(message.id), isFavorite: favoriteMessages.has(message.id), isHighlighted: Boolean(searchQuery.trim() &&
                                                                    message.content &&
                                                                    message.content.toLowerCase().includes(searchQuery.toLowerCase())), onCopy: () => handleCopyMessage(message.content) }) }, message.id));
                                                    })), _jsx(TypingIndicator, { typingUsers: [] }), _jsx("div", { ref: messagesEndRef, className: "h-1" })] }) }), showScrollToBottom && (_jsx(Button, { variant: "ghost", size: "icon", onClick: () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), className: "absolute bottom-4 right-4 h-8 w-8 bg-white/80 backdrop-blur-sm border shadow-sm hover:bg-white/90 transition-all duration-200", children: _jsx(ChevronDown, { className: "w-4 h-4" }) }))] }), replyingTo && (_jsx(ReplyPreview, { replyingTo: replyingTo, onCancel: () => setReplyingTo(null) })), _jsxs("div", { className: "border-t p-4 bg-white", children: [_jsx(MessageInputTabs, { activeMode: activeMode, onModeChange: setActiveMode, messageText: messageText, onMessageChange: (text) => {
                                                setMessageText(text);
                                                handleTypingStart();
                                            }, onSend: handleSendMessage, isLoading: isSending, ref: textareaRef }), _jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => fileInputRef.current?.click(), className: "h-8 px-3 text-gray-600 hover:text-blue-600", title: "Anexar arquivo (Drag & Drop)", children: [_jsx(Paperclip, { className: "w-4 h-4 mr-1" }), "Anexar"] }), _jsx("input", { ref: fileInputRef, type: "file", multiple: true, className: "hidden", accept: ".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt", onChange: (e) => {
                                                                        const files = Array.from(e.target.files || []);
                                                                        if (files.length > 0) {
                                                                            handleFileUpload(files);
                                                                        }
                                                                    } })] }), _jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setShowTemplates(!showTemplates), className: cn("h-8 px-3 text-gray-600 hover:text-purple-600", showTemplates && "bg-purple-50 text-purple-600"), title: "Templates de resposta r\u00E1pida", children: [_jsx(Zap, { className: "w-4 h-4 mr-1" }), "Templates"] }), showTemplates && (_jsxs("div", { className: "absolute bottom-full mb-2 left-0 z-50 bg-white border rounded-lg shadow-lg p-2 w-64", children: [_jsx("div", { className: "text-xs font-medium text-gray-700 mb-2 px-2", children: "Templates de Resposta" }), _jsx("div", { className: "space-y-1 max-h-48 overflow-y-auto", children: QUICK_TEMPLATES.map((template) => (_jsxs("button", { onClick: () => handleUseTemplate(template), className: "w-full text-left p-2 hover:bg-gray-50 rounded text-sm", children: [_jsx("div", { className: "font-medium text-gray-800", children: template.title }), _jsx("div", { className: "text-gray-500 text-xs truncate", children: template.content })] }, template.id))) }), _jsx("div", { className: "border-t mt-2 pt-2", children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowTemplates(false), className: "w-full text-xs", children: "Fechar" }) })] }))] }), _jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => setShowEmojiPicker(!showEmojiPicker), className: cn("h-8 px-3 text-gray-600 hover:text-yellow-600", showEmojiPicker && "bg-yellow-50 text-yellow-600"), title: "Emojis", children: [_jsx(Smile, { className: "w-4 h-4 mr-1" }), "Emoji"] }), showEmojiPicker && (_jsx("div", { className: "absolute bottom-full mb-2 left-0 z-50", children: _jsx(EmojiPicker, { onEmojiSelect: (emoji) => {
                                                                            setMessageText(prev => prev + emoji);
                                                                            setShowEmojiPicker(false);
                                                                        }, onClose: () => setShowEmojiPicker(false) }) }))] })] }), _jsxs("div", { className: "flex items-center gap-3 text-xs text-gray-400", children: [_jsxs("span", { children: ["Ticket #", ticketId] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { className: cn(messageText.length > 1800 ? "text-red-500" :
                                                                messageText.length > 1500 ? "text-yellow-500" : "text-gray-400"), children: [messageText.length, "/2000"] }), draftRestored && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u2022" }), _jsxs("span", { className: "text-green-500 flex items-center gap-1", children: [_jsx(Save, { className: "w-3 h-3" }), "Rascunho salvo"] })] })), replyingTo && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u2022" }), _jsxs("span", { className: "text-blue-500 flex items-center gap-1", children: [_jsx(Quote, { className: "w-3 h-3" }), "Respondendo"] })] }))] })] }), _jsxs("div", { className: "mt-2 text-xs text-gray-400 text-center", children: [_jsx("kbd", { className: "px-1 py-0.5 bg-gray-100 rounded", children: "Enter" }), " para enviar \u2022", _jsx("kbd", { className: "px-1 py-0.5 bg-gray-100 rounded mx-1", children: "Shift+Enter" }), " nova linha \u2022", _jsx("kbd", { className: "px-1 py-0.5 bg-gray-100 rounded mx-1", children: "Ctrl+I" }), " nota interna \u2022", _jsx("kbd", { className: "px-1 py-0.5 bg-gray-100 rounded mx-1", children: "F5" }), " atualizar"] })] })] }), showSidebar && (_jsxs("div", { className: "w-80 border-l bg-white flex flex-col", children: [_jsx("div", { className: "p-4 border-b bg-gray-50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-semibold text-gray-800", children: "Informa\u00E7\u00F5es" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setShowSidebar(false), className: "h-6 w-6", children: _jsx(X, { className: "w-4 h-4" }) })] }) }), _jsx(ScrollArea, { className: "flex-1 p-4", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-gray-800 mb-3 flex items-center gap-2", children: [_jsx(User, { className: "w-4 h-4" }), "Cliente"] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Nome:" }), _jsx("span", { className: "font-medium", children: clientName })] }), clientPhone && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "Telefone:" }), _jsx("span", { className: "font-medium text-blue-600", children: clientPhone })] }))] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-gray-800 mb-3 flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), "Estat\u00EDsticas"] }), _jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [_jsxs("div", { className: "bg-blue-50 p-3 rounded-lg text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: messageStats.total }), _jsx("div", { className: "text-gray-600", children: "Total" })] }), _jsxs("div", { className: "bg-green-50 p-3 rounded-lg text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: messageStats.fromClient }), _jsx("div", { className: "text-gray-600", children: "Cliente" })] }), _jsxs("div", { className: "bg-purple-50 p-3 rounded-lg text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: messageStats.fromAgent }), _jsx("div", { className: "text-gray-600", children: "Agente" })] }), _jsxs("div", { className: "bg-orange-50 p-3 rounded-lg text-center", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: messageStats.internal }), _jsx("div", { className: "text-gray-600", children: "Internas" })] })] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-gray-800 mb-3 flex items-center gap-2", children: [_jsx(Settings, { className: "w-4 h-4" }), "A\u00E7\u00F5es"] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-start", children: [_jsx(Archive, { className: "w-4 h-4 mr-2" }), "Arquivar conversa"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-start", children: [_jsx(Pin, { className: "w-4 h-4 mr-2" }), "Fixar conversa"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-start", children: [_jsx(Flag, { className: "w-4 h-4 mr-2" }), "Marcar importante"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "w-full justify-start", children: [_jsx(FileText, { className: "w-4 h-4 mr-2" }), "Exportar chat"] })] })] }), _jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-gray-800 mb-3 flex items-center gap-2", children: [_jsx(Wifi, { className: "w-4 h-4" }), "Conex\u00E3o"] }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-gray-600", children: "Status:" }), _jsx(Badge, { variant: isConnected ? "default" : "secondary", className: "text-xs", children: connectionStatus.text })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "\u00DAltima atualiza\u00E7\u00E3o:" }), _jsx("span", { className: "text-gray-800", children: formatDistanceToNow(new Date(), { addSuffix: true, locale: ptBR }) })] }), error && (_jsx("div", { className: "p-2 bg-red-50 rounded text-red-700 text-xs", children: error }))] })] }), actionHistory.length > 0 && (_jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-gray-800 mb-3 flex items-center gap-2", children: [_jsx(History, { className: "w-4 h-4" }), "Hist\u00F3rico Recente"] }), _jsx("div", { className: "space-y-2 max-h-32 overflow-y-auto", children: actionHistory.slice(0, 5).map((action) => (_jsxs("div", { className: "text-xs p-2 bg-gray-50 rounded", children: [_jsx("div", { className: "text-gray-800 font-medium", children: action.action }), _jsx("div", { className: "text-gray-500", children: formatDistanceToNow(action.timestamp, { addSuffix: true, locale: ptBR }) })] }, action.id))) }), actionHistory.length > 5 && (_jsxs("div", { className: "text-xs text-gray-500 text-center mt-2", children: ["+", actionHistory.length - 5, " a\u00E7\u00F5es anteriores"] }))] })), _jsxs("div", { children: [_jsxs("h4", { className: "font-medium text-gray-800 mb-3 flex items-center gap-2", children: [_jsx(Settings, { className: "w-4 h-4" }), "Prefer\u00EAncias"] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Som de notifica\u00E7\u00F5es" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setSoundEnabled(!soundEnabled), className: cn("h-6 w-10 p-0", soundEnabled ? "bg-green-100" : "bg-gray-100"), children: soundEnabled ? _jsx(Volume2, { className: "w-3 h-3 text-green-600" }) : _jsx(VolumeX, { className: "w-3 h-3 text-gray-400" }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Pr\u00E9-visualizar links" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setShowLinkPreview(!showLinkPreview), className: cn("h-6 w-10 p-0", showLinkPreview ? "bg-blue-100" : "bg-gray-100"), children: showLinkPreview ? _jsx(Link2, { className: "w-3 h-3 text-blue-600" }) : _jsx(X, { className: "w-3 h-3 text-gray-400" }) })] })] })] })] }) })] }))] }), _jsx(NotificationContainer, {})] }) }));
};
