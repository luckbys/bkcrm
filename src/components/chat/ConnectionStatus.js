import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// 🔗 COMPONENTE DE STATUS DE CONEXÃO WEBSOCKET
import { useState, useEffect } from 'react';
import { WifiOff, AlertCircle, Loader2, RefreshCw, Settings, Info, Clock, Users, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
export const ConnectionStatus = ({ connectionInfo, onReconnect, onSettings, className, showDetails = true, showPopover = true }) => {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [timeSinceLastSeen, setTimeSinceLastSeen] = useState('');
    // Atualizar tempo desde última conexão
    useEffect(() => {
        if (!connectionInfo.lastSeen)
            return;
        const updateTime = () => {
            const now = new Date();
            const diff = now.getTime() - connectionInfo.lastSeen.getTime();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            if (hours > 0) {
                setTimeSinceLastSeen(`${hours}h ${minutes % 60}m atrás`);
            }
            else if (minutes > 0) {
                setTimeSinceLastSeen(`${minutes}m ${seconds % 60}s atrás`);
            }
            else {
                setTimeSinceLastSeen(`${seconds}s atrás`);
            }
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [connectionInfo.lastSeen]);
    const getStatusConfig = () => {
        switch (connectionInfo.status) {
            case 'connected':
                return {
                    icon: connectionInfo.quality === 'excellent' ? Signal :
                        connectionInfo.quality === 'good' ? SignalHigh :
                            connectionInfo.quality === 'fair' ? SignalMedium : SignalLow,
                    text: 'Online',
                    color: 'text-green-500',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    badgeVariant: 'default',
                    badgeColor: 'bg-green-500'
                };
            case 'connecting':
            case 'reconnecting':
                return {
                    icon: Loader2,
                    text: connectionInfo.status === 'reconnecting' ? 'Reconectando' : 'Conectando',
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    badgeVariant: 'secondary',
                    badgeColor: 'bg-yellow-500'
                };
            case 'error':
                return {
                    icon: AlertCircle,
                    text: 'Erro',
                    color: 'text-red-500',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    badgeVariant: 'destructive',
                    badgeColor: 'bg-red-500'
                };
            default:
                return {
                    icon: WifiOff,
                    text: 'Offline',
                    color: 'text-gray-500',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    badgeVariant: 'secondary',
                    badgeColor: 'bg-gray-500'
                };
        }
    };
    const getQualityColor = () => {
        switch (connectionInfo.quality) {
            case 'excellent': return 'text-green-500';
            case 'good': return 'text-blue-500';
            case 'fair': return 'text-yellow-500';
            case 'poor': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };
    const getLatencyText = () => {
        if (!connectionInfo.latency)
            return 'N/A';
        if (connectionInfo.latency < 50)
            return 'Excelente';
        if (connectionInfo.latency < 100)
            return 'Boa';
        if (connectionInfo.latency < 200)
            return 'Regular';
        return 'Ruim';
    };
    const config = getStatusConfig();
    const Icon = config.icon;
    const StatusBadge = () => (_jsxs("div", { className: cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200', config.bgColor, config.borderColor, 'hover:shadow-sm cursor-pointer', className), children: [_jsx(Icon, { className: cn('w-4 h-4', config.color, (connectionInfo.status === 'connecting' || connectionInfo.status === 'reconnecting') && 'animate-spin') }), _jsx("span", { className: cn('text-sm font-medium', config.color), children: config.text }), showDetails && (_jsxs(_Fragment, { children: [connectionInfo.latency && connectionInfo.status === 'connected' && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [connectionInfo.latency, "ms"] })), connectionInfo.reconnectAttempts && connectionInfo.status === 'reconnecting' && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [connectionInfo.reconnectAttempts, "/", connectionInfo.maxReconnectAttempts || 5] }))] })), showPopover && _jsx(Info, { className: "w-3 h-3 text-gray-400" })] }));
    const DetailedInfo = () => (_jsxs("div", { className: "w-80 space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: cn('w-5 h-5', config.color) }), _jsx("span", { className: "font-semibold", children: config.text })] }), _jsx("div", { className: cn('w-3 h-3 rounded-full', config.badgeColor) })] }), _jsxs("div", { className: "space-y-3", children: [connectionInfo.latency && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Lat\u00EAncia:" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-sm font-medium", children: [connectionInfo.latency, "ms"] }), _jsxs("span", { className: cn('text-xs', getQualityColor()), children: ["(", getLatencyText(), ")"] })] })] })), connectionInfo.quality && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Qualidade:" }), _jsx(Badge, { variant: "outline", className: getQualityColor(), children: connectionInfo.quality === 'excellent' ? 'Excelente' :
                                    connectionInfo.quality === 'good' ? 'Boa' :
                                        connectionInfo.quality === 'fair' ? 'Regular' : 'Ruim' })] })), connectionInfo.lastSeen && connectionInfo.status !== 'connected' && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u00DAltima conex\u00E3o:" }), _jsx("span", { className: "text-sm text-gray-800", children: timeSinceLastSeen })] })), connectionInfo.clientsOnline !== undefined && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Usu\u00E1rios online:" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Users, { className: "w-3 h-3 text-gray-500" }), _jsx("span", { className: "text-sm font-medium", children: connectionInfo.clientsOnline })] })] })), connectionInfo.serverStatus && (_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Servidor:" }), _jsx(Badge, { variant: connectionInfo.serverStatus === 'online' ? 'default' : 'secondary', className: "text-xs", children: connectionInfo.serverStatus === 'online' ? 'Online' :
                                    connectionInfo.serverStatus === 'maintenance' ? 'Manutenção' : 'Offline' })] }))] }), connectionInfo.error && (_jsx("div", { className: "p-3 bg-red-50 border border-red-200 rounded-lg", children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(AlertCircle, { className: "w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-red-800", children: "Erro de Conex\u00E3o" }), _jsx("p", { className: "text-xs text-red-600 mt-1", children: connectionInfo.error })] })] }) })), _jsxs("div", { className: "flex gap-2", children: [(connectionInfo.status === 'disconnected' || connectionInfo.status === 'error') && onReconnect && (_jsxs(Button, { size: "sm", onClick: () => {
                            onReconnect();
                            setIsPopoverOpen(false);
                        }, className: "flex-1", children: [_jsx(RefreshCw, { className: "w-3 h-3 mr-1" }), "Reconectar"] })), onSettings && (_jsx(Button, { size: "sm", variant: "outline", onClick: () => {
                            onSettings();
                            setIsPopoverOpen(false);
                        }, children: _jsx(Settings, { className: "w-3 h-3" }) }))] }), _jsxs("div", { className: "flex items-center justify-center gap-1 text-xs text-gray-500 pt-2 border-t", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsxs("span", { children: ["Atualizado em ", new Date().toLocaleTimeString()] })] })] }));
    if (!showPopover) {
        return _jsx(StatusBadge, {});
    }
    return (_jsxs(Popover, { open: isPopoverOpen, onOpenChange: setIsPopoverOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: _jsx("div", { children: _jsx(StatusBadge, {}) }) }), _jsx(PopoverContent, { className: "w-auto p-4", align: "end", children: _jsx(DetailedInfo, {}) })] }));
};
// Hook para gerenciar estado de conexão
export const useConnectionStatus = () => {
    const [connectionInfo, setConnectionInfo] = useState({
        status: 'disconnected',
        latency: undefined,
        lastSeen: undefined,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,
        error: undefined,
        serverStatus: 'online',
        clientsOnline: 0,
        quality: 'good'
    });
    const updateStatus = (updates) => {
        setConnectionInfo(prev => ({ ...prev, ...updates }));
    };
    const setConnected = (latency, quality) => {
        updateStatus({
            status: 'connected',
            latency,
            quality,
            lastSeen: new Date(),
            reconnectAttempts: 0,
            error: undefined
        });
    };
    const setDisconnected = (error) => {
        updateStatus({
            status: 'disconnected',
            error,
            latency: undefined
        });
    };
    const setConnecting = () => {
        updateStatus({
            status: 'connecting',
            error: undefined
        });
    };
    const setError = (error) => {
        updateStatus({
            status: 'error',
            error,
            latency: undefined
        });
    };
    const incrementReconnectAttempt = () => {
        setConnectionInfo(prev => ({
            ...prev,
            status: 'reconnecting',
            reconnectAttempts: (prev.reconnectAttempts || 0) + 1
        }));
    };
    return {
        connectionInfo,
        updateStatus,
        setConnected,
        setDisconnected,
        setConnecting,
        setError,
        incrementReconnectAttempt
    };
};
