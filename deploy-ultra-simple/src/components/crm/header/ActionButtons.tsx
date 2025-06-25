import { Button } from '@/components/ui/button';
import { 
  Maximize, 
  Settings, 
  FolderOpen,
  Plus,
  Volume2,
  VolumeX,
  Minimize
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonsProps {
  selectedSector: any;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  onOpenAddTicket: () => void;
  variant?: 'default' | 'mobile' | 'compact';
}

export const ActionButtons = ({ 
  selectedSector, 
  isFullScreen, 
  onToggleFullScreen,
  soundEnabled,
  onToggleSound,
  onOpenAddTicket,
  variant = 'default'
}: ActionButtonsProps) => {
  const isMobile = variant === 'mobile';
  const isCompact = variant === 'compact';
  
  return (
    <div className={cn(
      "flex items-center",
      isMobile ? "space-x-1" : "space-x-2"
    )}>
      {/* Add Ticket Button - Primary Action */}
      <Button
        onClick={onOpenAddTicket}
        size={isMobile ? "sm" : "sm"}
        className={cn(
          "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 border-0 transition-all duration-200 ease-out hover:scale-105 active:scale-95 group",
          isMobile 
            ? "h-8 px-2 rounded-lg" 
            : isCompact 
              ? "h-9 px-3 rounded-xl"
              : "h-10 px-4 rounded-xl"
        )}
      >
        <Plus className={cn(
          "transition-transform group-hover:rotate-90 duration-200",
          isMobile ? "w-3 h-3" : "w-4 h-4",
          !isMobile && "mr-2"
        )} />
        {!isMobile && (
          <span className={cn(
            isCompact ? "hidden md:inline" : "hidden md:inline"
          )}>
            {isCompact ? "Novo" : "Novo Ticket"}
          </span>
        )}
      </Button>

      <div className={cn(
        "flex items-center",
        isMobile ? "space-x-1" : "space-x-1"
      )}>
        {/* Sound Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleSound(!soundEnabled)}
          className={cn(
            "backdrop-blur-sm transition-all duration-200 ease-out group",
            isMobile 
              ? "h-8 w-8 rounded-lg" 
              : isCompact 
                ? "h-9 w-9 rounded-xl"
                : "h-10 w-10 rounded-xl",
            soundEnabled 
              ? "bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 text-blue-600" 
              : "bg-white/60 hover:bg-white/80 border border-gray-200/60 text-gray-600 hover:text-gray-900"
          )}
          title={soundEnabled ? "Desativar sons" : "Ativar sons"}
        >
          {soundEnabled ? 
            <Volume2 className={cn(
              "transition-transform group-hover:scale-110 duration-200",
              isMobile ? "w-3 h-3" : "w-4 h-4"
            )} /> : 
            <VolumeX className={cn(
              "transition-transform group-hover:scale-110 duration-200",
              isMobile ? "w-3 h-3" : "w-4 h-4"
            )} />
          }
        </Button>

        {/* Full Screen Toggle */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleFullScreen}
            className={cn(
              "bg-white/60 hover:bg-white/80 border border-gray-200/60 hover:border-gray-300/80 text-gray-600 hover:text-gray-900 backdrop-blur-sm transition-all duration-200 ease-out group",
              isCompact 
                ? "h-9 w-9 rounded-xl"
                : "h-10 w-10 rounded-xl"
            )}
            title={isFullScreen ? "Sair do modo tela cheia" : "Modo tela cheia"}
          >
            {isFullScreen ? 
              <Minimize className="w-4 h-4 transition-transform group-hover:scale-110 duration-200" /> :
              <Maximize className="w-4 h-4 transition-transform group-hover:scale-110 duration-200" />
            }
          </Button>
        )}

        {/* Manage Packages */}
        {!isMobile && !isCompact && (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/60 hover:border-gray-300/80 text-gray-600 hover:text-gray-900 backdrop-blur-sm transition-all duration-200 ease-out group"
            title="Gerenciar pacotes"
          >
            <FolderOpen className="w-4 h-4 transition-transform group-hover:scale-110 duration-200" />
          </Button>
        )}

        {/* Settings */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => console.log(`Settings for sector: ${selectedSector.tipo}`)}
            className={cn(
              "bg-white/60 hover:bg-white/80 border border-gray-200/60 hover:border-gray-300/80 text-gray-600 hover:text-gray-900 backdrop-blur-sm transition-all duration-200 ease-out group",
              isCompact 
                ? "h-9 w-9 rounded-xl"
                : "h-10 w-10 rounded-xl"
            )}
            title="Configurações"
          >
            <Settings className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          </Button>
        )}
      </div>
    </div>
  );
};
