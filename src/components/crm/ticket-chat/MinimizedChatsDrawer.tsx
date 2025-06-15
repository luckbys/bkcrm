import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Maximize2, Pin, PinOff, Eye, EyeOff, MoreVertical } from 'lucide-react';
import './fab-fixed.css';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { useMinimizedChatManager } from '../../../hooks/useMinimizedChatManager';
import { MinimizedChat } from '../../../services/MinimizedChatManager';

interface MinimizedChatItemProps {
  chat: MinimizedChat;
  onExpand: (chatId: string) => void;
  onClose: (chatId: string) => void;
  onTogglePin: (chatId: string) => void;
  onToggleVisibility: (chatId: string) => void;
}

const MinimizedChatItem: React.FC<MinimizedChatItemProps> = ({
  chat,
  onExpand,
  onClose,
  onTogglePin,
  onToggleVisibility,
}) => {
  const handleExpand = () => {
    onExpand(chat.id);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(chat.id);
  };

  const handleTogglePin = () => {
    onTogglePin(chat.id);
  };

  const handleToggleVisibility = () => {
    onToggleVisibility(chat.id);
  };

  return (
    <div 
      className={`
        p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200
        ${chat.position?.isPinned ? 'ring-2 ring-yellow-400 bg-yellow-50' : 'bg-white'}
      `}
      onClick={handleExpand}
    >
      {/* Header do chat */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Status de conexão */}
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          
          {/* Nome do cliente */}
          <span className="text-sm font-medium text-gray-700 truncate">
            {chat.ticket?.client || 'Cliente'}
          </span>
          
          {/* Badge de mensagens não lidas */}
          {chat.unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="text-xs px-1.5 py-0.5 animate-bounce"
            >
              {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
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
                {chat.position.isPinned ? (
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

      {/* Última mensagem */}
      <div className="mb-2">
        {chat.lastMessage?.content || chat.ticket?.lastMessage ? (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {chat.lastMessage?.content || chat.ticket?.lastMessage}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">
            Nenhuma mensagem recente
          </p>
        )}
      </div>

      {/* Footer com informações */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>🟢 Online</span>
        <span className="text-blue-600 font-medium">
          Clique para expandir
        </span>
      </div>
    </div>
  );
};

export const MinimizedChatsDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    chats, 
    expandChat, 
    removeChat, 
    togglePin, 
    toggleVisibility,
    stats 
  } = useMinimizedChatManager();

  const handleExpand = (chatId: string) => {
    expandChat(chatId);
    setIsOpen(false); // Fecha o drawer após expandir
  };

  const totalUnread = stats.totalUnread;

  // FAB renderizado via portal para garantir posicionamento fixo
  const fabButton = (
    <Button
      size="lg"
      className={`fixed right-6 bottom-6 z-[9999] h-14 w-14 rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 group overflow-hidden ${
        isOpen ? 'opacity-30 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ 
        position: 'fixed',
        right: '24px',
        bottom: '24px',
        zIndex: 9999
      }}
      data-testid="minimized-chats-fab"
      onClick={() => setIsOpen(true)}
    >
      {/* Ripple effect */}
      <div className={`absolute inset-0 rounded-full bg-white transition-opacity duration-300 ${
        isOpen ? 'opacity-10' : 'opacity-0 group-hover:opacity-20'
      }`} />
      
      {/* Indicador de drawer aberto */}
      {isOpen && (
        <div className="absolute inset-0 rounded-full border-2 border-white opacity-50 animate-pulse" />
      )}
      
      <div className="relative z-10">
        <MessageSquare className={`w-6 h-6 text-white transition-transform duration-200 ${
          isOpen ? 'rotate-12' : 'group-hover:scale-110 group-active:scale-95'
        }`} />
        {totalUnread > 0 && !isOpen && (
          <Badge 
            variant="destructive" 
            className="absolute -top-3 -right-3 h-6 w-6 p-0 text-xs flex items-center justify-center animate-bounce border-2 border-white shadow-md"
          >
            {totalUnread > 9 ? '9+' : totalUnread}
          </Badge>
        )}
      </div>
    </Button>
  );

  return (
    <>
      {/* FAB renderizado no body via portal */}
      {typeof document !== 'undefined' && createPortal(fabButton, document.body)}
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
      
      <SheetContent side="right" className="w-96 sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Chats Minimizados
            {chats.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {chats.length}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6">
          {chats.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum chat minimizado
              </h3>
              <p className="text-gray-600">
                Quando você minimizar chats, eles aparecerão aqui para acesso rápido.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.map((chat) => (
                <MinimizedChatItem
                  key={chat.id}
                  chat={chat}
                  onExpand={handleExpand}
                  onClose={removeChat}
                  onTogglePin={togglePin}
                  onToggleVisibility={toggleVisibility}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer com estatísticas */}
        {chats.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{stats.totalChats} chats ativos</span>
              <span>{stats.pinnedChats} fixados</span>
              <span>{totalUnread} não lidas</span>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
    </>
  );
}; 