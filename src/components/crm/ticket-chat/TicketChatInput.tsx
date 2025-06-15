import React, { useRef } from 'react';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import { 
  Send,
  Paperclip,
  Eye,
  X,
  Zap,
  Loader2
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { QuickTemplate, UseTicketChatReturn } from '../../../types/ticketChat';

interface TicketChatInputProps {
  chatState: UseTicketChatReturn;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

const quickTemplates: QuickTemplate[] = [
  {
    id: 1,
    title: "Saudação",
    content: "Olá! Obrigado por entrar em contato. Como posso ajudá-lo hoje?",
    category: "saudacao"
  },
  {
    id: 2,
    title: "Aguardando informações",
    content: "Obrigado pela informação. Vou analisar e retorno em breve com uma solução.",
    category: "processo"
  },
  {
    id: 3,
    title: "Problema resolvido",
    content: "Ótimo! O problema foi resolvido. Há mais alguma coisa em que posso ajudar?",
    category: "resolucao"
  }
];

export const TicketChatInput: React.FC<TicketChatInputProps> = ({
  chatState,
  textareaRef
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    message,
    setMessage,
    isInternal,
    setIsInternal,
    isSending,
    quickReplyVisible,
    setQuickReplyVisible,
    realTimeMessages,
    handleSendMessage,
    handleKeyDown,
    handleTemplateSelect
  } = chatState;

  const characterCount = message.length;
  const isLongMessage = characterCount > 800;

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2 border">
            <input
              type="checkbox"
              id="internal"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
            />
            <label htmlFor="internal" className="text-sm text-gray-700 cursor-pointer select-none font-medium">
              Nota interna
            </label>
          </div>
          {isInternal && (
            <Badge variant="outline" className="text-xs font-bold text-orange-700 border-orange-400 bg-orange-50 px-3 py-1">
              <Eye className="w-3 h-3 mr-1.5 inline" />
              Não visível para o cliente
            </Badge>
          )}
          

        </div>
        
        <div className="flex items-center space-x-2">
          {/* File upload button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Anexar arquivo</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          <Popover open={quickReplyVisible} onOpenChange={setQuickReplyVisible}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "transition-all",
                  quickReplyVisible 
                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300" 
                    : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                )}
              >
                <Zap className="w-4 h-4 mr-1" />
                Respostas Rápidas
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" side="top" align="end">
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-purple-600" />
                  Respostas Rápidas
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {/* Templates pré-definidos */}
                {quickTemplates.map((template) => (
                  <Button
                    key={template.id}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-4 hover:bg-purple-50"
                    onClick={() => {
                      handleTemplateSelect(template);
                      setQuickReplyVisible(false);
                    }}
                  >
                    <div className="w-full">
                      <div className="font-medium text-gray-900 mb-1">{template.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">{template.content}</div>
                    </div>
                  </Button>
                ))}
                
                {/* Separador */}
                <div className="border-t border-gray-200 my-2"></div>
                
                {/* Respostas rápidas */}
                <div className="p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Respostas Rápidas</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "👋 Olá! Como posso ajudá-lo?",
                      "⏳ Um momento, estou verificando...",
                      "✅ Problema resolvido!",
                      "📞 Vou transferir para outro setor",
                      "📧 Enviando informações por email",
                      "🔄 Ticket atualizado com sucesso"
                    ].map((quickReply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMessage(quickReply);
                          setQuickReplyVisible(false);
                          textareaRef.current?.focus();
                        }}
                        className="h-8 text-xs text-left justify-start bg-white hover:bg-purple-50 border-purple-200"
                      >
                        {quickReply}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>



      {/* Message input */}
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInternal ? "✏️ Escreva uma nota interna..." : "💬 Digite sua mensagem..."}
            className={cn(
              "min-h-[60px] max-h-[120px] resize-none border-2 rounded-xl px-4 py-3 text-sm transition-all duration-200 shadow-sm",
              "focus:ring-2 focus:ring-offset-0 bg-gray-50 hover:bg-white",
              isInternal 
                ? "border-orange-300 focus:border-orange-500 focus:ring-orange-200" 
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-200",
              isLongMessage && "border-amber-300 focus:border-amber-500 focus:ring-amber-500"
            )}
            disabled={isSending}
          />
          {message.length > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center space-x-2">
              <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">
                {characterCount}/1000
              </div>
              {isLongMessage && (
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              )}
            </div>
          )}
        </div>
        
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || isSending}
          className={cn(
            "h-12 px-6 rounded-xl font-semibold transition-all duration-200 shadow-sm bg-blue-600 hover:bg-blue-700",
            "disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
          )}
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Send className="w-5 h-5 mr-2" />
          )}
          {isSending ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
      
      {/* Enhanced keyboard shortcut hints */}
      <div className="flex justify-between items-center mt-3">
        <div className="flex flex-wrap gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Enter</kbd> 
            <span>enviar</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Shift+Enter</kbd> 
            <span>nova linha</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">Ctrl+M</kbd> 
            <span>minimizar</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-purple-100 px-2 py-1 rounded text-xs font-mono">Ctrl+T</kbd> 
            <span>templates</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {message.trim() && (
            <div className="flex items-center gap-2 text-blue-500 animate-pulse">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs">Digitando...</span>
            </div>
          )}
          
          {/* Message count indicator */}
          <div className="text-xs text-gray-400">
            {realTimeMessages.length} mensagens
          </div>
        </div>
      </div>
    </div>
  );
}; 