import { useState, useMemo, useCallback } from 'react';
import { Customer, CustomerFilters } from '@/types/customer';
import { CustomerStats } from './CustomerStats';
import { CustomerFilters as Filters } from './CustomerFilters';
import { CustomerTable } from './CustomerTable';
import { AddCustomerModal } from './AddCustomerModal';
import { EditCustomerModal } from './EditCustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { AdvancedFilters, AdvancedFilterState, defaultFilters } from './AdvancedFilters';
import { EnhancedCustomerTable } from './EnhancedCustomerTable';
import { NotificationSystem, useNotifications } from './NotificationSystem';
import { KeyboardShortcuts, useKeyboardShortcuts } from './KeyboardShortcuts';
import { exportToExcel } from '@/utils/exportUtils';
import { 
  Users, 
  AlertCircle, 
  RefreshCw, 
  TrendingUp, 
  UserPlus, 
  Eye,
  Phone,
  Mail,
  MessageCircle,
  Filter,
  Grid3X3,
  List,
  Settings,
  Download,
  Keyboard,
  HelpCircle,
  Focus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/useCustomers';

export const CustomerManagement = () => {
  const { 
    customers: allCustomers, 
    loading, 
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers
  } = useCustomers();

  // Estados principais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [useAdvancedFilters, setUseAdvancedFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'enhanced' | 'simple'>('enhanced');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Estados de filtros
  const [basicFilters, setBasicFilters] = useState<CustomerFilters>({
    search: '',
    status: 'todos',
    category: 'todos',
    channel: 'todos',
    dateRange: { start: '', end: '' },
    agent: 'todos'
  });

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(defaultFilters);

  // Calcular estatísticas dos clientes
  const stats = useMemo(() => {
    const active = allCustomers.filter(c => c.status === 'active').length;
    const inactive = allCustomers.filter(c => c.status === 'inactive').length;
    const prospects = allCustomers.filter(c => c.status === 'prospect').length;
    const totalValue = allCustomers.reduce((sum, c) => sum + c.totalValue, 0);
    const averageTicket = totalValue / allCustomers.length || 0;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newThisMonth = allCustomers.filter(
      c => new Date(c.createdAt) >= thirtyDaysAgo
    ).length;

    return {
      total: allCustomers.length,
      active,
      inactive,
      prospects,
      newThisMonth,
      totalValue,
      averageTicket
    };
  }, [allCustomers]);

  // Filtrar clientes com base no modo selecionado
  const filteredCustomers = useMemo(() => {
    let customers = [...allCustomers];

    if (useAdvancedFilters) {
      // Aplicar filtros avançados
      customers = customers.filter(customer => {
        // Busca
        const matchesSearch = !advancedFilters.search || 
          customer.name.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
          customer.email.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
          customer.phone.includes(advancedFilters.search) ||
          customer.company.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
          customer.document.includes(advancedFilters.search);

        // Status
        const matchesStatus = advancedFilters.status.length === 0 || 
          advancedFilters.status.includes(customer.status);

        // Categoria
        const matchesCategory = advancedFilters.category.length === 0 || 
          advancedFilters.category.includes(customer.category);

        // Canal
        const matchesChannel = advancedFilters.channel.length === 0 || 
          advancedFilters.channel.includes(customer.channel);

        // Agente
        const matchesAgent = !advancedFilters.agent || 
          advancedFilters.agent === 'all_agents' ||
          customer.responsibleAgent === advancedFilters.agent;

        // Período
        const matchesDateRange = (!advancedFilters.dateRange.from && !advancedFilters.dateRange.to) || 
          ((!advancedFilters.dateRange.from || new Date(customer.createdAt) >= advancedFilters.dateRange.from) &&
           (!advancedFilters.dateRange.to || new Date(customer.createdAt) <= advancedFilters.dateRange.to));

        // Faixa de valor
        const matchesValue = customer.totalValue >= advancedFilters.valueRange[0] && 
          customer.totalValue <= advancedFilters.valueRange[1];

        // Empresa
        const matchesCompany = !advancedFilters.company || 
          customer.company.toLowerCase().includes(advancedFilters.company.toLowerCase());

        // Tags
        const matchesTags = advancedFilters.tags.length === 0 || 
          advancedFilters.tags.some(tag => customer.tags.includes(tag));

        // Com/sem pedidos
        const matchesOrders = advancedFilters.hasOrders === null || 
          (advancedFilters.hasOrders === true && customer.totalOrders > 0) ||
          (advancedFilters.hasOrders === false && customer.totalOrders === 0);

        return matchesSearch && matchesStatus && matchesCategory && 
               matchesChannel && matchesAgent && matchesDateRange && 
               matchesValue && matchesCompany && matchesTags && matchesOrders;
      });
    } else {
      // Aplicar filtros básicos
      customers = customers.filter(customer => {
        const matchesSearch = !basicFilters.search || 
          customer.name.toLowerCase().includes(basicFilters.search.toLowerCase()) ||
          customer.email.toLowerCase().includes(basicFilters.search.toLowerCase()) ||
          customer.phone.includes(basicFilters.search);

        const matchesStatus = basicFilters.status === 'todos' || customer.status === basicFilters.status;
        const matchesCategory = basicFilters.category === 'todos' || customer.category === basicFilters.category;
        const matchesChannel = basicFilters.channel === 'todos' || customer.channel === basicFilters.channel;
        const matchesAgent = basicFilters.agent === 'todos' || customer.responsibleAgent === basicFilters.agent;

        const matchesDateRange = !basicFilters.dateRange.start || !basicFilters.dateRange.end || (
          new Date(customer.createdAt) >= new Date(basicFilters.dateRange.start) &&
          new Date(customer.createdAt) <= new Date(basicFilters.dateRange.end)
        );

        return matchesSearch && matchesStatus && matchesCategory && 
               matchesChannel && matchesDateRange && matchesAgent;
      });
    }

    return customers;
  }, [allCustomers, basicFilters, advancedFilters, useAdvancedFilters]);

  // Handlers de ações
  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addCustomer(customerData);
      toast({
        title: '✅ Cliente adicionado',
        description: 'O cliente foi cadastrado com sucesso.',
      });
      setShowAddModal(false);
    } catch (error) {
      toast({
        title: '❌ Erro ao adicionar cliente',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  const handleSaveEditedCustomer = async (customer: Customer) => {
    try {
      await updateCustomer(customer.id, customer);
      toast({
        title: '✅ Cliente atualizado',
        description: 'Os dados do cliente foram atualizados com sucesso.',
      });
      setShowEditModal(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast({
        title: '❌ Erro ao atualizar cliente',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    try {
      await deleteCustomer(customer.id);
      toast({
        title: '✅ Cliente removido',
        description: 'O cliente foi removido com sucesso.',
      });
    } catch (error) {
      toast({
        title: '❌ Erro ao remover cliente',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  const handleContactCustomer = (customer: Customer, method: 'phone' | 'email' | 'whatsapp') => {
    const methodLabels = {
      phone: '📞 telefone',
      email: '📧 email',
      whatsapp: '💬 WhatsApp'
    };

    toast({
      title: `${methodLabels[method]} iniciado`,
      description: `Contatando ${customer.name} via ${methodLabels[method].split(' ')[1]}`,
    });

    // Aqui você integraria com APIs reais de contato
    if (method === 'phone') {
      window.open(`tel:${customer.phone}`);
    } else if (method === 'email') {
      window.open(`mailto:${customer.email}`);
    } else if (method === 'whatsapp') {
      const phoneNumber = customer.phone.replace(/\D/g, '');
      window.open(`https://wa.me/55${phoneNumber}`);
    }
  };

  const handleExportToExcel = () => {
    try {
      exportToExcel(filteredCustomers, 'clientes');
      toast({
        title: '✅ Exportação concluída',
        description: 'Os dados foram exportados para Excel com sucesso.',
      });
    } catch (error) {
      toast({
        title: '❌ Erro na exportação',
        description: 'Não foi possível exportar os dados para Excel.',
        variant: 'destructive',
      });
    }
  };

  const clearAllFilters = () => {
    if (useAdvancedFilters) {
      setAdvancedFilters(defaultFilters);
    } else {
      setBasicFilters({
        search: '',
        status: 'todos',
        category: 'todos',
        channel: 'todos',
        dateRange: { start: '', end: '' },
        agent: 'todos'
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <Card className="max-w-md mx-auto mt-20">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar clientes</h3>
              <p className="text-gray-600 mb-4">{error.message}</p>
              <Button
                onClick={refreshCustomers}
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header aprimorado */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestão de Clientes
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie e acompanhe todos os seus clientes com ferramentas avançadas
              </p>
            </div>
          </div>
          
          {/* Controles e indicadores */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            {/* Indicadores rápidos */}
            <div className="flex items-center space-x-2 text-sm">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stats.newThisMonth} novos este mês
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Total: {stats.total}
              </Badge>
            </div>

            {/* Controles de visualização */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Label htmlFor="advanced-filters" className="text-sm">Filtros Avançados</Label>
                <Switch
                  id="advanced-filters"
                  checked={useAdvancedFilters}
                  onCheckedChange={setUseAdvancedFilters}
                />
              </div>

              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'enhanced' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('enhanced')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'simple' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('simple')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowShortcuts(true)}
                className="border-gray-300"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Atalhos
              </Button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <CustomerStats stats={stats} loading={loading} />

        {/* Sistema de filtros */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {useAdvancedFilters ? (
              <AdvancedFilters
                filters={advancedFilters}
                onFiltersChange={setAdvancedFilters}
                onClear={clearAllFilters}
                resultCount={filteredCustomers.length}
              />
            ) : (
              <Filters 
                filters={basicFilters} 
                onFiltersChange={setBasicFilters}
                onAddCustomer={() => setShowAddModal(true)}
                onExport={handleExportToExcel}
              />
            )}
          </CardContent>
        </Card>

        {/* Indicador de resultados melhorado */}
        {filteredCustomers.length !== allCustomers.length && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {filteredCustomers.length} de {allCustomers.length} clientes encontrados
                    </p>
                    <p className="text-sm text-blue-700">
                      Filtros ativos - use os controles acima para refinar
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportToExcel}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Exportar Resultado
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-700 hover:text-blue-800"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado de loading melhorado */}
        {loading && (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">Carregando clientes...</p>
                  <p className="text-sm text-gray-600 mt-1">Aguarde enquanto buscamos os dados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sistema de tabelas aprimorado */}
        {!loading && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {viewMode === 'enhanced' ? (
                <EnhancedCustomerTable
                  customers={filteredCustomers}
                  onEdit={handleEditCustomer}
                  onDelete={handleDeleteCustomer}
                  onView={handleViewCustomer}
                  onContact={handleContactCustomer}
                  loading={loading}
                />
              ) : (
                <CustomerTable
                  customers={filteredCustomers}
                  onEdit={handleEditCustomer}
                  onDelete={handleDeleteCustomer}
                  onView={handleViewCustomer}
                  onContact={handleContactCustomer}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        <AddCustomerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCustomer}
        />

        <EditCustomerModal
          customer={selectedCustomer}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          onSave={handleSaveEditedCustomer}
        />

        <CustomerDetailModal
          customer={selectedCustomer}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }}
          onEdit={handleEditCustomer}
          onContact={handleContactCustomer}
        />
      </div>
    </div>
  );
}; 