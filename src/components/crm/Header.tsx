
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { menuItems } from '@/data/sectors';
import { 
  Menu, 
  Maximize, 
  Settings, 
  Bell, 
  FolderOpen,
  MessageSquare,
  Filter,
  User,
  LogOut,
  ExternalLink,
  Headphones,
  Plus,
  Volume2,
  VolumeX
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
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Side */}
        <div className="flex items-center space-x-3">
          {/* Main Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hover:bg-gray-50 transition-colors">
                <Menu className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Menus</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-white/95 backdrop-blur-sm">
              {menuItems.map((item, index) => (
                <div key={item.name}>
                  <DropdownMenuItem 
                    onClick={() => handleMenuClick(item)}
                    className="flex items-center hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span className="mr-3 text-lg">{getIconComponent(item.icon)}</span>
                    <span className="flex-1">{item.name}</span>
                    {item.external && <ExternalLink className="w-3 h-3 ml-auto text-gray-400" />}
                  </DropdownMenuItem>
                  {index === 4 && <DropdownMenuSeparator />}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dynamic Sector Title */}
          <div className={cn(
            "flex items-center px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200",
            selectedSector.color,
            selectedSector.textColor,
            "hover:shadow-md"
          )}>
            <Headphones className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{selectedSector.name}</span>
          </div>

          {/* Sector Action Buttons */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={currentView === 'conversas' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('conversas')}
              className={cn(
                "transition-all duration-200",
                currentView === 'conversas' 
                  ? "bg-white shadow-sm" 
                  : "hover:bg-white/70"
              )}
            >
              <MessageSquare className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Conversas</span>
            </Button>
            <Button
              variant={currentView === 'funil' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('funil')}
              className={cn(
                "transition-all duration-200",
                currentView === 'funil' 
                  ? "bg-white shadow-sm" 
                  : "hover:bg-white/70"
              )}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              <span className="hidden sm:inline">Funil</span>
            </Button>
          </div>

          {/* Add Ticket Button */}
          <Button
            onClick={onOpenAddTicket}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span className="hidden md:inline">Novo</span>
          </Button>
        </div>

        {/* Center - Company Logo */}
        <div className="flex-1 flex justify-center">
          <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CRM Sistema
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2">
          {/* Full Screen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullScreen}
            className="hover:bg-gray-100 transition-colors"
            title={isFullScreen ? "Sair do modo tela cheia" : "Modo tela cheia"}
          >
            <Maximize className="w-4 h-4" />
          </Button>

          {/* Settings Icon */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log(`Settings for sector: ${selectedSector.tipo}`)}
            className="hover:bg-gray-100 transition-colors"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </Button>

          {/* Manage Packages */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-gray-100 transition-colors"
            title="Gerenciar pacotes"
          >
            <FolderOpen className="w-4 h-4" />
          </Button>

          {/* Notifications */}
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

          {/* Sound Toggle */}
          <Button
            variant={soundEnabled ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleSound(!soundEnabled)}
            className={cn(
              "transition-all duration-200",
              soundEnabled 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "hover:bg-gray-100"
            )}
            title={soundEnabled ? "Desativar sons" : "Ativar sons"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 transition-colors">
                <Avatar className="h-8 w-8 ring-2 ring-gray-200">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                    US
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:inline">Usuário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
              <DropdownMenuItem className="hover:bg-gray-100 transition-colors cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Conta
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-gray-100 transition-colors cursor-pointer text-red-600">
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
