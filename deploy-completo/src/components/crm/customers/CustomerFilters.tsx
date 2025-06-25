import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerFilters as Filters } from '@/types/customer';
import { 
  customerStatuses,
  customerCategories,
  customerChannels,
  responsibleAgents
} from '@/data/customers';
import { Search, Filter, X, Calendar, Download, Plus } from 'lucide-react';

interface CustomerFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onAddCustomer: () => void;
  onExport: () => void;
}

export const CustomerFilters = ({ 
  filters, 
  onFiltersChange, 
  onAddCustomer,
  onExport 
}: CustomerFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof Filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'todos',
      category: 'todos',
      channel: 'todos',
      dateRange: { start: '', end: '' },
      agent: 'todos'
    });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.status !== 'todos' ||
    filters.category !== 'todos' ||
    filters.channel !== 'todos' ||
    filters.agent !== 'todos' ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-4 mb-6">
      {/* Linha principal de filtros */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        {/* Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar clientes..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-wrap gap-2 items-center">
          <Select 
            value={filters.status} 
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-40 border-gray-300">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {customerStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    {status.color && (
                      <div className={`w-2 h-2 rounded-full bg-${status.color}-500`} />
                    )}
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={filters.category} 
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-40 border-gray-300">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {customerCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  <div className="flex items-center gap-2">
                    {category.color && (
                      <div className={`w-2 h-2 rounded-full bg-${category.color}-500`} />
                    )}
                    {category.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Botão para expandir filtros */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Mais Filtros
          </Button>

          {/* Limpar filtros */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="border-gray-300 hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button
            onClick={onAddCustomer}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Filtros expandidos */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select 
              value={filters.channel} 
              onValueChange={(value) => handleFilterChange('channel', value)}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Canal de Origem" />
              </SelectTrigger>
              <SelectContent>
                {customerChannels.map((channel) => (
                  <SelectItem key={channel.value} value={channel.value}>
                    {channel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.agent} 
              onValueChange={(value) => handleFilterChange('agent', value)}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Agente Responsável" />
              </SelectTrigger>
              <SelectContent>
                {responsibleAgents.map((agent) => (
                  <SelectItem key={agent.value} value={agent.value}>
                    {agent.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="date"
                placeholder="Data inicial"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value
                })}
                className="pl-10 border-gray-300"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="date"
                placeholder="Data final"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value
                })}
                className="pl-10 border-gray-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
              Busca: "{filters.search}"
            </span>
          )}
          {filters.status !== 'todos' && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs">
              Status: {customerStatuses.find(s => s.value === filters.status)?.label}
            </span>
          )}
          {filters.category !== 'todos' && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 text-xs">
              Categoria: {customerCategories.find(c => c.value === filters.category)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}; 