import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import { HStack, Input, IconButton, useToast, Box } from '@chakra-ui/react';
import { IoSend } from 'react-icons/io5';
import { wsService } from '@/services/websocket';
const ChatInput = ({ ticketId, onMessageSent }) => {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const toast = useToast();
    const inputRef = useRef(null);
    const handleSend = async () => {
        if (!message.trim() || !ticketId)
            return;
        try {
            setSending(true);
            console.log('📤 [CHAT] Enviando mensagem:', {
                ticketId,
                content: message.substring(0, 50) + '...'
            });
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticketId,
                    content: message,
                    type: 'text'
                })
            });
            const data = await response.json();
            if (data.success) {
                console.log('✅ [CHAT] Mensagem enviada com sucesso:', data.message);
                // Limpar input
                setMessage('');
                // Notificar componente pai
                onMessageSent(data.message);
                // Emitir evento WebSocket
                wsService.sendMessage('agent-message', {
                    ticketId,
                    message: data.message
                });
            }
            else {
                console.error('❌ [CHAT] Erro ao enviar mensagem:', data.error);
                toast({
                    title: 'Erro ao enviar mensagem',
                    description: data.error || 'Tente novamente',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
            }
        }
        catch (error) {
            console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
            toast({
                title: 'Erro ao enviar mensagem',
                description: 'Tente novamente',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        }
        finally {
            setSending(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    return (_jsx(Box, { w: "full", p: 4, borderTop: "1px", borderColor: "gray.200", bg: "white", position: "sticky", bottom: 0, children: _jsxs(HStack, { spacing: 2, children: [_jsx(Input, { ref: inputRef, placeholder: "Digite sua mensagem...", value: message, onChange: (e) => setMessage(e.target.value), onKeyPress: handleKeyPress, disabled: sending, _focus: {
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)'
                    } }), _jsx(IconButton, { "aria-label": "Enviar mensagem", icon: _jsx(IoSend, {}), colorScheme: "blue", onClick: handleSend, isLoading: sending, isDisabled: !message.trim() })] }) }));
};
export default ChatInput;
