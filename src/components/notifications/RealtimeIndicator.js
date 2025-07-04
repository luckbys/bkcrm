import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from '@/components/ui/badge';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
export function RealtimeIndicator() {
    const { isConnected, unreadCount } = useRealtimeNotifications();
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: `w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse` }), _jsx(Badge, { variant: isConnected ? 'default' : 'secondary', className: "text-xs", children: isConnected ? 'Online' : 'Offline' }), unreadCount > 0 && (_jsxs(Badge, { variant: "destructive", className: "text-xs", children: [unreadCount, " nova", unreadCount > 1 ? 's' : ''] }))] }));
}
