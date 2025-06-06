import { useState, useMemo } from 'react';
import { Customer, CustomerFilters } from '@/types/customer';
import { CustomerStats } from './CustomerStats';
import { CustomerFilters as Filters } from './CustomerFilters';
import { CustomerTable } from './CustomerTable';
import { AddCustomerModal } from './AddCustomerModal';
import { exportToExcel } from '@/utils/exportUtils';
import { Users, AlertCircle } from 'lucide-react';
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'todos',
    category: 'todos',
    channel: 'todos',
    dateRange: { start: '', end: '' },
    agent: 'todos'
  });

  // Calcular estatísticas dos clientes
  const stats = useMemo(() => {
    const active = allCustomers.filter(c => c.status === 'ativo').length;
    const inactive = allCustomers.filter(c => c.status === 'inativo').length;
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

  // Filtrar clientes
  const filteredCustomers = useMemo(() => {
    return allCustomers.filter(customer => {
      const matchesSearch = !filters.search || 
        customer.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        customer.phone.includes(filters.search);

      const matchesStatus = filters.status === 'todos' || customer.status === filters.status;
      const matchesCategory = filters.category === 'todos' || customer.category === filters.category;
      const matchesChannel = filters.channel === 'todos' || customer.channel === filters.channel;
      const matchesAgent = filters.agent === 'todos' || customer.responsibleAgent === filters.agent;

      const matchesDateRange = !filters.dateRange.start || !filters.dateRange.end || (
        new Date(customer.createdAt) >= new Date(filters.dateRange.start) &&
        new Date(customer.createdAt) <= new Date(filters.dateRange.end)
      );

      return matchesSearch && matchesStatus && matchesCategory && 
             matchesChannel && matchesDateRange && matchesAgent;
    });
  }, [allCustomers, filters]);

  const handleAddCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addCustomer(customerData);
      toast({
        title: 'Cliente adicionado',
        description: 'O cliente foi cadastrado com sucesso.',
      });
      setShowAddModal(false);
    } catch (error) {
      toast({
        title: 'Erro ao adicionar cliente',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleEditCustomer = async (customer: Customer) => {
    try {
      await updateCustomer(customer.id, customer);
      toast({
        title: 'Cliente atualizado',
        description: 'Os dados do cliente foram atualizados com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar cliente',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    try {
      await deleteCustomer(customer.id);
      toast({
        title: 'Cliente removido',
        description: 'O cliente foi removido com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao remover cliente',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleExportToExcel = () => {
    try {
      exportToExcel(filteredCustomers, 'clientes');
      toast({
        title: 'Exportação concluída',
        description: 'Os dados foram exportados para Excel com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados para Excel.',
        variant: 'destructive',
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao carregar clientes</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={refreshCustomers}
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6" />
          Clientes
        </h2>
      </div>

      <CustomerStats stats={stats} loading={loading} />

      <div className="flex justify-between items-center gap-4">
        <Filters filters={filters} onFiltersChange={setFilters} />
        <div className="flex gap-2">
          <button
            onClick={handleExportToExcel}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Exportar Excel
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Novo Cliente
          </button>
        </div>
      </div>

      <CustomerTable
        customers={filteredCustomers}
        loading={loading}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        onView={(customer) => {
          // Implementar visualização detalhada
          console.log('Ver cliente:', customer);
        }}
        onContact={(customer, method) => {
          // Implementar contato
          console.log('Contatar cliente:', customer, 'via', method);
        }}
      />

      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddCustomer}
      />
    </div>
  );
}; 