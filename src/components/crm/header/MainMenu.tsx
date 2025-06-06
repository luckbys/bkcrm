import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { menuItems } from '@/data/sectors';
import { 
  Menu, 
  ExternalLink,
  BarChart3,
  User,
  Package,
  TrendingUp,
  Folder,
  ClipboardCheck,
  Settings,
  Boxes,
  Activity,
  ChevronRight,
  Smartphone
} from 'lucide-react';

interface MainMenuProps {
  onNavigate?: (view: string) => void;
}

export const MainMenu = ({ onNavigate }: MainMenuProps) => {
  const handleMenuClick = (item: any) => {
    if (item.external) {
      window.open(item.url, '_blank');
    } else {
      console.log(`Navegando para: ${item.url}`);
      
      // Mapear URLs para views do sistema
      const viewMap: Record<string, string> = {
        '/dashboard': 'dashboard',
        '/clientes': 'clientes',
        '/produtos': 'produtos',
        '/disparos': 'disparos',
        '/tarefas': 'tarefas',
        '/processos': 'processos',
        '/kanban': 'kanban',
        '/estatisticas': 'estatisticas',
        '/admin': 'admin',
        '/setup': 'setup'
      };
      
      const view = viewMap[item.url];
      if (view && onNavigate) {
        onNavigate(view);
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'tachometer-alt': BarChart3,
      'user': User,
      'box-open': Package,
      'chart-line': TrendingUp,
      'smartphone': Smartphone,
      'sitemap': Folder,
      'clipboard-check': ClipboardCheck,
      'chart-bar': Activity,
      'cogs': Settings,
      'cubes': Boxes
    };
    const IconComponent = iconMap[iconName] || ClipboardCheck;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="
            relative overflow-hidden
            bg-gradient-to-r from-blue-50 to-indigo-50
            border-blue-200 hover:border-blue-300
            text-gray-700 hover:text-blue-700
            shadow-sm hover:shadow-md
            transition-all duration-300 ease-in-out
            hover:scale-105 active:scale-95
            group
          "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Menu className="w-4 h-4 mr-2 transition-transform group-hover:rotate-180 duration-300" />
          <span className="hidden sm:inline font-medium">Menus</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="
          w-64 p-2
          bg-white/95 backdrop-blur-lg
          border border-gray-200/80
          shadow-xl shadow-black/10
          rounded-xl
          animate-in slide-in-from-top-2 duration-200
        "
      >
        {menuItems.map((item, index) => (
          <div key={item.name}>
            <DropdownMenuItem 
              onClick={() => handleMenuClick(item)}
              className="
                flex items-center p-3 rounded-lg mb-1
                hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50
                hover:border hover:border-blue-100
                transition-all duration-200 ease-in-out
                cursor-pointer group
                focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50
                focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1
              "
            >
              <div className="
                mr-3 p-2 rounded-lg
                bg-gradient-to-br from-gray-100 to-gray-200
                group-hover:from-blue-100 group-hover:to-indigo-100
                transition-all duration-200
                group-hover:scale-110
              ">
                <div className="text-gray-600 group-hover:text-blue-600 transition-colors duration-200">
                  {getIconComponent(item.icon)}
                </div>
              </div>
              
              <div className="flex-1">
                <span className="
                  font-medium text-gray-700
                  group-hover:text-blue-700
                  transition-colors duration-200
                ">
                  {item.name}
                </span>
              </div>
              
              <div className="flex items-center ml-auto">
                {item.external ? (
                  <ExternalLink className="
                    w-3 h-3 text-gray-400
                    group-hover:text-blue-500
                    transition-all duration-200
                    group-hover:scale-110
                  " />
                ) : (
                  <ChevronRight className="
                    w-3 h-3 text-gray-300
                    group-hover:text-blue-400
                    transition-all duration-200
                    group-hover:translate-x-1
                  " />
                )}
              </div>
            </DropdownMenuItem>
            
            {index === 4 && (
              <DropdownMenuSeparator className="
                my-3 bg-gradient-to-r from-transparent via-gray-200 to-transparent
                h-px border-0
              " />
            )}
          </div>
        ))}
        
        <div className="
          mt-2 pt-2 border-t border-gray-100
          text-xs text-gray-500 text-center
          font-medium tracking-wide
        ">
          Selecione um módulo
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
