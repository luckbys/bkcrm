
import { Button } from '@/components/ui/button';
import { 
  Maximize, 
  Settings, 
  FolderOpen,
  Plus,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonsProps {
  selectedSector: any;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenAddTicket: () => void;
}

export const ActionButtons = ({ 
  selectedSector, 
  isFullScreen, 
  onToggleFullScreen,
  soundEnabled,
  onToggleSound,
  onOpenAddTicket 
}: ActionButtonsProps) => {
  return (
    <div className="flex items-center space-x-2">
      {/* Add Ticket Button */}
      <Button
        onClick={onOpenAddTicket}
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <Plus className="w-4 h-4 mr-1.5" />
        <span className="hidden md:inline">Novo</span>
      </Button>

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
    </div>
  );
};
