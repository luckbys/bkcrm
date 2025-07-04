import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, UserCheck, UserMinus, UserPlus, TrendingUp, CreditCard, Calendar } from 'lucide-react';
export const CustomerStats = ({ stats, loading = false }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };
    const statItems = [
        {
            label: 'Total de Clientes',
            value: stats.total,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            label: 'Clientes Ativos',
            value: stats.active,
            icon: UserCheck,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            label: 'Clientes Inativos',
            value: stats.inactive,
            icon: UserMinus,
            color: 'text-red-600',
            bg: 'bg-red-100'
        },
        {
            label: 'Prospects',
            value: stats.prospects,
            icon: UserPlus,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
        {
            label: 'Novos este Mês',
            value: stats.newThisMonth,
            icon: Calendar,
            color: 'text-orange-600',
            bg: 'bg-orange-100'
        },
        {
            label: 'Valor Total',
            value: formatCurrency(stats.totalValue),
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-100'
        },
        {
            label: 'Ticket Médio',
            value: formatCurrency(stats.averageTicket),
            icon: CreditCard,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100'
        }
    ];
    if (loading) {
        return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [1, 2, 3, 4].map((i) => (_jsxs(Card, { className: "p-4", children: [_jsx(Skeleton, { className: "h-8 w-8 rounded mb-4" }), _jsx(Skeleton, { className: "h-4 w-24 mb-2" }), _jsx(Skeleton, { className: "h-6 w-32" })] }, i))) }));
    }
    return (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: statItems.map((item, index) => {
            const Icon = item.icon;
            return (_jsxs(Card, { className: "p-4", children: [_jsx("div", { className: `${item.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`, children: _jsx(Icon, { className: `w-6 h-6 ${item.color}` }) }), _jsx("div", { className: "text-sm text-gray-600 mb-1", children: item.label }), _jsx("div", { className: "text-2xl font-semibold", children: item.value })] }, index));
        }) }));
};
