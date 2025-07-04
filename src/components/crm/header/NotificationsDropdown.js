import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Bell, Check, Clock, User, MessageSquare } from 'lucide-react';
export const NotificationsDropdown = () => {
    const [notificationCount] = useState(5);
    const notifications = [
        {
            id: 1,
            type: 'ticket',
            icon: MessageSquare,
            title: 'Novo ticket recebido',
            description: 'Cliente: João Silva - Setor: Atendimento',
            time: 'há 2 minutos',
            color: 'blue',
            unread: true
        },
        {
            id: 2,
            type: 'update',
            icon: Check,
            title: 'Ticket atualizado',
            description: 'Ticket #1234 foi respondido',
            time: 'há 5 minutos',
            color: 'green',
            unread: true
        },
        {
            id: 3,
            type: 'user',
            icon: User,
            title: 'Novo usuário adicionado',
            description: 'Maria Santos foi adicionada ao sistema',
            time: 'há 1 hora',
            color: 'purple',
            unread: false
        }
    ];
    const getNotificationStyles = (color, unread) => {
        const baseStyles = "p-4 rounded-xl transition-all duration-200 cursor-pointer group border";
        if (unread) {
            switch (color) {
                case 'blue':
                    return `${baseStyles} bg-blue-50/80 border-blue-200/50 hover:bg-blue-100/80 hover:border-blue-300/60`;
                case 'green':
                    return `${baseStyles} bg-emerald-50/80 border-emerald-200/50 hover:bg-emerald-100/80 hover:border-emerald-300/60`;
                case 'purple':
                    return `${baseStyles} bg-purple-50/80 border-purple-200/50 hover:bg-purple-100/80 hover:border-purple-300/60`;
                default:
                    return `${baseStyles} bg-gray-50/80 border-gray-200/50 hover:bg-gray-100/80 hover:border-gray-300/60`;
            }
        }
        return `${baseStyles} bg-white border-gray-100 hover:bg-gray-50/50 hover:border-gray-200/60`;
    };
    const getIconStyles = (color, unread) => {
        const baseStyles = "w-4 h-4 transition-colors duration-200";
        if (unread) {
            switch (color) {
                case 'blue':
                    return `${baseStyles} text-blue-600`;
                case 'green':
                    return `${baseStyles} text-emerald-600`;
                case 'purple':
                    return `${baseStyles} text-purple-600`;
                default:
                    return `${baseStyles} text-gray-600`;
            }
        }
        return `${baseStyles} text-gray-500`;
    };
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "\r\n            relative h-10 w-10 rounded-xl\r\n            bg-white/60 hover:bg-white/80\r\n            border border-gray-200/60 hover:border-gray-300/80\r\n            shadow-sm hover:shadow-md\r\n            backdrop-blur-sm\r\n            transition-all duration-200 ease-out\r\n            group\r\n          ", children: [_jsx(Bell, { className: "w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" }), notificationCount > 0 && (_jsx(Badge, { variant: "destructive", className: "\r\n                absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 \r\n                flex items-center justify-center text-xs font-semibold\r\n                bg-gradient-to-br from-red-500 to-red-600\r\n                shadow-lg shadow-red-500/25\r\n                animate-pulse\r\n              ", children: notificationCount }))] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "\r\n          w-96 p-4\r\n          bg-white/95 backdrop-blur-xl\r\n          border border-gray-200/50\r\n          shadow-2xl shadow-black/5\r\n          rounded-2xl\r\n          animate-in slide-in-from-top-2 duration-300\r\n        ", children: [_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("h4", { className: "text-lg font-semibold text-gray-900", children: "Notifica\u00E7\u00F5es" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Badge, { variant: "secondary", className: "text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors", children: [notificationCount, " novas"] }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-xs text-gray-500 hover:text-gray-700", children: "Marcar todas como lidas" })] })] }), _jsx("p", { className: "text-sm text-gray-500", children: "Acompanhe as \u00FAltimas atualiza\u00E7\u00F5es do sistema" })] }), _jsx("div", { className: "space-y-3 max-h-80 overflow-y-auto", children: notifications.map((notification) => {
                            const IconComponent = notification.icon;
                            return (_jsx("div", { className: getNotificationStyles(notification.color, notification.unread), children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "\r\n                    p-2 rounded-lg\r\n                    bg-white/60 group-hover:bg-white/80\r\n                    transition-all duration-200\r\n                    group-hover:scale-105\r\n                  ", children: _jsx(IconComponent, { className: getIconStyles(notification.color, notification.unread) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsx("p", { className: "font-medium text-gray-900 text-sm truncate", children: notification.title }), notification.unread && (_jsx("div", { className: "w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1 flex-shrink-0" }))] }), _jsx("p", { className: "text-sm text-gray-600 mt-1 line-clamp-2", children: notification.description }), _jsxs("div", { className: "flex items-center mt-2", children: [_jsx(Clock, { className: "w-3 h-3 text-gray-400 mr-1" }), _jsx("span", { className: "text-xs text-gray-500 font-medium", children: notification.time })] })] })] }) }, notification.id));
                        }) }), _jsx("div", { className: "mt-4 pt-4 border-t border-gray-100/60", children: _jsx(Button, { variant: "ghost", size: "sm", className: "\r\n              w-full justify-center text-sm font-medium\r\n              text-blue-600 hover:text-blue-700\r\n              hover:bg-blue-50/50\r\n              transition-all duration-200\r\n            ", children: "Ver todas as notifica\u00E7\u00F5es" }) })] })] }));
};
