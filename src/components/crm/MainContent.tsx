import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Settings, 
  Plus, 
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  Target,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Activity,
  Bell,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dashboard } from './Dashboard';
import { TicketManagement } from './TicketManagement';
import { CustomerManagement } from './customers/CustomerManagement';
import { AnalyticsAndReports } from './analytics/AnalyticsAndReports';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner, PageLoadingSpinner } from '@/components/ui/loading';

interface MainContentProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userRole: string;
  userName: string;
  isLoading?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

export const MainContent: React.FC<MainContentProps> = ({
  activeView,
  onViewChange,
  userRole,
  userName,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Loading de página inicial
  if (isLoading) {
    return <PageLoadingSpinner message="Carregando BKCRM..." />;
  }

  const quickActions: QuickAction[] = [
    {
      id: 'new-ticket',
      label: 'Novo Ticket',
      icon: <Plus className="w-5 h-5" />,
      onClick: () => setShowAddTicketModal(true),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'search-customer',
      label: 'Buscar Cliente',
      icon: <Search className="w-5 h-5" />,
      onClick: () => onViewChange('customers'),
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'analytics',
      label: 'Relatórios',
      icon: <BarChart3 className="w-5 h-5" />,
      onClick: () => onViewChange('analytics'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'settings',
      label: 'Configurações',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => onViewChange('settings'),
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  const handleQuickAction = (action: QuickAction) => {
    action.onClick();
    toast({
      title: "Ação executada",
      description: `${action.label} foi acionado`,
      duration: 2000
    });
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            onViewChange={onViewChange}
            onOpenAddTicket={() => setShowAddTicketModal(true)}
          />
        );
      
      case 'tickets':
        return (
          <TicketManagement 
            sector={userRole}
            onOpenAddTicket={() => setShowAddTicketModal(true)}
          />
        );
      
      case 'customers':
        return <CustomerManagement />;
      
      case 'analytics':
        return <AnalyticsAndReports />;
      
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Settings className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Configurações Gerais</h3>
                          <p className="text-sm text-gray-600">Preferências do sistema</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Gerenciar Usuários</h3>
                          <p className="text-sm text-gray-600">Permissões e acessos</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Activity className="w-16 h-16 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Seção em Desenvolvimento
              </h3>
              <p className="text-gray-600">
                Esta funcionalidade estará disponível em breve.
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header com ações rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeView === 'dashboard' && 'Dashboard'}
            {activeView === 'tickets' && 'Gerenciamento de Tickets'}
            {activeView === 'customers' && 'Gestão de Clientes'}
            {activeView === 'analytics' && 'Analytics & Relatórios'}
            {activeView === 'settings' && 'Configurações'}
          </h1>
          <p className="text-gray-600">
            Olá, {userName}! Bem-vindo ao BKCRM
          </p>
        </div>
        
        {/* Ações rápidas */}
        <div className="flex flex-wrap items-center gap-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              onClick={() => handleQuickAction(action)}
              className={cn(
                "flex items-center gap-2 text-white transition-all duration-200",
                action.color
              )}
              size="sm"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="min-h-[600px]">
        {renderMainContent()}
      </div>

      {/* Modal de Novo Ticket */}
      <Dialog open={showAddTicketModal} onOpenChange={setShowAddTicketModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Ticket</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-gray-600">
              Formulário de criação de ticket será implementado aqui.
            </p>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setShowAddTicketModal(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
