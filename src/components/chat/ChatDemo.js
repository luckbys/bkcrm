import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { UnifiedChatModal } from './UnifiedChatModal';
import { MessageSquare, Play, Sparkles } from 'lucide-react';
export const ChatDemo = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDemo, setSelectedDemo] = useState('');
    const demoScenarios = [
        {
            id: 'whatsapp',
            title: 'Chat WhatsApp',
            description: 'Simulacao de conversa via WhatsApp',
            clientName: 'Joao Silva',
            clientPhone: '+55 11 99999-9999',
            ticketId: 'WA001',
            color: 'from-green-500 to-green-600'
        },
        {
            id: 'email',
            title: 'Chat por Email',
            description: 'Simulacao de conversa via email',
            clientName: 'Maria Santos',
            clientPhone: '+55 11 88888-8888',
            ticketId: 'EM002',
            color: 'from-blue-500 to-blue-600'
        },
        {
            id: 'site',
            title: 'Chat do Site',
            description: 'Simulacao de conversa via chat do site',
            clientName: 'Pedro Costa',
            clientPhone: '+55 11 77777-7777',
            ticketId: 'WB003',
            color: 'from-purple-500 to-purple-600'
        }
    ];
    const handleOpenDemo = (scenario) => {
        setSelectedDemo(scenario.id);
        setIsModalOpen(true);
    };
    const selectedScenario = demoScenarios.find(s => s.id === selectedDemo);
    return (_jsxs("div", { className: "p-8 max-w-6xl mx-auto", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsxs("div", { className: "relative inline-block mb-6", children: [_jsx("div", { className: "w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg", children: _jsx(MessageSquare, { className: "w-10 h-10 text-white" }) }), _jsx("div", { className: "absolute -top-2 -right-2", children: _jsx(Sparkles, { className: "w-6 h-6 text-yellow-500 animate-pulse" }) })] }), _jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Sistema de Chat CRM" }), _jsx("p", { className: "text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed", children: "Demonstracao interativa do sistema de chat unificado. Escolha um cenario abaixo para testar as funcionalidades." })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: demoScenarios.map((scenario) => (_jsx(Card, { className: "p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 border-0 bg-white", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: `w-16 h-16 bg-gradient-to-br ${scenario.color} rounded-xl mx-auto mb-4 flex items-center justify-center shadow-lg`, children: _jsx(MessageSquare, { className: "w-8 h-8 text-white" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-2", children: scenario.title }), _jsx("p", { className: "text-gray-600 mb-4 text-sm leading-relaxed", children: scenario.description }), _jsxs("div", { className: "space-y-2 mb-6", children: [_jsxs("div", { className: "text-sm text-gray-500", children: [_jsx("span", { className: "font-medium", children: "Cliente:" }), " ", scenario.clientName] }), _jsxs("div", { className: "text-sm text-gray-500", children: [_jsx("span", { className: "font-medium", children: "Ticket:" }), " #", scenario.ticketId] })] }), _jsxs(Button, { onClick: () => handleOpenDemo(scenario), className: `w-full bg-gradient-to-r ${scenario.color} hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl`, children: [_jsx(Play, { className: "w-4 h-4 mr-2" }), "Testar Chat"] })] }) }, scenario.id))) }), _jsxs(Card, { className: "p-8 bg-gradient-to-br from-gray-50 to-gray-100 border-0", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-6 text-center", children: "Funcionalidades do Chat" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
                            { icon: '💬', title: 'Mensagens', desc: 'Envio e recebimento em tempo real' },
                            { icon: '🔒', title: 'Notas Internas', desc: 'Comunicacao privada da equipe' },
                            { icon: '↩️', title: 'Responder', desc: 'Sistema de citacao de mensagens' },
                            { icon: '😀', title: 'Emojis', desc: 'Seletor completo de emojis' },
                            { icon: '📎', title: 'Anexos', desc: 'Envio de arquivos e midia' },
                            { icon: '📞', title: 'Chamadas', desc: 'Integracao com telefonia' },
                            { icon: '⚡', title: 'Tempo Real', desc: 'Atualizacoes instantaneas' },
                            { icon: '📱', title: 'Responsivo', desc: 'Funciona em todos dispositivos' }
                        ].map((feature, index) => (_jsxs("div", { className: "text-center p-4", children: [_jsx("div", { className: "text-3xl mb-3", children: feature.icon }), _jsx("h3", { className: "font-semibold text-gray-900 mb-2", children: feature.title }), _jsx("p", { className: "text-sm text-gray-600", children: feature.desc })] }, index))) })] }), selectedScenario && (_jsx(UnifiedChatModal, { isOpen: isModalOpen, onClose: () => setIsModalOpen(false), ticketId: selectedScenario.ticketId, clientName: selectedScenario.clientName, clientPhone: selectedScenario.clientPhone }))] }));
};
