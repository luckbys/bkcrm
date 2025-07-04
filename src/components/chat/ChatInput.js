import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Send, Paperclip, Smile } from 'lucide-react';
export const ChatInput = ({ onSend, isLoading, placeholder = "Digite sua mensagem...", maxLength = 2000, allowFileUpload = true, allowEmojis = true, onTyping }) => {
    const [message, setMessage] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const handleSend = async () => {
        if (!message.trim() || isLoading)
            return;
        try {
            await onSend(message, isInternal);
            setMessage('');
            if (onTyping)
                onTyping(false);
        }
        catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const handleChange = (e) => {
        setMessage(e.target.value);
        if (onTyping) {
            onTyping(e.target.value.length > 0);
        }
    };
    return (_jsxs("div", { className: "border-t bg-white p-4 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Switch, { checked: isInternal, onCheckedChange: setIsInternal, id: "internal-note" }), _jsx("label", { htmlFor: "internal-note", className: "text-sm text-gray-600", children: isInternal ? 'Nota interna (privada)' : 'Resposta ao cliente' })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1 relative", children: [_jsx(Textarea, { value: message, onChange: handleChange, onKeyPress: handleKeyPress, placeholder: placeholder, className: "min-h-[48px] max-h-[120px] resize-none pr-20", maxLength: maxLength, disabled: isLoading }), _jsxs("div", { className: "absolute right-2 bottom-2 flex items-center gap-1", children: [allowFileUpload && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(Paperclip, { className: "w-4 h-4 text-gray-400" }) })), allowEmojis && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(Smile, { className: "w-4 h-4 text-gray-400" }) }))] })] }), _jsx(Button, { onClick: handleSend, disabled: !message.trim() || isLoading, className: "self-end", children: _jsx(Send, { className: "w-4 h-4" }) })] }), maxLength && (_jsx("div", { className: "flex justify-between items-center mt-2 text-xs text-gray-500", children: _jsxs("div", { children: [message.length, "/", maxLength, " caracteres"] }) }))] }));
};
