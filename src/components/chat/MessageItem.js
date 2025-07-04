import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Check, CheckCheck, Clock, X, User, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
// 📊 Componente de Status da Mensagem
const MessageStatus = ({ status, isCurrentUser }) => {
    if (!isCurrentUser)
        return null;
    const getStatusConfig = () => {
        switch (status) {
            case 'sending':
                return {
                    icon: Clock,
                    color: 'text-gray-400',
                    label: 'Enviando...'
                };
            case 'sent':
                return {
                    icon: Check,
                    color: 'text-gray-500',
                    label: 'Enviado'
                };
            case 'delivered':
                return {
                    icon: CheckCheck,
                    color: 'text-gray-500',
                    label: 'Entregue'
                };
            case 'read':
                return {
                    icon: CheckCheck,
                    color: 'text-blue-500',
                    label: 'Lido'
                };
            case 'failed':
                return {
                    icon: X,
                    color: 'text-red-500',
                    label: 'Falha no envio'
                };
            default:
                return {
                    icon: Check,
                    color: 'text-gray-400',
                    label: 'Enviado'
                };
        }
    };
    const { icon: Icon, color, label } = getStatusConfig();
    return (_jsxs("div", { className: cn("flex items-center gap-1 text-xs", color), title: label, children: [_jsx(Icon, { size: 12 }), status === 'failed' && _jsx("span", { className: "text-xs", children: "Tentar novamente" })] }));
};
// 🎭 Componente Principal da Mensagem
export const MessageItem = ({ message, isCurrentUser = false, showAvatar = true }) => {
    const formatTime = (timestamp) => {
        return timestamp.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    const getMessageBubbleClass = () => {
        if (message.isInternal) {
            return "bg-amber-50 border border-amber-200 text-amber-800";
        }
        if (isCurrentUser) {
            return "bg-blue-500 text-white";
        }
        return "bg-white border border-gray-200 text-gray-900";
    };
    const getMessageAlignment = () => {
        if (message.isInternal) {
            return "justify-center"; // Centralized for internal notes
        }
        return isCurrentUser ? "justify-end" : "justify-start";
    };
    // Verificar se é mensagem do WhatsApp
    const isWhatsAppMessage = message.metadata?.whatsapp?.fromPhone || message.metadata?.whatsapp?.instanceName;
    return (_jsx("div", { className: cn("flex w-full", getMessageAlignment()), children: _jsxs("div", { className: cn("flex gap-3 max-w-[85%]", isCurrentUser ? "flex-row-reverse" : "flex-row"), children: [showAvatar && (_jsx("div", { className: cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium", message.isInternal
                        ? "bg-amber-500"
                        : isCurrentUser
                            ? "bg-blue-500"
                            : "bg-green-500"), children: message.isInternal ? "🔒" : isCurrentUser ? "🎧" : _jsx(User, { size: 16 }) })), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: cn("text-xs font-medium", isCurrentUser ? "text-right text-gray-600" : "text-left text-gray-600"), children: [message.isInternal && "🔒 NOTA INTERNA - ", message.senderName || (isCurrentUser ? "Você" : "Cliente"), !isCurrentUser && isWhatsAppMessage && (_jsxs("span", { className: "ml-2 inline-flex items-center gap-1 text-green-600", children: [_jsx(Phone, { size: 10 }), "WhatsApp"] }))] }), _jsxs("div", { className: cn("px-4 py-2 rounded-lg shadow-sm", getMessageBubbleClass()), children: [_jsx("div", { className: "text-sm whitespace-pre-wrap break-words", children: message.content }), _jsxs("div", { className: cn("flex items-center gap-2 mt-1", isCurrentUser ? "justify-end" : "justify-start"), children: [_jsx("span", { className: cn("text-xs", message.isInternal
                                                ? "text-amber-600"
                                                : isCurrentUser
                                                    ? "text-blue-100"
                                                    : "text-gray-500"), children: formatTime(message.timestamp) }), _jsx(MessageStatus, { status: message.status || 'sent', isCurrentUser: isCurrentUser })] })] }), message.isInternal && (_jsx("div", { className: "text-center", children: _jsx("span", { className: "inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full", children: "\uD83D\uDD12 Nota Interna (Apenas para equipe)" }) }))] })] }) }));
};
