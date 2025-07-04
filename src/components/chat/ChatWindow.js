import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// 🪟 COMPONENTE PRINCIPAL DE CHAT COM WEBSOCKET
import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { X, Minimize2, Paperclip, Smile, Wifi, WifiOff, Search, Maximize2, Maximize } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { MessageInputTabs } from './MessageInputTabs';
import { ReplyPreview } from './ReplyPreview';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '../lib/utils';
import { useChatSocket } from '../hooks/useChatSocket';
import { useAuth } from '../hooks/useAuth';
export const ChatWindow = ({ isOpen, onClose, onMinimize, ticketId, clientName = "Cliente", clientPhone, className }) => {
    const { user } = useAuth();
    const { messages, typingUsers, isConnected, isLoading, isSending, handleJoinTicket, handleLeaveTicket, handleSendMessage: sendRealMessage, handleTypingStart, handleTypingStop, } = useChatSocket();
    const [messageText, setMessageText] = useState('');
    const [activeMode, setActiveMode] = useState('message');
    const [replyingTo, setReplyingTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const messagesEndRef = useRef(null);
    const searchInputRef = useRef(null);
    useEffect(() => {
        if (isOpen && ticketId) {
            handleJoinTicket(ticketId);
        }
        return () => {
            if (isOpen && ticketId) {
                handleLeaveTicket();
            }
        };
    }, [isOpen, ticketId, handleJoinTicket, handleLeaveTicket]);
    const filteredMessages = React.useMemo(() => {
        if (!searchQuery.trim())
            return messages;
        return messages.filter(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [messages, searchQuery]);
    useEffect(() => {
        if (!showSearch) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredMessages, showSearch]);
    useEffect(() => {
        if (showSearch) {
            searchInputRef.current?.focus();
        }
    }, [showSearch]);
    const handleSendMessage = async () => {
        if (!messageText.trim())
            return;
        await sendRealMessage(messageText, activeMode === 'internal');
        setMessageText('');
        setReplyingTo(null);
        handleTypingStop();
    };
    const getClientInitials = () => clientName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'C';
    const getModalClasses = () => {
        const base = "p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl bg-white flex flex-col transition-all duration-300";
        if (isFullscreen)
            return cn(base, "w-screen h-screen max-w-none rounded-none");
        if (isExpanded)
            return cn(base, "max-w-7xl h-[95vh]");
        return cn(base, "max-w-5xl h-[90vh]");
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: getModalClasses(), children: [_jsxs(DialogTitle, { className: "sr-only", children: ["Chat do Ticket ", ticketId] }), _jsxs("div", { className: "flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-11 h-11 bg-gradient-to-br from-blue-500 to-green-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md", children: getClientInitials() }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-gray-800", children: clientName }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500", children: [isConnected ? _jsx(Wifi, { className: "w-3 h-3 text-green-500" }) : _jsx(WifiOff, { className: "w-3 h-3 text-red-500" }), _jsx("span", { children: isConnected ? 'Online' : 'Offline' }), typingUsers.length > 0 && _jsx("span", { className: "text-blue-500 animate-pulse", children: "digitando..." })] })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setShowSearch(s => !s), children: _jsx(Search, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setIsExpanded(!isExpanded), children: _jsx(Maximize, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setIsFullscreen(!isFullscreen), children: _jsx(Maximize2, { className: "w-4 h-4" }) }), onMinimize && _jsx(Button, { variant: "ghost", size: "icon", onClick: onMinimize, children: _jsx(Minimize2, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: onClose, children: _jsx(X, { className: "w-4 h-4" }) })] })] }), showSearch && (_jsx("div", { className: "p-2 border-b", children: _jsx(Input, { ref: searchInputRef, placeholder: "Buscar mensagens...", value: searchQuery, onChange: e => setSearchQuery(e.target.value) }) })), _jsxs("div", { className: "flex-1 flex flex-col min-h-0", children: [_jsx(ScrollArea, { className: "flex-1 p-4 bg-gray-100", children: _jsxs("div", { className: "space-y-4", children: [isLoading && _jsx("p", { className: "text-center text-gray-500", children: "Carregando mensagens..." }), filteredMessages.map((msg) => (_jsx(MessageBubble, { message: msg, isFromCurrentUser: msg.senderId === user?.id, onReply: () => setReplyingTo(msg), isHighlighted: searchQuery.trim() ? msg.content.toLowerCase().includes(searchQuery.toLowerCase()) : false }, msg.id))), _jsx("div", { ref: messagesEndRef })] }) }), replyingTo && _jsx(ReplyPreview, { replyingTo: replyingTo, onCancel: () => setReplyingTo(null) }), _jsxs("div", { className: "border-t p-4 bg-white", children: [_jsx(MessageInputTabs, { activeMode: activeMode, onModeChange: setActiveMode, messageText: messageText, onMessageChange: (text) => {
                                        setMessageText(text);
                                        handleTypingStart();
                                    }, onSend: handleSendMessage, isLoading: isSending }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", title: "Anexar", children: _jsx(Paperclip, { className: "w-4 h-4" }) }), _jsxs("div", { className: "relative", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setShowEmojiPicker(p => !p), title: "Emoji", children: _jsx(Smile, { className: "w-4 h-4" }) }), showEmojiPicker && (_jsx("div", { className: "absolute bottom-full mb-2 right-0 z-50", children: _jsx(EmojiPicker, { onEmojiSelect: (emoji) => setMessageText(t => t + emoji), onClose: () => setShowEmojiPicker(false) }) }))] })] }), _jsxs("div", { className: "text-xs text-gray-400", children: ["Ticket #", ticketId] })] })] })] })] }) }));
};
