import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from 'react';
import { useEvolutionWebhook } from '@/hooks/useEvolutionWebhook';
import { evolutionApi } from '@/services/evolutionApi.';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Smartphone, MessageSquare, Wifi, WifiOff, RefreshCw, Send, QrCode, Server, Clock, MemoryStick, Zap } from 'lucide-react';
import { toast } from 'sonner';
export function EvolutionDashboard() {
    const { isConnected, connectionStatus, messages, instances, qrCodes, stats: websocketStats, joinInstance, refreshStats, clearMessages } = useEvolutionWebhook();
    const [diagnostics, setDiagnostics] = useState({
        health: null,
        stats: null,
        instances: [],
        websocketStats: null
    });
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    // Carregar dados iniciais
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            console.log('🔍 Carregando dados Evolution API...');
            const diagnosticsData = await evolutionApi.runDiagnostics();
            setDiagnostics(diagnosticsData);
            setLastUpdate(new Date());
            console.log('✅ Dados carregados com sucesso:', diagnosticsData);
            toast.success('Dados atualizados com sucesso!');
        }
        catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            toast.error(`Erro ao carregar dados: ${error.message}`);
        }
        finally {
            setLoading(false);
        }
    }, []);
    // Enviar mensagem de teste
    const sendTestMessage = useCallback(async () => {
        try {
            const result = await evolutionApi.testSendMessage();
            if (result.success) {
                toast.success(`Mensagem teste enviada! ID: ${result.messageId}`);
            }
            else {
                toast.error(`Erro ao enviar: ${result.error}`);
            }
        }
        catch (error) {
            console.error('❌ Erro ao enviar mensagem teste:', error);
            toast.error(`Erro ao enviar mensagem: ${error.message}`);
        }
    }, []);
    // Verificar instância Evolution
    const checkInstance = useCallback(async () => {
        try {
            const result = await evolutionApi.checkEvolutionInstance();
            toast.success(`Instância verificada: ${result.status || 'OK'}`);
            console.log('📊 Status da instância:', result);
        }
        catch (error) {
            console.error('❌ Erro ao verificar instância:', error);
            toast.error(`Erro ao verificar instância: ${error.message}`);
        }
    }, []);
    // Conectar à instância padrão
    const connectToDefaultInstance = useCallback(() => {
        const defaultInstance = 'atendimento-ao-cliente-suporte';
        joinInstance(defaultInstance);
        toast.info(`Conectando à instância: ${defaultInstance}`);
    }, [joinInstance]);
    // Limpar mensagens
    const handleClearMessages = useCallback(() => {
        clearMessages();
        toast.info('Mensagens limpas!');
    }, [clearMessages]);
    // Auto-load inicial
    useEffect(() => {
        loadData();
    }, [loadData]);
    // Status da conexão WebSocket
    const getConnectionBadge = () => {
        if (isConnected) {
            return (_jsxs(Badge, { variant: "default", className: "bg-green-500 hover:bg-green-600", children: [_jsx(Wifi, { className: "w-3 h-3 mr-1" }), "Conectado"] }));
        }
        else {
            return (_jsxs(Badge, { variant: "destructive", children: [_jsx(WifiOff, { className: "w-3 h-3 mr-1" }), "Desconectado"] }));
        }
    };
    // Formatação de bytes
    const formatBytes = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    // Formatação de tempo
    const formatUptime = (seconds) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (days > 0)
            return `${days}d ${hours}h ${minutes}m`;
        if (hours > 0)
            return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };
    return (_jsxs("div", { className: "p-6 space-y-6 max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Evolution API Dashboard" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Monitor e gerencie a integra\u00E7\u00E3o WhatsApp" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [getConnectionBadge(), lastUpdate && (_jsxs("p", { className: "text-sm text-muted-foreground", children: ["Atualizado: ", lastUpdate.toLocaleTimeString()] }))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "WebSocket" }), _jsx(Activity, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: isConnected ? 'Online' : 'Offline' }), _jsx("p", { className: "text-xs text-muted-foreground", children: connectionStatus })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Mensagens" }), _jsx(MessageSquare, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: messages.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "\u00DAltimas 100 mensagens" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "Inst\u00E2ncias" }), _jsx(Smartphone, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: Object.keys(instances).length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "WhatsApp conectadas" })] })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [_jsx(CardTitle, { className: "text-sm font-medium", children: "QR Codes" }), _jsx(QrCode, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: Object.keys(qrCodes).length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Aguardando conex\u00E3o" })] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "h-5 w-5" }), "Controles R\u00E1pidos"] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs(Button, { onClick: loadData, disabled: loading, variant: "outline", children: [_jsx(RefreshCw, { className: `w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}` }), loading ? 'Carregando...' : 'Atualizar Dados'] }), _jsxs(Button, { onClick: sendTestMessage, variant: "outline", children: [_jsx(Send, { className: "w-4 h-4 mr-2" }), "Enviar Teste"] }), _jsxs(Button, { onClick: checkInstance, variant: "outline", children: [_jsx(Server, { className: "w-4 h-4 mr-2" }), "Verificar Inst\u00E2ncia"] }), _jsxs(Button, { onClick: connectToDefaultInstance, variant: "outline", children: [_jsx(Smartphone, { className: "w-4 h-4 mr-2" }), "Conectar Inst\u00E2ncia"] }), _jsxs(Button, { onClick: handleClearMessages, variant: "outline", children: [_jsx(MessageSquare, { className: "w-4 h-4 mr-2" }), "Limpar Mensagens"] })] }) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Server, { className: "h-5 w-5" }), "Estat\u00EDsticas do Sistema"] }), _jsx(CardDescription, { children: "M\u00E9tricas de desempenho do servidor" })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Uptime" }), _jsx(Clock, { className: "h-4 w-4 text-muted-foreground" })] }), _jsx("div", { className: "text-2xl font-bold", children: diagnostics.stats?.server?.uptime ? formatUptime(diagnostics.stats.server.uptime) : 'Carregando...' })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-sm font-medium", children: "Uso de Mem\u00F3ria" }), _jsx(MemoryStick, { className: "h-4 w-4 text-muted-foreground" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { children: "Heap Usado" }), _jsx("span", { children: diagnostics.stats?.server?.memory ? formatBytes(diagnostics.stats.server.memory.heapUsed) : 'Carregando...' })] }), _jsx(Progress, { value: diagnostics.stats?.server?.memory
                                                    ? (diagnostics.stats.server.memory.heapUsed / diagnostics.stats.server.memory.heapTotal) * 100
                                                    : 0 }), _jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [_jsxs("span", { children: ["Total: ", diagnostics.stats?.server?.memory ? formatBytes(diagnostics.stats.server.memory.heapTotal) : 'Carregando...'] }), _jsxs("span", { children: ["RSS: ", diagnostics.stats?.server?.memory ? formatBytes(diagnostics.stats.server.memory.rss) : 'Carregando...'] })] })] })] })] })] }), Object.keys(qrCodes).length > 0 && (_jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(QrCode, { className: "h-5 w-5" }), "QR Codes para Conex\u00E3o"] }), _jsx(CardDescription, { children: "Escaneie com o WhatsApp para conectar as inst\u00E2ncias" })] }), _jsx(CardContent, { children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: Object.entries(qrCodes).map(([instance, qr]) => (_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h4", { className: "font-medium", children: instance }), _jsx("div", { className: "border rounded-lg p-4 bg-white", children: _jsx("img", { src: qr, alt: `QR Code ${instance}`, className: "w-full max-w-[200px] mx-auto" }) }), _jsx(Badge, { variant: "outline", children: "Aguardando conex\u00E3o" })] }, instance))) }) })] })), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(Smartphone, { className: "h-5 w-5" }), "Status das Inst\u00E2ncias WhatsApp"] }) }), _jsx(CardContent, { children: Object.keys(instances).length === 0 ? (_jsx(Alert, { children: _jsx(AlertDescription, { children: "Nenhuma inst\u00E2ncia conectada. Use os controles acima para conectar." }) })) : (_jsx("div", { className: "space-y-3", children: Object.entries(instances).map(([name, info]) => (_jsxs("div", { className: "flex items-center justify-between p-3 border rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Smartphone, { className: "h-5 w-5 text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: name }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["\u00DAltima atualiza\u00E7\u00E3o: ", info.lastUpdate.toLocaleString()] })] })] }), _jsx(Badge, { variant: info.status === 'open' ? 'default' : 'secondary', className: info.status === 'open' ? 'bg-green-500 hover:bg-green-600' : '', children: info.status })] }, name))) })) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-5 w-5" }), "Mensagens Recentes (", messages.length, ")"] }) }), _jsx(CardContent, { children: messages.length === 0 ? (_jsx(Alert, { children: _jsx(AlertDescription, { children: "Nenhuma mensagem recebida ainda. As mensagens aparecer\u00E3o aqui em tempo real." }) })) : (_jsx(ScrollArea, { className: "h-[400px]", children: _jsx("div", { className: "space-y-3", children: messages.map((msg, index) => (_jsxs("div", { className: "border rounded-lg p-4 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "outline", className: "text-xs", children: msg.instance }), _jsx("span", { className: "font-medium text-sm", children: msg.pushName || msg.from })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: "secondary", className: "text-xs", children: msg.messageType }), _jsx("span", { className: "text-xs text-muted-foreground", children: msg.timestamp.toLocaleTimeString() })] })] }), _jsx("p", { className: "text-sm", children: msg.content })] }, msg.id || index))) }) })) })] })] }));
}
