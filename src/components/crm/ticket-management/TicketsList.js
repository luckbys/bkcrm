import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Square, CheckSquare, User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
export const TicketsList = ({ tickets, onTicketClick, selectedTickets = [], onSelectTicket, viewMode = 'list', compactView = false }) => {
    const getStatusColor = (status) => {
        const colors = {
            'pendente': 'status-pending',
            'atendimento': 'status-in-progress',
            'finalizado': 'status-completed',
            'cancelado': 'status-cancelled'
        };
        return colors[status] || 'bg-muted text-muted-foreground border-border';
    };
    const getPriorityColor = (priority) => {
        const colors = {
            'alta': 'border-l-destructive bg-destructive/5',
            'normal': 'border-l-primary bg-primary/5',
            'baixa': 'border-l-success bg-success/5'
        };
        return colors[priority] || 'border-l-muted bg-muted/20';
    };
    const handleTicketSelect = (e, ticketId) => {
        e.stopPropagation();
        onSelectTicket?.(ticketId);
    };
    const getChannelIcon = (channel) => {
        const icons = {
            whatsapp: MessageSquare,
            email: '📧',
            telefone: '📞',
            chat: MessageSquare,
            presencial: '🏢'
        };
        return icons[channel] || MessageSquare;
    };
    if (viewMode === 'grid') {
        return (_jsx("div", { className: cn("grid gap-4", compactView
                ? "grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"), children: tickets.map((ticket) => {
                const isSelected = selectedTickets.includes(ticket.id);
                return (_jsxs(Card, { className: cn("cursor-pointer hover:shadow-medium transition-all duration-200 border-l-4 group", getPriorityColor(ticket.priority), isSelected && "ring-2 ring-primary bg-primary/5 shadow-medium", compactView && "hover:scale-[1.02] transform"), onClick: () => onTicketClick(ticket), children: [_jsx(CardHeader, { className: cn("pb-2", compactView && "pb-1 px-3 pt-3"), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: cn("text-sm font-semibold text-foreground", compactView && "text-xs"), children: ["#", ticket.id] }), _jsxs("div", { className: "flex items-center space-x-1", children: [onSelectTicket && (_jsx(Button, { variant: "ghost", size: "sm", className: cn("h-6 w-6 p-0 hover:bg-accent", compactView && "h-4 w-4"), onClick: (e) => handleTicketSelect(e, ticket.id), children: isSelected ? (_jsx(CheckSquare, { className: cn("w-4 h-4 text-primary", compactView && "w-3 h-3") })) : (_jsx(Square, { className: cn("w-4 h-4 text-muted-foreground", compactView && "w-3 h-3") })) })), ticket.unread && (_jsx(Badge, { variant: "destructive", className: cn("text-2xs px-2 py-0.5 animate-pulse shadow-soft", compactView && "px-1 py-0 text-[10px]"), children: "Nova" }))] })] }) }), _jsxs(CardContent, { className: cn("space-y-2", compactView && "space-y-1 px-3 pb-3"), children: [_jsxs("div", { children: [_jsx("div", { className: cn("font-medium text-foreground", compactView && "text-xs truncate"), children: ticket.client }), _jsx("div", { className: cn("text-sm text-muted-foreground line-clamp-2", compactView && "text-xs line-clamp-1"), children: ticket.subject })] }), _jsxs("div", { className: cn("flex flex-wrap gap-1", compactView && "gap-0.5"), children: [_jsx(Badge, { className: cn("text-2xs border", getStatusColor(ticket.status), compactView && "text-[10px] px-1 py-0"), children: compactView ? ticket.status.slice(0, 3) : ticket.status }), _jsx(Badge, { variant: "outline", className: cn("text-2xs border-border", compactView && "text-[10px] px-1 py-0"), children: typeof getChannelIcon(ticket.channel) === 'string'
                                                ? getChannelIcon(ticket.channel)
                                                : ticket.channel.slice(0, 3) })] }), !compactView && (_jsxs("div", { className: "text-2xs text-muted-foreground flex items-center justify-between", children: [_jsx("span", { children: ticket.lastMessage }), ticket.agent && (_jsx("span", { className: "font-medium text-foreground", children: ticket.agent }))] }))] })] }, ticket.id));
            }) }));
    }
    // List view
    return (_jsx(Card, { className: "shadow-soft border-0", children: _jsx(CardContent, { className: "p-0", children: _jsx("div", { className: "divide-y divide-border", children: tickets.map((ticket) => {
                    const isSelected = selectedTickets.includes(ticket.id);
                    return (_jsxs("div", { onClick: () => onTicketClick(ticket), className: cn("cursor-pointer hover:bg-accent/50 transition-all duration-200 border-l-4 flex items-center space-x-4 group", getPriorityColor(ticket.priority), isSelected && "bg-primary/5 border-primary shadow-soft", compactView ? "p-2" : "p-4"), children: [onSelectTicket && (_jsx(Button, { variant: "ghost", size: "sm", className: cn("flex-shrink-0 hover:bg-accent", compactView ? "h-5 w-5 p-0" : "h-6 w-6 p-0"), onClick: (e) => handleTicketSelect(e, ticket.id), children: isSelected ? (_jsx(CheckSquare, { className: cn("text-primary", compactView ? "w-3 h-3" : "w-4 h-4") })) : (_jsx(Square, { className: cn("text-muted-foreground hover:text-foreground", compactView ? "w-3 h-3" : "w-4 h-4") })) })), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4 min-w-0 flex-1", children: [_jsxs("div", { className: cn("font-medium text-foreground flex-shrink-0", compactView && "text-sm"), children: ["#", ticket.id] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: cn("font-medium text-foreground truncate", compactView && "text-sm"), children: ticket.client }), !compactView && (_jsx("div", { className: "text-sm text-muted-foreground truncate", children: ticket.subject }))] }), ticket.unread && (_jsx(Badge, { variant: "destructive", className: cn("flex-shrink-0 animate-pulse shadow-soft", compactView ? "text-[10px] px-1 py-0" : "text-2xs"), children: "Nova" }))] }), _jsxs("div", { className: cn("flex items-center flex-shrink-0", compactView ? "space-x-2" : "space-x-3"), children: [_jsx(Badge, { className: cn("border", getStatusColor(ticket.status), compactView ? "text-[10px] px-1" : "text-2xs"), children: compactView ? ticket.status.slice(0, 3) : ticket.status }), _jsx(Badge, { variant: "outline", className: cn("border-border", compactView ? "text-[10px] px-1" : "text-2xs"), children: typeof getChannelIcon(ticket.channel) === 'string'
                                                            ? getChannelIcon(ticket.channel)
                                                            : (compactView ? ticket.channel.slice(0, 3) : ticket.channel) }), !compactView && (_jsxs(_Fragment, { children: [_jsx("div", { className: "text-sm text-muted-foreground min-w-0", children: ticket.lastMessage }), ticket.agent && (_jsx("div", { className: "text-2xs text-foreground font-medium bg-muted/40 px-2 py-1 rounded-md", children: ticket.agent }))] })), compactView && ticket.agent && (_jsx("div", { className: "text-xs text-foreground font-medium bg-muted/40 px-1 py-0.5 rounded text-center min-w-0", children: _jsx(User, { className: "w-3 h-3" }) }))] })] }), compactView && (_jsx("div", { className: "mt-1 text-xs text-muted-foreground truncate", children: ticket.subject }))] })] }, ticket.id));
                }) }) }) }));
};
