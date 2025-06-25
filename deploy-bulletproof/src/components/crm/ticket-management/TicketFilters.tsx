import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Filter, 
  Users, 
  Clock, 
  MessageSquare, 
  Tag,
  Mail,
  Phone,
  Building2,
  User,
  Calendar as CalendarIcon,
  X,
  SlidersHorizontal,
  Search
} from 'lucide-react';
import { cn } from '../../../lib/utils';

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

  const statusOptions = [
    { value: 'todos', label: 'Todos os Status' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'atendimento', label: 'Em Atendimento' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const channelOptions = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone' },
    { value: 'chat', label: 'Chat' },
    { value: 'presencial', label: 'Presencial' }
  ];

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

  return (
    <div className="space-y-4">
      {/* Header compacto dos filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h4 className="text-sm font-medium text-gray-700">Filtros Avançados</h4>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
              {activeFiltersCount} ativos
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700 h-8 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCompact(!isCompact)}
            className="text-gray-500 hover:text-gray-700 h-8 px-2"
            title={isCompact ? "Expandir filtros" : "Compactar filtros"}
          >
            <SlidersHorizontal className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Filtros principais em layout compacto ou expandido */}
      <div className={cn(
        "grid gap-3 transition-all duration-300",
        isCompact 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6" 
          : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {/* Responsável */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Users className="w-3 h-3 mr-1.5 text-blue-600" />
            Responsável
          </label>
          <Select value={filters.responsible} onValueChange={(value) => onFilterChange('responsible', value)}>
            <SelectTrigger className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="Selecione responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-2 text-gray-500" />
                  Todos os responsáveis
                </div>
              </SelectItem>
              <SelectItem value="meus">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-2 text-blue-600" />
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
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Clock className="w-3 h-3 mr-1.5 text-green-600" />
            Status
          </label>
          <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
            <SelectTrigger className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
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
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <MessageSquare className="w-3 h-3 mr-1.5 text-purple-600" />
            Canal
          </label>
          <Select value={filters.channel} onValueChange={(value) => onFilterChange('channel', value)}>
            <SelectTrigger className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="Todos os canais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-2 text-gray-500" />
                  Todos os canais
                </div>
              </SelectItem>
              {channelOptions.map(option => {
                const IconComponent = getChannelIcon(option.value);
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      <IconComponent className="w-3 h-3 mr-2 text-purple-600" />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Cliente */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Search className="w-3 h-3 mr-1.5 text-indigo-600" />
            Cliente
          </label>
          <Input
            placeholder="Buscar cliente..."
            value={filters.client}
            onChange={(e) => onFilterChange('client', e.target.value)}
            className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <Tag className="w-3 h-3 mr-1.5 text-pink-600" />
            Tags
          </label>
          <Input
            placeholder="Buscar por tags..."
            value={filters.tags}
            onChange={(e) => onFilterChange('tags', e.target.value)}
            className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Agente */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gray-600 flex items-center">
            <User className="w-3 h-3 mr-1.5 text-teal-600" />
            Agente
          </label>
          <Select value={filters.agent} onValueChange={(value) => onFilterChange('agent', value)}>
            <SelectTrigger className="h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm">
              <SelectValue placeholder="Todos os agentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_agents">
                <div className="flex items-center">
                  <Users className="w-3 h-3 mr-2 text-gray-500" />
                  Todos os agentes
                </div>
              </SelectItem>
              <SelectItem value="agent1">João Silva</SelectItem>
              <SelectItem value="agent2">Maria Santos</SelectItem>
              <SelectItem value="agent3">Pedro Oliveira</SelectItem>
              <SelectItem value="agent4">Ana Costa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filtros avançados (datas) */}
      {!isCompact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
          {/* Data De */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1.5 text-orange-600" />
              Data De
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 border-gray-200 hover:border-gray-300 text-sm",
                    !filters.dateFrom && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 text-orange-600" />
                  {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom || undefined}
                  onSelect={(date) => onFilterChange('dateFrom', date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data Até */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600 flex items-center">
              <CalendarIcon className="w-3 h-3 mr-1.5 text-orange-600" />
              Data Até
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 border-gray-200 hover:border-gray-300 text-sm",
                    !filters.dateTo && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 text-orange-600" />
                  {filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateTo || undefined}
                  onSelect={(date) => onFilterChange('dateTo', date)}
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};
