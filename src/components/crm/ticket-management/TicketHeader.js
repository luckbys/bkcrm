import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
export const TicketHeader = ({ sector, ticketCounts, onOpenAddTicket }) => {
    return (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: sector.name }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => console.log('Filter by non-visualized'), children: [_jsx(Badge, { variant: "destructive", className: "mr-2", children: ticketCounts.nonVisualized }), "N\u00E3o Visualizados"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => console.log('Show all tickets'), children: [_jsx(Badge, { variant: "secondary", className: "mr-2", children: ticketCounts.total }), "Total"] })] })] }), _jsxs(Button, { onClick: onOpenAddTicket, children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Novo Ticket"] })] }));
};
