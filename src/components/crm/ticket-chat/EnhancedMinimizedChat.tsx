import React, { useCallback } from 'react';
import { X, Maximize2, Pin, PinOff, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { MinimizedChatPosition } from '../../../services/MinimizedChatManager';

interface EnhancedMinimizedChatProps {
  ticketId: string;
  title: string;
  lastMessage?: string;
  unreadCount?: number;
  position: MinimizedChatPosition;
  index: number; // Índice para posicionamento vertical
  onExpand: (ticketId: string) => void;
  onClose: (ticketId: string) => void;
  onTogglePin: (ticketId: string) => void;
  onToggleVisibility: (ticketId: string) => void;
  isWhatsAppConnected?: boolean;
}

export const EnhancedMinimizedChat: React.FC<EnhancedMinimizedChatProps> = ({
  ticketId,
  title,
  lastMessage,
  unreadCount = 0,
  position,
  index,
  onExpand,
  onClose,
  onTogglePin,
  onToggleVisibility,
  isWhatsAppConnected = true,
}) => {
  // Early return se position não estiver definido
  if (!position) {
    console.warn(`EnhancedMinimizedChat: position is undefined for ticketId ${ticketId}`);
    return null;
  }

  // Handlers de ação
  const handleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onExpand(ticketId);
  }, [ticketId, onExpand]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(ticketId);
  }, [ticketId, onClose]);

  const handleTogglePin = useCallback(() => {
    onTogglePin(ticketId);
  }, [ticketId, onTogglePin]);

  const handleToggleVisibility = useCallback(() => {
    onToggleVisibility(ticketId);
  }, [ticketId, onToggleVisibility]);

  // Posicionamento fixo estratégico - canto inferior direito
  const chatHeight = 120;
  const chatWidth = 280;
  const margin = 20; // Margem maior para evitar corte
  const spacing = 8;
  
  // Calcula posição segura considerando o viewport
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const safeRight = Math.max(margin, margin);
  const safeBottom = margin + (index * (chatHeight + spacing));
  
  // Ajusta largura se necessário para telas pequenas
  const responsiveWidth = Math.min(chatWidth, viewportWidth - (margin * 2));
  
  const chatStyles: React.CSSProperties = {
    position: 'fixed',
    right: safeRight,
    bottom: safeBottom,
    width: responsiveWidth,
    height: chatHeight,
    maxWidth: `calc(100vw - ${margin * 2}px)`, // Garante que não ultrapasse a tela
    minWidth: '200px', // Largura mínima para manter usabilidade
    zIndex: 9999 + index, // Z-index muito alto para garantir que fique sempre visível
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'auto', // Garante que seja clicável
    // Propriedades adicionais para garantir posicionamento fixo
    transform: 'translateZ(0)', // Força aceleração de hardware
    willChange: 'auto',
    isolation: 'isolate', // Cria novo contexto de empilhamento
    boxSizing: 'border-box', // Inclui padding e border no cálculo da largura
    overflow: 'hidden', // Evita que o conteúdo vaze
  };

  const containerClasses = `
    bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl
    ${position?.isPinned ? 'ring-2 ring-yellow-400' : ''}
    backdrop-blur-sm cursor-pointer
    transform hover:scale-105 transition-all duration-200
  `.trim();

  if (!position?.isVisible) {
    return null;
  }

  return (
    <div
      style={chatStyles}
      className={containerClasses}
      onClick={handleExpand}
      data-testid={`minimized-chat-${ticketId}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 rounded-t-lg">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Status WhatsApp */}
          <div className={`
            w-2 h-2 rounded-full flex-shrink-0
            ${isWhatsAppConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}
          `} />
          
          {/* Título truncado */}
          <span className="text-sm font-medium text-gray-700 truncate">
            {title}
          </span>
          
          {/* Badge de mensagens não lidas */}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="text-xs px-1.5 py-0.5 animate-bounce"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleExpand}>
                <Maximize2 className="w-3 h-3 mr-2" />
                Expandir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTogglePin}>
                {position.isPinned ? (
                  <>
                    <PinOff className="w-3 h-3 mr-2" />
                    Desafixar
                  </>
                ) : (
                  <>
                    <Pin className="w-3 h-3 mr-2" />
                    Fixar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleVisibility}>
                <EyeOff className="w-3 h-3 mr-2" />
                Ocultar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClose} className="text-red-600">
                <X className="w-3 h-3 mr-2" />
                Fechar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
            onClick={handleClose}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Conteúdo do chat */}
      <div className="p-3 pt-2">
        {lastMessage && (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {lastMessage}
          </p>
        )}
        {!lastMessage && (
          <p className="text-xs text-gray-400 italic">
            Nenhuma mensagem recente
          </p>
        )}
        
        {/* Footer com status */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {isWhatsAppConnected ? '🟢 Online' : '🔴 Offline'}
          </span>
          <span className="text-xs text-blue-600 font-medium">
            Clique para expandir
          </span>
        </div>
      </div>
    </div>
  );
};
