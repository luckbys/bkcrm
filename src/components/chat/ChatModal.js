import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// 🎯 MODAL DE CHAT MODERNO
// Componente principal com arquitetura robusta
import { useState, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { X, WifiOff, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ChatProvider, useChat } from '../../contexts/ChatContextV2';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';
// 🎨 Componente interno que usa o contexto
const ChatModalContent = ({ isOpen, onClose, onMinimize, className }) => {
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
    const handleSearch = useCallback((query) => {
        setSearchQuery(query);
    }, []);
    // 🎯 Participante principal (cliente)
    const clientParticipant = configuration.participants.find(p => p.role === 'client');
    return (_jsxs(DialogContent, { className: cn("max-w-6xl w-full h-[95vh] p-0 gap-0 overflow-hidden bg-white border-none shadow-2xl", className), children: [_jsxs(DialogTitle, { className: "sr-only", children: ["Chat com ", clientParticipant?.name || 'Cliente'] }), _jsx(DialogDescription, { className: "sr-only", children: "Interface de chat para comunica\u00E7\u00E3o em tempo real" }), _jsxs("div", { className: "flex h-full", children: [_jsxs("div", { className: "flex flex-col flex-1 min-h-0", children: [_jsx(ChatHeader, { participant: clientParticipant || {
                                    id: 'unknown',
                                    name: 'Cliente',
                                    role: 'client',
                                    isOnline: false
                                }, channel: configuration.channel, state: state, onClose: onClose, onMinimize: onMinimize, onSettings: handleSettings, onCall: handleCall, onVideoCall: handleVideoCall, onSearch: handleSearch, searchQuery: searchQuery, isCompactMode: isCompactMode, onToggleCompact: () => setIsCompactMode(!isCompactMode) }), _jsx(ChatMessages, { messages: filteredMessages, isLoading: state.isLoading, isTyping: state.isTyping, typingUsers: state.typingUsers, searchQuery: searchQuery, isCompactMode: isCompactMode, onReply: (message) => console.log('🔧 Reply:', message), onEdit: (message) => console.log('🔧 Edit:', message), onDelete: (message) => console.log('🔧 Delete:', message), onReaction: (message, emoji) => console.log('🔧 Reaction:', message, emoji) }), _jsx(ChatInput, { onSend: actions.sendMessage, isLoading: state.isLoading, placeholder: "Digite sua mensagem...", maxLength: configuration.settings.maxMessageLength, allowFileUpload: configuration.settings.allowedFileTypes.length > 0, allowEmojis: configuration.channel.settings.allowEmojis, onTyping: actions.setTyping })] }), showSidebar && (_jsx(ChatSidebar, { participant: clientParticipant, configuration: configuration, state: state, onClose: () => setShowSidebar(false), messagesCount: messages.length, unreadCount: state.unreadCount }))] }), state.connectionStatus !== 'connected' && (_jsx("div", { className: "absolute top-4 right-4 z-50", children: _jsxs(Badge, { variant: "outline", className: cn("flex items-center gap-2 animate-pulse", state.connectionStatus === 'connecting' && "border-yellow-300 bg-yellow-50 text-yellow-700", state.connectionStatus === 'disconnected' && "border-red-300 bg-red-50 text-red-700", state.connectionStatus === 'error' && "border-red-500 bg-red-100 text-red-800"), children: [state.connectionStatus === 'connecting' && (_jsxs(_Fragment, { children: [_jsx(Activity, { className: "w-3 h-3 animate-spin" }), "Conectando..."] })), state.connectionStatus === 'disconnected' && (_jsxs(_Fragment, { children: [_jsx(WifiOff, { className: "w-3 h-3" }), "Desconectado"] })), state.connectionStatus === 'error' && (_jsxs(_Fragment, { children: [_jsx(X, { className: "w-3 h-3" }), "Erro de conex\u00E3o"] }))] }) }))] }));
};
// 🎯 Componente principal com Provider
export const ChatModal = ({ ticketId, isOpen, onClose, onMinimize, className }) => {
    // 🏗️ Configuração do chat baseada no ticket
    const configuration = useMemo(() => ({
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
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsx(ChatProvider, { configuration: configuration, children: _jsx(ChatModalContent, { isOpen: isOpen, onClose: onClose, onMinimize: onMinimize, className: className }) }) }));
};
