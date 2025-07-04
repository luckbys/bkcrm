import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Building2, Plus, Search, ChevronLeft, ChevronRight, MoreVertical, Filter, Star, Users, MessageSquare, CheckCircle, AlertCircle, Clock, Settings, Edit, Trash2, Headphones, Phone, DollarSign, UserCheck, Megaphone, Shield, Zap, Heart, Briefcase, Home, Globe, Mail, Calendar, FileText, Database, Server, Wifi, Camera, ShoppingCart, Truck, CreditCard, Lock, Key, Eye, Archive, Flag, Bookmark, ThumbsUp, ThumbsDown, Smile, Frown, Meh, Target, Smartphone } from 'lucide-react';
import { styles as sidebarStyles } from './Sidebar.styles';
import { useDepartments } from '../../hooks/useDepartments';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { SidebarLoading } from '../ui/loading-spinner';
import { cn } from '../../lib/utils';
import DepartmentCreateModal from './DepartmentCreateModal';
import WhatsAppConfigModal from './modals/WhatsAppConfigModal';
// Função para determinar cor baseada na prioridade
const getPriorityColor = (priority) => {
    switch (priority) {
        case 'high': return 'red';
        case 'medium': return 'yellow';
        case 'low': return 'green';
        default: return 'gray';
    }
};
// Função para determinar cor baseada no status dos tickets
const getStatusColor = (unreadTickets, totalTickets) => {
    if (totalTickets === 0)
        return 'gray';
    if (unreadTickets === 0)
        return 'green';
    if (unreadTickets >= totalTickets * 0.7)
        return 'red';
    return 'yellow';
};
// Mapeamento de ícones por nome
const iconMap = {
    Building2,
    Users,
    Headphones,
    Phone,
    DollarSign,
    UserCheck,
    Megaphone,
    Settings,
    Shield,
    Zap,
    Heart,
    Star,
    Briefcase,
    Home,
    Globe,
    Mail,
    Calendar,
    FileText,
    Database,
    Server,
    Wifi,
    Camera,
    ShoppingCart,
    Truck,
    CreditCard,
    Lock,
    Key,
    Eye,
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Archive,
    Flag,
    Bookmark,
    ThumbsUp,
    ThumbsDown,
    Smile,
    Frown,
    Meh,
    MessageSquare,
    Target,
    AlertCircle,
    Clock,
    CheckCircle,
    Smartphone
};
// Função para renderizar o ícone do departamento
const renderDepartmentIcon = (iconName) => {
    const IconComponent = iconName ? iconMap[iconName] : Building2;
    return IconComponent ? _jsx(IconComponent, { className: "w-4 h-4" }) : _jsx(Building2, { className: "w-4 h-4" });
};
export const Sidebar = ({ onDepartmentSelect, selectedDepartmentId, className = '', onCollapsedChange }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const { departments, loading, error, addDepartment, updateDepartment, archiveDepartment, refresh } = useDepartments();
    // Debug: monitorar estado do modal WhatsApp apenas quando relevante
    useEffect(() => {
        if (showWhatsAppModal && selectedDepartment) {
            console.log('🔍 [Sidebar] Modal WhatsApp aberto:', {
                departmentName: selectedDepartment?.name,
                departmentId: selectedDepartment?.id
            });
        }
    }, [showWhatsAppModal, selectedDepartment]);
    // Filtrar departamentos baseado na busca e filtros
    const filteredDepartments = useMemo(() => {
        let filtered = departments;
        // Filtro de busca
        if (searchTerm) {
            filtered = filtered.filter(dept => dept.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        // Filtro de prioridade
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(dept => dept.priority === priorityFilter);
        }
        // Filtro de não lidos
        if (showUnreadOnly) {
            filtered = filtered.filter(dept => dept.unreadTickets > 0);
        }
        // Ordenar por prioridade e tickets não lidos
        const sorted = filtered.sort((a, b) => {
            // Primeiro por prioridade (high > medium > low)
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            // Depois por tickets não lidos
            return b.unreadTickets - a.unreadTickets;
        });
        console.log('🔍 [Sidebar] Departamentos filtrados:', sorted.length, sorted);
        return sorted;
    }, [departments, searchTerm, priorityFilter, showUnreadOnly]);
    // Estatísticas gerais
    const totalStats = useMemo(() => {
        return departments.reduce((acc, dept) => ({
            totalDepartments: acc.totalDepartments + 1,
            totalTickets: acc.totalTickets + dept.totalTickets,
            unreadTickets: acc.unreadTickets + dept.unreadTickets,
            resolvedTickets: acc.resolvedTickets + dept.resolvedTickets
        }), { totalDepartments: 0, totalTickets: 0, unreadTickets: 0, resolvedTickets: 0 });
    }, [departments]);
    const handleDepartmentClick = (department) => {
        console.log('🎯 [Sidebar] Departamento clicado:', department);
        console.log('🎯 [Sidebar] onDepartmentSelect está definido?', typeof onDepartmentSelect);
        if (onDepartmentSelect) {
            console.log('🎯 [Sidebar] Chamando onDepartmentSelect...');
            onDepartmentSelect(department);
        }
        else {
            console.warn('⚠️ [Sidebar] onDepartmentSelect não está definido!');
        }
    };
    const handleAddDepartment = () => {
        setShowCreateModal(true);
    };
    const handleCreateDepartment = async (name, priority, description, icon) => {
        setIsCreating(true);
        try {
            await addDepartment(name, priority, description, icon);
            setShowCreateModal(false);
        }
        catch (error) {
            console.error('Erro ao criar departamento:', error);
            throw error;
        }
        finally {
            setIsCreating(false);
        }
    };
    const handleEditDepartment = async (name, priority, description, icon) => {
        if (!editingDepartment)
            return;
        setIsEditing(true);
        try {
            await updateDepartment(editingDepartment.id, {
                name,
                priority,
                ...(description && { description }),
                ...(icon && { icon })
            });
            // Refresh departments list
            await refresh();
            // Sucesso - fechar modal e limpar estado
            setShowEditModal(false);
            setEditingDepartment(null);
            // Feedback visual de sucesso
            console.log('✅ Departamento editado com sucesso:', name);
        }
        catch (error) {
            console.error('❌ Erro ao editar departamento:', error);
            // Em caso de erro, manter o modal aberto para o usuário tentar novamente
            // Mas limpar o estado de loading
            setIsEditing(false);
            // Mostrar erro amigável ao usuário
            alert(`Erro ao editar departamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            // Não fazer throw do erro para evitar que o modal trave
            return;
        }
        finally {
            setIsEditing(false);
        }
    };
    const handleDepartmentAction = async (action, department) => {
        console.log('🔍 [Sidebar] handleDepartmentAction chamado:', { action, department: department.name });
        try {
            switch (action) {
                case 'edit':
                    console.log('🔍 [Sidebar] Abrindo modal de edição');
                    setEditingDepartment(department);
                    setShowEditModal(true);
                    break;
                case 'whatsapp':
                    console.log('🔍 [Sidebar] Abrindo modal WhatsApp', { departmentId: department.id, showWhatsAppModal });
                    setSelectedDepartment(department);
                    setShowWhatsAppModal(true);
                    console.log('🔍 [Sidebar] Estado após setShowWhatsAppModal:', { showWhatsAppModal: true, selectedDepartment: department.name });
                    break;
                case 'delete':
                    if (confirm(`Tem certeza que deseja remover o departamento "${department.name}"?\n\nEsta ação não pode ser desfeita.`)) {
                        await archiveDepartment(department.id);
                    }
                    break;
                case 'priority-high':
                    await updateDepartment(department.id, { priority: 'high' });
                    break;
                case 'priority-medium':
                    await updateDepartment(department.id, { priority: 'medium' });
                    break;
                case 'priority-low':
                    await updateDepartment(department.id, { priority: 'low' });
                    break;
            }
        }
        catch (error) {
            console.error('Erro na ação do departamento:', error);
        }
    };
    const toggleCollapse = () => {
        const newCollapsed = !collapsed;
        setCollapsed(newCollapsed);
        onCollapsedChange?.(newCollapsed);
    };
    if (loading) {
        return (_jsx("div", { className: sidebarStyles.container({ collapsed: true }), children: _jsx(SidebarLoading, { text: "Carregando departamentos...", variant: "primary" }) }));
    }
    if (error) {
        return (_jsx("div", { className: sidebarStyles.container({ collapsed: true }), children: _jsxs("div", { className: sidebarStyles.errorState(), children: [_jsx(AlertCircle, { className: "w-5 h-5 mb-2" }), _jsx("span", { className: "text-xs text-center", children: "Erro ao carregar departamentos" }), _jsx(Button, { size: "sm", variant: "outline", onClick: refresh, className: "mt-2", children: "Tentar novamente" })] }) }));
    }
    return (_jsx(TooltipProvider, { children: _jsxs("div", { className: sidebarStyles.container({ collapsed }), children: [_jsx("div", { className: sidebarStyles.header({ collapsed }), children: !collapsed ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center", children: _jsx(Building2, { className: "w-3 h-3 text-white" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h1", { className: "text-sm font-bold text-gray-800 dark:text-gray-200", children: "Departamentos" }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: [totalStats.totalDepartments, " setores \u2022 ", totalStats.unreadTickets, " n\u00E3o lidos"] })] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx(Button, { size: "sm", variant: "ghost", onClick: handleAddDepartment, className: "w-6 h-6 p-0", children: _jsx(Plus, { className: "w-3 h-3" }) }) }), _jsx(TooltipContent, { children: "Adicionar departamento" })] }), _jsx("button", { onClick: toggleCollapse, className: "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50", children: _jsx(ChevronLeft, { className: "w-4 h-4 text-gray-600 dark:text-gray-400" }) })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center relative", children: [_jsx(Building2, { className: "w-3 h-3 text-white" }), totalStats.unreadTickets > 0 && (_jsx("div", { className: "absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center", children: _jsx("span", { className: "text-[8px] text-white font-bold", children: totalStats.unreadTickets > 9 ? '9+' : totalStats.unreadTickets }) }))] }), _jsx("button", { onClick: toggleCollapse, className: "w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50", children: _jsx(ChevronRight, { className: "w-4 h-4 text-gray-600 dark:text-gray-400" }) })] })) }), !collapsed && (_jsxs("div", { className: sidebarStyles.searchArea({ collapsed: false }), children: [_jsxs("div", { className: "flex items-center gap-2 w-full bg-gray-100/80 dark:bg-gray-800/80 rounded-lg px-3 py-2 border border-gray-200/50 dark:border-gray-700/50 mb-2", children: [_jsx(Search, { className: "w-4 h-4 text-gray-500 dark:text-gray-400" }), _jsx(Input, { type: "text", placeholder: "Buscar departamentos...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 p-0 h-auto" })] }), _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-xs", children: [_jsx(Filter, { className: "w-3 h-3 mr-1" }), priorityFilter === 'all' ? 'Todos' : priorityFilter] }) }), _jsxs(DropdownMenuContent, { align: "start", children: [_jsx(DropdownMenuItem, { onClick: () => setPriorityFilter('all'), children: "Todas as prioridades" }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => setPriorityFilter('high'), children: [_jsx(AlertCircle, { className: "w-3 h-3 mr-2 text-red-500" }), "Alta prioridade"] }), _jsxs(DropdownMenuItem, { onClick: () => setPriorityFilter('medium'), children: [_jsx(Clock, { className: "w-3 h-3 mr-2 text-yellow-500" }), "M\u00E9dia prioridade"] }), _jsxs(DropdownMenuItem, { onClick: () => setPriorityFilter('low'), children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-2 text-green-500" }), "Baixa prioridade"] })] })] }), _jsx(Button, { size: "sm", variant: showUnreadOnly ? "default" : "outline", onClick: () => setShowUnreadOnly(!showUnreadOnly), className: "h-7 text-xs", children: "N\u00E3o lidos" })] })] })), _jsx("div", { className: "flex-1 overflow-y-auto p-2", children: filteredDepartments.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400", children: [_jsx(Building2, { className: "w-8 h-8 mb-2 opacity-50" }), _jsx("span", { className: "text-xs text-center", children: searchTerm || priorityFilter !== 'all' || showUnreadOnly
                                    ? 'Nenhum departamento encontrado'
                                    : 'Nenhum departamento criado' })] })) : (filteredDepartments.map((department) => {
                        const isSelected = selectedDepartmentId === department.id;
                        const statusColor = getStatusColor(department.unreadTickets, department.totalTickets);
                        const priorityColor = getPriorityColor(department.priority);
                        if (collapsed) {
                            return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { className: sidebarStyles.departmentCard({
                                                collapsed: true,
                                                active: isSelected
                                            }), onClick: () => handleDepartmentClick(department), children: _jsxs("div", { className: cn(sidebarStyles.departmentIcon({ type: statusColor }), "relative"), children: [renderDepartmentIcon(department.icon), department.unreadTickets > 0 && (_jsx("div", { className: sidebarStyles.countBadge({
                                                            variant: statusColor === 'red' ? 'danger' :
                                                                statusColor === 'yellow' ? 'warning' : 'primary'
                                                        }), children: department.unreadTickets > 99 ? '99+' : department.unreadTickets })), _jsx("div", { className: cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-900", priorityColor === 'red' && "bg-red-500", priorityColor === 'yellow' && "bg-yellow-500", priorityColor === 'green' && "bg-green-500", priorityColor === 'gray' && "bg-gray-500") })] }) }) }), _jsx(TooltipContent, { side: "right", className: "z-50", children: _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "font-medium", children: department.name }), _jsx(Badge, { variant: "outline", className: "text-xs", children: department.priority })] }), _jsxs("div", { className: "text-xs text-gray-500 space-y-0.5", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(MessageSquare, { className: "w-3 h-3" }), department.totalTickets, " tickets total"] }), department.unreadTickets > 0 && (_jsxs("div", { className: "flex items-center gap-1 text-red-500", children: [_jsx(AlertCircle, { className: "w-3 h-3" }), department.unreadTickets, " n\u00E3o lidos"] })), _jsxs("div", { className: "flex items-center gap-1 text-green-500", children: [_jsx(CheckCircle, { className: "w-3 h-3" }), department.resolvedTickets, " resolvidos"] })] })] }) })] }, department.id));
                        }
                        return (_jsxs("div", { className: sidebarStyles.departmentCard({
                                collapsed: false,
                                active: isSelected
                            }), onClick: () => handleDepartmentClick(department), children: [_jsxs("div", { className: cn(sidebarStyles.departmentIcon({ type: statusColor }), "relative"), children: [renderDepartmentIcon(department.icon), _jsx("div", { className: cn("absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white dark:border-gray-900", priorityColor === 'red' && "bg-red-500", priorityColor === 'yellow' && "bg-yellow-500", priorityColor === 'green' && "bg-green-500", priorityColor === 'gray' && "bg-gray-500") })] }), _jsxs("div", { className: "flex-1 min-w-0 ml-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 truncate", children: department.name }), _jsxs("div", { className: "flex items-center gap-1", children: [department.priority === 'high' && (_jsx(Star, { className: "w-3 h-3 text-red-500" })), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { size: "sm", variant: "ghost", className: "w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity", onClick: (e) => e.stopPropagation(), children: _jsx(MoreVertical, { className: "w-3 h-3" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsxs(DropdownMenuItem, { onClick: () => handleDepartmentAction('edit', department), children: [_jsx(Edit, { className: "w-3 h-3 mr-2 text-blue-500" }), "Editar departamento"] }), _jsxs(DropdownMenuItem, { onClick: () => handleDepartmentAction('whatsapp', department), children: [_jsx(Smartphone, { className: "w-3 h-3 mr-2 text-green-500" }), "Configurar WhatsApp"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => handleDepartmentAction('priority-high', department), children: [_jsx(AlertCircle, { className: "w-3 h-3 mr-2 text-red-500" }), "Prioridade alta"] }), _jsxs(DropdownMenuItem, { onClick: () => handleDepartmentAction('priority-medium', department), children: [_jsx(Clock, { className: "w-3 h-3 mr-2 text-yellow-500" }), "Prioridade m\u00E9dia"] }), _jsxs(DropdownMenuItem, { onClick: () => handleDepartmentAction('priority-low', department), children: [_jsx(CheckCircle, { className: "w-3 h-3 mr-2 text-green-500" }), "Prioridade baixa"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { onClick: () => handleDepartmentAction('delete', department), className: "text-red-600", children: [_jsx(Trash2, { className: "w-3 h-3 mr-2" }), "Remover departamento"] })] })] })] })] }), _jsxs("div", { className: "flex items-center gap-3 mt-1", children: [_jsxs("div", { className: "flex items-center gap-1 text-xs text-gray-500", children: [_jsx(MessageSquare, { className: "w-3 h-3" }), department.totalTickets] }), department.unreadTickets > 0 && (_jsxs(Badge, { variant: "destructive", className: "text-xs h-4 px-1", children: [department.unreadTickets, " novos"] })), _jsxs("div", { className: "flex items-center gap-1 text-xs text-green-600", children: [_jsx(CheckCircle, { className: "w-3 h-3" }), department.resolvedTickets] })] })] })] }, department.id));
                    })) }), _jsx("div", { className: "p-3 border-t border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-gray-50/30 to-white/30 dark:bg-gradient-to-r dark:from-gray-800/30 dark:to-gray-900/30 rounded-b-2xl", children: !collapsed ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-gray-500 dark:text-gray-400", children: "Total" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-gray-600 dark:text-gray-300", children: [totalStats.totalTickets, " tickets"] }), totalStats.unreadTickets > 0 && (_jsx(Badge, { variant: "destructive", className: "text-xs h-4 px-1", children: totalStats.unreadTickets }))] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1", children: _jsx("div", { className: "bg-green-500 h-1 rounded-full transition-all duration-300", style: {
                                                width: `${totalStats.totalTickets > 0 ? (totalStats.resolvedTickets / totalStats.totalTickets) * 100 : 0}%`
                                            } }) }), _jsxs("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: [totalStats.totalTickets > 0 ? Math.round((totalStats.resolvedTickets / totalStats.totalTickets) * 100) : 0, "%"] })] })] })) : (_jsx("div", { className: "flex justify-center", children: _jsx("div", { className: cn("w-2 h-2 rounded-full", totalStats.unreadTickets > 0 ? "bg-red-500" : "bg-green-500") }) })) }), _jsx(DepartmentCreateModal, { isOpen: showCreateModal, onClose: () => setShowCreateModal(false), onSubmit: handleCreateDepartment, isLoading: isCreating }), _jsx(DepartmentCreateModal, { isOpen: showEditModal, onClose: () => {
                        setShowEditModal(false);
                        setEditingDepartment(null);
                    }, onSubmit: handleEditDepartment, isLoading: isEditing, editMode: true, initialData: editingDepartment ? {
                        name: editingDepartment.name,
                        priority: editingDepartment.priority,
                        description: editingDepartment.description || ''
                    } : undefined }), selectedDepartment && (_jsx(WhatsAppConfigModal, { isOpen: showWhatsAppModal, onClose: () => {
                        console.log('🔍 [Sidebar] Fechando modal WhatsApp');
                        setShowWhatsAppModal(false);
                        setSelectedDepartment(null);
                    }, departmentId: selectedDepartment.id, departmentName: selectedDepartment.name }))] }) }));
};
export default Sidebar;
