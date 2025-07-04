import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChartCard } from './dashboard/ChartCard';
import { BarChart3, Users, MessageSquare, Clock, CheckCircle, Phone, Mail, Activity, RefreshCw, Download, Star, Zap, ArrowUp, ArrowDown, Plus, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTicketsDB } from '@/hooks/useTicketsDB';
import { useDepartments } from '@/hooks/useDepartments';
export const Dashboard = ({ onViewChange, onOpenAddTicket } = { onViewChange: () => { }, onOpenAddTicket: () => { } }) => {
    const { user } = useAuth();
    const { tickets, loading: ticketsLoading } = useTicketsDB();
    const { departments } = useDepartments();
    const [timeRange, setTimeRange] = useState('7d'); // 24h, 7d, 30d, 90d
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Estados para métricas calculadas
    const [metrics, setMetrics] = useState({
        totalTickets: 0,
        pendingTickets: 0,
        resolvedTickets: 0,
        averageResponseTime: 0,
        customerSatisfaction: 0,
        activeAgents: 0,
        totalCustomers: 0,
        conversionRate: 0
    });
    // Calcular métricas baseadas nos dados
    useEffect(() => {
        if (tickets.length > 0) {
            const now = new Date();
            const timeRangeMs = {
                '24h': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000,
                '90d': 90 * 24 * 60 * 60 * 1000
            };
            const cutoffDate = new Date(now.getTime() - timeRangeMs[timeRange]);
            const filteredTickets = tickets.filter(ticket => new Date(ticket.created_at) >= cutoffDate);
            const pending = filteredTickets.filter(t => t.status === 'pendente').length;
            const resolved = filteredTickets.filter(t => t.status === 'finalizado').length;
            const inProgress = filteredTickets.filter(t => t.status === 'atendimento').length;
            // Simular algumas métricas (em produção seria calculado do banco)
            setMetrics({
                totalTickets: filteredTickets.length,
                pendingTickets: pending,
                resolvedTickets: resolved,
                averageResponseTime: Math.floor(Math.random() * 180) + 60, // 60-240 min
                customerSatisfaction: 4.2 + Math.random() * 0.6, // 4.2-4.8
                activeAgents: departments.filter(d => d.isActive).length * 3, // Simular agentes
                totalCustomers: Math.floor(filteredTickets.length * 1.5), // Estimativa
                conversionRate: 65 + Math.random() * 20 // 65-85%
            });
        }
    }, [tickets, timeRange, departments]);
    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simular refresh
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsRefreshing(false);
    };
    const timeRangeOptions = [
        { value: '24h', label: 'Últimas 24h' },
        { value: '7d', label: 'Últimos 7 dias' },
        { value: '30d', label: 'Últimos 30 dias' },
        { value: '90d', label: 'Últimos 90 dias' }
    ];
    const getMetricTrend = (value) => {
        const trend = Math.random() > 0.5 ? 'up' : 'down';
        const percentage = Math.floor(Math.random() * 20) + 1;
        return { trend, percentage };
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Dashboard" }), _jsxs("p", { className: "text-gray-600 mt-1", children: ["Vis\u00E3o geral das opera\u00E7\u00F5es do CRM \u2022 ", user?.email] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex items-center bg-white rounded-lg border border-gray-200 p-1", children: timeRangeOptions.map((option) => (_jsx(Button, { variant: timeRange === option.value ? "default" : "ghost", size: "sm", onClick: () => setTimeRange(option.value), className: "text-xs", children: option.label }, option.value))) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleRefresh, disabled: isRefreshing, className: "flex items-center gap-2", children: [_jsx(RefreshCw, { className: cn("w-4 h-4", isRefreshing && "animate-spin") }), "Atualizar"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "flex items-center gap-2", children: [_jsx(Download, { className: "w-4 h-4" }), "Exportar"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs(Card, { className: "relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-medium text-blue-700", children: "Total de Tickets" }), _jsx("div", { className: "p-2 bg-blue-500 rounded-lg", children: _jsx(MessageSquare, { className: "w-4 h-4 text-white" }) })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-2xl font-bold text-blue-900", children: metrics.totalTickets.toLocaleString() }), _jsxs("div", { className: "flex items-center text-sm", children: [getMetricTrend(metrics.totalTickets).trend === 'up' ? (_jsx(ArrowUp, { className: "w-3 h-3 text-green-600 mr-1" })) : (_jsx(ArrowDown, { className: "w-3 h-3 text-red-600 mr-1" })), _jsxs("span", { className: cn("font-medium", getMetricTrend(metrics.totalTickets).trend === 'up' ? "text-green-600" : "text-red-600"), children: [getMetricTrend(metrics.totalTickets).percentage, "%"] }), _jsx("span", { className: "text-gray-600 ml-1", children: "vs per\u00EDodo anterior" })] })] }) })] }), _jsxs(Card, { className: "relative overflow-hidden bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-medium text-amber-700", children: "Tickets Pendentes" }), _jsx("div", { className: "p-2 bg-amber-500 rounded-lg", children: _jsx(Clock, { className: "w-4 h-4 text-white" }) })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-2xl font-bold text-amber-900", children: metrics.pendingTickets }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Badge, { variant: "secondary", className: "bg-amber-200 text-amber-800", children: "Urgente" }), _jsxs("span", { className: "text-xs text-gray-600", children: [metrics.totalTickets > 0 ? Math.round((metrics.pendingTickets / metrics.totalTickets) * 100) : 0, "% do total"] })] })] }) })] }), _jsxs(Card, { className: "relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-medium text-green-700", children: "Tickets Resolvidos" }), _jsx("div", { className: "p-2 bg-green-500 rounded-lg", children: _jsx(CheckCircle, { className: "w-4 h-4 text-white" }) })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-2xl font-bold text-green-900", children: metrics.resolvedTickets }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-xs text-gray-600", children: [_jsx("span", { children: "Taxa de Resolu\u00E7\u00E3o" }), _jsxs("span", { children: [metrics.totalTickets > 0 ? Math.round((metrics.resolvedTickets / metrics.totalTickets) * 100) : 0, "%"] })] }), _jsx(Progress, { value: metrics.totalTickets > 0 ? (metrics.resolvedTickets / metrics.totalTickets) * 100 : 0, className: "h-2" })] })] }) })] }), _jsxs(Card, { className: "relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-medium text-purple-700", children: "Satisfa\u00E7\u00E3o do Cliente" }), _jsx("div", { className: "p-2 bg-purple-500 rounded-lg", children: _jsx(Star, { className: "w-4 h-4 text-white" }) })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-2xl font-bold text-purple-900", children: metrics.customerSatisfaction.toFixed(1) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex", children: [1, 2, 3, 4, 5].map((star) => (_jsx(Star, { className: cn("w-3 h-3", star <= Math.floor(metrics.customerSatisfaction)
                                                            ? "text-yellow-400 fill-current"
                                                            : "text-gray-300") }, star))) }), _jsx("span", { className: "text-xs text-gray-600", children: "Excelente" })] })] }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx(Activity, { className: "w-5 h-5 text-blue-600" }), "Tempo M\u00E9dio de Resposta"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-3xl font-bold text-gray-900 mb-2", children: [Math.floor(metrics.averageResponseTime / 60), "h ", metrics.averageResponseTime % 60, "m"] }), _jsx("p", { className: "text-sm text-gray-600", children: "Tempo m\u00E9dio para primeira resposta" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Excelente (< 1h)" }), _jsx("span", { className: "text-sm font-medium", children: "32%" })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Bom (1-4h)" }), _jsx("span", { className: "text-sm font-medium", children: "48%" })] }), _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Regular (> 4h)" }), _jsx("span", { className: "text-sm font-medium", children: "20%" })] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5 text-green-600" }), "Equipe Ativa"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: metrics.activeAgents }), _jsx("p", { className: "text-xs text-gray-600", children: "Agentes Online" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: departments.filter(d => d.isActive).length }), _jsx("p", { className: "text-xs text-gray-600", children: "Departamentos" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), _jsx("span", { className: "text-sm", children: "Online" })] }), _jsx("span", { className: "text-sm font-medium", children: Math.floor(metrics.activeAgents * 0.7) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-yellow-500 rounded-full" }), _jsx("span", { className: "text-sm", children: "Ocupado" })] }), _jsx("span", { className: "text-sm font-medium", children: Math.floor(metrics.activeAgents * 0.2) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-gray-400 rounded-full" }), _jsx("span", { className: "text-sm", children: "Offline" })] }), _jsx("span", { className: "text-sm font-medium", children: Math.floor(metrics.activeAgents * 0.1) })] })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-5 h-5 text-purple-600" }), "Canais de Atendimento"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-4", children: [
                                        { name: 'Chat Online', value: 45, color: 'bg-green-500', icon: Phone },
                                        { name: 'Email', value: 25, color: 'bg-blue-500', icon: Mail },
                                        { name: 'Chat Web', value: 20, color: 'bg-purple-500', icon: MessageSquare },
                                        { name: 'Telefone', value: 10, color: 'bg-orange-500', icon: Phone }
                                    ].map((channel) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(channel.icon, { className: "w-4 h-4 text-gray-600" }), _jsx("span", { className: "text-sm font-medium", children: channel.name })] }), _jsxs("span", { className: "text-sm text-gray-600", children: [channel.value, "%"] })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: cn("h-2 rounded-full", channel.color), style: { width: `${channel.value}%` } }) })] }, channel.name))) }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(ChartCard, { title: "Tickets por Status", type: "bar", showTrend: true, trendValue: 15, trendDirection: "up", data: [
                            { label: 'Pendentes', value: metrics.pendingTickets, color: 'bg-amber-500' },
                            { label: 'Em Atendimento', value: Math.floor(metrics.totalTickets * 0.4), color: 'bg-blue-500' },
                            { label: 'Resolvidos', value: metrics.resolvedTickets, color: 'bg-green-500' },
                            { label: 'Cancelados', value: Math.floor(metrics.totalTickets * 0.05), color: 'bg-red-500' }
                        ] }), _jsx(ChartCard, { title: "Performance dos Agentes", type: "bar", showTrend: true, trendValue: 8, trendDirection: "up", data: [
                            { label: 'Ana Costa', value: 42, color: 'bg-green-500' },
                            { label: 'Carlos Silva', value: 38, color: 'bg-blue-500' },
                            { label: 'Maria Santos', value: 35, color: 'bg-purple-500' },
                            { label: 'João Oliveira', value: 31, color: 'bg-orange-500' }
                        ] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx(ChartCard, { title: "Tend\u00EAncia Semanal", type: "line", showTrend: true, trendValue: 12, trendDirection: "up", data: [
                            { label: 'Seg', value: 25, color: 'bg-blue-500' },
                            { label: 'Ter', value: 32, color: 'bg-blue-500' },
                            { label: 'Qua', value: 28, color: 'bg-blue-500' },
                            { label: 'Qui', value: 45, color: 'bg-blue-500' },
                            { label: 'Sex', value: 38, color: 'bg-blue-500' },
                            { label: 'Sáb', value: 18, color: 'bg-blue-500' },
                            { label: 'Dom', value: 12, color: 'bg-blue-500' }
                        ] }), _jsx(ChartCard, { title: "Distribui\u00E7\u00E3o por Prioridade", type: "pie", data: [
                            { label: 'Alta', value: 15, color: 'bg-red-500' },
                            { label: 'Normal', value: 65, color: 'bg-blue-500' },
                            { label: 'Baixa', value: 20, color: 'bg-green-500' }
                        ] }), _jsx(ChartCard, { title: "Satisfa\u00E7\u00E3o por Departamento", type: "bar", showTrend: true, trendValue: 5, trendDirection: "up", data: [
                            { label: 'Vendas', value: 4.8, color: 'bg-green-500' },
                            { label: 'Suporte', value: 4.6, color: 'bg-blue-500' },
                            { label: 'Financeiro', value: 4.4, color: 'bg-purple-500' },
                            { label: 'Técnico', value: 4.2, color: 'bg-orange-500' }
                        ] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg font-semibold flex items-center gap-2", children: [_jsx(Zap, { className: "w-5 h-5 text-yellow-600" }), "A\u00E7\u00F5es R\u00E1pidas"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Button, { variant: "outline", className: "h-auto p-4 flex-col gap-2", onClick: () => onOpenAddTicket?.(), children: [_jsx(Plus, { className: "w-6 h-6 text-blue-600" }), _jsx("span", { className: "font-medium", children: "Novo Ticket" }), _jsx("span", { className: "text-xs text-gray-600", children: "Criar atendimento" })] }), _jsxs(Button, { variant: "outline", className: "h-auto p-4 flex-col gap-2", onClick: () => onViewChange?.('clientes'), children: [_jsx(Users, { className: "w-6 h-6 text-green-600" }), _jsx("span", { className: "font-medium", children: "Clientes" }), _jsx("span", { className: "text-xs text-gray-600", children: "Gerenciar base" })] }), _jsxs(Button, { variant: "outline", className: "h-auto p-4 flex-col gap-2", onClick: () => onViewChange?.('admin'), children: [_jsx(BarChart3, { className: "w-6 h-6 text-purple-600" }), _jsx("span", { className: "font-medium", children: "Relat\u00F3rios" }), _jsx("span", { className: "text-xs text-gray-600", children: "An\u00E1lises detalhadas" })] }), _jsxs(Button, { variant: "outline", className: "h-auto p-4 flex-col gap-2", onClick: () => onViewChange?.('admin'), children: [_jsx(Settings, { className: "w-6 h-6 text-gray-600" }), _jsx("span", { className: "font-medium", children: "Configura\u00E7\u00F5es" }), _jsx("span", { className: "text-xs text-gray-600", children: "Sistema" })] })] }) })] })] }));
};
