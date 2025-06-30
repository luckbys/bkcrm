import React, { useState, useEffect } from 'react';
import { Bell, Check, X, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  ticketId: string;
  isInternal: boolean;
  isRead: boolean;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  // Simular hook removido
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // Carregar notificações de exemplo (simulação)
  useEffect(() => {
    const sampleNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nova mensagem',
        message: 'Cliente enviou uma nova mensagem',
        timestamp: new Date(),
        ticketId: 'ticket-123',
        isInternal: false,
        isRead: false
      }
    ];
    
    // Simular delay de carregamento
    setTimeout(() => {
      setNotifications(sampleNotifications);
    }, 1000);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida
    markNotificationAsRead(notification.id);
    
    // Abrir ticket em nova aba
    window.open(`/tickets/${notification.ticketId}`, '_blank');
    
    // Fechar dropdown
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAsRead();
    setIsOpen(false);
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          <div className="flex items-center gap-2">
            {!isConnected && (
              <Badge variant="secondary" className="text-xs">
                Desconectado
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-6 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma notificação</p>
            <p className="text-xs">Novas mensagens aparecerão aqui</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {notification.title}
                  </span>
                  {notification.isInternal && (
                    <Badge variant="outline" className="text-xs">
                      Interna
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    markNotificationAsRead(notification.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(notification.timestamp)}
                </div>
                <div className="flex items-center gap-1">
                  <span>Ticket #{notification.ticketId.slice(-8)}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                Fechar
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 