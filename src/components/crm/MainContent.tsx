import { useState } from 'react';
import { TicketManagement } from './TicketManagement';
import { CustomerManagement } from './customers/CustomerManagement';
import { SalesFunnel } from './SalesFunnel';
import { DepartmentDiagnostic } from './admin/DepartmentDiagnostic';
import { DepartmentEvolutionManager } from './admin/DepartmentEvolutionManager';
import { Dashboard } from './Dashboard';
import { ChatDemo } from '../chat/ChatDemo';
import { EvolutionDashboard } from '../chat/EvolutionDashboard';
import { Loader2, MessageSquare, Filter, Users, Plus, Settings, Sparkles } from 'lucide-react';
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
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg mx-auto flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
              
              <div className="absolute inset-0 rounded-2xl bg-blue-400/20 animate-ping" />
              <div className="absolute inset-2 rounded-xl bg-blue-400/10 animate-ping animation-delay-200" />
            </div>
            
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">Carregando...</p>
              <p className="text-sm text-gray-500">Preparando a melhor experiência para você</p>
            </div>
            
            <div className="flex justify-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-100" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200" />
            </div>
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
        return <Dashboard onViewChange={onViewChange} onOpenAddTicket={onOpenAddTicket} />;
      case 'produtos':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <div className="bg-gradient-to-br from-emerald-100 via-green-50 to-teal-100 rounded-3xl p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
                <MessageSquare className="w-16 h-16 text-emerald-600 mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Produtos
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Funcionalidade em desenvolvimento. Em breve você poderá gerenciar todos os seus produtos aqui.
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 text-sm font-medium">
                  🚧 Em breve...
                </div>
              </div>
            </div>
          </div>
        );
      case 'disparos':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-md">
              <div className="bg-gradient-to-br from-orange-100 via-red-50 to-pink-100 rounded-3xl p-8 mb-6 relative overflow-hidden">
                <div className="absolute top-2 right-2">
                  <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                </div>
                <MessageSquare className="w-16 h-16 text-orange-600 mb-4 mx-auto" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Disparos em Massa
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Sistema de disparos em massa em desenvolvimento. Em breve você poderá enviar mensagens para múltiplos contatos.
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-orange-200 text-orange-700 text-sm font-medium">
                  🚧 Em breve...
                </div>
              </div>
            </div>
          </div>
        );
      case 'whatsapp':
        return (
          <EvolutionDashboard 
            departmentId={selectedSector?.id || ''} 
            departmentName={selectedSector?.name || 'Departamento'} 
          />
        );
      case 'evolution-api':
        return (
          <EvolutionDashboard 
            departmentId={selectedSector?.id || ''} 
            departmentName={`${selectedSector?.name || 'Departamento'} - Evolution API`} 
          />
        );
      case 'admin':
        return <DepartmentDiagnostic />;
      case 'chat-demo':
        return <ChatDemo />;
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 max-w-2xl">
              <div className="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-3xl p-12 mb-8 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse animation-delay-100" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-200" />
                  </div>
                </div>
                
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                    <MessageSquare className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Bem-vindo ao CRM Sistema
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    Sua plataforma completa para gerenciamento de relacionamento com clientes. 
                    Selecione uma opção do menu para começar a explorar.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => onViewChange('conversas')}
                  className="group flex items-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Conversas</p>
                    <p className="text-sm text-gray-500">Gerencie tickets</p>
                  </div>
                </button>
                
                <button
                  onClick={() => onViewChange('funil')}
                  className="group flex items-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200 hover:border-purple-300 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors">
                    <Filter className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Funil</p>
                    <p className="text-sm text-gray-500">Acompanhe vendas</p>
                  </div>
                </button>
                
                <button
                  onClick={() => onViewChange('clientes')}
                  className="group flex items-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200 hover:border-emerald-300 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-emerald-200 transition-colors">
                    <Users className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Clientes</p>
                    <p className="text-sm text-gray-500">Gerencie contatos</p>
                  </div>
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
      "flex flex-col h-full overflow-hidden",
      "bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30"
    )}>
      <div id="content-dinamico" className="flex-1 p-4 lg:p-6 xl:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto h-full">
          <div className="h-full rounded-2xl bg-white/40 backdrop-blur-sm border border-white/60 shadow-sm">
            {renderContent()}
          </div>
        </div>
      </div>
    </main>
  );
};
