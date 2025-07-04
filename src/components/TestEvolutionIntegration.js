import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useEvolutionWebhook } from '@/hooks/useEvolutionWebhook';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { testEvolutionIntegration } from '@/utils/testEvolutionIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, AlertTriangle, RefreshCw, Play, Wifi, WifiOff, MessageSquare, Bell, Activity } from 'lucide-react';
import { toast } from 'sonner';
function TestEvolutionIntegration() {
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
    return (_jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold", children: "Teste de Integra\u00E7\u00E3o Evolution API" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Verifica\u00E7\u00E3o completa da integra\u00E7\u00E3o WhatsApp" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs(Button, { onClick: runTests, disabled: isRunningTests, variant: "outline", size: "sm", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}` }), isRunningTests ? 'Testando...' : 'Executar Testes'] }), lastTestTime && (_jsx("p", { className: "text-sm text-muted-foreground", children: lastTestTime.toLocaleTimeString() }))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "WebSocket" }), wsStats.connected ?
                                        _jsx(Wifi, { className: "h-4 w-4 text-green-500" }) :
                                        _jsx(WifiOff, { className: "h-4 w-4 text-red-500" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-xl font-bold", children: wsStats.connected ? 'Online' : 'Offline' }), _jsx("p", { className: "text-xs text-muted-foreground truncate", children: wsStats.status })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Mensagens" }), _jsx(MessageSquare, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-xl font-bold", children: wsStats.messages }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Via WebSocket" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Notifica\u00E7\u00F5es" }), _jsx(Bell, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-xl font-bold", children: notifStats.total }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [notifStats.unread, " n\u00E3o lidas"] })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Inst\u00E2ncias" }), _jsx(Activity, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-xl font-bold", children: wsStats.instances }), _jsx("p", { className: "text-xs text-muted-foreground", children: "WhatsApp" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Play, { className: "h-5 w-5" }), "Controles de Teste"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs(Button, { onClick: () => evolutionWebhook.refreshStats(), variant: "outline", size: "sm", disabled: !wsStats.connected, children: [_jsx(Activity, { className: "w-4 h-4 mr-2" }), "Stats"] }), _jsxs(Button, { onClick: () => evolutionWebhook.pingServer(), variant: "outline", size: "sm", disabled: !wsStats.connected, children: [_jsx(Wifi, { className: "w-4 h-4 mr-2" }), "Ping"] }), _jsxs(Button, { onClick: () => evolutionWebhook.clearMessages(), variant: "outline", size: "sm", children: [_jsx(MessageSquare, { className: "w-4 h-4 mr-2" }), "Limpar"] }), _jsxs(Button, { onClick: () => notifications.clearNotifications(), variant: "outline", size: "sm", children: [_jsx(Bell, { className: "w-4 h-4 mr-2" }), "Notif"] })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(MessageSquare, { className: "h-5 w-5" }), "Mensagens Recentes (", wsStats.messages, ")"] }) }), _jsx(CardContent, { children: evolutionWebhook.messages.length === 0 ? (_jsx(Alert, { children: _jsx(AlertDescription, { children: "Nenhuma mensagem recebida. As mensagens aparecer\u00E3o aqui em tempo real." }) })) : (_jsx(ScrollArea, { className: "h-[200px]", children: _jsx("div", { className: "space-y-2", children: evolutionWebhook.messages.slice(0, 5).map((msg, index) => (_jsxs("div", { className: "border rounded p-3 space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: msg.instance }), _jsx("span", { className: "font-medium text-sm", children: msg.pushName || msg.from.split('@')[0] })] }), _jsx("span", { className: "text-xs text-muted-foreground", children: msg.timestamp.toLocaleTimeString() })] }), _jsx("p", { className: "text-sm", children: msg.content.substring(0, 100) })] }, msg.id || index))) }) })) })] }), Object.keys(evolutionWebhook.instances).length > 0 && (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [_jsx(Activity, { className: "h-5 w-5" }), "Inst\u00E2ncias WhatsApp"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: Object.entries(evolutionWebhook.instances).map(([name, info]) => (_jsxs("div", { className: "flex items-center justify-between p-2 border rounded", children: [_jsx("span", { className: "font-medium text-sm", children: name }), _jsx(Badge, { variant: info.status === 'open' ? 'default' : 'secondary', className: info.status === 'open' ? 'bg-green-500' : '', children: info.status })] }, name))) }) })] }))] }));
}
export default TestEvolutionIntegration;
