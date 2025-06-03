
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Headphones, ShoppingCart, ClipboardCheck, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  sectors: any[];
  selectedSector: any;
  onSectorChange: (sector: any) => void;
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ sectors, selectedSector, onSectorChange, collapsed, onToggle }: SidebarProps) => {
  const [ticketCounts, setTicketCounts] = useState<Record<number, { nonVisualized: number; total: number }>>({});

  // Simulate real-time ticket count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTicketCounts(prev => {
        const updated = { ...prev };
        sectors.forEach(sector => {
          if (Math.random() > 0.8) { // 20% chance to update
            updated[sector.id] = {
              nonVisualized: Math.max(0, (prev[sector.id]?.nonVisualized || sector.nonVisualized) + (Math.random() > 0.5 ? 1 : -1)),
              total: Math.max(1, (prev[sector.id]?.total || sector.total) + (Math.random() > 0.7 ? 1 : 0))
            };
          }
        });
        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [sectors]);

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'headset': Headphones,
      'shopping-cart': ShoppingCart,
      'clipboard-check': ClipboardCheck,
      'chart-bar': BarChart3,
      'chart-line': TrendingUp
    };
    return iconMap[iconName] || ClipboardCheck;
  };

  const getSectorCounts = (sector: any) => {
    return ticketCounts[sector.id] || { nonVisualized: sector.nonVisualized, total: sector.total };
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm",
      collapsed ? "w-16" : "w-72"
    )}>
      {/* Toggle Button */}
      <div className="p-3 border-b border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full flex justify-center hover:bg-gray-100 transition-colors"
          title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sectors List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {sectors.map((sector) => {
            const IconComponent = getIconComponent(sector.icon);
            const counts = getSectorCounts(sector);
            const isSelected = selectedSector.id === sector.id;

            return (
              <Button
                key={sector.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left transition-all duration-200 h-auto p-0",
                  collapsed ? "px-2 py-3" : "px-3 py-3",
                  isSelected && "bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500 shadow-sm"
                )}
                onClick={() => onSectorChange(sector)}
              >
                <div className="flex items-center w-full">
                  <div className={cn(
                    "flex items-center justify-center rounded-lg text-white text-xs font-medium shadow-sm transition-transform duration-200 hover:scale-105",
                    sector.color,
                    collapsed ? "w-8 h-8" : "w-12 h-12 mr-3"
                  )}>
                    <IconComponent className={cn(collapsed ? "w-4 h-4" : "w-5 h-5")} />
                  </div>
                  
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold truncate text-gray-900">
                          {sector.name}
                        </span>
                        <div className="flex items-center space-x-1.5 ml-2">
                          {counts.nonVisualized > 0 && (
                            <Badge 
                              variant="destructive" 
                              className="text-xs px-2 py-0.5 animate-pulse"
                            >
                              {counts.nonVisualized}
                            </Badge>
                          )}
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700"
                          >
                            {counts.total}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                        {counts.nonVisualized} não visualizados de {counts.total}
                      </div>
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="text-xs text-gray-600 font-medium">
            📊 Setores/Departamentos
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Atualizando em tempo real
          </div>
        </div>
      )}
    </div>
  );
};
