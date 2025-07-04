import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
export const NotificationSystem = ({ notifications, onDismiss, position = 'top-right' }) => {
    const [visibleNotifications, setVisibleNotifications] = useState(notifications);
    useEffect(() => {
        setVisibleNotifications(notifications);
    }, [notifications]);
    useEffect(() => {
        const timers = {};
        visibleNotifications.forEach((notification) => {
            if (!notification.persistent && notification.duration) {
                timers[notification.id] = setTimeout(() => {
                    onDismiss(notification.id);
                }, notification.duration);
            }
        });
        return () => {
            Object.values(timers).forEach((timer) => clearTimeout(timer));
        };
    }, [visibleNotifications, onDismiss]);
    const getIcon = (type) => {
        const icons = {
            success: _jsx(CheckCircle, { className: "w-5 h-5 text-green-600" }),
            error: _jsx(XCircle, { className: "w-5 h-5 text-red-600" }),
            warning: _jsx(AlertCircle, { className: "w-5 h-5 text-yellow-600" }),
            info: _jsx(Info, { className: "w-5 h-5 text-blue-600" })
        };
        return icons[type];
    };
    const getColors = (type) => {
        const colors = {
            success: 'border-green-200 bg-green-50',
            error: 'border-red-200 bg-red-50',
            warning: 'border-yellow-200 bg-yellow-50',
            info: 'border-blue-200 bg-blue-50'
        };
        return colors[type];
    };
    const getPositionClasses = () => {
        const positions = {
            'top-right': 'top-4 right-4',
            'top-left': 'top-4 left-4',
            'bottom-right': 'bottom-4 right-4',
            'bottom-left': 'bottom-4 left-4'
        };
        return positions[position];
    };
    if (visibleNotifications.length === 0)
        return null;
    return (_jsx("div", { className: `fixed ${getPositionClasses()} z-50 space-y-2 max-w-sm w-full`, children: visibleNotifications.map((notification) => (_jsx(Card, { className: `${getColors(notification.type)} border shadow-lg animate-in slide-in-from-right-full duration-300`, children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx("div", { className: "flex-shrink-0 mt-0.5", children: getIcon(notification.type) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: notification.title }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: notification.message })] }), !notification.persistent && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onDismiss(notification.id), className: "h-6 w-6 p-0 text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-4 h-4" }) }))] }), notification.progress !== undefined && (_jsxs("div", { className: "mt-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-gray-600 mb-1", children: [_jsx("span", { children: "Progresso" }), _jsxs("span", { children: [notification.progress, "%"] })] }), _jsx(Progress, { value: notification.progress, className: "h-2" })] })), notification.actions && notification.actions.length > 0 && (_jsx("div", { className: "flex space-x-2 mt-3", children: notification.actions.map((action, index) => (_jsx(Button, { variant: action.variant || 'outline', size: "sm", onClick: action.action, className: "text-xs", children: action.label }, index))) }))] })] }) }) }, notification.id))) }));
};
// Hook para gerenciar notificações
export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const addNotification = useCallback((notification) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { ...notification, id }]);
        return id;
    }, []);
    const updateNotification = useCallback((id, updates) => {
        setNotifications(prev => prev.map(notification => notification.id === id
            ? { ...notification, ...updates }
            : notification));
    }, []);
    const dismissNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);
    // Notificações pré-configuradas
    const notify = {
        success: (title, message, options) => addNotification({ type: 'success', title, message, duration: 5000, ...options }),
        error: (title, message, options) => addNotification({ type: 'error', title, message, duration: 7000, ...options }),
        warning: (title, message, options) => addNotification({ type: 'warning', title, message, duration: 6000, ...options }),
        info: (title, message, options) => addNotification({ type: 'info', title, message, duration: 5000, ...options }),
        // Notificações especializadas para CRM
        customerAdded: (customerName) => notify.success('✅ Cliente cadastrado', `${customerName} foi adicionado com sucesso`, {
            actions: [
                {
                    label: 'Ver cliente',
                    action: () => console.log('Ver cliente'),
                    variant: 'outline'
                }
            ]
        }),
        customerUpdated: (customerName) => notify.success('✅ Cliente atualizado', `Dados de ${customerName} foram atualizados`),
        customerDeleted: (customerName) => notify.success('✅ Cliente removido', `${customerName} foi removido do sistema`),
        exportStarted: (recordCount) => {
            const id = notify.info('📊 Iniciando exportação', `Preparando ${recordCount} registros para download`, {
                persistent: true,
                progress: 0,
                actions: [
                    {
                        label: 'Cancelar',
                        action: () => dismissNotification(id),
                        variant: 'outline'
                    }
                ]
            });
            return id;
        },
        exportProgress: (id, progress) => updateNotification(id, {
            progress,
            message: `Processando... ${progress}% concluído`
        }),
        exportCompleted: (id, fileName) => updateNotification(id, {
            type: 'success',
            title: '✅ Exportação concluída',
            message: `Arquivo ${fileName} está pronto para download`,
            progress: undefined,
            persistent: false,
            duration: 5000,
            actions: [
                {
                    label: 'Download',
                    action: () => console.log('Download file'),
                    variant: 'default'
                }
            ]
        }),
        contactInitiated: (customerName, method) => notify.info(`${method === 'phone' ? '📞' : method === 'email' ? '📧' : '💬'} Contato iniciado`, `Conectando com ${customerName} via ${method}`),
        bulkActionStarted: (action, count) => {
            const id = notify.info(`🔄 ${action} em lote`, `Processando ${count} clientes...`, {
                persistent: true,
                progress: 0
            });
            return id;
        },
        connectionError: () => notify.error('🔌 Erro de conexão', 'Problema ao conectar com o servidor', {
            actions: [
                {
                    label: 'Tentar novamente',
                    action: () => window.location.reload(),
                    variant: 'default'
                }
            ],
            persistent: true
        }),
        filterApplied: (resultCount, totalCount) => notify.info('🔍 Filtros aplicados', `Mostrando ${resultCount} de ${totalCount} clientes`, { duration: 3000 }),
        dataRefreshed: () => notify.success('🔄 Dados atualizados', 'Lista de clientes foi atualizada', { duration: 3000 })
    };
    return {
        notifications,
        addNotification,
        updateNotification,
        dismissNotification,
        clearAll,
        notify
    };
};
