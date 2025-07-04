import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { customerStatuses, customerCategories, customerChannels, responsibleAgents } from '@/data/customers';
import { Search, Filter, X, Calendar, Download, Plus } from 'lucide-react';
export const CustomerFilters = ({ filters, onFiltersChange, onAddCustomer, onExport }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const handleFilterChange = (key, value) => {
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
    const hasActiveFilters = filters.search ||
        filters.status !== 'todos' ||
        filters.category !== 'todos' ||
        filters.channel !== 'todos' ||
        filters.agent !== 'todos' ||
        filters.dateRange.start ||
        filters.dateRange.end;
    return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200/80 shadow-sm p-4 mb-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row gap-4 items-start lg:items-center", children: [_jsxs("div", { className: "relative flex-1 max-w-md", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Buscar clientes...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value), className: "pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500" })] }), _jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [_jsxs(Select, { value: filters.status, onValueChange: (value) => handleFilterChange('status', value), children: [_jsx(SelectTrigger, { className: "w-40 border-gray-300", children: _jsx(SelectValue, { placeholder: "Status" }) }), _jsx(SelectContent, { children: customerStatuses.map((status) => (_jsx(SelectItem, { value: status.value, children: _jsxs("div", { className: "flex items-center gap-2", children: [status.color && (_jsx("div", { className: `w-2 h-2 rounded-full bg-${status.color}-500` })), status.label] }) }, status.value))) })] }), _jsxs(Select, { value: filters.category, onValueChange: (value) => handleFilterChange('category', value), children: [_jsx(SelectTrigger, { className: "w-40 border-gray-300", children: _jsx(SelectValue, { placeholder: "Categoria" }) }), _jsx(SelectContent, { children: customerCategories.map((category) => (_jsx(SelectItem, { value: category.value, children: _jsxs("div", { className: "flex items-center gap-2", children: [category.color && (_jsx("div", { className: `w-2 h-2 rounded-full bg-${category.color}-500` })), category.label] }) }, category.value))) })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsExpanded(!isExpanded), className: "border-gray-300 hover:bg-gray-50", children: [_jsx(Filter, { className: "w-4 h-4 mr-2" }), "Mais Filtros"] }), hasActiveFilters && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: clearFilters, className: "text-red-600 hover:text-red-700 hover:bg-red-50", children: [_jsx(X, { className: "w-4 h-4 mr-1" }), "Limpar"] }))] }), _jsxs("div", { className: "flex gap-2 ml-auto", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: onExport, className: "border-gray-300 hover:bg-gray-50", children: [_jsx(Download, { className: "w-4 h-4 mr-2" }), "Exportar"] }), _jsxs(Button, { onClick: onAddCustomer, size: "sm", className: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Novo Cliente"] })] })] }), isExpanded && (_jsx("div", { className: "mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Select, { value: filters.channel, onValueChange: (value) => handleFilterChange('channel', value), children: [_jsx(SelectTrigger, { className: "border-gray-300", children: _jsx(SelectValue, { placeholder: "Canal de Origem" }) }), _jsx(SelectContent, { children: customerChannels.map((channel) => (_jsx(SelectItem, { value: channel.value, children: channel.label }, channel.value))) })] }), _jsxs(Select, { value: filters.agent, onValueChange: (value) => handleFilterChange('agent', value), children: [_jsx(SelectTrigger, { className: "border-gray-300", children: _jsx(SelectValue, { placeholder: "Agente Respons\u00E1vel" }) }), _jsx(SelectContent, { children: responsibleAgents.map((agent) => (_jsx(SelectItem, { value: agent.value, children: agent.label }, agent.value))) })] }), _jsxs("div", { className: "relative", children: [_jsx(Calendar, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { type: "date", placeholder: "Data inicial", value: filters.dateRange.start, onChange: (e) => handleFilterChange('dateRange', {
                                        ...filters.dateRange,
                                        start: e.target.value
                                    }), className: "pl-10 border-gray-300" })] }), _jsxs("div", { className: "relative", children: [_jsx(Calendar, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { type: "date", placeholder: "Data final", value: filters.dateRange.end, onChange: (e) => handleFilterChange('dateRange', {
                                        ...filters.dateRange,
                                        end: e.target.value
                                    }), className: "pl-10 border-gray-300" })] })] }) })), hasActiveFilters && (_jsxs("div", { className: "mt-3 flex flex-wrap gap-2", children: [filters.search && (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs", children: ["Busca: \"", filters.search, "\""] })), filters.status !== 'todos' && (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs", children: ["Status: ", customerStatuses.find(s => s.value === filters.status)?.label] })), filters.category !== 'todos' && (_jsxs("span", { className: "inline-flex items-center px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 text-xs", children: ["Categoria: ", customerCategories.find(c => c.value === filters.category)?.label] }))] }))] }));
};
