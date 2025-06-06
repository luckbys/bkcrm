import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Filter, 
  Calendar as CalendarIcon, 
  X, 
  RotateCcw,
  DollarSign,
  Building,
  Tag,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AdvancedFilterState {
  search: string;
  status: string[];
  category: string[];
  channel: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  valueRange: [number, number];
  company: string;
  tags: string[];
  agent: string;
  hasOrders: boolean | null;
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterState;
  onFiltersChange: (filters: AdvancedFilterState) => void;
  onClear: () => void;
  resultCount: number;
}

const defaultFilters: AdvancedFilterState = {
  search: '',
  status: [],
  category: [],
  channel: [],
  dateRange: {},
  valueRange: [0, 50000],
  company: '',
  tags: [],
  agent: '',
  hasOrders: null
};

export const AdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  onClear, 
  resultCount 
}: AdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const statusOptions = [
    { value: 'active', label: 'Ativo' },
    { value: 'inactive', label: 'Inativo' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'blocked', label: 'Bloqueado' }
  ];

  const categoryOptions = [
    { value: 'bronze', label: 'Bronze' },
    { value: 'silver', label: 'Prata' },
    { value: 'gold', label: 'Ouro' },
    { value: 'platinum', label: 'Platina' }
  ];

  const channelOptions = [
    { value: 'website', label: 'Website' },
    { value: 'phone', label: 'Telefone' },
    { value: 'email', label: 'Email' },
    { value: 'social', label: 'Redes Sociais' },
    { value: 'referral', label: 'Indicação' }
  ];

  const agentOptions = [
    { value: 'ana-costa', label: 'Ana Costa' },
    { value: 'carlos-silva', label: 'Carlos Silva' },
    { value: 'marina-santos', label: 'Marina Santos' },
    { value: 'pedro-oliveira', label: 'Pedro Oliveira' }
  ];

  const tagOptions = [
    'VIP', 'Fidelizado', 'Potencial Alto', 'Primeiro Compra', 
    'Recompra', 'Corporativo', 'Varejo', 'E-commerce'
  ];

  const updateFilter = (key: keyof AdvancedFilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleArrayValue = (array: string[], value: string) => {
    if (array.includes(value)) {
      return array.filter(item => item !== value);
    } else {
      return [...array, value];
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) count++;
    if (filters.category.length > 0) count++;
    if (filters.channel.length > 0) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    if (filters.valueRange[0] > 0 || filters.valueRange[1] < 50000) count++;
    if (filters.company) count++;
    if (filters.tags.length > 0) count++;
    if (filters.agent) count++;
    if (filters.hasOrders !== null) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Busca principal e botão de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nome, email, empresa ou documento..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full"
          />
        </div>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-6" align="end">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filtros Avançados</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onClear}
                  className="text-red-600 hover:text-red-700"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Status</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${option.value}`}
                        checked={filters.status.includes(option.value)}
                        onCheckedChange={() => 
                          updateFilter('status', toggleArrayValue(filters.status, option.value))
                        }
                      />
                      <Label htmlFor={`status-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Tag className="w-4 h-4" />
                  <span>Categoria</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {categoryOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${option.value}`}
                        checked={filters.category.includes(option.value)}
                        onCheckedChange={() => 
                          updateFilter('category', toggleArrayValue(filters.category, option.value))
                        }
                      />
                      <Label htmlFor={`category-${option.value}`} className="text-sm">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Canal */}
              <div className="space-y-2">
                <Label>Canal de Origem</Label>
                <Select 
                  value={filters.channel[0] || ''} 
                  onValueChange={(value) => updateFilter('channel', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os canais</SelectItem>
                    {channelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Agente Responsável */}
              <div className="space-y-2">
                <Label>Agente Responsável</Label>
                <Select 
                  value={filters.agent} 
                  onValueChange={(value) => updateFilter('agent', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o agente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os agentes</SelectItem>
                    {agentOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Período */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Período de Cadastro</span>
                </Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                            {format(filters.dateRange.to, "dd/MM/yy", { locale: ptBR })}
                          </>
                        ) : (
                          format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                        )
                      ) : (
                        <span>Selecione o período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={filters.dateRange.from}
                      selected={{
                        from: filters.dateRange.from,
                        to: filters.dateRange.to
                      }}
                      onSelect={(range) => {
                        updateFilter('dateRange', {
                          from: range?.from,
                          to: range?.to
                        });
                        if (range?.from && range?.to) {
                          setDatePopoverOpen(false);
                        }
                      }}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Faixa de Valor */}
              <div className="space-y-3">
                <Label className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Valor Total Gasto</span>
                </Label>
                <div className="space-y-3">
                  <Slider
                    value={filters.valueRange}
                    onValueChange={(value) => updateFilter('valueRange', value as [number, number])}
                    max={50000}
                    step={500}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatCurrency(filters.valueRange[0])}</span>
                    <span>{formatCurrency(filters.valueRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Empresa</span>
                </Label>
                <Input
                  placeholder="Nome da empresa..."
                  value={filters.company}
                  onChange={(e) => updateFilter('company', e.target.value)}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {tagOptions.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? "default" : "secondary"}
                      className={`cursor-pointer text-xs ${
                        filters.tags.includes(tag) 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      onClick={() => 
                        updateFilter('tags', toggleArrayValue(filters.tags, tag))
                      }
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Com/Sem Pedidos */}
              <div className="space-y-2">
                <Label>Status de Compras</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="has-orders"
                      checked={filters.hasOrders === true}
                      onCheckedChange={(checked) => 
                        updateFilter('hasOrders', checked ? true : null)
                      }
                    />
                    <Label htmlFor="has-orders" className="text-sm">
                      Apenas com pedidos
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="no-orders"
                      checked={filters.hasOrders === false}
                      onCheckedChange={(checked) => 
                        updateFilter('hasOrders', checked ? false : null)
                      }
                    />
                    <Label htmlFor="no-orders" className="text-sm">
                      Apenas sem pedidos
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Indicador de resultados e filtros ativos */}
      {(activeFiltersCount > 0 || filters.search) && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-800">
              {resultCount} cliente{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
            </span>
            
            {/* Filtros ativos */}
            <div className="flex flex-wrap gap-1">
              {filters.search && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Busca: "{filters.search}"
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('search', '')}
                  />
                </Badge>
              )}
              
              {filters.status.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Status: {filters.status.length}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('status', [])}
                  />
                </Badge>
              )}
              
              {filters.category.length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Categoria: {filters.category.length}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('category', [])}
                  />
                </Badge>
              )}
              
              {filters.agent && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Agente: {agentOptions.find(a => a.value === filters.agent)?.label}
                  <X 
                    className="w-3 h-3 ml-1 cursor-pointer" 
                    onClick={() => updateFilter('agent', '')}
                  />
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClear}
            className="text-blue-600 hover:text-blue-700"
          >
            Limpar todos
          </Button>
        </div>
      )}
    </div>
  );
};

export { defaultFilters }; 