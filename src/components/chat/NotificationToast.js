import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
export const NotificationToast = ({ message, type, isVisible, onClose, duration = 3000, position = 'top-right', withProgress = true }) => {
    const [progress, setProgress] = useState(100);
    const [isClosing, setIsClosing] = useState(false);
    useEffect(() => {
        if (!isVisible)
            return;
        let interval;
        let timeout;
        if (withProgress && duration > 0) {
            const startTime = Date.now();
            interval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
                setProgress(remaining);
                if (remaining <= 0) {
                    clearInterval(interval);
                }
            }, 50);
            timeout = setTimeout(() => {
                setIsClosing(true);
                setTimeout(onClose, 300);
            }, duration);
        }
        return () => {
            if (interval)
                clearInterval(interval);
            if (timeout)
                clearTimeout(timeout);
        };
    }, [isVisible, duration, withProgress, onClose]);
    if (!isVisible && !isClosing)
        return null;
    const typeConfig = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            iconColor: 'text-green-500',
            textColor: 'text-green-800',
            progressColor: 'bg-green-400'
        },
        error: {
            icon: AlertCircle,
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            iconColor: 'text-red-500',
            textColor: 'text-red-800',
            progressColor: 'bg-red-400'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            iconColor: 'text-blue-500',
            textColor: 'text-blue-800',
            progressColor: 'bg-blue-400'
        },
        warning: {
            icon: AlertCircle,
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            iconColor: 'text-yellow-500',
            textColor: 'text-yellow-800',
            progressColor: 'bg-yellow-400'
        }
    };
    const config = typeConfig[type];
    const Icon = config.icon;
    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4'
    };
    return (_jsxs("div", { className: cn('fixed z-50 flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm', 'min-w-80 max-w-96 transition-all duration-300 ease-out', positionClasses[position], config.bgColor, config.borderColor, isVisible && !isClosing
            ? 'translate-x-0 opacity-100 scale-100'
            : position.includes('right')
                ? 'translate-x-full opacity-0 scale-95'
                : '-translate-x-full opacity-0 scale-95'), children: [_jsx(Icon, { className: cn('w-5 h-5 flex-shrink-0 mt-0.5', config.iconColor) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: cn('text-sm font-medium leading-relaxed', config.textColor), children: message }), withProgress && duration > 0 && (_jsx("div", { className: "mt-2 h-1 bg-gray-200 rounded-full overflow-hidden", children: _jsx("div", { className: cn('h-full transition-all duration-75 ease-linear', config.progressColor), style: { width: `${progress}%` } }) }))] }), _jsx("button", { onClick: () => {
                    setIsClosing(true);
                    setTimeout(onClose, 300);
                }, className: cn('flex-shrink-0 p-1 rounded-full transition-colors', 'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300', config.textColor), children: _jsx(X, { className: "w-4 h-4" }) })] }));
};
// Hook para gerenciar notificações
export const useNotificationToast = () => {
    const [notifications, setNotifications] = useState([]);
    const showNotification = (message, type = 'info', duration = 3000) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type, duration }]);
    };
    const hideNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };
    const NotificationContainer = () => (_jsx("div", { className: "fixed top-4 right-4 z-50 flex flex-col gap-2", children: notifications.map((notification) => (_jsx(NotificationToast, { message: notification.message, type: notification.type, isVisible: true, onClose: () => hideNotification(notification.id), duration: notification.duration }, notification.id))) }));
    return {
        showNotification,
        hideNotification,
        NotificationContainer,
        success: (message, duration) => showNotification(message, 'success', duration),
        error: (message, duration) => showNotification(message, 'error', duration),
        info: (message, duration) => showNotification(message, 'info', duration),
        warning: (message, duration) => showNotification(message, 'warning', duration)
    };
};
