import { useState, useMemo } from 'react';
import { Customer } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MoreVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Download,
  Trash2,
  Mail,
  Phone,
  MessageCircle,
  Edit,
  Eye,
  Star,
  StarOff,
  Users,
  Tag,
  Settings2
} from 'lucide-react';

type SortField = 'name' | 'email' | 'company' | 'totalValue' | 'customerSince' | 'lastInteraction';
type SortDirection = 'asc' | 'desc';

interface EnhancedCustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onView: (customer: Customer) => void;
  onContact: (customer: Customer, method: 'phone' | 'email' | 'whatsapp') => void;
  loading?: boolean;
}

export const EnhancedCustomerTable = ({
  customers,
  onEdit,
  onDelete,
  onView,
  onContact,
  loading = false
}: EnhancedCustomerTableProps) => {
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('customerSince');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [compactView, setCompactView] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    avatar: true,
    name: true,
    email: true,
    company: true,
    category: true,
    status: true,
    totalValue: true,
    totalOrders: true,
    lastInteraction: true,
    actions: true
  });

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'customerSince' || sortField === 'lastInteraction') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [customers, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers(prev => [...prev, customerId]);
    } else {
      setSelectedCustomers(prev => prev.filter(id => id !== customerId));
    }
  };

  const toggleFavorite = (customerId: string) => {
    setFavorites(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleBulkAction = (action: string) => {
    const selectedCustomerObjects = customers.filter(c => selectedCustomers.includes(c.id));
    
    switch (action) {
      case 'delete':
        selectedCustomerObjects.forEach(customer => onDelete(customer));
        setSelectedCustomers([]);
        break;
      case 'export':
        // Implementar exportação
        console.log('Exportando clientes selecionados:', selectedCustomerObjects);
        break;
      case 'email':
        // Implementar envio de email em lote
        console.log('Enviando email para:', selectedCustomerObjects);
        break;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: Customer['status']) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-red-100 text-red-800 border-red-200',
      prospect: 'bg-blue-100 text-blue-800 border-blue-200',
      blocked: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCategoryColor = (category: Customer['category']) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800 border-orange-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  const isAllSelected = selectedCustomers.length === customers.length && customers.length > 0;
  const isPartialSelected = selectedCustomers.length > 0 && selectedCustomers.length < customers.length;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Barra de ações em lote */}
        {selectedCustomers.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {selectedCustomers.length} cliente{selectedCustomers.length !== 1 ? 's' : ''} selecionado{selectedCustomers.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('email')}
              >
                <Mail className="w-4 h-4 mr-1" />
                Enviar Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        )}

        {/* Controles da tabela */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={isAllSelected || isPartialSelected}
              onCheckedChange={handleSelectAll}
              ref={(el) => {
                if (el) el.indeterminate = isPartialSelected;
              }}
            />
            <span className="text-sm text-gray-600">
              Selecionar todos
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompactView(!compactView)}
            >
              <Settings2 className="w-4 h-4 mr-1" />
              {compactView ? 'Expandir' : 'Compactar'}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="w-4 h-4 mr-1" />
                  Colunas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {Object.entries(visibleColumns).map(([key, visible]) => (
                  <DropdownMenuCheckboxItem
                    key={key}
                    checked={visible}
                    onCheckedChange={(checked) =>
                      setVisibleColumns(prev => ({ ...prev, [key]: checked }))
                    }
                  >
                    {key === 'avatar' ? 'Avatar' :
                     key === 'name' ? 'Nome' :
                     key === 'email' ? 'Email' :
                     key === 'company' ? 'Empresa' :
                     key === 'category' ? 'Categoria' :
                     key === 'status' ? 'Status' :
                     key === 'totalValue' ? 'Valor Total' :
                     key === 'totalOrders' ? 'Pedidos' :
                     key === 'lastInteraction' ? 'Última Interação' :
                     'Ações'}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabela */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartialSelected;
                    }}
                  />
                </TableHead>
                
                {visibleColumns.avatar && (
                  <TableHead className="w-12"></TableHead>
                )}
                
                {visibleColumns.name && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-semibold"
                    >
                      Nome {getSortIcon('name')}
                    </Button>
                  </TableHead>
                )}
                
                {visibleColumns.email && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('email')}
                      className="h-auto p-0 font-semibold"
                    >
                      Email {getSortIcon('email')}
                    </Button>
                  </TableHead>
                )}
                
                {visibleColumns.company && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('company')}
                      className="h-auto p-0 font-semibold"
                    >
                      Empresa {getSortIcon('company')}
                    </Button>
                  </TableHead>
                )}
                
                {visibleColumns.category && (
                  <TableHead>Categoria</TableHead>
                )}
                
                {visibleColumns.status && (
                  <TableHead>Status</TableHead>
                )}
                
                {visibleColumns.totalValue && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('totalValue')}
                      className="h-auto p-0 font-semibold"
                    >
                      Valor Total {getSortIcon('totalValue')}
                    </Button>
                  </TableHead>
                )}
                
                {visibleColumns.totalOrders && (
                  <TableHead>Pedidos</TableHead>
                )}
                
                {visibleColumns.lastInteraction && (
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('lastInteraction')}
                      className="h-auto p-0 font-semibold"
                    >
                      Última Interação {getSortIcon('lastInteraction')}
                    </Button>
                  </TableHead>
                )}
                
                {visibleColumns.actions && (
                  <TableHead className="w-20">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {sortedCustomers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''
                  } ${compactView ? 'h-12' : 'h-16'}`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedCustomers.includes(customer.id)}
                      onCheckedChange={(checked) => 
                        handleSelectCustomer(customer.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  
                  {visibleColumns.avatar && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar className={compactView ? "h-8 w-8" : "h-10 w-10"}>
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                            {customer.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(customer.id)}
                          className="p-1 h-auto"
                        >
                          {favorites.includes(customer.id) ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  )}
                  
                  {visibleColumns.name && (
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        {!compactView && customer.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {customer.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {customer.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{customer.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                  
                  {visibleColumns.email && (
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-sm text-gray-600 truncate block max-w-48">
                            {customer.email}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {customer.email}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  )}
                  
                  {visibleColumns.company && (
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">{customer.company}</p>
                        {!compactView && (
                          <p className="text-xs text-gray-600">{customer.position}</p>
                        )}
                      </div>
                    </TableCell>
                  )}
                  
                  {visibleColumns.category && (
                    <TableCell>
                      <Badge className={`${getCategoryColor(customer.category)} border`}>
                        {customer.category.charAt(0).toUpperCase() + customer.category.slice(1)}
                      </Badge>
                    </TableCell>
                  )}
                  
                  {visibleColumns.status && (
                    <TableCell>
                      <Badge className={`${getStatusColor(customer.status)} border`}>
                        {customer.status === 'active' ? 'Ativo' : 
                         customer.status === 'inactive' ? 'Inativo' : 
                         customer.status === 'prospect' ? 'Prospect' : 'Bloqueado'}
                      </Badge>
                    </TableCell>
                  )}
                  
                  {visibleColumns.totalValue && (
                    <TableCell>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatCurrency(customer.totalValue)}
                        </p>
                        {!compactView && (
                          <p className="text-xs text-gray-600">
                            Média: {formatCurrency(customer.averageTicket)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                  )}
                  
                  {visibleColumns.totalOrders && (
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {customer.totalOrders}
                      </Badge>
                    </TableCell>
                  )}
                  
                  {visibleColumns.lastInteraction && (
                    <TableCell>
                      <p className="text-sm text-gray-900">
                        {formatDate(customer.lastInteraction)}
                      </p>
                    </TableCell>
                  )}
                  
                  {visibleColumns.actions && (
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(customer)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Visualizar</TooltipContent>
                        </Tooltip>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => onEdit(customer)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onContact(customer, 'phone')}>
                              <Phone className="w-4 h-4 mr-2" />
                              Ligar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onContact(customer, 'email')}>
                              <Mail className="w-4 h-4 mr-2" />
                              Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onContact(customer, 'whatsapp')}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(customer)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {customers.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Nenhum cliente encontrado</p>
              <p className="text-sm">Tente ajustar os filtros ou adicionar novos clientes</p>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}; 