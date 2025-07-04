import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MoreVertical, ChevronUp, ChevronDown, ArrowUpDown, Download, Trash2, Mail, Phone, MessageCircle, Edit, Eye, Star, StarOff, Users, Settings2 } from 'lucide-react';
export const EnhancedCustomerTable = ({ customers, onEdit, onDelete, onView, onContact, loading = false }) => {
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [sortField, setSortField] = useState('customerSince');
    const [sortDirection, setSortDirection] = useState('desc');
    const [favorites, setFavorites] = useState([]);
    const [compactView, setCompactView] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState({
        avatar: true,
        name: true,
        email: true,
        company: true,
        category: true,
        status: true,
        totalValue: true,
        totalOrders: true,
        lastInteraction: true,
        actions: true
    });
    const sortedCustomers = useMemo(() => {
        return [...customers].sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];
            if (sortField === 'customerSince' || sortField === 'lastInteraction') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            if (aValue < bValue)
                return sortDirection === 'asc' ? -1 : 1;
            if (aValue > bValue)
                return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [customers, sortField, sortDirection]);
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    };
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedCustomers(customers.map(c => c.id));
        }
        else {
            setSelectedCustomers([]);
        }
    };
    const handleSelectCustomer = (customerId, checked) => {
        if (checked) {
            setSelectedCustomers(prev => [...prev, customerId]);
        }
        else {
            setSelectedCustomers(prev => prev.filter(id => id !== customerId));
        }
    };
    const toggleFavorite = (customerId) => {
        setFavorites(prev => prev.includes(customerId)
            ? prev.filter(id => id !== customerId)
            : [...prev, customerId]);
    };
    const handleBulkAction = (action) => {
        const selectedCustomerObjects = customers.filter(c => selectedCustomers.includes(c.id));
        switch (action) {
            case 'delete':
                selectedCustomerObjects.forEach(customer => onDelete(customer));
                setSelectedCustomers([]);
                break;
            case 'export':
                // Implementar exportação
                console.log('Exportando clientes selecionados:', selectedCustomerObjects);
                break;
            case 'email':
                // Implementar envio de email em lote
                console.log('Enviando email para:', selectedCustomerObjects);
                break;
        }
    };
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value);
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800 border-green-200',
            inactive: 'bg-red-100 text-red-800 border-red-200',
            prospect: 'bg-blue-100 text-blue-800 border-blue-200',
            blocked: 'bg-orange-100 text-orange-800 border-orange-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    const getCategoryColor = (category) => {
        const colors = {
            bronze: 'bg-orange-100 text-orange-800 border-orange-200',
            silver: 'bg-gray-100 text-gray-800 border-gray-200',
            gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            platinum: 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    const getSortIcon = (field) => {
        if (sortField !== field) {
            return _jsx(ArrowUpDown, { className: "w-4 h-4 text-gray-400" });
        }
        return sortDirection === 'asc'
            ? _jsx(ChevronUp, { className: "w-4 h-4 text-blue-600" })
            : _jsx(ChevronDown, { className: "w-4 h-4 text-blue-600" });
    };
    const isAllSelected = selectedCustomers.length === customers.length && customers.length > 0;
    const isPartialSelected = selectedCustomers.length > 0 && selectedCustomers.length < customers.length;
    if (loading) {
        return (_jsx("div", { className: "space-y-3", children: Array.from({ length: 5 }).map((_, i) => (_jsx("div", { className: "h-16 bg-gray-100 rounded-lg animate-pulse" }, i))) }));
    }
    return (_jsx(TooltipProvider, { children: _jsxs("div", { className: "space-y-4", children: [selectedCustomers.length > 0 && (_jsxs("div", { className: "flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Users, { className: "w-4 h-4 text-blue-600" }), _jsxs("span", { className: "text-sm font-medium text-blue-800", children: [selectedCustomers.length, " cliente", selectedCustomers.length !== 1 ? 's' : '', " selecionado", selectedCustomers.length !== 1 ? 's' : ''] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleBulkAction('email'), children: [_jsx(Mail, { className: "w-4 h-4 mr-1" }), "Enviar Email"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleBulkAction('export'), children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Exportar"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleBulkAction('delete'), className: "text-red-600 hover:text-red-700", children: [_jsx(Trash2, { className: "w-4 h-4 mr-1" }), "Excluir"] })] })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Checkbox, { checked: isAllSelected || isPartialSelected, onCheckedChange: handleSelectAll, ref: (el) => {
                                        if (el)
                                            el.indeterminate = isPartialSelected;
                                    } }), _jsx("span", { className: "text-sm text-gray-600", children: "Selecionar todos" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setCompactView(!compactView), children: [_jsx(Settings2, { className: "w-4 h-4 mr-1" }), compactView ? 'Expandir' : 'Compactar'] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(Settings2, { className: "w-4 h-4 mr-1" }), "Colunas"] }) }), _jsx(DropdownMenuContent, { align: "end", className: "w-48", children: Object.entries(visibleColumns).map(([key, visible]) => (_jsx(DropdownMenuCheckboxItem, { checked: visible, onCheckedChange: (checked) => setVisibleColumns(prev => ({ ...prev, [key]: checked })), children: key === 'avatar' ? 'Avatar' :
                                                    key === 'name' ? 'Nome' :
                                                        key === 'email' ? 'Email' :
                                                            key === 'company' ? 'Empresa' :
                                                                key === 'category' ? 'Categoria' :
                                                                    key === 'status' ? 'Status' :
                                                                        key === 'totalValue' ? 'Valor Total' :
                                                                            key === 'totalOrders' ? 'Pedidos' :
                                                                                key === 'lastInteraction' ? 'Última Interação' :
                                                                                    'Ações' }, key))) })] })] })] }), _jsxs("div", { className: "border rounded-lg overflow-hidden", children: [_jsxs(Table, { children: [_jsx(TableHeader, { className: "bg-gray-50", children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-12", children: _jsx(Checkbox, { checked: isAllSelected, onCheckedChange: handleSelectAll, ref: (el) => {
                                                        if (el)
                                                            el.indeterminate = isPartialSelected;
                                                    } }) }), visibleColumns.avatar && (_jsx(TableHead, { className: "w-12" })), visibleColumns.name && (_jsx(TableHead, { children: _jsxs(Button, { variant: "ghost", onClick: () => handleSort('name'), className: "h-auto p-0 font-semibold", children: ["Nome ", getSortIcon('name')] }) })), visibleColumns.email && (_jsx(TableHead, { children: _jsxs(Button, { variant: "ghost", onClick: () => handleSort('email'), className: "h-auto p-0 font-semibold", children: ["Email ", getSortIcon('email')] }) })), visibleColumns.company && (_jsx(TableHead, { children: _jsxs(Button, { variant: "ghost", onClick: () => handleSort('company'), className: "h-auto p-0 font-semibold", children: ["Empresa ", getSortIcon('company')] }) })), visibleColumns.category && (_jsx(TableHead, { children: "Categoria" })), visibleColumns.status && (_jsx(TableHead, { children: "Status" })), visibleColumns.totalValue && (_jsx(TableHead, { children: _jsxs(Button, { variant: "ghost", onClick: () => handleSort('totalValue'), className: "h-auto p-0 font-semibold", children: ["Valor Total ", getSortIcon('totalValue')] }) })), visibleColumns.totalOrders && (_jsx(TableHead, { children: "Pedidos" })), visibleColumns.lastInteraction && (_jsx(TableHead, { children: _jsxs(Button, { variant: "ghost", onClick: () => handleSort('lastInteraction'), className: "h-auto p-0 font-semibold", children: ["\u00DAltima Intera\u00E7\u00E3o ", getSortIcon('lastInteraction')] }) })), visibleColumns.actions && (_jsx(TableHead, { className: "w-20", children: "A\u00E7\u00F5es" }))] }) }), _jsx(TableBody, { children: sortedCustomers.map((customer) => (_jsxs(TableRow, { className: `hover:bg-gray-50 transition-colors ${selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''} ${compactView ? 'h-12' : 'h-16'}`, children: [_jsx(TableCell, { children: _jsx(Checkbox, { checked: selectedCustomers.includes(customer.id), onCheckedChange: (checked) => handleSelectCustomer(customer.id, checked) }) }), visibleColumns.avatar && (_jsx(TableCell, { children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Avatar, { className: compactView ? "h-8 w-8" : "h-10 w-10", children: _jsx(AvatarFallback, { className: "bg-gradient-to-br from-blue-500 to-blue-600 text-white", children: customer.name.charAt(0).toUpperCase() }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => toggleFavorite(customer.id), className: "p-1 h-auto", children: favorites.includes(customer.id) ? (_jsx(Star, { className: "w-4 h-4 text-yellow-500 fill-current" })) : (_jsx(StarOff, { className: "w-4 h-4 text-gray-400" })) })] }) })), visibleColumns.name && (_jsx(TableCell, { children: _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "font-medium text-gray-900", children: customer.name }), !compactView && customer.tags.length > 0 && (_jsxs("div", { className: "flex flex-wrap gap-1", children: [customer.tags.slice(0, 2).map((tag, index) => (_jsx(Badge, { variant: "secondary", className: "text-xs", children: tag }, index))), customer.tags.length > 2 && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: ["+", customer.tags.length - 2] }))] }))] }) })), visibleColumns.email && (_jsx(TableCell, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { children: _jsx("span", { className: "text-sm text-gray-600 truncate block max-w-48", children: customer.email }) }), _jsx(TooltipContent, { children: customer.email })] }) })), visibleColumns.company && (_jsx(TableCell, { children: _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: customer.company }), !compactView && (_jsx("p", { className: "text-xs text-gray-600", children: customer.position }))] }) })), visibleColumns.category && (_jsx(TableCell, { children: _jsx(Badge, { className: `${getCategoryColor(customer.category)} border`, children: customer.category.charAt(0).toUpperCase() + customer.category.slice(1) }) })), visibleColumns.status && (_jsx(TableCell, { children: _jsx(Badge, { className: `${getStatusColor(customer.status)} border`, children: customer.status === 'active' ? 'Ativo' :
                                                        customer.status === 'inactive' ? 'Inativo' :
                                                            customer.status === 'prospect' ? 'Prospect' : 'Bloqueado' }) })), visibleColumns.totalValue && (_jsx(TableCell, { children: _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-medium text-green-600", children: formatCurrency(customer.totalValue) }), !compactView && (_jsxs("p", { className: "text-xs text-gray-600", children: ["M\u00E9dia: ", formatCurrency(customer.averageTicket)] }))] }) })), visibleColumns.totalOrders && (_jsx(TableCell, { className: "text-center", children: _jsx(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-800", children: customer.totalOrders }) })), visibleColumns.lastInteraction && (_jsx(TableCell, { children: _jsx("p", { className: "text-sm text-gray-900", children: formatDate(customer.lastInteraction) }) })), visibleColumns.actions && (_jsx(TableCell, { children: _jsxs("div", { className: "flex items-center space-x-1", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onView(customer), className: "h-8 w-8 p-0", children: _jsx(Eye, { className: "w-4 h-4" }) }) }), _jsx(TooltipContent, { children: "Visualizar" })] }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", children: _jsx(MoreVertical, { className: "w-4 h-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-48", children: [_jsxs(DropdownMenuItem, { onClick: () => onEdit(customer), children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Editar"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => onContact(customer, 'phone'), children: [_jsx(Phone, { className: "w-4 h-4 mr-2" }), "Ligar"] }), _jsxs(DropdownMenuItem, { onClick: () => onContact(customer, 'email'), children: [_jsx(Mail, { className: "w-4 h-4 mr-2" }), "Email"] }), _jsxs(DropdownMenuItem, { onClick: () => onContact(customer, 'whatsapp'), children: [_jsx(MessageCircle, { className: "w-4 h-4 mr-2" }), "WhatsApp"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => onDelete(customer), className: "text-red-600", children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Excluir"] })] })] })] }) }))] }, customer.id))) })] }), customers.length === 0 && (_jsxs("div", { className: "p-8 text-center text-gray-500", children: [_jsx(Users, { className: "w-12 h-12 mx-auto mb-4 text-gray-300" }), _jsx("p", { className: "text-lg font-medium", children: "Nenhum cliente encontrado" }), _jsx("p", { className: "text-sm", children: "Tente ajustar os filtros ou adicionar novos clientes" })] }))] })] }) }));
};
