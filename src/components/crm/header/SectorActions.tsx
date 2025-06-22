import { Button } from '@/components/ui/button';
import { MessageSquare, Filter, BarChart3, Smartphone, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorActionsProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const SectorActions = ({ currentView, onViewChange }: SectorActionsProps) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      color: 'blue'
    },
    {
      id: 'conversas',
      label: 'Conversas',
      icon: MessageSquare,
      color: 'emerald'
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: Users,
      color: 'orange'
    },
    {
      id: 'funil',
      label: 'Funil',
      icon: Filter,
      color: 'purple'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: Smartphone,
      color: 'green'
    },
    {
      id: 'chat-demo',
      label: 'Chat Demo',
      icon: Sparkles,
      color: 'pink'
    }
  ];

  const getButtonStyles = (isActive: boolean, color: string) => {
    if (isActive) {
      switch (color) {
        case 'blue':
          return "bg-blue-50/80 hover:bg-blue-100/80 border-blue-200/60 text-blue-700 shadow-sm";
        case 'emerald':
          return "bg-emerald-50/80 hover:bg-emerald-100/80 border-emerald-200/60 text-emerald-700 shadow-sm";
        case 'orange':
          return "bg-orange-50/80 hover:bg-orange-100/80 border-orange-200/60 text-orange-700 shadow-sm";
        case 'purple':
          return "bg-purple-50/80 hover:bg-purple-100/80 border-purple-200/60 text-purple-700 shadow-sm";
        case 'green':
          return "bg-green-50/80 hover:bg-green-100/80 border-green-200/60 text-green-700 shadow-sm";
        case 'pink':
          return "bg-pink-50/80 hover:bg-pink-100/80 border-pink-200/60 text-pink-700 shadow-sm";
        default:
          return "bg-white/80 hover:bg-white border-gray-200/60 text-gray-900 shadow-sm";
      }
    }
    return "bg-white/40 hover:bg-white/70 border-gray-200/40 hover:border-gray-300/60 text-gray-600 hover:text-gray-900";
  };

  return (
    <div className="flex items-center bg-white/40 backdrop-blur-sm rounded-xl p-1 border border-gray-200/40">
      {navigationItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = currentView === item.id;
        
        return (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => onViewChange(item.id)}
            className={cn(
              "h-9 px-3 rounded-lg border transition-all duration-200 ease-out group",
              getButtonStyles(isActive, item.color)
            )}
          >
            <IconComponent className="w-4 h-4 mr-2 transition-transform group-hover:scale-110 duration-200" />
            <span className="hidden md:inline text-sm font-medium">{item.label}</span>
          </Button>
        );
      })}
    </div>
  );
};
