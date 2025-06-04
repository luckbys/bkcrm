import { useState, useMemo } from 'react';
import { Customer, CustomerFilters } from '@/types/customer';
import { mockCustomers, customerStats } from '@/data/customers';
import { CustomerStats } from './CustomerStats';
import { CustomerFilters as Filters } from './CustomerFilters';
import { CustomerTable } from './CustomerTable';
import { AddCustomerModal } from './AddCustomerModal';
import { exportToExcel } from '@/utils/exportUtils';
import { Users, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'todos',
    category: 'todos',
    channel: 'todos',
    dateRange: { start: '', end: '' },
    agent: 'todos'
  });

  // Filtrar clientes baseado nos filtros aplicados
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Filtro de busca
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesSearch = 
          customer.name.toLowerCase().includes(searchTerm) ||
          customer.email.toLowerCase().includes(searchTerm) ||
          customer.phone.includes(searchTerm) ||
          customer.document.includes(searchTerm) ||
          (customer.company && customer.company.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Filtro de status
      if (filters.status !== 'todos' && customer.status !== filters.status) {
        return false;
      }

      // Filtro de categoria
      if (filters.category !== 'todos' && customer.category !== filters.category) {
        return false;
      }

      // Filtro de canal
      if (filters.channel !== 'todos' && customer.channel !== filters.channel) {
        return false;
      }

      // Filtro de agente
      if (filters.agent !== 'todos' && customer.responsibleAgent !== filters.agent) {
        return false;
      }

      // Filtro de data
      if (filters.dateRange.start) {
        const customerDate = new Date(customer.customerSince);
        const startDate = new Date(filters.dateRange.start);
        if (customerDate < startDate) return false;
      }

      if (filters.dateRange.end) {
        const customerDate = new Date(customer.customerSince);
        const endDate = new Date(filters.dateRange.end);
        if (customerDate > endDate) return false;
      }

      return true;
    });
  }, [customers, filters]);

  // Calcular estatísticas dos clientes filtrados
  const filteredStats = useMemo(() => {
    const total = filteredCustomers.length;
    const active = filteredCustomers.filter(c => c.status === 'ativo').length;
    const inactive = filteredCustomers.filter(c => c.status === 'inativo').length;
    const prospects = filteredCustomers.filter(c => c.status === 'prospect').length;
    
    const totalValue = filteredCustomers.reduce((sum, customer) => sum + customer.totalValue, 0);
    const averageTicket = total > 0 ? totalValue / total : 0;
    
    // Clientes novos deste mês
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newThisMonth = filteredCustomers.filter(customer => {
      const customerDate = new Date(customer.customerSince);
      return customerDate.getMonth() === currentMonth && 
             customerDate.getFullYear() === currentYear;
    }).length;

    return {
      total,
      active,
      inactive,
      prospects,
      newThisMonth,
      totalValue,
      averageTicket
    };
  }, [filteredCustomers]);

  const handleAddCustomer = () => {
    setShowAddModal(true);
  };

  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customerData,
      id: (customers.length + 1).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCustomers(prev => [newCustomer, ...prev]);
    
    toast({
      title: "Cliente cadastrado com sucesso!",
      description: `${customerData.name} foi adicionado à sua base de clientes.`,
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('Editando cliente:', customer.name);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A edição de clientes será implementada em breve.",
    });
  };

  const handleViewCustomer = (customer: Customer) => {
    console.log('Visualizando cliente:', customer.name);
    toast({
      title: "Funcionalidade em desenvolvimento", 
      description: "A visualização detalhada será implementada em breve.",
    });
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (confirm(`Tem certeza que deseja excluir o cliente ${customer.name}?`)) {
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      
      toast({
        title: "Cliente excluído",
        description: `${customer.name} foi removido da sua base de clientes.`,
        variant: "destructive"
      });
    }
  };

  const handleContactCustomer = (customer: Customer, method: 'phone' | 'email' | 'whatsapp') => {
    console.log(`Contatando ${customer.name} via ${method}`);
    
    switch (method) {
      case 'phone':
        window.open(`tel:${customer.phone}`);
        break;
      case 'email':
        window.open(`mailto:${customer.email}`);
        break;
      case 'whatsapp':
        const phoneNumber = customer.phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${phoneNumber}`);
        break;
    }

    toast({
      title: "Contato iniciado",
      description: `Abrindo ${method} para contatar ${customer.name}.`,
    });
  };

  const handleExport = () => {
    try {
      exportToExcel(filteredCustomers, 'clientes');
      
      toast({
        title: "Exportação realizada com sucesso!",
        description: `${filteredCustomers.length} clientes foram exportados para Excel.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os dados. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gerenciamento de Clientes
              </h1>
              <p className="text-gray-600">
                Gerencie sua base de clientes e acompanhe métricas importantes
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <CustomerStats stats={filteredStats} />

        {/* Filtros */}
        <Filters
          filters={filters}
          onFiltersChange={setFilters}
          onAddCustomer={handleAddCustomer}
          onExport={handleExport}
        />

        {/* Tabela de clientes */}
        <CustomerTable
          customers={filteredCustomers}
          onEdit={handleEditCustomer}
          onView={handleViewCustomer}
          onDelete={handleDeleteCustomer}
          onContact={handleContactCustomer}
        />

        {/* Informações adicionais quando há filtros ativos */}
        {filteredCustomers.length !== customers.length && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                Mostrando {filteredCustomers.length} de {customers.length} clientes
              </span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              Use os filtros acima para refinar ainda mais sua busca.
            </p>
          </div>
        )}

        {/* Modal de adicionar cliente */}
        <AddCustomerModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveCustomer}
        />
      </div>
    </div>
  );
}; 