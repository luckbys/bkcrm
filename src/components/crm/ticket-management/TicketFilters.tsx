
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Edit,
  ArrowRight,
  Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react';
import { statusOptions, channelOptions, agentTypes } from '@/data/sectors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Responsável</label>
            <Select value={filters.responsible} onValueChange={(value) => onFilterChange('responsible', value)}>
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
            <Select value={filters.status} onValueChange={(value) => onFilterChange('status', value)}>
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
                    onSelect={(date) => onFilterChange('dateFrom', date)}
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
                    onSelect={(date) => onFilterChange('dateTo', date)}
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
                <Select value={filters.channel} onValueChange={(value) => onFilterChange('channel', value)}>
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
                  onChange={(e) => onFilterChange('tags', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Agente</label>
                <Select value={filters.agent} onValueChange={(value) => onFilterChange('agent', value)}>
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
                  onChange={(e) => onFilterChange('client', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">CNPJ</label>
                <Input
                  placeholder="CNPJ do cliente"
                  value={filters.cnpj}
                  onChange={(e) => onFilterChange('cnpj', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
