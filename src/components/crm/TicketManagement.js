import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, RefreshCw, Grid3X3, List, SortAsc, SortDesc, Bell, BellOff, CheckSquare, Square, Play, Pause, Eye, Users, Clock, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { TicketHeader } from './ticket-management/TicketHeader';
import { TicketFilters } from './ticket-management/TicketFilters';
import { TicketsList } from './ticket-management/TicketsList';
import { cn } from '@/lib/utils';
import { useTicketsDB } from '@/hooks/useTicketsDB';
import { useUserDepartment } from '@/hooks/useUserDepartment';
import { useToast } from '@/hooks/use-toast';
import UnifiedChatModalWrapper from '../chat/UnifiedChatModalWrapper';
// Função helper para extrair informações do cliente do ticket
const extractClientInfo = (ticket) => {
    if (!ticket) {
        return {
            clientName: 'Cliente Anônimo',
            clientPhone: undefined,
            isWhatsApp: false
        };
    }
    const metadata = ticket.metadata || {};
    const isWhatsApp = metadata.created_from_whatsapp ||
        metadata.whatsapp_phone ||
        metadata.anonymous_contact ||
        ticket.channel === 'whatsapp';
    let clientName = 'Cliente Anônimo';
    let clientPhone = undefined;
    if (isWhatsApp) {
        // Extrair nome do WhatsApp
        clientName = metadata.client_name ||
            metadata.whatsapp_name ||
            (typeof metadata.anonymous_contact === 'object' ? metadata.anonymous_contact?.name : metadata.anonymous_contact) ||
            ticket.client ||
            ticket.whatsapp_contact_name ||
            'Cliente WhatsApp';
        // Extrair telefone do WhatsApp com múltiplas fontes
        clientPhone = metadata.client_phone ||
            metadata.whatsapp_phone ||
            (typeof metadata.anonymous_contact === 'object' ? metadata.anonymous_contact?.phone : null) ||
            ticket.client_phone ||
            ticket.customerPhone ||
            ticket.phone ||
            ticket.nunmsg;
        // Formatar telefone brasileiro se necessário
        if (clientPhone && !clientPhone.includes('+')) {
            const clean = clientPhone.replace(/\D/g, '');
            if (clean.length >= 10) {
                if (clean.length === 13 && clean.startsWith('55')) {
                    clientPhone = `+${clean}`;
                }
                else if (clean.length >= 10 && clean.length <= 11) {
                    clientPhone = `+55${clean}`;
                }
            }
        }
    }
    else {
        // Ticket normal (não WhatsApp)
        clientName = ticket.client || ticket.customer_name || 'Cliente';
        clientPhone = ticket.customerPhone || ticket.customer_phone;
    }
    return {
        clientName: typeof clientName === 'string' ? clientName : 'Cliente Anônimo',
        clientPhone: typeof clientPhone === 'string' ? clientPhone : undefined,
        isWhatsApp
    };
};
export const TicketManagement = ({ sector, onOpenAddTicket }) => {
    // Hooks do banco de dados
    const { compatibilityTickets, loading: dbLoading, error: dbError, refreshTickets, updateTicket } = useTicketsDB();
    const { userInfo, canViewAllTickets } = useUserDepartment();
    const { toast } = useToast();
    // Mock data expandido - definido logo após os hooks
    const mockTickets = [
        {
            id: 1234,
            client: 'João Silva',
            subject: 'Problema com sistema de login',
            status: 'pendente',
            channel: 'chat',
            lastMessage: '2 min atrás',
            unread: true,
            priority: 'alta',
            agent: 'Não atribuído',
            createdAt: new Date(Date.now() - 2 * 60 * 1000),
            updatedAt: new Date(Date.now() - 2 * 60 * 1000),
            tags: ['login', 'urgente'],
            description: 'Cliente não consegue acessar sua conta há 2 dias'
        },
        {
            id: 1235,
            client: 'Maria Santos',
            subject: 'Dúvida sobre produto premium',
            status: 'atendimento',
            channel: 'email',
            lastMessage: '15 min atrás',
            unread: false,
            priority: 'normal',
            agent: 'Ana Costa',
            createdAt: new Date(Date.now() - 15 * 60 * 1000),
            updatedAt: new Date(Date.now() - 15 * 60 * 1000),
            tags: ['produto', 'premium'],
            description: 'Quer entender as funcionalidades do plano premium'
        },
        {
            id: 1236,
            client: 'Pedro Costa',
            subject: 'Solicitação de cancelamento',
            status: 'finalizado',
            channel: 'telefone',
            lastMessage: '1 hora atrás',
            unread: false,
            priority: 'baixa',
            agent: 'Carlos Silva',
            createdAt: new Date(Date.now() - 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 60 * 60 * 1000),
            tags: ['cancelamento'],
            description: 'Processo de cancelamento finalizado com sucesso'
        },
        {
            id: 1237,
            client: 'Ana Oliveira',
            subject: 'Integração API não funcionando',
            status: 'pendente',
            channel: 'chat',
            lastMessage: '5 min atrás',
            unread: true,
            priority: 'alta',
            agent: 'Não atribuído',
            createdAt: new Date(Date.now() - 5 * 60 * 1000),
            updatedAt: new Date(Date.now() - 5 * 60 * 1000),
            tags: ['api', 'integração', 'técnico'],
            description: 'Erro 500 ao fazer chamadas para a API'
        },
        {
            id: 1238,
            client: 'Roberto Lima',
            subject: 'Cobrança indevida',
            status: 'atendimento',
            channel: 'email',
            lastMessage: '30 min atrás',
            unread: false,
            priority: 'normal',
            agent: 'Fernanda Souza',
            createdAt: new Date(Date.now() - 30 * 60 * 1000),
            updatedAt: new Date(Date.now() - 30 * 60 * 1000),
            tags: ['financeiro', 'cobrança'],
            description: 'Cliente questiona cobrança no cartão'
        }
    ];
    // Usar dados do banco de dados ou fallback para mock durante migração
    const currentTickets = compatibilityTickets.length > 0 ? compatibilityTickets : mockTickets;
    // Estados principais
    const [filters, setFilters] = useState({
        responsible: 'todos',
        status: 'todos',
        channel: 'all',
        tags: '',
        agent: 'all',
        client: '',
        cnpj: '',
        dateFrom: null,
        dateTo: null
    });
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [ticketCounts, setTicketCounts] = useState({
        nonVisualized: sector.nonVisualized || 0,
        inProgress: sector.inProgress || 0,
        total: sector.total || 0
    });
    // Estados UX
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    const [viewMode, setViewMode] = useState('list');
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [isAutoRefresh, setIsAutoRefresh] = useState(true);
    const [showNotifications, setShowNotifications] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [activeTab, setActiveTab] = useState('todos');
    const [lastUpdate, setLastUpdate] = useState(new Date());
    // Novo estado para controle do filtro colapsável
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isCompactView, setIsCompactView] = useState(false);
    // Auto-refresh de tickets a cada 30 segundos
    useEffect(() => {
        if (!isAutoRefresh)
            return;
        const interval = setInterval(() => {
            refreshTickets();
            setLastUpdate(new Date());
        }, 30000);
        return () => clearInterval(interval);
    }, [isAutoRefresh, refreshTickets]);
    // Computed values
    const filteredAndSortedTickets = useMemo(() => {
        let filtered = currentTickets;
        // Filtro por busca
        if (searchQuery) {
            filtered = filtered.filter(ticket => ticket.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ticket.id.toString().includes(searchQuery));
        }
        // Filtro por status ativo
        if (activeTab !== 'todos') {
            filtered = filtered.filter(ticket => ticket.status === activeTab);
        }
        // Aplicar outros filtros
        if (filters.status !== 'todos') {
            filtered = filtered.filter(ticket => ticket.status === filters.status);
        }
        if (filters.channel && filters.channel !== 'all') {
            filtered = filtered.filter(ticket => ticket.channel === filters.channel);
        }
        if (filters.agent && filters.agent !== 'todos' && filters.agent !== 'all') {
            filtered = filtered.filter(ticket => ticket.agent === filters.agent);
        }
        // Ordenação
        filtered.sort((a, b) => {
            let aValue;
            let bValue;
            switch (sortBy) {
                case 'date':
                    aValue = a.updatedAt;
                    bValue = b.updatedAt;
                    break;
                case 'priority':
                    const priorityOrder = { 'alta': 3, 'normal': 2, 'baixa': 1 };
                    aValue = priorityOrder[a.priority];
                    bValue = priorityOrder[b.priority];
                    break;
                case 'status':
                    aValue = a.status;
                    bValue = b.status;
                    break;
                case 'client':
                    aValue = a.client;
                    bValue = b.client;
                    break;
                default:
                    return 0;
            }
            if (aValue < bValue)
                return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue)
                return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered;
    }, [currentTickets, searchQuery, activeTab, filters, sortBy, sortOrder]);
    // Paginação
    const paginatedTickets = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedTickets.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedTickets, currentPage, itemsPerPage]);
    const totalPages = Math.ceil(filteredAndSortedTickets.length / itemsPerPage);
    // Estatísticas por status
    const statusCounts = useMemo(() => {
        // Debug: Verificar status dos tickets
        console.log('🔍 Debug - Status dos tickets:');
        const statusDistribution = {};
        currentTickets.forEach(ticket => {
            statusDistribution[ticket.status] = (statusDistribution[ticket.status] || 0) + 1;
        });
        console.log('📊 Distribuição de status:', statusDistribution);
        const counts = {
            todos: currentTickets.length,
            pendente: currentTickets.filter(t => t.status === 'pendente').length,
            atendimento: currentTickets.filter(t => t.status === 'atendimento').length,
            finalizado: currentTickets.filter(t => t.status === 'finalizado').length,
            cancelado: currentTickets.filter(t => t.status === 'cancelado').length,
        };
        console.log('🎯 Contadores finais:', counts);
        return counts;
    }, [currentTickets]);
    // Auto-refresh
    useEffect(() => {
        if (!isAutoRefresh)
            return;
        const interval = setInterval(() => {
            refreshTickets();
            setLastUpdate(new Date());
            console.log('Auto-refresh triggered');
        }, 30000); // 30 segundos
        return () => clearInterval(interval);
    }, [isAutoRefresh, refreshTickets]);
    // Handlers
    const handleFilterChange = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setCurrentPage(1); // Reset para primeira página
    }, []);
    // Listener para expansão de chats minimizados
    useEffect(() => {
        const handleExpandChat = (event) => {
            const { ticket } = event.detail;
            if (ticket) {
                setSelectedTicket(ticket);
            }
        };
        window.addEventListener('expandChat', handleExpandChat);
        return () => {
            window.removeEventListener('expandChat', handleExpandChat);
        };
    }, []);
    const handleTicketClick = useCallback((ticket) => {
        console.log('🎯 [TICKET] Ticket clicado:', {
            ticket,
            ticketId: ticket?.id,
            ticketClient: ticket?.client,
            ticketSubject: ticket?.subject,
            ticketKeys: ticket ? Object.keys(ticket) : [],
            ticketStringified: JSON.stringify(ticket, null, 2)
        });
        console.log('🎯 [TICKET] Antes de setSelectedTicket:', {
            currentSelectedTicket: selectedTicket,
            newTicket: ticket,
            currentIsChatOpen: isChatOpen
        });
        setSelectedTicket(ticket);
        setIsChatOpen(true);
        console.log('🎯 [TICKET] Estado após clique (imediato):', {
            selectedTicket: ticket,
            isChatOpen: true
        });
    }, [selectedTicket, isChatOpen]);
    const handleSearchChange = useCallback((value) => {
        setSearchQuery(value);
        setCurrentPage(1);
    }, []);
    const handleSort = useCallback((field) => {
        if (sortBy === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortBy(field);
            setSortOrder('desc');
        }
        setCurrentPage(1);
    }, [sortBy]);
    const handleSelectTicket = useCallback((ticketId) => {
        setSelectedTickets(prev => prev.includes(ticketId)
            ? prev.filter(id => id !== ticketId)
            : [...prev, ticketId]);
    }, []);
    const handleSelectAll = useCallback(() => {
        if (selectedTickets.length === paginatedTickets.length) {
            setSelectedTickets([]);
        }
        else {
            setSelectedTickets(paginatedTickets.map(t => t.id));
        }
    }, [selectedTickets.length, paginatedTickets]);
    const handleBulkAction = useCallback(async (action) => {
        if (selectedTickets.length === 0)
            return;
        setIsLoading(true);
        try {
            if (action === 'finalize') {
                console.log('🎯 Iniciando finalização em massa de tickets:', selectedTickets);
                // Filtrar apenas tickets que não estão finalizados
                const ticketsToFinalize = currentTickets.filter(ticket => selectedTickets.includes(ticket.id) && ticket.status !== 'finalizado');
                console.log('📋 Tickets que serão finalizados:', {
                    total: selectedTickets.length,
                    aFinalizarCount: ticketsToFinalize.length,
                    aFinalizar: ticketsToFinalize.map(t => ({ id: t.id, client: t.client, status: t.status }))
                });
                if (ticketsToFinalize.length === 0) {
                    console.log('⚠️ Nenhum ticket precisa ser finalizado');
                    toast({
                        title: "ℹ️ Nenhuma ação necessária",
                        description: "Todos os tickets selecionados já estão finalizados",
                    });
                    return;
                }
                // Usar updateTicket se disponível para tickets reais
                if (compatibilityTickets.length > 0) {
                    // Finalizar cada ticket no banco de dados
                    const finalizationPromises = ticketsToFinalize.map(async (ticket) => {
                        try {
                            const ticketId = ticket.originalId || ticket.id.toString();
                            console.log(`💾 Finalizando ticket ${ticketId} (${ticket.client})`);
                            await updateTicket(ticketId, {
                                status: 'finalizado',
                                updated_at: new Date().toISOString()
                            });
                            console.log(`✅ Ticket ${ticketId} finalizado com sucesso`);
                            return { success: true, ticketId, client: ticket.client };
                        }
                        catch (error) {
                            console.error(`❌ Erro ao finalizar ticket ${ticket.id}:`, error);
                            return { success: false, ticketId: ticket.id, client: ticket.client, error };
                        }
                    });
                    const results = await Promise.all(finalizationPromises);
                    const successful = results.filter(r => r.success);
                    const failed = results.filter(r => !r.success);
                    console.log('📊 Resultado da finalização em massa:', {
                        total: results.length,
                        successful: successful.length,
                        failed: failed.length
                    });
                    if (successful.length > 0) {
                        // Atualizar tickets localmente também
                        // Note: o updateTicket já deve atualizar a lista automaticamente
                        console.log(`🎉 ${successful.length} tickets finalizados com sucesso!`);
                        toast({
                            title: "✅ Finalização em massa concluída",
                            description: `${successful.length} ticket(s) finalizado(s) com sucesso!`,
                        });
                    }
                    if (failed.length > 0) {
                        console.warn(`⚠️ ${failed.length} tickets falharam na finalização`);
                        toast({
                            title: "⚠️ Alguns tickets falharam",
                            description: `${failed.length} ticket(s) não puderam ser finalizados. Verifique os logs.`,
                            variant: "destructive"
                        });
                    }
                }
                else {
                    // Para dados mock, apenas simular a ação
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    console.log(`🎉 ${ticketsToFinalize.length} tickets finalizados (simulação)`);
                    toast({
                        title: "✅ Finalização em massa (simulação)",
                        description: `${ticketsToFinalize.length} ticket(s) finalizados no modo demonstração`,
                    });
                }
                // Refresh da lista
                await refreshTickets();
            }
            else {
                // Outras ações existentes
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log(`Bulk action ${action} on tickets:`, selectedTickets);
            }
            setSelectedTickets([]);
        }
        catch (error) {
            console.error('Erro na ação em lote:', error);
        }
        finally {
            setIsLoading(false);
        }
    }, [selectedTickets, currentTickets, compatibilityTickets, refreshTickets]);
    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        try {
            await refreshTickets();
            setLastUpdate(new Date());
        }
        finally {
            setIsLoading(false);
        }
    }, [refreshTickets]);
    const handleExport = useCallback(() => {
        console.log('Exportando tickets:', filteredAndSortedTickets);
        // Aqui você implementaria a lógica de export
    }, [filteredAndSortedTickets]);
    const handleCloseChat = useCallback(() => {
        setIsChatOpen(false);
        setSelectedTicket(null);
    }, []);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4", children: [_jsxs("div", { className: "flex flex-col space-y-2", children: [_jsx(TicketHeader, { sector: sector, ticketCounts: ticketCounts, onOpenAddTicket: onOpenAddTicket }), userInfo && (_jsx("div", { className: "flex items-center space-x-2 text-xs", children: canViewAllTickets() ? (_jsxs(Badge, { variant: "outline", className: "text-blue-600 border-blue-200", children: [_jsx(Users, { className: "w-3 h-3 mr-1" }), "Visualizando todos os departamentos (Admin)"] })) : userInfo.department ? (_jsxs(Badge, { variant: "outline", className: "text-green-600 border-green-200", children: [_jsx("div", { className: "w-2 h-2 rounded-full mr-1 bg-green-500" }), "Departamento: ", userInfo.department] })) : (_jsxs(Badge, { variant: "outline", className: "text-amber-600 border-amber-200", children: [_jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }), "Sem departamento atribu\u00EDdo"] })) }))] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { className: "flex items-center text-xs text-gray-500", children: [_jsx(Clock, { className: "w-3 h-3 mr-1" }), "Atualizado ", lastUpdate.toLocaleTimeString()] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setIsAutoRefresh(!isAutoRefresh), className: cn(isAutoRefresh ? "text-green-600 border-green-200" : "text-gray-600"), children: isAutoRefresh ? _jsx(Play, { className: "w-4 h-4" }) : _jsx(Pause, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setShowNotifications(!showNotifications), className: cn(showNotifications ? "text-blue-600 border-blue-200" : "text-gray-600"), children: showNotifications ? _jsx(Bell, { className: "w-4 h-4" }) : _jsx(BellOff, { className: "w-4 h-4" }) })] })] }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center gap-4", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" }), _jsx(Input, { placeholder: "Buscar por cliente, assunto ou ID do ticket...", value: searchQuery, onChange: (e) => handleSearchChange(e.target.value), className: "pl-10" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("div", { className: "flex items-center border rounded-lg", children: [_jsx(Button, { variant: viewMode === 'list' ? 'default' : 'ghost', size: "sm", onClick: () => setViewMode('list'), className: "rounded-r-none", children: _jsx(List, { className: "w-4 h-4" }) }), _jsx(Button, { variant: viewMode === 'grid' ? 'default' : 'ghost', size: "sm", onClick: () => setViewMode('grid'), className: "rounded-l-none", children: _jsx(Grid3X3, { className: "w-4 h-4" }) })] }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleRefresh, disabled: isLoading || dbLoading, children: _jsx(RefreshCw, { className: cn("w-4 h-4", (isLoading || dbLoading) && "animate-spin") }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleExport, children: _jsx(Download, { className: "w-4 h-4" }) })] })] }), selectedTickets.length > 0 && (_jsx("div", { className: "mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex flex-col", children: [_jsxs("span", { className: "text-sm font-medium text-blue-900", children: [selectedTickets.length, " ticket(s) selecionado(s)"] }), _jsx("span", { className: "text-xs text-blue-700", children: (() => {
                                                    const finalizableCount = currentTickets.filter(ticket => selectedTickets.includes(ticket.id) && ticket.status !== 'finalizado').length;
                                                    return finalizableCount > 0
                                                        ? `${finalizableCount} podem ser finalizados`
                                                        : 'Todos já estão finalizados';
                                                })() })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleBulkAction('finalize'), disabled: isLoading, className: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), "Finalizar"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleBulkAction('assign'), disabled: isLoading, children: [_jsx(Users, { className: "w-4 h-4 mr-2" }), "Atribuir"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleBulkAction('status'), disabled: isLoading, children: [_jsx(Clock, { className: "w-4 h-4 mr-2" }), "Status"] }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => setSelectedTickets([]), children: "Cancelar" })] })] }) }))] }) }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-5", children: [_jsxs(TabsTrigger, { value: "todos", className: "relative", children: ["Todos", _jsx(Badge, { variant: "secondary", className: "ml-2 text-xs", children: statusCounts.todos })] }), _jsxs(TabsTrigger, { value: "pendente", className: "relative", children: ["Pendentes", _jsx(Badge, { variant: "secondary", className: "ml-2 text-xs bg-amber-100 text-amber-800", children: statusCounts.pendente })] }), _jsxs(TabsTrigger, { value: "atendimento", children: ["Em Atendimento", _jsx(Badge, { variant: "secondary", className: "ml-2 text-xs bg-blue-100 text-blue-800", children: statusCounts.atendimento })] }), _jsxs(TabsTrigger, { value: "finalizado", children: ["Finalizados", _jsx(Badge, { variant: "secondary", className: "ml-2 text-xs bg-green-100 text-green-800", children: statusCounts.finalizado })] }), _jsxs(TabsTrigger, { value: "cancelado", children: ["Cancelados", _jsx(Badge, { variant: "secondary", className: "ml-2 text-xs bg-red-100 text-red-800", children: statusCounts.cancelado })] })] }), _jsxs(TabsContent, { value: activeTab, className: "space-y-4", children: [_jsx(TicketFilters, { filters: filters, onFilterChange: handleFilterChange }), viewMode === 'list' && (_jsx(Card, { children: _jsx(CardContent, { className: "p-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: handleSelectAll, className: "p-0 h-auto", children: selectedTickets.length === paginatedTickets.length ?
                                                            _jsx(CheckSquare, { className: "w-4 h-4" }) :
                                                            _jsx(Square, { className: "w-4 h-4" }) }), _jsxs("span", { className: "text-sm font-medium", children: [filteredAndSortedTickets.length, " tickets encontrados"] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Ordenar por:" }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleSort('date'), className: cn(sortBy === 'date' && "bg-gray-100"), children: ["Data", sortBy === 'date' && (sortOrder === 'asc' ? _jsx(SortAsc, { className: "w-3 h-3 ml-1" }) : _jsx(SortDesc, { className: "w-3 h-3 ml-1" }))] }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleSort('priority'), className: cn(sortBy === 'priority' && "bg-gray-100"), children: ["Prioridade", sortBy === 'priority' && (sortOrder === 'asc' ? _jsx(SortAsc, { className: "w-3 h-3 ml-1" }) : _jsx(SortDesc, { className: "w-3 h-3 ml-1" }))] }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => handleSort('client'), className: cn(sortBy === 'client' && "bg-gray-100"), children: ["Cliente", sortBy === 'client' && (sortOrder === 'asc' ? _jsx(SortAsc, { className: "w-3 h-3 ml-1" }) : _jsx(SortDesc, { className: "w-3 h-3 ml-1" }))] })] })] }) }) })), isLoading ? (_jsx(Card, { children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx(Loader2, { className: "w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" }), _jsx("p", { className: "text-gray-600", children: "Carregando tickets..." })] }) })) : paginatedTickets.length === 0 ? (_jsx(Card, { children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx("div", { className: "mb-4", children: searchQuery ? (_jsx(Search, { className: "w-12 h-12 mx-auto text-gray-400" })) : (_jsx(Eye, { className: "w-12 h-12 mx-auto text-gray-400" })) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: searchQuery ? 'Nenhum ticket encontrado' : 'Nenhum ticket neste status' }), _jsx("p", { className: "text-gray-600 mb-4", children: searchQuery
                                                ? 'Tente ajustar sua busca ou filtros para encontrar tickets.'
                                                : 'Quando houver tickets neste status, eles aparecerão aqui.' }), searchQuery && (_jsx(Button, { variant: "outline", onClick: () => setSearchQuery(''), children: "Limpar busca" }))] }) })) : (_jsx(TicketsList, { tickets: paginatedTickets, onTicketClick: handleTicketClick, selectedTickets: selectedTickets, onSelectTicket: handleSelectTicket, viewMode: viewMode })), totalPages > 1 && (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-gray-600", children: ["Mostrando ", ((currentPage - 1) * itemsPerPage) + 1, " a ", Math.min(currentPage * itemsPerPage, filteredAndSortedTickets.length), " de ", filteredAndSortedTickets.length, " tickets"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage(prev => Math.max(1, prev - 1)), disabled: currentPage === 1, children: "Anterior" }), _jsxs("div", { className: "flex items-center space-x-1", children: [Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                                                                if (page > totalPages)
                                                                    return null;
                                                                return (_jsx(Button, { variant: currentPage === page ? "default" : "outline", size: "sm", onClick: () => setCurrentPage(page), className: "w-8 h-8 p-0", children: page }, page));
                                                            }), totalPages > 5 && currentPage < totalPages - 2 && (_jsxs(_Fragment, { children: [_jsx("span", { className: "text-gray-400", children: "..." }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage(totalPages), className: "w-8 h-8 p-0", children: totalPages })] }))] }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentPage(prev => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, children: "Pr\u00F3ximo" })] })] }) }) }))] })] }), selectedTicket && (_jsx(UnifiedChatModalWrapper, { ticket: selectedTicket, isOpen: isChatOpen, onOpenChange: setIsChatOpen }))] }));
};
export default TicketManagement;
