import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Bell, Check, Clock, User, MessageSquare } from 'lucide-react';

export const NotificationsDropdown = () => {
  const [notificationCount] = useState(5);

  const notifications = [
    {
      id: 1,
      type: 'ticket',
      icon: MessageSquare,
      title: 'Novo ticket recebido',
      description: 'Cliente: João Silva - Setor: Atendimento',
      time: 'há 2 minutos',
      color: 'blue',
      unread: true
    },
    {
      id: 2,
      type: 'update',
      icon: Check,
      title: 'Ticket atualizado',
      description: 'Ticket #1234 foi respondido',
      time: 'há 5 minutos',
      color: 'green',
      unread: true
    },
    {
      id: 3,
      type: 'user',
      icon: User,
      title: 'Novo usuário adicionado',
      description: 'Maria Santos foi adicionada ao sistema',
      time: 'há 1 hora',
      color: 'purple',
      unread: false
    }
  ];

  const getNotificationStyles = (color: string, unread: boolean) => {
    const baseStyles = "p-4 rounded-xl transition-all duration-200 cursor-pointer group border";
    
    if (unread) {
      switch (color) {
        case 'blue':
          return `${baseStyles} bg-blue-50/80 border-blue-200/50 hover:bg-blue-100/80 hover:border-blue-300/60`;
        case 'green':
          return `${baseStyles} bg-emerald-50/80 border-emerald-200/50 hover:bg-emerald-100/80 hover:border-emerald-300/60`;
        case 'purple':
          return `${baseStyles} bg-purple-50/80 border-purple-200/50 hover:bg-purple-100/80 hover:border-purple-300/60`;
        default:
          return `${baseStyles} bg-gray-50/80 border-gray-200/50 hover:bg-gray-100/80 hover:border-gray-300/60`;
      }
    }
    
    return `${baseStyles} bg-white border-gray-100 hover:bg-gray-50/50 hover:border-gray-200/60`;
  };

  const getIconStyles = (color: string, unread: boolean) => {
    const baseStyles = "w-4 h-4 transition-colors duration-200";
    
    if (unread) {
      switch (color) {
        case 'blue':
          return `${baseStyles} text-blue-600`;
        case 'green':
          return `${baseStyles} text-emerald-600`;
        case 'purple':
          return `${baseStyles} text-purple-600`;
        default:
          return `${baseStyles} text-gray-600`;
      }
    }
    
    return `${baseStyles} text-gray-500`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="
            relative h-10 w-10 rounded-xl
            bg-white/60 hover:bg-white/80
            border border-gray-200/60 hover:border-gray-300/80
            shadow-sm hover:shadow-md
            backdrop-blur-sm
            transition-all duration-200 ease-out
            group
          "
        >
          <Bell className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="
                absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 
                flex items-center justify-center text-xs font-semibold
                bg-gradient-to-br from-red-500 to-red-600
                shadow-lg shadow-red-500/25
                animate-pulse
              "
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="
          w-96 p-4
          bg-white/95 backdrop-blur-xl
          border border-gray-200/50
          shadow-2xl shadow-black/5
          rounded-2xl
          animate-in slide-in-from-top-2 duration-300
        "
      >
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-gray-900">Notificações</h4>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="secondary" 
                className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                {notificationCount} novas
              </Badge>
              <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-700">
                Marcar todas como lidas
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">Acompanhe as últimas atualizações do sistema</p>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {notifications.map((notification) => {
            const IconComponent = notification.icon;
            return (
              <div
                key={notification.id}
                className={getNotificationStyles(notification.color, notification.unread)}
              >
                <div className="flex items-start space-x-3">
                  <div className="
                    p-2 rounded-lg
                    bg-white/60 group-hover:bg-white/80
                    transition-all duration-200
                    group-hover:scale-105
                  ">
                    <IconComponent className={getIconStyles(notification.color, notification.unread)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {notification.title}
                      </p>
                      {notification.unread && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {notification.description}
                    </p>
                    <div className="flex items-center mt-2">
                      <Clock className="w-3 h-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 font-medium">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100/60">
          <Button 
            variant="ghost" 
            size="sm" 
            className="
              w-full justify-center text-sm font-medium
              text-blue-600 hover:text-blue-700
              hover:bg-blue-50/50
              transition-all duration-200
            "
          >
            Ver todas as notificações
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
