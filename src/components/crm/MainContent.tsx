import { useState } from 'react';
import { TicketManagement } from './TicketManagement';
import { CustomerManagement } from './customers/CustomerManagement';
import { SalesFunnel } from './SalesFunnel';
import { DepartmentDiagnostic } from './admin/DepartmentDiagnostic';
import { Loader2, MessageSquare, Filter, Users, Plus, Settings } from 'lucide-react';
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
          <div className="text-center p-8">
            <div className="bg-white rounded-full p-6 shadow-lg mb-4 inline-block">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
            <p className="text-gray-600 font-medium">Carregando...</p>
            <p className="text-sm text-gray-500 mt-1">Aguarde um momento</p>
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
      case 'clientes':
        return <CustomerManagement />;
      case 'dashboard':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 mb-6 inline-block">
                <MessageSquare className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Dashboard
                </h3>
                <p className="text-gray-600">
                  Em desenvolvimento...
                </p>
              </div>
            </div>
          </div>
        );
      case 'produtos':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl p-8 mb-6 inline-block">
                <MessageSquare className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Produtos
                </h3>
                <p className="text-gray-600">
                  Em desenvolvimento...
                </p>
              </div>
            </div>
          </div>
        );
      case 'disparos':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-8 mb-6 inline-block">
                <MessageSquare className="w-12 h-12 text-orange-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Disparos
                </h3>
                <p className="text-gray-600">
                  Em desenvolvimento...
                </p>
              </div>
            </div>
          </div>
        );
      case 'admin':
        return <DepartmentDiagnostic />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 mb-6 inline-block">
                <MessageSquare className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bem-vindo ao CRM
                </h3>
                <p className="text-gray-600">
                  Selecione uma opção do menu para começar
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => onViewChange('conversas')}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ver Conversas
                </button>
                <button
                  onClick={() => onViewChange('funil')}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Ver Funil
                </button>
                <button
                  onClick={() => onViewChange('clientes')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Ver Clientes
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <main className={cn(
      "flex-1 transition-all duration-300",
      "flex flex-col h-full overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50/30"
    )}>
      <div id="content-dinamico" className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>
    </main>
  );
};
