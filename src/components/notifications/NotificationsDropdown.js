import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Bell, Check, X, MessageSquare, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
export function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(true);
    // Simular hook removido
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const markAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };
    const markNotificationAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };
    // Carregar notificações de exemplo (simulação)
    useEffect(() => {
        const sampleNotifications = [
            {
                id: '1',
                title: 'Nova mensagem',
                message: 'Cliente enviou uma nova mensagem',
                timestamp: new Date(),
                ticketId: 'ticket-123',
                isInternal: false,
                isRead: false
            }
        ];
        // Simular delay de carregamento
        setTimeout(() => {
            setNotifications(sampleNotifications);
        }, 1000);
    }, []);
    const handleNotificationClick = (notification) => {
        // Marcar como lida
        markNotificationAsRead(notification.id);
        // Abrir ticket em nova aba
        window.open(`/tickets/${notification.ticketId}`, '_blank');
        // Fechar dropdown
        setIsOpen(false);
    };
    const handleMarkAllAsRead = () => {
        markAsRead();
        setIsOpen(false);
    };
    const formatTime = (date) => {
        return formatDistanceToNow(date, {
            addSuffix: true,
            locale: ptBR
        });
    };
    return (_jsxs(DropdownMenu, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "icon", className: "relative", children: [_jsx(Bell, { className: "h-5 w-5" }), unreadCount > 0 && (_jsx(Badge, { variant: "destructive", className: "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center", children: unreadCount > 99 ? '99+' : unreadCount })), !isConnected && (_jsx("div", { className: "absolute -bottom-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full animate-pulse" }))] }) }), _jsxs(DropdownMenuContent, { align: "end", className: "w-80 max-h-96 overflow-y-auto", children: [_jsxs(DropdownMenuLabel, { className: "flex items-center justify-between", children: [_jsx("span", { children: "Notifica\u00E7\u00F5es" }), _jsxs("div", { className: "flex items-center gap-2", children: [!isConnected && (_jsx(Badge, { variant: "secondary", className: "text-xs", children: "Desconectado" })), unreadCount > 0 && (_jsxs(Button, { variant: "ghost", size: "sm", onClick: handleMarkAllAsRead, className: "h-6 px-2 text-xs", children: [_jsx(Check, { className: "h-3 w-3 mr-1" }), "Marcar todas"] }))] })] }), _jsx(DropdownMenuSeparator, {}), notifications.length === 0 ? (_jsxs("div", { className: "p-4 text-center text-muted-foreground", children: [_jsx(MessageSquare, { className: "h-8 w-8 mx-auto mb-2 opacity-50" }), _jsx("p", { className: "text-sm", children: "Nenhuma notifica\u00E7\u00E3o" }), _jsx("p", { className: "text-xs", children: "Novas mensagens aparecer\u00E3o aqui" })] })) : (notifications.map((notification) => (_jsxs(DropdownMenuItem, { className: "flex flex-col items-start p-3 cursor-pointer hover:bg-accent", onClick: () => handleNotificationClick(notification), children: [_jsxs("div", { className: "flex items-start justify-between w-full mb-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium", children: notification.title }), notification.isInternal && (_jsx(Badge, { variant: "outline", className: "text-xs", children: "Interna" }))] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-4 w-4 p-0 opacity-50 hover:opacity-100", onClick: (e) => {
                                            e.stopPropagation();
                                            markNotificationAsRead(notification.id);
                                        }, children: _jsx(X, { className: "h-3 w-3" }) })] }), _jsx("p", { className: "text-sm text-muted-foreground mb-2 line-clamp-2", children: notification.message }), _jsxs("div", { className: "flex items-center justify-between w-full text-xs text-muted-foreground", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), formatTime(notification.timestamp)] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("span", { children: ["Ticket #", notification.ticketId.slice(-8)] }), _jsx(ExternalLink, { className: "h-3 w-3" })] })] })] }, notification.id)))), notifications.length > 0 && (_jsxs(_Fragment, { children: [_jsx(DropdownMenuSeparator, {}), _jsx("div", { className: "p-2 text-center", children: _jsx(Button, { variant: "outline", size: "sm", onClick: () => setIsOpen(false), className: "w-full", children: "Fechar" }) })] }))] })] }));
}
