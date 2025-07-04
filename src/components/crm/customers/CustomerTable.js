import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Eye, Trash2, Phone, Mail, MessageCircle, Building, Calendar, TrendingUp, User } from 'lucide-react';
export const CustomerTable = ({ customers, onEdit, onView, onDelete, onContact }) => {
    const [sortField, setSortField] = useState('name');
    const [sortDirection, setSortDirection] = useState('asc');
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };
    const getStatusBadge = (status) => {
        const statusConfig = {
            ativo: { color: 'bg-green-100 text-green-800', label: 'Ativo' },
            inativo: { color: 'bg-red-100 text-red-800', label: 'Inativo' },
            suspenso: { color: 'bg-orange-100 text-orange-800', label: 'Suspenso' },
            prospect: { color: 'bg-blue-100 text-blue-800', label: 'Prospect' }
        };
        const config = statusConfig[status];
        return (_jsx(Badge, { className: `${config.color} border-0 font-medium`, children: config.label }));
    };
    const getCategoryBadge = (category) => {
        const categoryConfig = {
            bronze: { color: 'bg-orange-100 text-orange-800', label: 'Bronze' },
            prata: { color: 'bg-gray-100 text-gray-800', label: 'Prata' },
            ouro: { color: 'bg-yellow-100 text-yellow-800', label: 'Ouro' },
            diamante: { color: 'bg-blue-100 text-blue-800', label: 'Diamante' }
        };
        const config = categoryConfig[category];
        return (_jsx(Badge, { className: `${config.color} border-0 font-medium`, children: config.label }));
    };
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    };
    const sortedCustomers = [...customers].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortDirection === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
    });
    if (customers.length === 0) {
        return (_jsxs("div", { className: "bg-white rounded-xl border border-gray-200/80 shadow-sm p-8 text-center", children: [_jsx(User, { className: "w-12 h-12 text-gray-400 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Nenhum cliente encontrado" }), _jsx("p", { className: "text-gray-500", children: "Tente ajustar os filtros ou adicione seu primeiro cliente." })] }));
    }
    return (_jsx("div", { className: "bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleSort('name'), children: "Cliente" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleSort('status'), children: "Status" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleSort('category'), children: "Categoria" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleSort('totalValue'), children: "Valor Total" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors", onClick: () => handleSort('lastInteraction'), children: "\u00DAltima Intera\u00E7\u00E3o" }), _jsx("th", { className: "px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Contato" }), _jsx("th", { className: "px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider", children: "A\u00E7\u00F5es" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: sortedCustomers.map((customer, index) => (_jsxs("tr", { className: "hover:bg-gray-50 transition-colors duration-150 animate-in fade-in duration-300", style: { animationDelay: `${index * 50}ms` }, children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0 h-10 w-10", children: _jsx("div", { className: "h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium", children: customer.name.charAt(0).toUpperCase() }) }), _jsxs("div", { className: "ml-4", children: [_jsx("div", { className: "text-sm font-medium text-gray-900", children: customer.name }), _jsx("div", { className: "text-sm text-gray-500 flex items-center", children: customer.company && (_jsxs(_Fragment, { children: [_jsx(Building, { className: "w-3 h-3 mr-1" }), customer.company] })) })] })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: getStatusBadge(customer.status) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: getCategoryBadge(customer.category) }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm text-gray-900 font-medium", children: formatCurrency(customer.totalValue) }), _jsxs("div", { className: "text-sm text-gray-500 flex items-center", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), customer.totalOrders, " pedidos"] })] }), _jsxs("td", { className: "px-6 py-4 whitespace-nowrap", children: [_jsx("div", { className: "text-sm text-gray-900", children: formatDate(customer.lastInteraction) }), _jsxs("div", { className: "text-sm text-gray-500 flex items-center", children: [_jsx(Calendar, { className: "w-3 h-3 mr-1" }), "Cliente desde ", formatDate(customer.customerSince)] })] }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onContact(customer, 'phone'), className: "h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600", children: _jsx(Phone, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onContact(customer, 'email'), className: "h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600", children: _jsx(Mail, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onContact(customer, 'whatsapp'), className: "h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600", children: _jsx(MessageCircle, { className: "w-4 h-4" }) })] }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-right text-sm font-medium", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 hover:bg-gray-100", children: _jsx(MoreVertical, { className: "w-4 h-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-48", children: [_jsxs(DropdownMenuItem, { onClick: () => onView(customer), className: "cursor-pointer", children: [_jsx(Eye, { className: "w-4 h-4 mr-2" }), "Visualizar"] }), _jsxs(DropdownMenuItem, { onClick: () => onEdit(customer), className: "cursor-pointer", children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Editar"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => onDelete(customer), className: "cursor-pointer text-red-600 hover:text-red-700", children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Excluir"] })] })] }) })] }, customer.id))) })] }) }) }));
};
