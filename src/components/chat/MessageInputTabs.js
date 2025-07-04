import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Lock, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
export const MessageInputTabs = forwardRef(({ activeMode, onModeChange, messageText, onMessageChange, onSend, isLoading = false, placeholder, disabled = false, className }, ref) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isLoading && messageText.trim()) {
                onSend();
            }
        }
    };
    const getPlaceholder = () => {
        if (placeholder)
            return placeholder;
        return activeMode === 'internal'
            ? "Digite uma nota interna (apenas para equipe)..."
            : "Digite sua mensagem...";
    };
    return (_jsxs("div", { className: cn("space-y-3", className), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { variant: activeMode === 'message' ? 'default' : 'outline', size: "sm", onClick: () => onModeChange('message'), className: cn("h-8 px-3 text-sm transition-all", activeMode === 'message'
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "text-gray-600 hover:text-blue-600 hover:border-blue-300"), children: [_jsx(MessageCircle, { className: "w-3 h-3 mr-1" }), "Mensagem"] }), _jsxs(Button, { variant: activeMode === 'internal' ? 'default' : 'outline', size: "sm", onClick: () => onModeChange('internal'), className: cn("h-8 px-3 text-sm transition-all", activeMode === 'internal'
                            ? "bg-orange-500 text-white hover:bg-orange-600"
                            : "text-gray-600 hover:text-orange-600 hover:border-orange-300"), children: [_jsx(Lock, { className: "w-3 h-3 mr-1" }), "Nota Interna"] })] }), _jsxs("div", { className: "flex gap-3 items-end", children: [_jsx(Textarea, { ref: ref, placeholder: getPlaceholder(), value: messageText, onChange: (e) => onMessageChange(e.target.value), onKeyPress: handleKeyPress, disabled: disabled || isLoading, className: cn("flex-1 min-h-[60px] max-h-[120px] resize-none transition-all", activeMode === 'internal'
                            ? "border-orange-300 focus:border-orange-500 focus:ring-orange-200"
                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-200", disabled && "opacity-50 cursor-not-allowed"), rows: 2 }), _jsx(Button, { onClick: onSend, disabled: !messageText.trim() || isLoading || disabled, size: "sm", className: cn("h-12 px-4 transition-all", activeMode === 'internal'
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-blue-500 hover:bg-blue-600", (!messageText.trim() || isLoading || disabled) && "opacity-50 cursor-not-allowed"), children: isLoading ? (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })) : (_jsx(Send, { className: "w-4 h-4" })) })] }), activeMode === 'internal' && (_jsxs("div", { className: "text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 flex items-center gap-2", children: [_jsx(Lock, { className: "w-3 h-3" }), _jsx("span", { className: "font-medium", children: "Modo Nota Interna:" }), _jsx("span", { children: "Esta mensagem ser\u00E1 vis\u00EDvel apenas para a equipe interna" })] }))] }));
});
MessageInputTabs.displayName = 'MessageInputTabs';
