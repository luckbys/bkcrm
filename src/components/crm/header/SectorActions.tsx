
import { Button } from '@/components/ui/button';
import { MessageSquare, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorActionsProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const SectorActions = ({ currentView, onViewChange }: SectorActionsProps) => {
  return (
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
  );
};
