import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { CustomerStats } from './CustomerStats';
import { CustomerFilters as Filters } from './CustomerFilters';
import { CustomerTable } from './CustomerTable';
import { AddCustomerModal } from './AddCustomerModal';
import { EditCustomerModal } from './EditCustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { AdvancedFilters, defaultFilters } from './AdvancedFilters';
import { EnhancedCustomerTable } from './EnhancedCustomerTable';
import { exportToExcel } from '@/utils/exportUtils';
import { Users, AlertCircle, RefreshCw, TrendingUp, UserPlus, Filter, Grid3X3, List, Download, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useCustomers } from '@/hooks/useCustomers';
export const CustomerManagement = () => {
    const { customers: allCustomers, loading, error, addCustomer, updateCustomer, deleteCustomer, refreshCustomers } = useCustomers();
    // Estados principais
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [useAdvancedFilters, setUseAdvancedFilters] = useState(true);
    const [viewMode, setViewMode] = useState('enhanced');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    // Estados de filtros
    const [basicFilters, setBasicFilters] = useState({
        search: '',
        status: 'todos',
        category: 'todos',
        channel: 'todos',
        dateRange: { start: '', end: '' },
        agent: 'todos'
    });
    const [advancedFilters, setAdvancedFilters] = useState(defaultFilters);
    // Calcular estatísticas dos clientes
    const stats = useMemo(() => {
        const active = allCustomers.filter(c => c.status === 'active').length;
        const inactive = allCustomers.filter(c => c.status === 'inactive').length;
        const prospects = allCustomers.filter(c => c.status === 'prospect').length;
        const totalValue = allCustomers.reduce((sum, c) => sum + c.totalValue, 0);
        const averageTicket = totalValue / allCustomers.length || 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newThisMonth = allCustomers.filter(c => new Date(c.createdAt) >= thirtyDaysAgo).length;
        return {
            total: allCustomers.length,
            active,
            inactive,
            prospects,
            newThisMonth,
            totalValue,
            averageTicket
        };
    }, [allCustomers]);
    // Filtrar clientes com base no modo selecionado
    const filteredCustomers = useMemo(() => {
        let customers = [...allCustomers];
        if (useAdvancedFilters) {
            // Aplicar filtros avançados
            customers = customers.filter(customer => {
                // Busca
                const matchesSearch = !advancedFilters.search ||
                    customer.name.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
                    customer.email.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
                    customer.phone.includes(advancedFilters.search) ||
                    customer.company.toLowerCase().includes(advancedFilters.search.toLowerCase()) ||
                    customer.document.includes(advancedFilters.search);
                // Status
                const matchesStatus = advancedFilters.status.length === 0 ||
                    advancedFilters.status.includes(customer.status);
                // Categoria
                const matchesCategory = advancedFilters.category.length === 0 ||
                    advancedFilters.category.includes(customer.category);
                // Canal
                const matchesChannel = advancedFilters.channel.length === 0 ||
                    advancedFilters.channel.includes(customer.channel);
                // Agente
                const matchesAgent = !advancedFilters.agent ||
                    advancedFilters.agent === 'all_agents' ||
                    customer.responsibleAgent === advancedFilters.agent;
                // Período
                const matchesDateRange = (!advancedFilters.dateRange.from && !advancedFilters.dateRange.to) ||
                    ((!advancedFilters.dateRange.from || new Date(customer.createdAt) >= advancedFilters.dateRange.from) &&
                        (!advancedFilters.dateRange.to || new Date(customer.createdAt) <= advancedFilters.dateRange.to));
                // Faixa de valor
                const matchesValue = customer.totalValue >= advancedFilters.valueRange[0] &&
                    customer.totalValue <= advancedFilters.valueRange[1];
                // Empresa
                const matchesCompany = !advancedFilters.company ||
                    customer.company.toLowerCase().includes(advancedFilters.company.toLowerCase());
                // Tags
                const matchesTags = advancedFilters.tags.length === 0 ||
                    advancedFilters.tags.some(tag => customer.tags.includes(tag));
                // Com/sem pedidos
                const matchesOrders = advancedFilters.hasOrders === null ||
                    (advancedFilters.hasOrders === true && customer.totalOrders > 0) ||
                    (advancedFilters.hasOrders === false && customer.totalOrders === 0);
                return matchesSearch && matchesStatus && matchesCategory &&
                    matchesChannel && matchesAgent && matchesDateRange &&
                    matchesValue && matchesCompany && matchesTags && matchesOrders;
            });
        }
        else {
            // Aplicar filtros básicos
            customers = customers.filter(customer => {
                const matchesSearch = !basicFilters.search ||
                    customer.name.toLowerCase().includes(basicFilters.search.toLowerCase()) ||
                    customer.email.toLowerCase().includes(basicFilters.search.toLowerCase()) ||
                    customer.phone.includes(basicFilters.search);
                const matchesStatus = basicFilters.status === 'todos' || customer.status === basicFilters.status;
                const matchesCategory = basicFilters.category === 'todos' || customer.category === basicFilters.category;
                const matchesChannel = basicFilters.channel === 'todos' || customer.channel === basicFilters.channel;
                const matchesAgent = basicFilters.agent === 'todos' || customer.responsibleAgent === basicFilters.agent;
                const matchesDateRange = !basicFilters.dateRange.start || !basicFilters.dateRange.end || (new Date(customer.createdAt) >= new Date(basicFilters.dateRange.start) &&
                    new Date(customer.createdAt) <= new Date(basicFilters.dateRange.end));
                return matchesSearch && matchesStatus && matchesCategory &&
                    matchesChannel && matchesDateRange && matchesAgent;
            });
        }
        return customers;
    }, [allCustomers, basicFilters, advancedFilters, useAdvancedFilters]);
    // Handlers de ações
    const handleAddCustomer = async (customerData) => {
        try {
            await addCustomer(customerData);
            toast({
                title: '✅ Cliente adicionado',
                description: 'O cliente foi cadastrado com sucesso.',
            });
            setShowAddModal(false);
        }
        catch (error) {
            toast({
                title: '❌ Erro ao adicionar cliente',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        }
    };
    const handleEditCustomer = (customer) => {
        setSelectedCustomer(customer);
        setShowEditModal(true);
        setShowDetailModal(false);
    };
    const handleSaveEditedCustomer = async (customer) => {
        try {
            await updateCustomer(customer.id, customer);
            toast({
                title: '✅ Cliente atualizado',
                description: 'Os dados do cliente foram atualizados com sucesso.',
            });
            setShowEditModal(false);
            setSelectedCustomer(null);
        }
        catch (error) {
            toast({
                title: '❌ Erro ao atualizar cliente',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        }
    };
    const handleDeleteCustomer = async (customer) => {
        try {
            await deleteCustomer(customer.id);
            toast({
                title: '✅ Cliente removido',
                description: 'O cliente foi removido com sucesso.',
            });
        }
        catch (error) {
            toast({
                title: '❌ Erro ao remover cliente',
                description: error instanceof Error ? error.message : 'Erro desconhecido',
                variant: 'destructive',
            });
        }
    };
    const handleViewCustomer = (customer) => {
        setSelectedCustomer(customer);
        setShowDetailModal(true);
    };
    const handleContactCustomer = (customer, method) => {
        const methodLabels = {
            phone: '📞 telefone',
            email: '📧 email',
            whatsapp: '💬 WhatsApp'
        };
        toast({
            title: `${methodLabels[method]} iniciado`,
            description: `Contatando ${customer.name} via ${methodLabels[method].split(' ')[1]}`,
        });
        // Aqui você integraria com APIs reais de contato
        if (method === 'phone') {
            window.open(`tel:${customer.phone}`);
        }
        else if (method === 'email') {
            window.open(`mailto:${customer.email}`);
        }
        else if (method === 'whatsapp') {
            const phoneNumber = customer.phone.replace(/\D/g, '');
            window.open(`https://wa.me/55${phoneNumber}`);
        }
    };
    const handleExportToExcel = () => {
        try {
            exportToExcel(filteredCustomers, 'clientes');
            toast({
                title: '✅ Exportação concluída',
                description: 'Os dados foram exportados para Excel com sucesso.',
            });
        }
        catch (error) {
            toast({
                title: '❌ Erro na exportação',
                description: 'Não foi possível exportar os dados para Excel.',
                variant: 'destructive',
            });
        }
    };
    const clearAllFilters = () => {
        if (useAdvancedFilters) {
            setAdvancedFilters(defaultFilters);
        }
        else {
            setBasicFilters({
                search: '',
                status: 'todos',
                category: 'todos',
                channel: 'todos',
                dateRange: { start: '', end: '' },
                agent: 'todos'
            });
        }
    };
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6", children: _jsx(Card, { className: "max-w-md mx-auto mt-20", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertCircle, { className: "h-12 w-12 text-red-500 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold mb-2", children: "Erro ao carregar clientes" }), _jsx("p", { className: "text-gray-600 mb-4", children: error.message }), _jsxs(Button, { onClick: refreshCustomers, className: "w-full", variant: "outline", children: [_jsx(RefreshCw, { className: "w-4 h-4 mr-2" }), "Tentar novamente"] })] }) }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100", children: _jsxs("div", { className: "container mx-auto p-6 space-y-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg", children: _jsx(Users, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Gest\u00E3o de Clientes" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Gerencie e acompanhe todos os seus clientes com ferramentas avan\u00E7adas" })] })] }), _jsxs("div", { className: "flex flex-col lg:flex-row items-start lg:items-center gap-4", children: [_jsxs("div", { className: "flex items-center space-x-2 text-sm", children: [_jsxs(Badge, { variant: "secondary", className: "bg-green-100 text-green-800", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), stats.newThisMonth, " novos este m\u00EAs"] }), _jsxs(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-800", children: ["Total: ", stats.total] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Label, { htmlFor: "advanced-filters", className: "text-sm", children: "Filtros Avan\u00E7ados" }), _jsx(Switch, { id: "advanced-filters", checked: useAdvancedFilters, onCheckedChange: setUseAdvancedFilters })] }), _jsxs("div", { className: "flex border rounded-lg", children: [_jsx(Button, { variant: viewMode === 'enhanced' ? 'default' : 'ghost', size: "sm", onClick: () => setViewMode('enhanced'), className: "rounded-r-none", children: _jsx(Grid3X3, { className: "w-4 h-4" }) }), _jsx(Button, { variant: viewMode === 'simple' ? 'default' : 'ghost', size: "sm", onClick: () => setViewMode('simple'), className: "rounded-l-none", children: _jsx(List, { className: "w-4 h-4" }) })] }), _jsxs(Button, { onClick: () => setShowAddModal(true), className: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800", children: [_jsx(UserPlus, { className: "w-4 h-4 mr-2" }), "Novo Cliente"] }), _jsxs(Button, { variant: "outline", onClick: () => setShowShortcuts(true), className: "border-gray-300", children: [_jsx(Keyboard, { className: "w-4 h-4 mr-2" }), "Atalhos"] })] })] })] }), _jsx(CustomerStats, { stats: stats, loading: loading }), _jsx(Card, { className: "border-0 shadow-lg", children: _jsx(CardContent, { className: "p-6", children: useAdvancedFilters ? (_jsx(AdvancedFilters, { filters: advancedFilters, onFiltersChange: setAdvancedFilters, onClear: clearAllFilters, resultCount: filteredCustomers.length })) : (_jsx(Filters, { filters: basicFilters, onFiltersChange: setBasicFilters, onAddCustomer: () => setShowAddModal(true), onExport: handleExportToExcel })) }) }), filteredCustomers.length !== allCustomers.length && (_jsx(Card, { className: "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50", children: _jsx(CardContent, { className: "py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Filter, { className: "w-5 h-5 text-blue-600" }), _jsxs("div", { children: [_jsxs("p", { className: "font-medium text-blue-900", children: [filteredCustomers.length, " de ", allCustomers.length, " clientes encontrados"] }), _jsx("p", { className: "text-sm text-blue-700", children: "Filtros ativos - use os controles acima para refinar" })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: handleExportToExcel, className: "border-blue-300 text-blue-700 hover:bg-blue-100", children: [_jsx(Download, { className: "w-4 h-4 mr-1" }), "Exportar Resultado"] }), _jsx(Button, { variant: "ghost", size: "sm", onClick: clearAllFilters, className: "text-blue-700 hover:text-blue-800", children: "Limpar Filtros" })] })] }) }) })), loading && (_jsx(Card, { className: "border-0 shadow-lg", children: _jsx(CardContent, { className: "py-12", children: _jsxs("div", { className: "flex flex-col items-center justify-center space-y-4", children: [_jsx(RefreshCw, { className: "w-8 h-8 animate-spin text-blue-600" }), _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-lg font-medium text-gray-900", children: "Carregando clientes..." }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Aguarde enquanto buscamos os dados" })] })] }) }) })), !loading && (_jsx(Card, { className: "border-0 shadow-lg", children: _jsx(CardContent, { className: "p-6", children: viewMode === 'enhanced' ? (_jsx(EnhancedCustomerTable, { customers: filteredCustomers, onEdit: handleEditCustomer, onDelete: handleDeleteCustomer, onView: handleViewCustomer, onContact: handleContactCustomer, loading: loading })) : (_jsx(CustomerTable, { customers: filteredCustomers, onEdit: handleEditCustomer, onDelete: handleDeleteCustomer, onView: handleViewCustomer, onContact: handleContactCustomer })) }) })), _jsx(AddCustomerModal, { isOpen: showAddModal, onClose: () => setShowAddModal(false), onSave: handleAddCustomer }), _jsx(EditCustomerModal, { customer: selectedCustomer, isOpen: showEditModal, onClose: () => {
                        setShowEditModal(false);
                        setSelectedCustomer(null);
                    }, onSave: handleSaveEditedCustomer }), _jsx(CustomerDetailModal, { customer: selectedCustomer, isOpen: showDetailModal, onClose: () => {
                        setShowDetailModal(false);
                        setSelectedCustomer(null);
                    }, onEdit: handleEditCustomer, onContact: handleContactCustomer })] }) }));
};
