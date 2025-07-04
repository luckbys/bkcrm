import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Building, Mail, Phone, MapPin, Calendar, DollarSign, TrendingUp, MessageCircle, Edit, FileText, Clock, Target, Award, Contact } from 'lucide-react';
export const CustomerDetailModal = ({ customer, isOpen, onClose, onEdit, onContact }) => {
    const [activeTab, setActiveTab] = useState('overview');
    if (!customer)
        return null;
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };
    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800 border-green-200',
            inactive: 'bg-red-100 text-red-800 border-red-200',
            prospect: 'bg-blue-100 text-blue-800 border-blue-200',
            blocked: 'bg-orange-100 text-orange-800 border-orange-200'
        };
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    const getCategoryColor = (category) => {
        const colors = {
            bronze: 'bg-orange-100 text-orange-800 border-orange-200',
            silver: 'bg-gray-100 text-gray-800 border-gray-200',
            gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            platinum: 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
    };
    // Mock data para demonstração
    const mockInteractions = [
        {
            id: 1,
            type: 'email',
            description: 'Email de boas-vindas enviado',
            date: '2024-01-15',
            agent: 'Ana Costa'
        },
        {
            id: 2,
            type: 'phone',
            description: 'Ligação de follow-up realizada',
            date: '2024-01-10',
            agent: 'Carlos Silva'
        },
        {
            id: 3,
            type: 'whatsapp',
            description: 'Mensagem de suporte enviada',
            date: '2024-01-08',
            agent: 'Marina Santos'
        }
    ];
    const mockOrders = [
        {
            id: 1,
            description: 'Produto Premium',
            value: 2500.00,
            date: '2024-01-12',
            status: 'completed'
        },
        {
            id: 2,
            description: 'Serviço de Consultoria',
            value: 1800.00,
            date: '2024-01-05',
            status: 'completed'
        }
    ];
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-hidden", children: [_jsx(DialogHeader, { className: "space-y-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold", children: customer.name.charAt(0).toUpperCase() }), _jsxs("div", { children: [_jsx(DialogTitle, { className: "text-2xl font-bold text-gray-900", children: customer.name }), _jsxs("div", { className: "flex items-center space-x-2 mt-1", children: [_jsx(Badge, { className: `${getStatusColor(customer.status)} border`, children: customer.status === 'active' ? 'Ativo' :
                                                            customer.status === 'inactive' ? 'Inativo' :
                                                                customer.status === 'prospect' ? 'Prospect' : 'Bloqueado' }), _jsx(Badge, { className: `${getCategoryColor(customer.category)} border`, children: customer.category.charAt(0).toUpperCase() + customer.category.slice(1) })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => onEdit(customer), children: [_jsx(Edit, { className: "w-4 h-4 mr-2" }), "Editar"] }), _jsxs("div", { className: "flex items-center border rounded-lg", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onContact(customer, 'phone'), className: "rounded-r-none border-r", children: _jsx(Phone, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onContact(customer, 'email'), className: "rounded-none border-r", children: _jsx(Mail, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => onContact(customer, 'whatsapp'), className: "rounded-l-none", children: _jsx(MessageCircle, { className: "w-4 h-4" }) })] })] })] }) }), _jsx("div", { className: "overflow-y-auto", children: _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "overview", children: "Vis\u00E3o Geral" }), _jsx(TabsTrigger, { value: "contact", children: "Contato" }), _jsx(TabsTrigger, { value: "history", children: "Hist\u00F3rico" }), _jsx(TabsTrigger, { value: "financial", children: "Financeiro" })] }), _jsxs(TabsContent, { value: "overview", className: "space-y-4 mt-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(DollarSign, { className: "w-5 h-5 text-green-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Valor Total" }), _jsx("p", { className: "text-lg font-bold text-green-600", children: formatCurrency(customer.totalValue) })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(TrendingUp, { className: "w-5 h-5 text-blue-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Ticket M\u00E9dio" }), _jsx("p", { className: "text-lg font-bold text-blue-600", children: formatCurrency(customer.averageTicket) })] })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Target, { className: "w-5 h-5 text-purple-600" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Total de Pedidos" }), _jsx("p", { className: "text-lg font-bold text-purple-600", children: customer.totalOrders })] })] }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Building, { className: "w-5 h-5" }), _jsx("span", { children: "Informa\u00E7\u00F5es da Empresa" })] }) }), _jsx(CardContent, { className: "space-y-3", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Empresa" }), _jsx("p", { className: "text-gray-900", children: customer.company })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Cargo" }), _jsx("p", { className: "text-gray-900", children: customer.position })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Documento" }), _jsx("p", { className: "text-gray-900", children: customer.document })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Canal" }), _jsx("p", { className: "text-gray-900 capitalize", children: customer.channel })] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(FileText, { className: "w-5 h-5" }), _jsx("span", { children: "Tags e Observa\u00E7\u00F5es" })] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Tags" }), _jsx("div", { className: "flex flex-wrap gap-2 mt-1", children: customer.tags.map((tag, index) => (_jsx(Badge, { variant: "secondary", className: "bg-blue-100 text-blue-800", children: tag }, index))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Observa\u00E7\u00F5es" }), _jsx("p", { className: "text-gray-900 mt-1 text-sm leading-relaxed", children: customer.notes })] })] })] })] }), _jsx(TabsContent, { value: "contact", className: "space-y-4 mt-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Contact, { className: "w-5 h-5" }), _jsx("span", { children: "Informa\u00E7\u00F5es de Contato" })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Mail, { className: "w-5 h-5 text-blue-600" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Email" }), _jsx("p", { className: "text-gray-900", children: customer.email })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx(Phone, { className: "w-5 h-5 text-green-600" }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-gray-600", children: "Telefone" }), _jsx("p", { className: "text-gray-900", children: customer.phone })] })] })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center space-x-2 mb-3", children: [_jsx(MapPin, { className: "w-5 h-5 text-red-600" }), _jsx("h4", { className: "font-medium text-gray-900", children: "Endere\u00E7o" })] }), _jsxs("div", { className: "bg-gray-50 p-3 rounded-lg", children: [_jsxs("p", { className: "text-sm text-gray-900", children: [customer.address.street, ", ", customer.address.number, customer.address.complement && `, ${customer.address.complement}`] }), _jsxs("p", { className: "text-sm text-gray-900", children: [customer.address.neighborhood, " - ", customer.address.city, ", ", customer.address.state] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["CEP: ", customer.address.zipCode] })] })] })] })] }) }), _jsx(TabsContent, { value: "history", className: "space-y-4 mt-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Clock, { className: "w-5 h-5" }), _jsx("span", { children: "Hist\u00F3rico de Intera\u00E7\u00F5es" })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: mockInteractions.map((interaction) => (_jsxs("div", { className: "flex items-start space-x-3 p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex-shrink-0 mt-1", children: [interaction.type === 'email' && _jsx(Mail, { className: "w-4 h-4 text-blue-600" }), interaction.type === 'phone' && _jsx(Phone, { className: "w-4 h-4 text-green-600" }), interaction.type === 'whatsapp' && _jsx(MessageCircle, { className: "w-4 h-4 text-green-600" })] }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: interaction.description }), _jsxs("p", { className: "text-xs text-gray-600", children: [formatDate(interaction.date), " \u2022 ", interaction.agent] })] })] }, interaction.id))) }) })] }) }), _jsxs(TabsContent, { value: "financial", className: "space-y-4 mt-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx(Award, { className: "w-8 h-8 text-yellow-600 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-gray-600", children: "Cliente desde" }), _jsx("p", { className: "font-bold text-gray-900", children: formatDate(customer.customerSince) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx(Calendar, { className: "w-8 h-8 text-blue-600 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-gray-600", children: "\u00DAltima intera\u00E7\u00E3o" }), _jsx("p", { className: "font-bold text-gray-900", children: formatDate(customer.lastInteraction) })] }) }), _jsx(Card, { children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx(User, { className: "w-8 h-8 text-purple-600 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-gray-600", children: "Agente respons\u00E1vel" }), _jsx("p", { className: "font-bold text-gray-900", children: customer.responsibleAgent })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Hist\u00F3rico de Pedidos" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: mockOrders.map((order) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium text-gray-900", children: order.description }), _jsx("p", { className: "text-sm text-gray-600", children: formatDate(order.date) })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "font-bold text-green-600", children: formatCurrency(order.value) }), _jsx(Badge, { variant: "secondary", className: "bg-green-100 text-green-800", children: "Conclu\u00EDdo" })] })] }, order.id))) }) })] })] })] }) })] }) }));
};
