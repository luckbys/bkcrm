
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Bell } from 'lucide-react';

export const NotificationsDropdown = () => {
  const [notificationCount] = useState(5);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative hover:bg-gray-100 transition-colors">
          <Bell className="w-4 h-4" />
          {notificationCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
            >
              {notificationCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-white/95 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Notificações</h4>
            <Badge variant="secondary" className="text-xs">
              {notificationCount} novas
            </Badge>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400 transition-colors hover:bg-blue-100">
              <p className="font-medium text-gray-900">Novo ticket recebido</p>
              <p className="text-sm text-gray-600 mt-1">Cliente: João Silva - Setor: Atendimento</p>
              <p className="text-xs text-gray-500 mt-1">há 2 minutos</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400 transition-colors hover:bg-green-100">
              <p className="font-medium text-gray-900">Ticket atualizado</p>
              <p className="text-sm text-gray-600 mt-1">Ticket #1234 foi respondido</p>
              <p className="text-xs text-gray-500 mt-1">há 5 minutos</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <Button variant="link" size="sm" className="p-0 text-blue-600 hover:text-blue-700">
              Ver todas notificações →
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
