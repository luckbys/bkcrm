// ⌨️ COMPONENTE DE INPUT MELHORADO COM FUNCIONALIDADES AVANÇADAS
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic, 
  Image, 
  File,
  MessageSquare,
  Loader2,
  Zap
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../../components/ui/popover';
import { cn } from '../../lib/utils';

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category?: string;
}

interface ChatInputEnhancedProps {
  onSendMessage: (content: string, isInternal?: boolean) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  cannedResponses: CannedResponse[];
  isLoading?: boolean;
  isSending?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

// 🎯 Componente de Indicador de Digitação
const TypingIndicator: React.FC<{ typingUsers: string[] }> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0]} está digitando...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0]} e ${typingUsers[1]} estão digitando...`;
    } else {
      return `${typingUsers.length} pessoas estão digitando...`;
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{getTypingText()}</span>
    </div>
  );
};

// 📝 Componente de Respostas Rápidas
const CannedResponsesPopover: React.FC<{
  responses: CannedResponse[];
  onSelect: (content: string) => void;
}> = ({ responses, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResponses = responses.filter(response =>
    response.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    response.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedResponses = filteredResponses.reduce((acc, response) => {
    const category = response.category || 'Geral';
    if (!acc[category]) acc[category] = [];
    acc[category].push(response);
    return acc;
  }, {} as Record<string, CannedResponse[]>);

  return (
    <PopoverContent className="w-96 p-0" align="end">
      <div className="border-b p-3">
        <h4 className="font-medium mb-2">📝 Respostas Rápidas</h4>
        <input
          type="text"
          placeholder="Buscar respostas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm"
        />
      </div>
      
      <div className="max-h-80 overflow-y-auto">
        {Object.entries(groupedResponses).map(([category, categoryResponses]) => (
          <div key={category} className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-2">
              {category}
            </div>
            {categoryResponses.map((response) => (
              <button
                key={response.id}
                onClick={() => onSelect(response.content)}
                className="w-full text-left p-2 rounded hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-sm text-gray-900 mb-1">
                  {response.title}
                </div>
                <div className="text-xs text-gray-500 line-clamp-2">
                  {response.content}
                </div>
              </button>
            ))}
          </div>
        ))}
        
        {filteredResponses.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            Nenhuma resposta encontrada
          </div>
        )}
      </div>
    </PopoverContent>
  );
};

// ⌨️ Componente Principal
export const ChatInputEnhanced: React.FC<ChatInputEnhancedProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  cannedResponses = [],
  isLoading = false,
  isSending = false,
  disabled = false,
  placeholder = "Digite sua mensagem...",
  maxLength = 2000,
  className
}) => {
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [typingUsers] = useState<string[]>([]); // Seria gerenciado pelo WebSocket
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    } else if (message.length === 0 && typingTimeoutRef.current) {
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
    if (!message.trim() || isSending || isOverLimit) return;

    try {
      await onSendMessage(message.trim(), isInternal);
      setMessage('');
      onTypingStop();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  // ⌨️ Capturar teclas
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 📝 Selecionar resposta rápida
  const handleSelectCannedResponse = (content: string) => {
    setMessage(content);
    textareaRef.current?.focus();
  };

  // 📁 Upload de arquivo (placeholder)
  const handleFileUpload = () => {
    // Implementar upload de arquivo
    console.log('Upload de arquivo');
  };

  return (
    <div className={cn("border-t bg-white", className)}>
      {/* 🎯 Indicador de digitação */}
      <TypingIndicator typingUsers={typingUsers} />
      
      {/* 🎛️ Controles superiores */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-4">
          {/* Toggle nota interna */}
          <div className="flex items-center gap-2">
            <Switch
              id="internal-note"
              checked={isInternal}
              onCheckedChange={setIsInternal}
              size="sm"
            />
            <Label 
              htmlFor="internal-note" 
              className={cn(
                "text-sm font-medium cursor-pointer",
                isInternal ? "text-amber-600" : "text-gray-600"
              )}
            >
              {isInternal ? "🔒 Nota Interna" : "💬 Resposta ao Cliente"}
            </Label>
          </div>
        </div>

        {/* Contador de caracteres */}
        <div className={cn(
          "text-xs font-medium",
          isOverLimit ? "text-red-500" : isNearLimit ? "text-yellow-500" : "text-gray-400"
        )}>
          {characterCount}/{maxLength}
        </div>
      </div>

      {/* 📝 Área de input */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Textarea */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none border-gray-200 rounded-lg",
                isOverLimit && "border-red-300 focus:border-red-500"
              )}
            />
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2">
            {/* Botões superiores */}
            <div className="flex gap-2">
              {/* Respostas rápidas */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="h-9 w-9 p-0"
                    title="Respostas Rápidas"
                  >
                    <Zap className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <CannedResponsesPopover
                  responses={cannedResponses}
                  onSelect={handleSelectCannedResponse}
                />
              </Popover>

              {/* Upload de arquivo */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleFileUpload}
                disabled={disabled}
                className="h-9 w-9 p-0"
                title="Anexar Arquivo"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>

            {/* Botão enviar */}
            <Button
              onClick={handleSend}
              disabled={!message.trim() || isSending || isOverLimit || disabled}
              size="sm"
              className={cn(
                "h-9 w-16 transition-all",
                isInternal ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"
              )}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 📋 Atalhos de teclado */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> para enviar
            <span className="mx-2">•</span>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">Shift+Enter</kbd> para nova linha
          </div>
          
          {isInternal && (
            <div className="flex items-center gap-1 text-amber-600">
              🔒 Esta mensagem é privada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 