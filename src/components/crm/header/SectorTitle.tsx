import { Headphones, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorTitleProps {
  selectedSector: any;
  variant?: 'default' | 'compact' | 'floating';
}

export const SectorTitle = ({ selectedSector, variant = 'default' }: SectorTitleProps) => {
  const isCompact = variant === 'compact';
  const isFloating = variant === 'floating';
  
  return (
    <div className={cn(
      "flex items-center backdrop-blur-sm transition-all duration-200 border group",
      isFloating 
        ? "px-4 py-3 rounded-2xl bg-white/90 hover:bg-white border-gray-200/60 hover:border-gray-300/80 shadow-lg hover:shadow-xl"
        : "px-3 py-2 rounded-xl bg-white/60 hover:bg-white/80 border-gray-200/60 hover:border-gray-300/80 shadow-sm hover:shadow-md",
      isCompact && "px-2 py-1"
    )}>
      
      <div className={cn(
        "p-1.5 rounded-lg mr-3 bg-blue-50/80 group-hover:bg-blue-100/80 transition-all duration-200 group-hover:scale-105",
        isCompact && "p-1 mr-2"
      )}>
        <Headphones className={cn(
          "text-blue-600 transition-colors duration-200",
          isCompact ? "w-3 h-3" : "w-4 h-4"
        )} />
      </div>
      
      <div className="flex flex-col min-w-0">
        <div className="flex items-center space-x-2">
          <span className={cn(
            "font-semibold text-gray-900 group-hover:text-gray-800 transition-colors truncate",
            isCompact ? "text-xs" : "text-sm"
          )}>
            {selectedSector.name}
          </span>
          
          {/* Status indicator */}
          <div className="flex items-center space-x-1">
            <Circle className={cn(
              "fill-emerald-400 text-emerald-400",
              isCompact ? "w-2 h-2" : "w-2.5 h-2.5"
            )} />
            {!isCompact && (
              <span className="text-xs text-emerald-600 font-medium">
                Ativo
              </span>
            )}
          </div>
        </div>
        
        {!isCompact && (
          <span className="text-xs text-gray-500 font-medium">
            Setor de Atendimento
          </span>
        )}
      </div>
      

    </div>
  );
};
