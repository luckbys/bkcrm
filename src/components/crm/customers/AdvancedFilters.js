import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
import { Filter, Calendar as CalendarIcon, X, RotateCcw, DollarSign, Building, Tag, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const defaultFilters = {
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
export const AdvancedFilters = ({ filters, onFiltersChange, onClear, resultCount }) => {
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
    const updateFilter = (key, value) => {
        onFiltersChange({ ...filters, [key]: value });
    };
    const toggleArrayValue = (array, value) => {
        if (array.includes(value)) {
            return array.filter(item => item !== value);
        }
        else {
            return [...array, value];
        }
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value);
    };
    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.search)
            count++;
        if (filters.status.length > 0)
            count++;
        if (filters.category.length > 0)
            count++;
        if (filters.channel.length > 0)
            count++;
        if (filters.dateRange.from || filters.dateRange.to)
            count++;
        if (filters.valueRange[0] > 0 || filters.valueRange[1] < 50000)
            count++;
        if (filters.company)
            count++;
        if (filters.tags.length > 0)
            count++;
        if (filters.agent && filters.agent !== 'all_agents')
            count++;
        if (filters.hasOrders !== null)
            count++;
        return count;
    };
    const activeFiltersCount = getActiveFiltersCount();
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("div", { className: "flex-1", children: _jsx(Input, { placeholder: "Buscar por nome, email, empresa ou documento...", value: filters.search, onChange: (e) => updateFilter('search', e.target.value), className: "w-full" }) }), _jsxs(Popover, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "relative", children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), "Filtros Avan\u00E7ados", activeFiltersCount > 0 && (_jsx(Badge, { className: "ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5", children: activeFiltersCount }))] }) }), _jsx(PopoverContent, { className: "w-96 p-6", align: "end", children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Filtros Avan\u00E7ados" }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: onClear, className: "text-red-600 hover:text-red-700", children: [_jsx(RotateCcw, { className: "w-4 h-4 mr-1" }), "Limpar"] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "flex items-center space-x-2", children: [_jsx(Users, { className: "w-4 h-4" }), _jsx("span", { children: "Status" })] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: statusOptions.map((option) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: `status-${option.value}`, checked: filters.status.includes(option.value), onCheckedChange: () => updateFilter('status', toggleArrayValue(filters.status, option.value)) }), _jsx(Label, { htmlFor: `status-${option.value}`, className: "text-sm", children: option.label })] }, option.value))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "flex items-center space-x-2", children: [_jsx(Tag, { className: "w-4 h-4" }), _jsx("span", { children: "Categoria" })] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: categoryOptions.map((option) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: `category-${option.value}`, checked: filters.category.includes(option.value), onCheckedChange: () => updateFilter('category', toggleArrayValue(filters.category, option.value)) }), _jsx(Label, { htmlFor: `category-${option.value}`, className: "text-sm", children: option.label })] }, option.value))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Canal de Origem" }), _jsxs(Select, { value: filters.channel[0] || '', onValueChange: (value) => updateFilter('channel', value ? [value] : []), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecione o canal" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all_channels", children: "Todos os canais" }), channelOptions.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value)))] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Agente Respons\u00E1vel" }), _jsxs(Select, { value: filters.agent, onValueChange: (value) => updateFilter('agent', value), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecione o agente" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all_agents", children: "Todos os agentes" }), agentOptions.map((option) => (_jsx(SelectItem, { value: option.value, children: option.label }, option.value)))] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "flex items-center space-x-2", children: [_jsx(CalendarIcon, { className: "w-4 h-4" }), _jsx("span", { children: "Per\u00EDodo de Cadastro" })] }), _jsxs(Popover, { open: datePopoverOpen, onOpenChange: setDatePopoverOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "w-full justify-start text-left", children: [_jsx(CalendarIcon, { className: "w-4 h-4 mr-2" }), filters.dateRange.from ? (filters.dateRange.to ? (_jsxs(_Fragment, { children: [format(filters.dateRange.from, "dd/MM/yy", { locale: ptBR }), " -", " ", format(filters.dateRange.to, "dd/MM/yy", { locale: ptBR })] })) : (format(filters.dateRange.from, "dd/MM/yyyy", { locale: ptBR }))) : (_jsx("span", { children: "Selecione o per\u00EDodo" }))] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "range", defaultMonth: filters.dateRange.from, selected: {
                                                                    from: filters.dateRange.from,
                                                                    to: filters.dateRange.to
                                                                }, onSelect: (range) => {
                                                                    updateFilter('dateRange', {
                                                                        from: range?.from,
                                                                        to: range?.to
                                                                    });
                                                                    if (range?.from && range?.to) {
                                                                        setDatePopoverOpen(false);
                                                                    }
                                                                }, numberOfMonths: 2, locale: ptBR }) })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs(Label, { className: "flex items-center space-x-2", children: [_jsx(DollarSign, { className: "w-4 h-4" }), _jsx("span", { children: "Valor Total Gasto" })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(Slider, { value: filters.valueRange, onValueChange: (value) => updateFilter('valueRange', value), max: 50000, step: 500, className: "w-full" }), _jsxs("div", { className: "flex justify-between text-sm text-gray-600", children: [_jsx("span", { children: formatCurrency(filters.valueRange[0]) }), _jsx("span", { children: formatCurrency(filters.valueRange[1]) })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { className: "flex items-center space-x-2", children: [_jsx(Building, { className: "w-4 h-4" }), _jsx("span", { children: "Empresa" })] }), _jsx(Input, { placeholder: "Nome da empresa...", value: filters.company, onChange: (e) => updateFilter('company', e.target.value) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-1", children: tagOptions.map((tag) => (_jsx(Badge, { variant: filters.tags.includes(tag) ? "default" : "secondary", className: `cursor-pointer text-xs ${filters.tags.includes(tag)
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, onClick: () => updateFilter('tags', toggleArrayValue(filters.tags, tag)), children: tag }, tag))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { children: "Status de Compras" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "has-orders", checked: filters.hasOrders === true, onCheckedChange: (checked) => updateFilter('hasOrders', checked ? true : null) }), _jsx(Label, { htmlFor: "has-orders", className: "text-sm", children: "Apenas com pedidos" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { id: "no-orders", checked: filters.hasOrders === false, onCheckedChange: (checked) => updateFilter('hasOrders', checked ? false : null) }), _jsx(Label, { htmlFor: "no-orders", className: "text-sm", children: "Apenas sem pedidos" })] })] })] })] }) })] })] }), (activeFiltersCount > 0 || filters.search) && (_jsxs("div", { className: "flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("span", { className: "text-sm text-blue-800", children: [resultCount, " cliente", resultCount !== 1 ? 's' : '', " encontrado", resultCount !== 1 ? 's' : ''] }), _jsxs("div", { className: "flex flex-wrap gap-1", children: [filters.search && (_jsxs(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-800", children: ["Busca: \"", filters.search, "\"", _jsx(X, { className: "w-3 h-3 ml-1 cursor-pointer", onClick: () => updateFilter('search', '') })] })), filters.status.length > 0 && (_jsxs(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-800", children: ["Status: ", filters.status.length, _jsx(X, { className: "w-3 h-3 ml-1 cursor-pointer", onClick: () => updateFilter('status', []) })] })), filters.category.length > 0 && (_jsxs(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-800", children: ["Categoria: ", filters.category.length, _jsx(X, { className: "w-3 h-3 ml-1 cursor-pointer", onClick: () => updateFilter('category', []) })] })), filters.agent && filters.agent !== 'all_agents' && (_jsxs(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-800", children: ["Agente: ", agentOptions.find(a => a.value === filters.agent)?.label, _jsx(X, { className: "w-3 h-3 ml-1 cursor-pointer", onClick: () => updateFilter('agent', '') })] }))] })] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClear, className: "text-blue-600 hover:text-blue-700", children: "Limpar todos" })] }))] }));
};
export { defaultFilters };
