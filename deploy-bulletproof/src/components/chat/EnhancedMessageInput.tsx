// Sistema de Input de Mensagens Avancado
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Image, 
  FileText,
  Lock,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface EnhancedMessageInputProps {
  onSendMessage: (content: string, isInternal?: boolean, attachments?: File[]) => Promise<void>;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  showInternalToggle?: boolean;
  className?: string;
}

interface MessageDraft {
  content: string;
  isInternal: boolean;
  attachments: File[];
}

export const EnhancedMessageInput: React.FC<EnhancedMessageInputProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  isLoading = false,
  disabled = false,
  placeholder,
  maxLength = 2000,
  showInternalToggle = true,
  className
}) => {
  const [draft, setDraft] = useState<MessageDraft>({
    content: '',
    isInternal: false,
    attachments: []
  });
  
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (!isTyping && onTypingStart) {
      setIsTyping(true);
      onTypingStart();
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onTypingStop) {
        onTypingStop();
      }
    }, 3000);
  }, [isTyping, onTypingStart, onTypingStop]);

  // Handle content change
  const handleContentChange = (value: string) => {
    setDraft(prev => ({ ...prev, content: value }));
    handleTypingStart();
    adjustTextareaHeight();
  };

  // Handle file selection
  const handleFileSelect = (files: File[]) => {
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type.startsWith('audio/') ||
                         file.type === 'application/pdf';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      return isValidType && isValidSize;
    });
    
    setDraft(prev => ({ 
      ...prev, 
      attachments: [...prev.attachments, ...validFiles] 
    }));
  };

  // Handle send message
  const handleSend = async () => {
    if ((!draft.content.trim() && draft.attachments.length === 0) || isSending) {
      return;
    }

    setIsSending(true);
    
    try {
      await onSendMessage(
        draft.content.trim(), 
        draft.isInternal, 
        draft.attachments.length > 0 ? draft.attachments : undefined
      );
      
      setDraft({
        content: '',
        isInternal: false,
        attachments: []
      });
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      setIsTyping(false);
      if (onTypingStop) {
        onTypingStop();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        handleSend();
      }
    }
    
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      setDraft(prev => ({ ...prev, isInternal: !prev.isInternal }));
    }
  };

  const getCharCountColor = () => {
    const percentage = (draft.content.length / maxLength) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-orange-500';
    return 'text-gray-400';
  };

  const canSend = draft.content.trim().length > 0 || draft.attachments.length > 0;

  useEffect(() => {
    adjustTextareaHeight();
  }, [draft.content, adjustTextareaHeight]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("border-t border-gray-200 bg-white", className)}>
      {showInternalToggle && (
        <div className="flex items-center space-x-4 px-4 py-3 border-b border-gray-100">
          <button
            type="button"
            onClick={() => setDraft(prev => ({ ...prev, isInternal: false }))}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              !draft.isInternal 
                ? "bg-blue-100 text-blue-700 border border-blue-200" 
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Mensagem</span>
          </button>
          
          <button
            type="button"
            onClick={() => setDraft(prev => ({ ...prev, isInternal: true }))}
            className={cn(
              "flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              draft.isInternal 
                ? "bg-amber-100 text-amber-700 border border-amber-200" 
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Lock className="w-4 h-4" />
            <span>Nota Interna</span>
          </button>
        </div>
      )}

      {draft.attachments.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex flex-wrap gap-2">
            {draft.attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg text-sm"
              >
                {file.type.startsWith('image/') ? (
                  <Image className="w-4 h-4 text-blue-500" />
                ) : (
                  <FileText className="w-4 h-4 text-gray-500" />
                )}
                <span className="truncate max-w-32">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setDraft(prev => ({
                    ...prev,
                    attachments: prev.attachments.filter((_, i) => i !== index)
                  }))}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end space-x-3 p-4">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.pdf,.doc,.docx"
          onChange={(e) => e.target.files && handleFileSelect(Array.from(e.target.files))}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
          title="Anexar Arquivo"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={draft.content}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || (draft.isInternal ? "Digite uma nota interna..." : "Digite sua mensagem...")}
            disabled={disabled || isLoading}
            maxLength={maxLength}
            className={cn(
              "min-h-10 max-h-32 resize-none border-0 shadow-none focus:ring-0 bg-gray-50 rounded-xl",
              draft.isInternal && "bg-amber-50 border-amber-200"
            )}
            style={{ height: 'auto' }}
          />
          
          <div className={cn(
            "absolute bottom-2 right-2 text-xs",
            getCharCountColor()
          )}>
            {draft.content.length}/{maxLength}
          </div>
        </div>

        <button
          type="button"
          disabled={disabled}
          className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-all"
          title="Emojis"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="button"
          disabled={disabled}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
          title="Gravar Audio"
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || disabled || isSending}
          className={cn(
            "p-2.5 rounded-lg transition-all duration-200",
            canSend && !disabled && !isSending
              ? draft.isInternal
                ? "bg-amber-500 hover:bg-amber-600 text-white shadow-lg hover:shadow-xl scale-100 hover:scale-105"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl scale-100 hover:scale-105"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
          title="Enviar Mensagem"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="px-4 pb-2 text-xs text-gray-400 flex items-center justify-between">
        <span>Enter para enviar • Shift+Enter para nova linha</span>
        <span>Ctrl+I para alternar modo</span>
      </div>
    </div>
  );
}; 