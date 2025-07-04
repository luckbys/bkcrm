import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, Clock, MessageSquare, Tag, Mail, Phone, Building2, User, Calendar as CalendarIcon, X, SlidersHorizontal, Search } from 'lucide-react';
import { cn } from '../../../lib/utils';
export const TicketFilters = ({ filters, onFilterChange }) => {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    // Contar filtros ativos
    const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
        if (key === 'responsible' && value === 'todos')
            return false;
        if (key === 'status' && value === 'todos')
            return false;
        if (key === 'channel' && value === 'all')
            return false;
        if (key === 'agent' && value === 'all')
            return false;
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
    const getChannelIcon = (channel) => {
        const icons = {
            whatsapp: MessageSquare,
            email: Mail,
            telefone: Phone,
            chat: MessageSquare,
            presencial: Building2
        };
        return icons[channel] || MessageSquare;
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700", children: "Filtros Avan\u00E7ados" }), activeFiltersCount > 0 && (_jsxs(Badge, { variant: "secondary", className: "text-xs bg-blue-100 text-blue-700 border-blue-200", children: [activeFiltersCount, " ativos"] }))] }), _jsxs("div", { className: "flex items-center space-x-2", children: [activeFiltersCount > 0 && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: clearAllFilters, className: "text-gray-500 hover:text-gray-700 h-8 px-2 text-xs", children: [_jsx(X, { className: "w-3 h-3 mr-1" }), "Limpar"] })), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setIsCompact(!isCompact), className: "text-gray-500 hover:text-gray-700 h-8 px-2", title: isCompact ? "Expandir filtros" : "Compactar filtros", children: _jsx(SlidersHorizontal, { className: "w-3 h-3" }) })] })] }), _jsxs("div", { className: cn("grid gap-3 transition-all duration-300", isCompact
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"), children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 flex items-center", children: [_jsx(Users, { className: "w-3 h-3 mr-1.5 text-blue-600" }), "Respons\u00E1vel"] }), _jsxs(Select, { value: filters.responsible, onValueChange: (value) => onFilterChange('responsible', value), children: [_jsx(SelectTrigger, { className: "h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm", children: _jsx(SelectValue, { placeholder: "Selecione respons\u00E1vel" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "todos", children: _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-3 h-3 mr-2 text-gray-500" }), "Todos os respons\u00E1veis"] }) }), _jsx(SelectItem, { value: "meus", children: _jsxs("div", { className: "flex items-center", children: [_jsx(User, { className: "w-3 h-3 mr-2 text-blue-600" }), "Meus Tickets"] }) }), _jsx(SelectItem, { value: "grupo1", children: "Grupo Atendimento" }), _jsx(SelectItem, { value: "user1", children: "Jo\u00E3o Silva" }), _jsx(SelectItem, { value: "user2", children: "Maria Santos" }), _jsx(SelectItem, { value: "user3", children: "Pedro Costa" }), _jsx(SelectItem, { value: "user4", children: "Ana Oliveira" })] })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 flex items-center", children: [_jsx(Clock, { className: "w-3 h-3 mr-1.5 text-green-600" }), "Status"] }), _jsxs(Select, { value: filters.status, onValueChange: (value) => onFilterChange('status', value), children: [_jsx(SelectTrigger, { className: "h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm", children: _jsx(SelectValue, { placeholder: "Selecione status" }) }), _jsx(SelectContent, { children: statusOptions.map(option => (_jsx(SelectItem, { value: option.value, children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: cn("w-2 h-2 rounded-full", option.value === 'pendente' && "bg-amber-500", option.value === 'atendimento' && "bg-blue-500", option.value === 'finalizado' && "bg-green-500", option.value === 'cancelado' && "bg-red-500", option.value === 'todos' && "bg-gray-400") }), _jsx("span", { children: option.label })] }) }, option.value))) })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 flex items-center", children: [_jsx(MessageSquare, { className: "w-3 h-3 mr-1.5 text-purple-600" }), "Canal"] }), _jsxs(Select, { value: filters.channel, onValueChange: (value) => onFilterChange('channel', value), children: [_jsx(SelectTrigger, { className: "h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm", children: _jsx(SelectValue, { placeholder: "Todos os canais" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: _jsxs("div", { className: "flex items-center", children: [_jsx(MessageSquare, { className: "w-3 h-3 mr-2 text-gray-500" }), "Todos os canais"] }) }), channelOptions.map(option => {
                                                const IconComponent = getChannelIcon(option.value);
                                                return (_jsx(SelectItem, { value: option.value, children: _jsxs("div", { className: "flex items-center", children: [_jsx(IconComponent, { className: "w-3 h-3 mr-2 text-purple-600" }), option.label] }) }, option.value));
                                            })] })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 flex items-center", children: [_jsx(Search, { className: "w-3 h-3 mr-1.5 text-indigo-600" }), "Cliente"] }), _jsx(Input, { placeholder: "Buscar cliente...", value: filters.client, onChange: (e) => onFilterChange('client', e.target.value), className: "h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 flex items-center", children: [_jsx(Tag, { className: "w-3 h-3 mr-1.5 text-pink-600" }), "Tags"] }), _jsx(Input, { placeholder: "Buscar por tags...", value: filters.tags, onChange: (e) => onFilterChange('tags', e.target.value), className: "h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 flex items-center", children: [_jsx(User, { className: "w-3 h-3 mr-1.5 text-teal-600" }), "Agente"] }), _jsxs(Select, { value: filters.agent, onValueChange: (value) => onFilterChange('agent', value), children: [_jsx(SelectTrigger, { className: "h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm", children: _jsx(SelectValue, { placeholder: "Todos os agentes" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all_agents", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Users, { className: "w-3 h-3 mr-2 text-gray-500" }), "Todos os agentes"] }) }), _jsx(SelectItem, { value: "agent1", children: "Jo\u00E3o Silva" }), _jsx(SelectItem, { value: "agent2", children: "Maria Santos" }), _jsx(SelectItem, { value: "agent3", children: "Pedro Oliveira" }), _jsx(SelectItem, { value: "agent4", children: "Ana Costa" })] })] })] })] }), !isCompact && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 flex items-center", children: [_jsx(CalendarIcon, { className: "w-3 h-3 mr-1.5 text-orange-600" }), "Data De"] }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: cn("w-full justify-start text-left font-normal h-9 border-gray-200 hover:border-gray-300 text-sm", !filters.dateFrom && "text-gray-500"), children: [_jsx(CalendarIcon, { className: "mr-2 h-3 w-3 text-orange-600" }), filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: filters.dateFrom || undefined, onSelect: (date) => onFilterChange('dateFrom', date), initialFocus: true, locale: ptBR }) })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-medium text-gray-600 flex items-center", children: [_jsx(CalendarIcon, { className: "w-3 h-3 mr-1.5 text-orange-600" }), "Data At\u00E9"] }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: cn("w-full justify-start text-left font-normal h-9 border-gray-200 hover:border-gray-300 text-sm", !filters.dateTo && "text-gray-500"), children: [_jsx(CalendarIcon, { className: "mr-2 h-3 w-3 text-orange-600" }), filters.dateTo ? format(filters.dateTo, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "start", children: _jsx(Calendar, { mode: "single", selected: filters.dateTo || undefined, onSelect: (date) => onFilterChange('dateTo', date), initialFocus: true, locale: ptBR }) })] })] })] }))] }));
};
