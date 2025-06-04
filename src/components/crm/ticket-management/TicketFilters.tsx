import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  Tag,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  Hash,
  SlidersHorizontal,
  RefreshCw,
  Download,
  User
} from 'lucide-react';
import { statusOptions, channelOptions, agentTypes } from '@/data/sectors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TicketFiltersProps {
  filters: {
    responsible: string;
    status: string;
    channel: string;
    tags: string;
    agent: string;
    client: string;
    cnpj: string;
    dateFrom: Date | null;
    dateTo: Date | null;
  };
  onFilterChange: (key: string, value: any) => void;
}

export const TicketFilters = ({ filters, onFilterChange }: TicketFiltersProps) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Contar filtros ativos
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'responsible' && value === 'todos') return false;
    if (key === 'status' && value === 'todos') return false;
    if (key === 'channel' && value === 'all') return false;
    if (key === 'agent' && value === 'all') return false;
    return value !== '' && value !== null && value !== 'todos' && value !== 'all';
  }).length;

  const clearAllFilters = () => {
    onFilterChange('responsible', 'todos');
    onFilterChange('status', 'todos');
    onFilterChange('channel', 'all');
    onFilterChange('tags', '');
    onFilterChange('agent', 'all');
    onFilterChange('client', '');
    onFilterChange('cnpj', '');
    onFilterChange('dateFrom', null);
    onFilterChange('dateTo', null);
  };

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, any> = {
      whatsapp: MessageSquare,
      email: Mail,
      telefone: Phone,
      chat: MessageSquare,
      presencial: Building2
    };
    return icons[channel] || MessageSquare;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: 'bg-amber-100 text-amber-800 border-amber-200',
      atendimento: 'bg-blue-100 text-blue-800 border-blue-200',
      finalizado: 'bg-green-100 text-green-800 border-green-200',
      cancelado: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card className="shadow-soft border-gray-200">
      <CardContent className="p-6">
        {/* Header dos filtros */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
            </div>
            {activeFiltersCount > 0 && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-gray-600 hover:text-gray-900 border-gray-300"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompact(!isCompact)}
              className="text-gray-600 hover:text-gray-900 border-gray-300"
              title={isCompact ? "Expandir filtros" : "Compactar filtros"}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filtros principais em layout compacto ou expandido */}
        <div className={cn(
          "grid gap-4 transition-all duration-300",
          isCompact 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6" 
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
          {/* Responsável */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-600" />
              Responsável
            </label>
            <Select value={filters.responsible} onValueChange={(value) => onFilterChange('responsible', value)}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Selecione responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Todos os responsáveis
                  </div>
                </SelectItem>
                <SelectItem value="meus">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Meus Tickets
                  </div>
                </SelectItem>
                <SelectItem value="grupo1">Grupo Atendimento</SelectItem>
                <SelectItem value="user1">João Silva</SelectItem>
                <SelectItem value="user2">Maria Santos</SelectItem>
                <SelectItem value="user3">Pedro Costa</SelectItem>
                <SelectItem value="user4">Ana Oliveira</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-green-600" />
              Status
            </label>
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Selecione status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center space-x-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        option.value === 'pendente' && "bg-amber-500",
                        option.value === 'atendimento' && "bg-blue-500",
                        option.value === 'finalizado' && "bg-green-500",
                        option.value === 'cancelado' && "bg-red-500",
                        option.value === 'todos' && "bg-gray-400"
                      )} />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Canal */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-purple-600" />
              Canal
            </label>
            <Select value={filters.channel} onValueChange={(value) => onFilterChange('channel', value)}>
              <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Todos os canais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2 text-gray-500" />
                    Todos os canais
                  </div>
                </SelectItem>
                {channelOptions.map(option => {
                  const IconComponent = getChannelIcon(option.value);
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <IconComponent className="w-4 h-4 mr-2 text-purple-600" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Período - Data De */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-orange-600" />
              Data De
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start text-left font-normal border-gray-300 hover:border-gray-400",
                    !filters.dateFrom && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-orange-600" />
                  {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => onFilterChange('dateFrom', date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Período - Data Até */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-orange-600" />
              Data Até
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start text-left font-normal border-gray-300 hover:border-gray-400",
                    !filters.dateTo && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-orange-600" />
                  {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => onFilterChange('dateTo', date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filtros avançados toggle */}
        <div className="flex items-center justify-center mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-gray-600 hover:text-gray-900 border-gray-300"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {showAdvancedFilters ? 'Ocultar' : 'Mostrar'} Filtros Avançados
            {showAdvancedFilters ? 
              <ChevronUp className="w-4 h-4 ml-2" /> : 
              <ChevronDown className="w-4 h-4 ml-2" />
            }
          </Button>
        </div>

        {/* Filtros avançados */}
        {showAdvancedFilters && (
          <>
            <Separator className="my-6" />
            
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                <h4 className="text-md font-semibold text-gray-900">Filtros Avançados</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Cliente */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <User className="w-4 h-4 mr-2 text-indigo-600" />
                    Cliente
                  </label>
                  <Input
                    placeholder="Nome do cliente"
                    value={filters.client}
                    onChange={(e) => onFilterChange('client', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* CNPJ */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Hash className="w-4 h-4 mr-2 text-green-600" />
                    CNPJ
                  </label>
                  <Input
                    placeholder="00.000.000/0000-00"
                    value={filters.cnpj}
                    onChange={(e) => onFilterChange('cnpj', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Etiquetas */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-pink-600" />
                    Etiquetas
                  </label>
                  <Input
                    placeholder="Separar por vírgula"
                    value={filters.tags}
                    onChange={(e) => onFilterChange('tags', e.target.value)}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                {/* Tipo de Agente */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Users className="w-4 h-4 mr-2 text-teal-600" />
                    Tipo de Agente
                  </label>
                  <Select value={filters.agent} onValueChange={(value) => onFilterChange('agent', value)}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {agentTypes.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Ações dos filtros */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Filtros ativos visual */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filtros ativos:</span>
                <div className="flex flex-wrap gap-1">
                  {filters.responsible !== 'todos' && (
                    <Badge variant="outline" className="text-xs">
                      Resp: {filters.responsible === 'meus' ? 'Meus' : filters.responsible}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => onFilterChange('responsible', 'todos')}
                      />
                    </Badge>
                  )}
                  {filters.status !== 'todos' && (
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(filters.status))}>
                      Status: {statusOptions.find(s => s.value === filters.status)?.label}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => onFilterChange('status', 'todos')}
                      />
                    </Badge>
                  )}
                  {filters.channel && filters.channel !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      Canal: {channelOptions.find(c => c.value === filters.channel)?.label}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => onFilterChange('channel', 'all')}
                      />
                    </Badge>
                  )}
                  {filters.dateFrom && (
                    <Badge variant="outline" className="text-xs">
                      De: {format(filters.dateFrom, "dd/MM", { locale: ptBR })}
                      <X 
                        className="w-3 h-3 ml-1 cursor-pointer" 
                        onClick={() => onFilterChange('dateFrom', null)}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900 border-gray-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900 border-gray-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Search className="w-4 h-4 mr-2" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
