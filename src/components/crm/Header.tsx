
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { menuItems } from '@/data/sectors';
import { 
  Menu, 
  Expand, 
  Settings, 
  Bell, 
  FolderOpen,
  MessageSquare,
  Filter,
  User,
  LogOut,
  ExternalLink,
  Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  selectedSector: any;
  currentView: string;
  onViewChange: (view: string) => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenAddTicket: () => void;
}

export const Header = ({ 
  selectedSector, 
  currentView, 
  onViewChange, 
  isFullScreen, 
  onToggleFullScreen,
  soundEnabled,
  onToggleSound,
  onOpenAddTicket 
}: HeaderProps) => {
  const [notificationCount] = useState(5);

  const handleMenuClick = (item: any) => {
    if (item.external) {
      window.open(item.url, '_blank');
    } else {
      console.log(`Navigating to: ${item.url}`);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'tachometer-alt': '📊',
      'user': '👤',
      'box-open': '📦',
      'chart-line': '📈',
      'sitemap': '🗂️',
      'clipboard-check': '📋',
      'chart-bar': '📊',
      'cogs': '⚙️',
      'cubes': '🧊'
    };
    return iconMap[iconName] || '📋';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Side */}
        <div className="flex items-center space-x-4">
          {/* Main Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4 mr-2" />
                Menus
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {menuItems.map((item) => (
                <DropdownMenuItem 
                  key={item.name}
                  onClick={() => handleMenuClick(item)}
                  className="flex items-center"
                >
                  <span className="mr-2">{getIconComponent(item.icon)}</span>
                  {item.name}
                  {item.external && <ExternalLink className="w-3 h-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dynamic Sector Title */}
          <div className={cn(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium",
            selectedSector.color,
            selectedSector.textColor
          )}>
            <Headphones className="w-4 h-4 mr-2" />
            {selectedSector.name}
          </div>

          {/* Sector Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant={currentView === 'conversas' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange('conversas')}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Conversas
            </Button>
            <Button
              variant={currentView === 'funil' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewChange('funil')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Funil
            </Button>
          </div>
        </div>

        {/* Center - Company Logo */}
        <div className="flex-1 flex justify-center">
          <div className="text-xl font-bold text-blue-600">
            CRM Sistema
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-3">
          {/* Full Screen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullScreen}
          >
            <Expand className="w-4 h-4" />
          </Button>

          {/* Settings Icon */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log(`Settings for sector: ${selectedSector.tipo}`)}
          >
            <Settings className="w-4 h-4" />
          </Button>

          {/* Manage Packages */}
          <Button
            variant="ghost"
            size="sm"
          >
            <FolderOpen className="w-4 h-4" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3">
                <h4 className="font-medium">Notificações</h4>
                <div className="mt-2 space-y-2">
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium">Novo ticket recebido</p>
                    <p className="text-gray-600">Cliente: João Silva - Setor: Atendimento</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-sm">
                    <p className="font-medium">Ticket atualizado</p>
                    <p className="text-gray-600">Ticket #1234 foi respondido</p>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <Button variant="link" size="sm" className="p-0">
                    Ver todas notificações
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sound Toggle */}
          <Button
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleSound(!soundEnabled)}
          >
            🔊
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>US</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Usuário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Conta
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
