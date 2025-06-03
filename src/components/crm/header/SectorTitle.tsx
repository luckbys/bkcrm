
import { Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectorTitleProps {
  selectedSector: any;
}

export const SectorTitle = ({ selectedSector }: SectorTitleProps) => {
  return (
    <div className={cn(
      "flex items-center px-3 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all duration-200",
      selectedSector.color,
      selectedSector.textColor,
      "hover:shadow-md"
    )}>
      <Headphones className="w-4 h-4 mr-2" />
      <span className="hidden sm:inline">{selectedSector.name}</span>
    </div>
  );
};
