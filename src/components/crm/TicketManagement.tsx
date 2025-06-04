import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  Filter,
  Download,
  RefreshCw,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Bell,
  BellOff,
  CheckSquare,
  Square,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  EyeOff,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { TicketChat } from './TicketChat';
import { TicketHeader } from './ticket-management/TicketHeader';
import { TicketFilters } from './ticket-management/TicketFilters';
import { TicketsList } from './ticket-management/TicketsList';
import { cn } from '@/lib/utils';

interface TicketManagementProps {
  sector: any;
  onOpenAddTicket: () => void;
}

interface Ticket {
  id: number;
  client: string;
  subject: string;
  status: 'pendente' | 'atendimento' | 'finalizado' | 'cancelado';
  channel: string;
  lastMessage: string;
  unread: boolean;
  priority: 'alta' | 'normal' | 'baixa';
  agent?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  description?: string;
}

export const TicketManagement = ({ sector, onOpenAddTicket }: TicketManagementProps) => {
  // Estados principais
  const [filters, setFilters] = useState({
    responsible: 'todos',
    status: 'todos',
    channel: 'all',
    tags: '',
    agent: 'all',
    client: '',
    cnpj: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null
  });
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketCounts, setTicketCounts] = useState({
    nonVisualized: sector.nonVisualized || 0,
    total: sector.total || 0
  });
  
  // Estados UX
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status' | 'client'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showNotifications, setShowNotifications] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState('todos');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock data expandido
  const mockTickets: Ticket[] = [
    {
      id: 1234,
      client: 'João Silva',
      subject: 'Problema com sistema de login',
      status: 'pendente',
      channel: 'whatsapp',
      lastMessage: '2 min atrás',
      unread: true,
      priority: 'alta',
      agent: 'Não atribuído',
      createdAt: new Date(Date.now() - 2 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 60 * 1000),
      tags: ['login', 'urgente'],
      description: 'Cliente não consegue acessar sua conta há 2 dias'
    },
    {
      id: 1235,
      client: 'Maria Santos',
      subject: 'Dúvida sobre produto premium',
      status: 'atendimento',
      channel: 'email',
      lastMessage: '15 min atrás',
      unread: false,
      priority: 'normal',
      agent: 'Ana Costa',
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
      updatedAt: new Date(Date.now() - 15 * 60 * 1000),
      tags: ['produto', 'premium'],
      description: 'Quer entender as funcionalidades do plano premium'
    },
    {
      id: 1236,
      client: 'Pedro Costa',
      subject: 'Solicitação de cancelamento',
      status: 'finalizado',
      channel: 'telefone',
      lastMessage: '1 hora atrás',
      unread: false,
      priority: 'baixa',
      agent: 'Carlos Silva',
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 60 * 60 * 1000),
      tags: ['cancelamento'],
      description: 'Processo de cancelamento finalizado com sucesso'
    },
    {
      id: 1237,
      client: 'Ana Oliveira',
      subject: 'Integração API não funcionando',
      status: 'pendente',
      channel: 'chat',
      lastMessage: '5 min atrás',
      unread: true,
      priority: 'alta',
      agent: 'Não atribuído',
      createdAt: new Date(Date.now() - 5 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 60 * 1000),
      tags: ['api', 'integração', 'técnico'],
      description: 'Erro 500 ao fazer chamadas para a API'
    },
    {
      id: 1238,
      client: 'Roberto Lima',
      subject: 'Cobrança indevida',
      status: 'atendimento',
      channel: 'whatsapp',
      lastMessage: '30 min atrás',
      unread: false,
      priority: 'normal',
      agent: 'Fernanda Souza',
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      tags: ['financeiro', 'cobrança'],
      description: 'Cliente questiona cobrança no cartão'
    }
  ];

  // Computed values
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = mockTickets;

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(ticket => 
        ticket.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.id.toString().includes(searchQuery)
      );
    }

    // Filtro por status ativo
    if (activeTab !== 'todos') {
      filtered = filtered.filter(ticket => ticket.status === activeTab);
    }

    // Aplicar outros filtros
    if (filters.status !== 'todos') {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }
    if (filters.channel && filters.channel !== 'all') {
      filtered = filtered.filter(ticket => ticket.channel === filters.channel);
    }
    if (filters.agent && filters.agent !== 'todos' && filters.agent !== 'all') {
      filtered = filtered.filter(ticket => ticket.agent === filters.agent);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = a.updatedAt;
          bValue = b.updatedAt;
          break;
        case 'priority':
          const priorityOrder = { 'alta': 3, 'normal': 2, 'baixa': 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'client':
          aValue = a.client;
          bValue = b.client;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [mockTickets, searchQuery, activeTab, filters, sortBy, sortOrder]);

  // Paginação
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTickets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTickets, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage);

  // Estatísticas por status
  const statusCounts = useMemo(() => {
    return {
      todos: mockTickets.length,
      pendente: mockTickets.filter(t => t.status === 'pendente').length,
      atendimento: mockTickets.filter(t => t.status === 'atendimento').length,
      finalizado: mockTickets.filter(t => t.status === 'finalizado').length,
      cancelado: mockTickets.filter(t => t.status === 'cancelado').length,
    };
  }, [mockTickets]);

  // Auto-refresh
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Aqui você faria a chamada real para atualizar os dados
      console.log('Auto-refresh triggered');
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // Handlers
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset para primeira página
  }, []);

  const handleTicketClick = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleSort = useCallback((field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  }, [sortBy]);

  const handleSelectTicket = useCallback((ticketId: number) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedTickets.length === paginatedTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(paginatedTickets.map(t => t.id));
    }
  }, [selectedTickets.length, paginatedTickets]);

  const handleBulkAction = useCallback(async (action: 'assign' | 'status' | 'priority' | 'delete') => {
    if (selectedTickets.length === 0) return;
    
    setIsLoading(true);
    try {
      // Simular ação em lote
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Bulk action ${action} on tickets:`, selectedTickets);
      setSelectedTickets([]);
    } catch (error) {
      console.error('Erro na ação em lote:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTickets]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 800));
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExport = useCallback(() => {
    console.log('Exportando tickets:', filteredAndSortedTickets);
    // Aqui você implementaria a lógica de export
  }, [filteredAndSortedTickets]);

  return (
    <div className="space-y-6">
      {/* Header aprimorado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <TicketHeader 
          sector={sector}
          ticketCounts={ticketCounts}
          onOpenAddTicket={onOpenAddTicket}
        />
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            Atualizado {lastUpdate.toLocaleTimeString()}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={cn(
              isAutoRefresh ? "text-green-600 border-green-200" : "text-gray-600"
            )}
          >
            {isAutoRefresh ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              showNotifications ? "text-blue-600 border-blue-200" : "text-gray-600"
            )}
          >
            {showNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Barra de busca e ações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por cliente, assunto ou ID do ticket..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Controles de visualização */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </Button>

              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Ações em lote */}
          {selectedTickets.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedTickets.length} ticket(s) selecionado(s)
                </span>
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('assign')}
                    disabled={isLoading}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Atribuir
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBulkAction('status')}
                    disabled={isLoading}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Status
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedTickets([])}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs de status */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="todos" className="relative">
            Todos
            <Badge variant="secondary" className="ml-2 text-xs">
              {statusCounts.todos}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pendente" className="relative">
            Pendentes
            <Badge variant="secondary" className="ml-2 text-xs bg-amber-100 text-amber-800">
              {statusCounts.pendente}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="atendimento">
            Em Atendimento
            <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-800">
              {statusCounts.atendimento}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="finalizado">
            Finalizados
            <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
              {statusCounts.finalizado}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="cancelado">
            Cancelados
            <Badge variant="secondary" className="ml-2 text-xs bg-red-100 text-red-800">
              {statusCounts.cancelado}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Filtros */}
          <TicketFilters 
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Cabeçalho da lista com ordenação */}
          {viewMode === 'list' && (
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                      className="p-0 h-auto"
                    >
                      {selectedTickets.length === paginatedTickets.length ? 
                        <CheckSquare className="w-4 h-4" /> : 
                        <Square className="w-4 h-4" />
                      }
                    </Button>
                    <span className="text-sm font-medium">
                      {filteredAndSortedTickets.length} tickets encontrados
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Ordenar por:</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSort('date')}
                      className={cn(sortBy === 'date' && "bg-gray-100")}
                    >
                      Data
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSort('priority')}
                      className={cn(sortBy === 'priority' && "bg-gray-100")}
                    >
                      Prioridade
                      {sortBy === 'priority' && (
                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSort('client')}
                      className={cn(sortBy === 'client' && "bg-gray-100")}
                    >
                      Cliente
                      {sortBy === 'client' && (
                        sortOrder === 'asc' ? <SortAsc className="w-3 h-3 ml-1" /> : <SortDesc className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de tickets */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Carregando tickets...</p>
              </CardContent>
            </Card>
          ) : paginatedTickets.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mb-4">
                  {searchQuery ? (
                    <Search className="w-12 h-12 mx-auto text-gray-400" />
                  ) : (
                    <Eye className="w-12 h-12 mx-auto text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'Nenhum ticket encontrado' : 'Nenhum ticket neste status'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? 'Tente ajustar sua busca ou filtros para encontrar tickets.'
                    : 'Quando houver tickets neste status, eles aparecerão aqui.'
                  }
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Limpar busca
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <TicketsList 
              tickets={paginatedTickets}
              onTicketClick={handleTicketClick}
              selectedTickets={selectedTickets}
              onSelectTicket={handleSelectTicket}
              viewMode={viewMode}
            />
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredAndSortedTickets.length)} de {filteredAndSortedTickets.length} tickets
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                        if (page > totalPages) return null;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="text-gray-400">...</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8 p-0"
                          >
                            {totalPages}
                          </Button>
                        </>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Ticket Chat Modal */}
      {selectedTicket && (
        <TicketChat 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
};
