import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// ⌨️ COMPONENTE DE INPUT MELHORADO COM FUNCIONALIDADES AVANÇADAS
import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { cn } from '../../lib/utils';
// 🎯 Componente de Indicador de Digitação
const TypingIndicator = ({ typingUsers }) => {
    if (typingUsers.length === 0)
        return null;
    const getTypingText = () => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0]} está digitando...`;
        }
        else if (typingUsers.length === 2) {
            return `${typingUsers[0]} e ${typingUsers[1]} estão digitando...`;
        }
        else {
            return `${typingUsers.length} pessoas estão digitando...`;
        }
    };
    return (_jsxs("div", { className: "flex items-center gap-2 px-4 py-2 text-sm text-gray-500", children: [_jsxs("div", { className: "flex gap-1", children: [_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-bounce", style: { animationDelay: '0ms' } }), _jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-bounce", style: { animationDelay: '150ms' } }), _jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full animate-bounce", style: { animationDelay: '300ms' } })] }), _jsx("span", { children: getTypingText() })] }));
};
// 📝 Componente de Respostas Rápidas
const CannedResponsesPopover = ({ responses, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredResponses = responses.filter(response => response.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        response.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const groupedResponses = filteredResponses.reduce((acc, response) => {
        const category = response.category || 'Geral';
        if (!acc[category])
            acc[category] = [];
        acc[category].push(response);
        return acc;
    }, {});
    return (_jsxs(PopoverContent, { className: "w-96 p-0", align: "end", children: [_jsxs("div", { className: "border-b p-3", children: [_jsx("h4", { className: "font-medium mb-2", children: "\uD83D\uDCDD Respostas R\u00E1pidas" }), _jsx("input", { type: "text", placeholder: "Buscar respostas...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full px-3 py-2 border rounded-md text-sm" })] }), _jsxs("div", { className: "max-h-80 overflow-y-auto", children: [Object.entries(groupedResponses).map(([category, categoryResponses]) => (_jsxs("div", { className: "p-2", children: [_jsx("div", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2", children: category }), categoryResponses.map((response) => (_jsxs("button", { onClick: () => onSelect(response.content), className: "w-full text-left p-2 rounded hover:bg-gray-50 border-b border-gray-100 last:border-b-0", children: [_jsx("div", { className: "font-medium text-sm text-gray-900 mb-1", children: response.title }), _jsx("div", { className: "text-xs text-gray-500 line-clamp-2", children: response.content })] }, response.id)))] }, category))), filteredResponses.length === 0 && (_jsx("div", { className: "p-4 text-center text-gray-500 text-sm", children: "Nenhuma resposta encontrada" }))] })] }));
};
// ⌨️ Componente Principal
export const ChatInputEnhanced = ({ onSendMessage, onTypingStart, onTypingStop, cannedResponses = [], isLoading = false, isSending = false, disabled = false, placeholder = "Digite sua mensagem...", maxLength = 2000, className }) => {
    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [typingUsers] = useState([]); // Seria gerenciado pelo WebSocket
    const textareaRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    // 📊 Contador de caracteres
    const characterCount = message.length;
    const isNearLimit = characterCount > maxLength * 0.8;
    const isOverLimit = characterCount > maxLength;
    // ⌨️ Gerenciar digitação
    useEffect(() => {
        if (message.length > 0 && !typingTimeoutRef.current) {
            onTypingStart();
            typingTimeoutRef.current = setTimeout(() => {
                onTypingStop();
                typingTimeoutRef.current = null;
            }, 3000);
        }
        else if (message.length === 0 && typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
            onTypingStop();
        }
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                onTypingStop();
            }
        };
    }, [message, onTypingStart, onTypingStop]);
    // 📤 Enviar mensagem
    const handleSend = async () => {
        if (!message.trim() || isSending || isOverLimit)
            return;
        try {
            await onSendMessage(message.trim(), isInternal);
            setMessage('');
            onTypingStop();
        }
        catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    };
    // ⌨️ Capturar teclas
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    // 📝 Selecionar resposta rápida
    const handleSelectCannedResponse = (content) => {
        setMessage(content);
        textareaRef.current?.focus();
    };
    // 📁 Upload de arquivo (placeholder)
    const handleFileUpload = () => {
        // Implementar upload de arquivo
        console.log('Upload de arquivo');
    };
    return (_jsxs("div", { className: cn("border-t bg-white", className), children: [_jsx(TypingIndicator, { typingUsers: typingUsers }), _jsxs("div", { className: "flex items-center justify-between px-4 py-2 border-b", children: [_jsx("div", { className: "flex items-center gap-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Switch, { id: "internal-note", checked: isInternal, onCheckedChange: setIsInternal, size: "sm" }), _jsx(Label, { htmlFor: "internal-note", className: cn("text-sm font-medium cursor-pointer", isInternal ? "text-amber-600" : "text-gray-600"), children: isInternal ? "🔒 Nota Interna" : "💬 Resposta ao Cliente" })] }) }), _jsxs("div", { className: cn("text-xs font-medium", isOverLimit ? "text-red-500" : isNearLimit ? "text-yellow-500" : "text-gray-400"), children: [characterCount, "/", maxLength] })] }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Textarea, { ref: textareaRef, value: message, onChange: (e) => setMessage(e.target.value), onKeyDown: handleKeyDown, placeholder: placeholder, disabled: disabled || isLoading, className: cn("min-h-[44px] max-h-[120px] resize-none border-gray-200 rounded-lg", isOverLimit && "border-red-300 focus:border-red-500") }), isLoading && (_jsx("div", { className: "absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center", children: _jsx(Loader2, { className: "w-4 h-4 animate-spin text-blue-500" }) }))] }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("div", { className: "flex gap-2", children: [_jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", size: "sm", disabled: disabled, className: "h-9 w-9 p-0", title: "Respostas R\u00E1pidas", children: _jsx(Zap, { className: "w-4 h-4" }) }) }), _jsx(CannedResponsesPopover, { responses: cannedResponses, onSelect: handleSelectCannedResponse })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleFileUpload, disabled: disabled, className: "h-9 w-9 p-0", title: "Anexar Arquivo", children: _jsx(Paperclip, { className: "w-4 h-4" }) })] }), _jsx(Button, { onClick: handleSend, disabled: !message.trim() || isSending || isOverLimit || disabled, size: "sm", className: cn("h-9 w-16 transition-all", isInternal ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"), children: isSending ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Send, { className: "w-4 h-4" })) })] })] }), _jsxs("div", { className: "flex items-center justify-between mt-2 text-xs text-gray-500", children: [_jsxs("div", { children: [_jsx("kbd", { className: "px-1 py-0.5 bg-gray-100 rounded", children: "Enter" }), " para enviar", _jsx("span", { className: "mx-2", children: "\u2022" }), _jsx("kbd", { className: "px-1 py-0.5 bg-gray-100 rounded", children: "Shift+Enter" }), " para nova linha"] }), isInternal && (_jsx("div", { className: "flex items-center gap-1 text-amber-600", children: "\uD83D\uDD12 Esta mensagem \u00E9 privada" }))] })] })] }));
};
