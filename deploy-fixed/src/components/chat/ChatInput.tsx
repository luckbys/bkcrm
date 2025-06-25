import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Send, Paperclip, Smile } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string, isInternal?: boolean) => Promise<void>;
  isLoading: boolean;
  placeholder?: string;
  maxLength?: number;
  allowFileUpload?: boolean;
  allowEmojis?: boolean;
  onTyping?: (isTyping: boolean) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  placeholder = "Digite sua mensagem...",
  maxLength = 2000,
  allowFileUpload = true,
  allowEmojis = true,
  onTyping
}) => {
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    try {
      await onSend(message, isInternal);
      setMessage('');
      if (onTyping) onTyping(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (onTyping) {
      onTyping(e.target.value.length > 0);
    }
  };

  return (
    <div className="border-t bg-white p-4 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <Switch
          checked={isInternal}
          onCheckedChange={setIsInternal}
          id="internal-note"
        />
        <label htmlFor="internal-note" className="text-sm text-gray-600">
          {isInternal ? 'Nota interna (privada)' : 'Resposta ao cliente'}
        </label>
      </div>
      
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Textarea
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[48px] max-h-[120px] resize-none pr-20"
            maxLength={maxLength}
            disabled={isLoading}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {allowFileUpload && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Paperclip className="w-4 h-4 text-gray-400" />
              </Button>
            )}
            
            {allowEmojis && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Smile className="w-4 h-4 text-gray-400" />
              </Button>
            )}
          </div>
        </div>
        
        <Button 
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      {maxLength && (
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <div>
            {message.length}/{maxLength} caracteres
          </div>
        </div>
      )}
    </div>
  );
}; 