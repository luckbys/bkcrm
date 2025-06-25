import React, { forwardRef } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Lock, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MessageInputTabsProps {
  activeMode: 'message' | 'internal';
  onModeChange: (mode: 'message' | 'internal') => void;
  messageText: string;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const MessageInputTabs = forwardRef<HTMLTextAreaElement, MessageInputTabsProps>(({
  activeMode,
  onModeChange,
  messageText,
  onMessageChange,
  onSend,
  isLoading = false,
  placeholder,
  disabled = false,
  className
}, ref) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && messageText.trim()) {
        onSend();
      }
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return activeMode === 'internal' 
      ? "Digite uma nota interna (apenas para equipe)..." 
      : "Digite sua mensagem...";
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Abas de Modo */}
      <div className="flex items-center gap-2">
        <Button
          variant={activeMode === 'message' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('message')}
          className={cn(
            "h-8 px-3 text-sm transition-all",
            activeMode === 'message' 
              ? "bg-blue-500 text-white hover:bg-blue-600" 
              : "text-gray-600 hover:text-blue-600 hover:border-blue-300"
          )}
        >
          <MessageCircle className="w-3 h-3 mr-1" />
          Mensagem
        </Button>
        <Button
          variant={activeMode === 'internal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onModeChange('internal')}
          className={cn(
            "h-8 px-3 text-sm transition-all",
            activeMode === 'internal' 
              ? "bg-orange-500 text-white hover:bg-orange-600" 
              : "text-gray-600 hover:text-orange-600 hover:border-orange-300"
          )}
        >
          <Lock className="w-3 h-3 mr-1" />
          Nota Interna
        </Button>
      </div>

      {/* Área de Input */}
      <div className="flex gap-3 items-end">
        <Textarea
          ref={ref}
          placeholder={getPlaceholder()}
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || isLoading}
          className={cn(
            "flex-1 min-h-[60px] max-h-[120px] resize-none transition-all",
            activeMode === 'internal' 
              ? "border-orange-300 focus:border-orange-500 focus:ring-orange-200" 
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-200",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          rows={2}
        />
        
        <Button
          onClick={onSend}
          disabled={!messageText.trim() || isLoading || disabled}
          size="sm"
          className={cn(
            "h-12 px-4 transition-all",
            activeMode === 'internal' 
              ? "bg-orange-500 hover:bg-orange-600" 
              : "bg-blue-500 hover:bg-blue-600",
            (!messageText.trim() || isLoading || disabled) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Indicador de Modo */}
      {activeMode === 'internal' && (
        <div className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200 flex items-center gap-2">
          <Lock className="w-3 h-3" />
          <span className="font-medium">Modo Nota Interna:</span>
          <span>Esta mensagem será visível apenas para a equipe interna</span>
        </div>
      )}
    </div>
  );
});

MessageInputTabs.displayName = 'MessageInputTabs'; 