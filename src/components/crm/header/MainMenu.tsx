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
          variant="ghost" 
          size="sm" 
          className="
            h-10 px-3 rounded-xl
            bg-white/60 hover:bg-white/80
            border border-gray-200/60 hover:border-gray-300/80
            text-gray-600 hover:text-gray-900
            shadow-sm hover:shadow-md
            backdrop-blur-sm
            transition-all duration-200 ease-out
            group
          "
        >
          <Menu className="w-4 h-4 mr-2 transition-transform group-hover:scale-110 duration-200" />
          <span className="hidden sm:inline font-medium text-sm">Menus</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="start" 
        className="
          w-72 p-3
          bg-white/95 backdrop-blur-xl
          border border-gray-200/50
          shadow-2xl shadow-black/5
          rounded-2xl
          animate-in slide-in-from-top-2 duration-300
        "
      >
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Navegação</h3>
          <p className="text-xs text-gray-500">Acesse os módulos do sistema</p>
        </div>
        
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <div key={item.name}>
              <DropdownMenuItem 
                onClick={() => handleMenuClick(item)}
                className="
                  flex items-center p-3 rounded-xl
                  hover:bg-gray-50/80 hover:backdrop-blur-sm
                  transition-all duration-200 ease-out
                  cursor-pointer group
                  focus:bg-gray-50/80
                  focus:outline-none focus:ring-2 focus:ring-blue-500/20
                  border border-transparent hover:border-gray-200/50
                "
              >
                <div className="
                  mr-3 p-2 rounded-lg
                  bg-gray-100/50 group-hover:bg-blue-50/80
                  transition-all duration-200
                  group-hover:scale-105
                ">
                  <div className="text-gray-500 group-hover:text-blue-600 transition-colors duration-200">
                    {getIconComponent(item.icon)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="
                    text-sm font-medium text-gray-700
                    group-hover:text-gray-900
                    transition-colors duration-200
                    block truncate
                  ">
                    {item.name}
                  </span>
                </div>
                
                <div className="flex items-center ml-3">
                  {item.external ? (
                    <ExternalLink className="
                      w-4 h-4 text-gray-400
                      group-hover:text-blue-500
                      transition-all duration-200
                    " />
                  ) : (
                    <ChevronRight className="
                      w-4 h-4 text-gray-300
                      group-hover:text-gray-500
                      transition-all duration-200
                      group-hover:translate-x-0.5
                    " />
                  )}
                </div>
              </DropdownMenuItem>
              
              {index === 4 && (
                <DropdownMenuSeparator className="
                  my-3 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent
                  h-px border-0
                " />
              )}
            </div>
          ))}
        </div>
        
        <div className="
          mt-4 pt-3 border-t border-gray-100/60
          text-xs text-gray-500 text-center
          font-medium
        ">
          {menuItems.length} módulos disponíveis
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
