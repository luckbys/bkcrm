import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Building2, MessageSquare, AlertCircle, CheckCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
export const DepartmentStatsCard = ({ departments, className }) => {
    // Calcular estatísticas gerais
    const stats = React.useMemo(() => {
        const total = departments.reduce((acc, dept) => ({
            departments: acc.departments + 1,
            totalTickets: acc.totalTickets + dept.totalTickets,
            unreadTickets: acc.unreadTickets + dept.unreadTickets,
            resolvedTickets: acc.resolvedTickets + dept.resolvedTickets,
            highPriority: acc.highPriority + (dept.priority === 'high' ? 1 : 0),
            mediumPriority: acc.mediumPriority + (dept.priority === 'medium' ? 1 : 0),
            lowPriority: acc.lowPriority + (dept.priority === 'low' ? 1 : 0)
        }), {
            departments: 0,
            totalTickets: 0,
            unreadTickets: 0,
            resolvedTickets: 0,
            highPriority: 0,
            mediumPriority: 0,
            lowPriority: 0
        });
        const resolutionRate = total.totalTickets > 0 ? (total.resolvedTickets / total.totalTickets) * 100 : 0;
        const pendingTickets = total.totalTickets - total.resolvedTickets;
        const urgentDepartments = departments.filter(d => d.priority === 'high' && d.unreadTickets > 0).length;
        return {
            ...total,
            resolutionRate,
            pendingTickets,
            urgentDepartments
        };
    }, [departments]);
    // Top 3 departamentos por tickets não lidos
    const topDepartments = React.useMemo(() => {
        return departments
            .filter(d => d.unreadTickets > 0)
            .sort((a, b) => b.unreadTickets - a.unreadTickets)
            .slice(0, 3);
    }, [departments]);
    const getHealthStatus = () => {
        if (stats.unreadTickets === 0)
            return { color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Excelente' };
        if (stats.unreadTickets <= stats.totalTickets * 0.1)
            return { color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', label: 'Bom' };
        if (stats.unreadTickets <= stats.totalTickets * 0.3)
            return { color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', label: 'Atenção' };
        return { color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Crítico' };
    };
    const healthStatus = getHealthStatus();
    return (_jsxs(Card, { className: cn("w-full", className), children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-base font-semibold flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-5 h-5 text-blue-500" }), "Vis\u00E3o Geral dos Departamentos"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Building2, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Departamentos" })] }), _jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-gray-100", children: stats.departments })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Tickets Total" })] }), _jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-gray-100", children: stats.totalTickets })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-red-500" }), _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "N\u00E3o Lidos" })] }), _jsx("p", { className: "text-xl font-bold text-red-600", children: stats.unreadTickets })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-500" }), _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Resolvidos" })] }), _jsx("p", { className: "text-xl font-bold text-green-600", children: stats.resolvedTickets })] })] }), _jsxs("div", { className: cn("p-3 rounded-lg border", healthStatus.bg), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Status Geral" }), _jsx("p", { className: cn("text-lg font-bold", healthStatus.color), children: healthStatus.label })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xs text-gray-500", children: "Taxa de Resolu\u00E7\u00E3o" }), _jsxs("p", { className: "text-lg font-bold text-gray-900 dark:text-gray-100", children: [stats.resolutionRate.toFixed(1), "%"] })] })] }), _jsxs("div", { className: "mt-2", children: [_jsxs("div", { className: "flex justify-between text-xs text-gray-500 mb-1", children: [_jsx("span", { children: "Progresso" }), _jsxs("span", { children: [stats.resolvedTickets, "/", stats.totalTickets] })] }), _jsx("div", { className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", children: _jsx("div", { className: "bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500", style: { width: `${Math.min(stats.resolutionRate, 100)}%` } }) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 dark:text-gray-300", children: "Distribui\u00E7\u00E3o por Prioridade" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-red-600", children: stats.highPriority }), _jsx("p", { className: "text-xs text-red-500", children: "Alta" })] }), _jsxs("div", { className: "text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-yellow-600", children: stats.mediumPriority }), _jsx("p", { className: "text-xs text-yellow-500", children: "M\u00E9dia" })] }), _jsxs("div", { className: "text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg", children: [_jsx("p", { className: "text-lg font-bold text-green-600", children: stats.lowPriority }), _jsx("p", { className: "text-xs text-green-500", children: "Baixa" })] })] })] }), topDepartments.length > 0 && (_jsxs("div", { className: "space-y-2", children: [_jsxs("h4", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), "Requer Aten\u00E7\u00E3o"] }), _jsx("div", { className: "space-y-2", children: topDepartments.map((dept, index) => (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-xs font-medium text-gray-500 w-4", children: ["#", index + 1] }), _jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 truncate", children: dept.name })] }), _jsx(Badge, { variant: "destructive", className: "text-xs", children: dept.unreadTickets })] }, dept.id))) })] })), stats.urgentDepartments > 0 && (_jsx("div", { className: "p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-red-500" }), _jsxs("span", { className: "text-sm font-medium text-red-700 dark:text-red-300", children: [stats.urgentDepartments, " departamento", stats.urgentDepartments > 1 ? 's' : '', " de alta prioridade com tickets n\u00E3o lidos"] })] }) }))] })] }));
};
export default DepartmentStatsCard;
