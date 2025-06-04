import { useState } from 'react';
import { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  MoreVertical, 
  Edit, 
  Eye, 
  Trash2, 
  Phone, 
  Mail, 
  MessageCircle,
  Building,
  Calendar,
  TrendingUp,
  User
} from 'lucide-react';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onContact: (customer: Customer, method: 'phone' | 'email' | 'whatsapp') => void;
}

export const CustomerTable = ({ 
  customers, 
  onEdit, 
  onView, 
  onDelete, 
  onContact 
}: CustomerTableProps) => {
  const [sortField, setSortField] = useState<keyof Customer>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: Customer['status']) => {
    const statusConfig = {
      ativo: { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      inativo: { color: 'bg-red-100 text-red-800', label: 'Inativo' },
      suspenso: { color: 'bg-orange-100 text-orange-800', label: 'Suspenso' },
      prospect: { color: 'bg-blue-100 text-blue-800', label: 'Prospect' }
    };
    const config = statusConfig[status];
    return (
      <Badge className={`${config.color} border-0 font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryBadge = (category: Customer['category']) => {
    const categoryConfig = {
      bronze: { color: 'bg-orange-100 text-orange-800', label: 'Bronze' },
      prata: { color: 'bg-gray-100 text-gray-800', label: 'Prata' },
      ouro: { color: 'bg-yellow-100 text-yellow-800', label: 'Ouro' },
      diamante: { color: 'bg-blue-100 text-blue-800', label: 'Diamante' }
    };
    const config = categoryConfig[category];
    return (
      <Badge className={`${config.color} border-0 font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum cliente encontrado
        </h3>
        <p className="text-gray-500">
          Tente ajustar os filtros ou adicione seu primeiro cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                Cliente
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                Status
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('category')}
              >
                Categoria
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('totalValue')}
              >
                Valor Total
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('lastInteraction')}
              >
                Última Interação
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Contato
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCustomers.map((customer, index) => (
              <tr 
                key={customer.id} 
                className="hover:bg-gray-50 transition-colors duration-150 animate-in fade-in duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        {customer.company && (
                          <>
                            <Building className="w-3 h-3 mr-1" />
                            {customer.company}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(customer.status)}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  {getCategoryBadge(customer.category)}
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatCurrency(customer.totalValue)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {customer.totalOrders} pedidos
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(customer.lastInteraction)}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    Cliente desde {formatDate(customer.customerSince)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onContact(customer, 'phone')}
                      className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onContact(customer, 'email')}
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                    >
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onContact(customer, 'whatsapp')}
                      className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem 
                        onClick={() => onView(customer)}
                        className="cursor-pointer"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onEdit(customer)}
                        className="cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(customer)}
                        className="cursor-pointer text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 