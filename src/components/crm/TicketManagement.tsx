
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronDown,
  RefreshCw 
} from 'lucide-react';
import { statusOptions, channelOptions, agentTypes } from '@/data/sectors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TicketChat } from './TicketChat';

interface TicketManagementProps {
  sector: any;
  onOpenAddTicket: () => void;
}

export const TicketManagement = ({ sector, onOpenAddTicket }: TicketManagementProps) => {
  const [filters, setFilters] = useState({
    responsible: 'todos',
    status: 'todos',
    channel: '',
    tags: '',
    agent: '',
    client: '',
    cnpj: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketCounts, setTicketCounts] = useState({
    nonVisualized: sector.nonVisualized || 0,
    total: sector.total || 0
  });

  const mockTickets = [
    {
      id: 1234,
      client: 'João Silva',
      subject: 'Problema com sistema',
      status: 'pendente',
      channel: 'whatsapp',
      lastMessage: '2 min atrás',
      unread: true,
      priority: 'alta'
    },
    {
      id: 1235,
      client: 'Maria Santos',
      subject: 'Dúvida sobre produto',
      status: 'atendimento',
      channel: 'email',
      lastMessage: '15 min atrás',
      unread: false,
      priority: 'normal'
    },
    {
      id: 1236,
      client: 'Pedro Costa',
      subject: 'Solicitação de cancelamento',
      status: 'finalizado',
      channel: 'telefone',
      lastMessage: '1 hora atrás',
      unread: false,
      priority: 'baixa'
    }
  ];

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-100 text-yellow-800',
      'atendimento': 'bg-blue-100 text-blue-800',
      'finalizado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'alta': 'border-l-red-500',
      'normal': 'border-l-blue-500',
      'baixa': 'border-l-green-500'
    };
    return colors[priority] || 'border-l-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Counts */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">{sector.name}</h1>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => console.log('Filter by non-visualized')}
            >
              <Badge variant="destructive" className="mr-2">
                {ticketCounts.nonVisualized}
              </Badge>
              Não Visualizados
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => console.log('Show all tickets')}
            >
              <Badge variant="secondary" className="mr-2">
                {ticketCounts.total}
              </Badge>
              Total
            </Button>
          </div>
        </div>
        
        <Button onClick={onOpenAddTicket}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Responsável</label>
              <Select value={filters.responsible} onValueChange={(value) => handleFilterChange('responsible', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="meus">Meus Tickets</SelectItem>
                  <SelectItem value="grupo1">Grupo Atendimento</SelectItem>
                  <SelectItem value="user1">João Silva</SelectItem>
                  <SelectItem value="user2">Maria Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center">
                Status
                <Button variant="ghost" size="sm" className="ml-2 p-1">
                  <Edit className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" className="ml-1 p-1">
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <div className="flex space-x-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "De"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => handleFilterChange('dateFrom', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Até"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => handleFilterChange('dateTo', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-end space-x-2">
              <Button className="flex-1">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedSearch ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>

          {/* Advanced Search */}
          {showAdvancedSearch && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Busca Avançada</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Canal</label>
                  <Select value={filters.channel} onValueChange={(value) => handleFilterChange('channel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {channelOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center">
                    Etiquetas
                    <Button variant="ghost" size="sm" className="ml-2 p-1">
                      <Edit className="w-3 h-3" />
                    </Button>
                  </label>
                  <Input
                    placeholder="Digite etiquetas"
                    value={filters.tags}
                    onChange={(e) => handleFilterChange('tags', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Agente</label>
                  <Select value={filters.agent} onValueChange={(value) => handleFilterChange('agent', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentTypes.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Cliente</label>
                  <Input
                    placeholder="Nome do cliente"
                    value={filters.client}
                    onChange={(e) => handleFilterChange('client', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">CNPJ</label>
                  <Input
                    placeholder="CNPJ do cliente"
                    value={filters.cnpj}
                    onChange={(e) => handleFilterChange('cnpj', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Tickets</CardTitle>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleTicketClick(ticket)}
                className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(ticket.priority)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="font-medium text-gray-900">#{ticket.id}</div>
                    <div>
                      <div className="font-medium">{ticket.client}</div>
                      <div className="text-sm text-gray-600">{ticket.subject}</div>
                    </div>
                    {ticket.unread && (
                      <Badge variant="destructive" className="text-xs">
                        Nova
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                    <Badge variant="outline">
                      {ticket.channel}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      {ticket.lastMessage}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
