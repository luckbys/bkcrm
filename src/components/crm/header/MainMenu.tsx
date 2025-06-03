
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { menuItems } from '@/data/sectors';
import { Menu, ExternalLink } from 'lucide-react';

export const MainMenu = () => {
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
  );
};
