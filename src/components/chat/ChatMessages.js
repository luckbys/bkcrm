import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useMemo } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Check, CheckCheck, Clock, AlertCircle, Reply, MoreVertical, Shield, User } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
const MessageBubble = ({ message, isOwn, showAvatar, showTimestamp, onReply, onEdit, onDelete }) => {
    const formatTime = (date) => {
        if (isToday(date)) {
            return format(date, 'HH:mm', { locale: ptBR });
        }
        else if (isYesterday(date)) {
            return `Ontem ${format(date, 'HH:mm', { locale: ptBR })}`;
        }
        else {
            return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
        }
    };
    const getStatusIcon = () => {
        switch (message.status) {
            case 'sending':
                return _jsx(Clock, { className: "w-3 h-3 text-gray-400" });
            case 'sent':
                return _jsx(Check, { className: "w-3 h-3 text-gray-400" });
            case 'delivered':
                return _jsx(CheckCheck, { className: "w-3 h-3 text-gray-400" });
            case 'read':
                return _jsx(CheckCheck, { className: "w-3 h-3 text-blue-500" });
            case 'failed':
                return _jsx(AlertCircle, { className: "w-3 h-3 text-red-500" });
            default:
                return null;
        }
    };
    return (_jsxs("div", { className: cn("flex gap-3 mb-4", isOwn && "flex-row-reverse"), children: [showAvatar && (_jsx("div", { className: "flex-shrink-0", children: _jsx(Avatar, { className: "w-8 h-8", children: _jsx(AvatarFallback, { className: cn("text-xs font-medium", isOwn ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"), children: message.senderName.charAt(0).toUpperCase() }) }) })), _jsxs("div", { className: cn("flex flex-col max-w-[75%]", isOwn && "items-end"), children: [showAvatar && (_jsxs("div", { className: cn("flex items-center gap-2 mb-1 text-xs font-medium", isOwn ? "flex-row-reverse text-blue-700" : "text-gray-700"), children: [_jsx("span", { children: message.senderName }), message.isInternal && (_jsxs(Badge, { variant: "outline", className: "text-xs px-1 py-0", children: [_jsx(Shield, { className: "w-3 h-3 mr-1" }), "Interno"] }))] })), _jsxs("div", { className: cn("relative group rounded-lg px-3 py-2 shadow-sm", isOwn
                            ? message.isInternal
                                ? "bg-yellow-100 text-yellow-900 border border-yellow-200"
                                : "bg-blue-500 text-white"
                            : "bg-white text-gray-900 border border-gray-200"), children: [_jsx("div", { className: "whitespace-pre-wrap break-words", children: message.content }), showTimestamp && (_jsxs("div", { className: cn("flex items-center gap-1 mt-1 text-xs opacity-70", isOwn ? "justify-end" : "justify-start"), children: [_jsx("span", { children: formatTime(message.timestamp) }), isOwn && getStatusIcon()] })), _jsx("div", { className: cn("absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity", isOwn ? "left-0" : "right-0"), children: _jsxs("div", { className: "flex items-center gap-1 bg-white rounded-lg shadow-lg border p-1", children: [onReply && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", children: _jsx(Reply, { className: "w-3 h-3" }) })), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", children: _jsx(MoreVertical, { className: "w-3 h-3" }) })] }) })] })] })] }));
};
const TypingIndicator = ({ users }) => {
    if (users.length === 0)
        return null;
    return (_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Avatar, { className: "w-8 h-8", children: _jsx(AvatarFallback, { className: "bg-gray-100", children: _jsx(User, { className: "w-4 h-4" }) }) }), _jsx("div", { className: "bg-gray-100 rounded-lg px-3 py-2", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm text-gray-600", children: [users.length === 1 ? users[0] : `${users.length} pessoas`, " digitando"] }), _jsxs("div", { className: "flex gap-1", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce" }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.1s' } }), _jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full animate-bounce", style: { animationDelay: '0.2s' } })] })] }) })] }));
};
export const ChatMessages = ({ messages, isLoading, isTyping, typingUsers, searchQuery = '', isCompactMode = false, onReply, onEdit, onDelete, onReaction }) => {
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    // 🔍 Filtrar mensagens por busca
    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim())
            return messages;
        const query = searchQuery.toLowerCase();
        return messages.filter(msg => msg.content.toLowerCase().includes(query) ||
            msg.senderName.toLowerCase().includes(query));
    }, [messages, searchQuery]);
    // 📜 Scroll automático para novas mensagens
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    // 📅 Agrupar mensagens por data
    const groupedMessages = useMemo(() => {
        const groups = [];
        let currentDate = '';
        let currentGroup = [];
        filteredMessages.forEach(message => {
            const messageDate = format(message.timestamp, 'yyyy-MM-dd');
            if (messageDate !== currentDate) {
                if (currentGroup.length > 0) {
                    groups.push({ date: currentDate, messages: currentGroup });
                }
                currentDate = messageDate;
                currentGroup = [message];
            }
            else {
                currentGroup.push(message);
            }
        });
        if (currentGroup.length > 0) {
            groups.push({ date: currentDate, messages: currentGroup });
        }
        return groups;
    }, [filteredMessages]);
    const formatDateSeparator = (dateStr) => {
        const date = new Date(dateStr);
        if (isToday(date))
            return 'Hoje';
        if (isYesterday(date))
            return 'Ontem';
        return format(date, "dd 'de' MMMM", { locale: ptBR });
    };
    if (isLoading) {
        return (_jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" }), _jsx("p", { className: "text-gray-600", children: "Carregando mensagens..." })] }) }));
    }
    return (_jsxs("div", { ref: containerRef, className: "flex-1 overflow-y-auto p-4 space-y-1", style: { maxHeight: 'calc(100vh - 200px)' }, children: [filteredMessages.length === 0 && !isLoading && (_jsx("div", { className: "flex-1 flex items-center justify-center", children: _jsxs("div", { className: "text-center text-gray-500", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83D\uDCAC" }), _jsx("p", { children: "Nenhuma mensagem ainda" }), _jsx("p", { className: "text-sm", children: "Inicie uma conversa!" })] }) })), groupedMessages.map(group => (_jsxs("div", { children: [_jsx("div", { className: "flex justify-center my-4", children: _jsx("div", { className: "bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600", children: formatDateSeparator(group.date) }) }), group.messages.map((message, index) => {
                        const prevMessage = group.messages[index - 1];
                        const isOwn = message.sender === 'agent';
                        const showAvatar = !prevMessage || prevMessage.sender !== message.sender || !isCompactMode;
                        const showTimestamp = !isCompactMode || index === group.messages.length - 1;
                        return (_jsx(MessageBubble, { message: message, isOwn: isOwn, showAvatar: showAvatar, showTimestamp: showTimestamp, onReply: onReply, onEdit: onEdit, onDelete: onDelete }, message.id));
                    })] }, group.date))), isTyping && _jsx(TypingIndicator, { users: typingUsers }), _jsx("div", { ref: messagesEndRef })] }));
};
