import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useEvolutionWebhook } from '@/hooks/useEvolutionWebhook';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { testEvolutionIntegration } from '@/utils/testEvolutionIntegration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, AlertTriangle, RefreshCw, Play, Wifi, WifiOff, MessageSquare, Bell, Activity } from 'lucide-react';
import { toast } from 'sonner';
function TestEvolutionPage() {
    const [testResults, setTestResults] = useState([]);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [lastTestTime, setLastTestTime] = useState(null);
    // Hooks de integração
    const evolutionWebhook = useEvolutionWebhook();
    const notifications = useRealtimeNotifications();
    // Executar testes
    const runTests = async () => {
        setIsRunningTests(true);
        try {
            console.log('🧪 Iniciando bateria de testes...');
            await testEvolutionIntegration();
            setLastTestTime(new Date());
            toast.success('Testes executados com sucesso!');
        }
        catch (error) {
            console.error('❌ Erro ao executar testes:', error);
            toast.error(`Erro nos testes: ${error.message}`);
        }
        finally {
            setIsRunningTests(false);
        }
    };
    // Auto-executar testes na primeira carga
    useEffect(() => {
        runTests();
    }, []);
    // Estatísticas do WebSocket
    const getWebSocketStats = () => {
        return {
            connected: evolutionWebhook.isConnected,
            status: evolutionWebhook.connectionStatus,
            messages: evolutionWebhook.messages.length,
            instances: Object.keys(evolutionWebhook.instances).length,
            qrCodes: Object.keys(evolutionWebhook.qrCodes).length
        };
    };
    // Estatísticas das notificações
    const getNotificationStats = () => {
        return {
            total: notifications.notifications.length,
            unread: notifications.unreadCount,
            connected: notifications.isConnected
        };
    };
    const wsStats = getWebSocketStats();
    const notifStats = getNotificationStats();
    // Renderizar badge de status
    const renderStatusBadge = (status) => {
        const config = {
            success: { icon: CheckCircle, className: 'bg-green-500 hover:bg-green-600', text: 'Sucesso' },
            error: { icon: AlertCircle, className: 'bg-red-500 hover:bg-red-600', text: 'Erro' },
            warning: { icon: AlertTriangle, className: 'bg-yellow-500 hover:bg-yellow-600', text: 'Aviso' }
        };
        const { icon: Icon, className, text } = config[status];
        return (_jsxs(Badge, { variant: "default", className: className, children: [_jsx(Icon, { className: "w-3 h-3 mr-1" }), text] }));
    };
    return (_jsxs("div", { className: "p-6 space-y-6 max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Teste de Integra\u00E7\u00E3o Evolution API" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Verifica\u00E7\u00E3o completa da integra\u00E7\u00E3o WhatsApp com Evolution API" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Button, { onClick: runTests, disabled: isRunningTests, variant: "outline", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}` }), isRunningTests ? 'Testando...' : 'Executar Testes'] }), lastTestTime && (_jsxs("p", { className: "text-sm text-muted-foreground", children: ["\u00DAltimo teste: ", lastTestTime.toLocaleTimeString()] }))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "WebSocket" }), wsStats.connected ?
                                        _jsx(Wifi, { className: "h-4 w-4 text-green-500" }) :
                                        _jsx(WifiOff, { className: "h-4 w-4 text-red-500" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: wsStats.connected ? 'Online' : 'Offline' }), _jsx("p", { className: "text-xs text-muted-foreground", children: wsStats.status })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Mensagens" }), _jsx(MessageSquare, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: wsStats.messages }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Recebidas via WebSocket" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Notifica\u00E7\u00F5es" }), _jsx(Bell, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: notifStats.total }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [notifStats.unread, " n\u00E3o lidas"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Inst\u00E2ncias" }), _jsx(Activity, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: wsStats.instances }), _jsx("p", { className: "text-xs text-muted-foreground", children: "WhatsApp conectadas" })] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Play, { className: "h-5 w-5" }), "Controles de Teste"] }), _jsx(CardDescription, { children: "Execute testes individuais ou completos da integra\u00E7\u00E3o" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs(Button, { onClick: () => evolutionWebhook.refreshStats(), variant: "outline", disabled: !wsStats.connected, children: [_jsx(Activity, { className: "w-4 h-4 mr-2" }), "Atualizar Stats"] }), _jsxs(Button, { onClick: () => evolutionWebhook.pingServer(), variant: "outline", disabled: !wsStats.connected, children: [_jsx(Wifi, { className: "w-4 h-4 mr-2" }), "Ping Server"] }), _jsxs(Button, { onClick: () => evolutionWebhook.clearMessages(), variant: "outline", children: [_jsx(MessageSquare, { className: "w-4 h-4 mr-2" }), "Limpar Mensagens"] }), _jsxs(Button, { onClick: () => notifications.clearNotifications(), variant: "outline", children: [_jsx(Bell, { className: "w-4 h-4 mr-2" }), "Limpar Notifica\u00E7\u00F5es"] })] }) })] }), testResults.length > 0 && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Resultados dos Testes" }), _jsx(CardDescription, { children: "Status detalhado de cada componente da integra\u00E7\u00E3o" })] }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: testResults.map((result, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: result.test }), _jsx("p", { className: "text-sm text-muted-foreground", children: result.message })] })] }), renderStatusBadge(result.status)] }, index))) }) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-5 w-5" }), "Mensagens Recentes (", wsStats.messages, ")"] }) }), _jsx(CardContent, { children: evolutionWebhook.messages.length === 0 ? (_jsx(Alert, { children: _jsx(AlertDescription, { children: "Nenhuma mensagem recebida ainda. As mensagens aparecer\u00E3o aqui em tempo real quando chegarem via Evolution API." }) })) : (_jsx(ScrollArea, { className: "h-[300px]", children: _jsx("div", { className: "space-y-3", children: evolutionWebhook.messages.slice(0, 10).map((msg, index) => (_jsxs("div", { className: "border rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: msg.instance }), _jsx("span", { className: "font-medium text-sm", children: msg.pushName || msg.from })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: msg.messageType }), _jsx("span", { className: "text-xs text-muted-foreground", children: msg.timestamp.toLocaleTimeString() })] })] }), _jsx("p", { className: "text-sm", children: msg.content })] }, msg.id || index))) }) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Bell, { className: "h-5 w-5" }), "Notifica\u00E7\u00F5es do Sistema (", notifStats.total, ")"] }) }), _jsx(CardContent, { children: notifications.notifications.length === 0 ? (_jsx(Alert, { children: _jsx(AlertDescription, { children: "Nenhuma notifica\u00E7\u00E3o ainda. O sistema gerar\u00E1 notifica\u00E7\u00F5es automaticamente." }) })) : (_jsx(ScrollArea, { className: "h-[200px]", children: _jsx("div", { className: "space-y-2", children: notifications.notifications.slice(0, 5).map((notif) => (_jsxs("div", { className: "flex items-start gap-3 p-2 border rounded", children: [_jsx("div", { className: "w-2 h-2 rounded-full bg-blue-500 mt-2" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-medium text-sm", children: notif.title }), _jsx("p", { className: "text-xs text-muted-foreground", children: notif.message }), _jsx("span", { className: "text-xs text-muted-foreground", children: notif.timestamp.toLocaleString() })] }), !notif.read && (_jsx(Badge, { variant: "default", className: "text-xs", children: "Novo" }))] }, notif.id))) }) })) })] })] }));
}
export default TestEvolutionPage;
