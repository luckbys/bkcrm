import React from 'react';
import { MessageCircle, Lock } from 'lucide-react';
import { Button } from '../ui/button';

interface MessageInputTabsProps {
  activeMode: 'message' | 'internal';
  onModeChange: (mode: 'message' | 'internal') => void;
  messageText: string;
  onMessageChange: (text: string) => void;
  onSend: () => void;
  isLoading?: boolean;
}

export const MessageInputTabs: React.FC<MessageInputTabsProps> = ({
  activeMode,
  onModeChange,
  messageText,
  onMessageChange,
  onSend,
  isLoading = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    } else if (e.key === 'i' && e.ctrlKey) {
      e.preventDefault();
      onModeChange(activeMode === 'message' ? 'internal' : 'message');
    }
  };

  const getPlaceholder = () => {
    return activeMode === 'message' 
      ? 'Digite sua mensagem para o cliente...'
      : 'Digite uma nota interna (apenas para equipe)...';
  };

  const getButtonColor = () => {
    return activeMode === 'message' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600';
  };

  return (
    <div className="space-y-3">
      {/* Abas de Modo */}
      <div className="flex space-x-2">
        <button
          onClick={() => onModeChange('message')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            activeMode === 'message'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageCircle size={16} />
          <span>Mensagem</span>
        </button>
        
        <button
          onClick={() => onModeChange('internal')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            activeMode === 'internal'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Lock size={16} />
          <span>Nota Interna</span>
        </button>
      </div>

      {/* Área de Input */}
      <div className="flex space-x-3">
        <textarea
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={getPlaceholder()}
          className="flex-1 p-3 border border-gray-300 rounded-lg resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
        
        <Button
          onClick={onSend}
          disabled={!messageText.trim() || isLoading}
          className={`px-6 py-3 text-white rounded-lg transition-all duration-200 ${getButtonColor()} disabled:opacity-50`}
        >
          {isLoading ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>

      {/* Contador de Caracteres */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>
          {activeMode === 'message' ? '💬 Para o cliente' : '🔒 Apenas equipe'}
        </span>
        <span className={messageText.length > 800 ? 'text-amber-600' : ''}>
          {messageText.length} caracteres
        </span>
      </div>

      {/* Atalhos */}
      <div className="text-xs text-gray-400">
        Enter = Enviar • Shift+Enter = Nova linha • Ctrl+I = Alternar modo
      </div>
    </div>
  );
}; 