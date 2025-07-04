import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Input } from '../ui/input';
import { X, Minimize2, Settings, Phone, Video, Search, Wifi, WifiOff, Activity, Minimize, Maximize } from 'lucide-react';
import { cn } from '../../lib/utils';
export const ChatHeader = ({ participant, channel, state, onClose, onMinimize, onSettings, onCall, onVideoCall, onSearch, searchQuery = '', isCompactMode = false, onToggleCompact }) => {
    const getConnectionIcon = () => {
        switch (state.connectionStatus) {
            case 'connected':
                return _jsx(Wifi, { className: "w-4 h-4 text-green-500" });
            case 'connecting':
                return _jsx(Activity, { className: "w-4 h-4 text-yellow-500 animate-spin" });
            default:
                return _jsx(WifiOff, { className: "w-4 h-4 text-red-500" });
        }
    };
    return (_jsxs("div", { className: "flex flex-col border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center justify-between p-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative", children: [_jsx(Avatar, { className: "w-10 h-10 ring-2 ring-blue-200", children: _jsx(AvatarFallback, { className: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold", children: participant.name.charAt(0).toUpperCase() }) }), _jsx("div", { className: cn("absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full", participant.isOnline ? "bg-green-500" : "bg-gray-400") })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900", children: participant.name }), _jsx(Badge, { variant: "outline", className: "text-xs", children: channel.name })] }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600", children: [getConnectionIcon(), _jsx("span", { className: "capitalize", children: state.connectionStatus === 'connected' ? 'Online' : state.connectionStatus }), state.isTyping && (_jsx("span", { className: "text-blue-600 animate-pulse", children: "\u2022 digitando..." }))] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [onCall && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onCall, children: _jsx(Phone, { className: "w-4 h-4" }) })), onVideoCall && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onVideoCall, children: _jsx(Video, { className: "w-4 h-4" }) })), onToggleCompact && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onToggleCompact, children: isCompactMode ? _jsx(Maximize, { className: "w-4 h-4" }) : _jsx(Minimize, { className: "w-4 h-4" }) })), onSettings && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onSettings, children: _jsx(Settings, { className: "w-4 h-4" }) })), onMinimize && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onMinimize, children: _jsx(Minimize2, { className: "w-4 h-4" }) })), _jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, children: _jsx(X, { className: "w-4 h-4" }) })] })] }), onSearch && (_jsx("div", { className: "px-4 pb-3", children: _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx(Input, { value: searchQuery, onChange: (e) => onSearch(e.target.value), placeholder: "Buscar mensagens...", className: "pl-10 bg-white/80 border-gray-200 focus:bg-white" })] }) }))] }));
};
