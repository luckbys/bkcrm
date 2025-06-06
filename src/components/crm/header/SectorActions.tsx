import { Button } from '@/components/ui/button';
import { MessageSquare, Filter, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorActionsProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const SectorActions = ({ currentView, onViewChange }: SectorActionsProps) => {
  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('dashboard')}
        className={cn(
          "transition-all duration-200",
          currentView === 'dashboard' 
            ? "bg-white shadow-sm text-gray-900 hover:bg-white" 
            : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
        )}
      >
        <BarChart3 className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">Dashboard</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('conversas')}
        className={cn(
          "transition-all duration-200",
          currentView === 'conversas' 
            ? "bg-white shadow-sm text-gray-900 hover:bg-white" 
            : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
        )}
      >
        <MessageSquare className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">Conversas</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('funil')}
        className={cn(
          "transition-all duration-200",
          currentView === 'funil' 
            ? "bg-white shadow-sm text-gray-900 hover:bg-white" 
            : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
        )}
      >
        <Filter className="w-4 h-4 mr-1.5" />
        <span className="hidden sm:inline">Funil</span>
      </Button>
    </div>
  );
};
