
import { useState } from 'react';
import { TicketManagement } from './TicketManagement';
import { SalesFunnel } from './SalesFunnel';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainContentProps {
  selectedSector: any;
  currentView: string;
  onViewChange: (view: string) => void;
  isLoading: boolean;
  sidebarCollapsed: boolean;
  onOpenAddTicket: () => void;
}

export const MainContent = ({ 
  selectedSector, 
  currentView, 
  onViewChange, 
  isLoading, 
  sidebarCollapsed,
  onOpenAddTicket 
}: MainContentProps) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'conversas':
        return (
          <TicketManagement 
            sector={selectedSector} 
            onOpenAddTicket={onOpenAddTicket}
          />
        );
      case 'funil':
        return <SalesFunnel sector={selectedSector} />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-600">Selecione uma opção do menu</p>
          </div>
        );
    }
  };

  return (
    <main className={cn(
      "flex-1 bg-gray-50 transition-all duration-300",
      "flex flex-col h-full overflow-hidden"
    )}>
      <div id="content-dinamico" className="flex-1 p-6 overflow-auto">
        {renderContent()}
      </div>
    </main>
  );
};
