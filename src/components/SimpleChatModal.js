import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '../stores/chatStore';
import { X, Send, Wifi, WifiOff, MessageSquare, User, Clock } from 'lucide-react';
const SimpleChatModal = ({ ticket, isOpen, onOpenChange }) => {
    const [messageText, setMessageText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const { isConnected, isLoading, isSending, error, messages, init, disconnect, join, send, load } = useChatStore();
    const ticketId = ticket?.originalId || ticket?.id ? String(ticket.originalId || ticket.id) : null;
    const displayId = ticket?.id;
    const ticketMessages = ticketId ? messages[ticketId] || [] : [];
    console.log('🎫 [SIMPLE-CHAT] Ticket:', {
        displayId: displayId,
        ticketId: ticketId,
        title: ticket?.title || ticket?.subject,
        messagesCount: ticketMessages.length,
        hasOriginalId: !!ticket?.originalId
    });
    // Inicializar quando abrir o modal
    useEffect(() => {
        if (isOpen && !isConnected) {
            console.log('🔄 [SIMPLE-CHAT] Inicializando socket...');
            init();
        }
    }, [isOpen, isConnected, init]);
    // Entrar no ticket quando conectar
    useEffect(() => {
        if (isOpen && ticketId && isConnected) {
            console.log(`🔗 [SIMPLE-CHAT] Entrando no ticket ${ticketId}`);
            join(ticketId);
            // Carregar mensagens se não existirem
            if (ticketMessages.length === 0) {
                console.log(`📥 [SIMPLE-CHAT] Carregando mensagens...`);
                load(ticketId);
            }
        }
    }, [isOpen, ticketId, isConnected, join, load, ticketMessages.length]);
    // Enviar mensagem
    const handleSendMessage = async () => {
        if (!ticketId || !messageText.trim())
            return;
        try {
            await send(ticketId, messageText, isInternal);
            setMessageText('');
        }
        catch (error) {
            console.error('❌ [SIMPLE-CHAT] Erro ao enviar:', error);
        }
    };
    // Formatação de timestamp
    const formatTime = (date) => {
        if (!date || !(date instanceof Date))
            return '';
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };
    if (!ticket) {
        return (_jsx(Dialog, { open: isOpen, onOpenChange: onOpenChange, children: _jsx(DialogContent, { className: "max-w-md", children: _jsxs("div", { className: "p-4 text-center", children: [_jsx("h3", { className: "text-lg font-semibold text-red-600", children: "Erro" }), _jsx("p", { className: "text-sm text-muted-foreground mt-2", children: "Nenhum ticket foi selecionado." }), _jsx(Button, { onClick: () => onOpenChange(false), className: "mt-4", children: "Fechar" })] }) }) }));
    }
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "max-w-4xl h-[80vh] flex flex-col p-0", children: [_jsxs(DialogTitle, { className: "sr-only", children: ["Chat - Ticket #", ticketId] }), _jsxs("div", { className: "p-4 border-b bg-gray-50 flex justify-between items-center", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold", children: ticket.client?.charAt(0)?.toUpperCase() || 'T' }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: ticket.title || ticket.subject || `Ticket #${ticketId}` }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsxs(Badge, { variant: "outline", className: "text-xs", children: [_jsx(User, { className: "w-3 h-3 mr-1" }), ticket.client || 'Cliente'] }), _jsx(Badge, { variant: ticket.channel === 'whatsapp' ? 'default' : 'secondary', className: "text-xs", children: ticket.channel === 'whatsapp' ? '📱 WhatsApp' : ticket.channel || 'Chat' })] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex items-center gap-1 text-sm", children: isConnected ? (_jsxs(_Fragment, { children: [_jsx(Wifi, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "text-green-600", children: "Online" })] })) : (_jsxs(_Fragment, { children: [_jsx(WifiOff, { className: "w-4 h-4 text-red-600" }), _jsx("span", { className: "text-red-600", children: "Offline" })] })) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onOpenChange(false), children: _jsx(X, { className: "w-4 h-4" }) })] })] }), error && (_jsxs("div", { className: "p-3 bg-red-50 border-b text-sm text-red-600", children: ["\u274C ", error] })), _jsxs("div", { className: "flex-1 flex flex-col min-h-0", children: [_jsx(ScrollArea, { className: "flex-1 p-4", children: isLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full", children: [_jsx("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: "Carregando mensagens..." })] })) : ticketMessages.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center h-full text-gray-500", children: [_jsx(MessageSquare, { className: "w-12 h-12 mb-4" }), _jsx("p", { className: "text-lg font-medium", children: "Nenhuma mensagem ainda" }), _jsx("p", { className: "text-sm", children: "Comece a conversa enviando uma mensagem" })] })) : (_jsx("div", { className: "space-y-4", children: ticketMessages.map((message) => (_jsx("div", { className: `flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`, children: _jsx("div", { className: `max-w-[70%] ${message.sender === 'agent' ? 'order-2' : 'order-1'}`, children: _jsxs("div", { className: `rounded-2xl p-4 shadow-sm ${message.isInternal
                                                ? 'bg-amber-50 border border-amber-200'
                                                : message.sender === 'agent'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white border border-gray-200'}`, children: [message.isInternal && (_jsx("div", { className: "text-amber-700 text-xs font-medium mb-2", children: "\uD83D\uDD12 NOTA INTERNA" })), _jsx("div", { className: "break-words", children: message.content }), _jsxs("div", { className: `mt-2 text-xs flex justify-between items-center ${message.sender === 'agent' && !message.isInternal ? 'text-blue-100' : 'text-gray-500'}`, children: [_jsx("span", { className: "font-medium", children: message.senderName }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsx("span", { children: formatTime(message.timestamp) })] })] })] }) }) }, message.id))) })) }), _jsxs("div", { className: "p-4 border-t bg-white", children: [_jsx("div", { className: "flex items-center gap-3 mb-3", children: _jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: isInternal, onChange: (e) => setIsInternal(e.target.checked), className: "rounded border-gray-300" }), _jsx("span", { className: "text-sm font-medium", children: isInternal ? '🔒 Nota Interna' : '💬 Resposta ao Cliente' })] }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Textarea, { placeholder: isInternal ? "Digite uma nota interna..." : "Digite sua mensagem...", value: messageText, onChange: (e) => setMessageText(e.target.value), className: "flex-1 min-h-[60px] max-h-[120px] resize-none", onKeyPress: (e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }, disabled: isSending }), _jsx(Button, { onClick: handleSendMessage, disabled: !messageText.trim() || isSending, size: "sm", className: "px-4", children: isSending ? (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsx(Send, { className: "w-4 h-4" })) })] }), _jsxs("div", { className: "flex justify-between items-center mt-2 text-xs text-gray-500", children: [_jsxs("span", { children: [messageText.length, "/2000 caracteres"] }), _jsxs("div", { className: "flex items-center gap-2", children: [isConnected ? (_jsx("span", { className: "text-green-600", children: "WebSocket Online" })) : (_jsx("span", { className: "text-orange-500", children: "Modo Offline" })), isSending && _jsx("span", { className: "text-blue-500", children: "Enviando..." })] })] })] })] })] }) }));
};
export default SimpleChatModal;
