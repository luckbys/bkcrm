import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
import { Maximize, Settings, FolderOpen, Plus, Volume2, VolumeX, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';
export const ActionButtons = ({ selectedSector, isFullScreen, onToggleFullScreen, soundEnabled, onToggleSound, onOpenAddTicket, variant = 'default' }) => {
    const isMobile = variant === 'mobile';
    const isCompact = variant === 'compact';
    return (_jsxs("div", { className: cn("flex items-center", isMobile ? "space-x-1" : "space-x-2"), children: [_jsxs(Button, { onClick: onOpenAddTicket, size: isMobile ? "sm" : "sm", className: cn("bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 border-0 transition-all duration-200 ease-out hover:scale-105 active:scale-95 group", isMobile
                    ? "h-8 px-2 rounded-lg"
                    : isCompact
                        ? "h-9 px-3 rounded-xl"
                        : "h-10 px-4 rounded-xl"), children: [_jsx(Plus, { className: cn("transition-transform group-hover:rotate-90 duration-200", isMobile ? "w-3 h-3" : "w-4 h-4", !isMobile && "mr-2") }), !isMobile && (_jsx("span", { className: cn(isCompact ? "hidden md:inline" : "hidden md:inline"), children: isCompact ? "Novo" : "Novo Ticket" }))] }), _jsxs("div", { className: cn("flex items-center", isMobile ? "space-x-1" : "space-x-1"), children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onToggleSound(!soundEnabled), className: cn("backdrop-blur-sm transition-all duration-200 ease-out group", isMobile
                            ? "h-8 w-8 rounded-lg"
                            : isCompact
                                ? "h-9 w-9 rounded-xl"
                                : "h-10 w-10 rounded-xl", soundEnabled
                            ? "bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 text-blue-600"
                            : "bg-white/60 hover:bg-white/80 border border-gray-200/60 text-gray-600 hover:text-gray-900"), title: soundEnabled ? "Desativar sons" : "Ativar sons", children: soundEnabled ?
                            _jsx(Volume2, { className: cn("transition-transform group-hover:scale-110 duration-200", isMobile ? "w-3 h-3" : "w-4 h-4") }) :
                            _jsx(VolumeX, { className: cn("transition-transform group-hover:scale-110 duration-200", isMobile ? "w-3 h-3" : "w-4 h-4") }) }), !isMobile && (_jsx(Button, { variant: "ghost", size: "sm", onClick: onToggleFullScreen, className: cn("bg-white/60 hover:bg-white/80 border border-gray-200/60 hover:border-gray-300/80 text-gray-600 hover:text-gray-900 backdrop-blur-sm transition-all duration-200 ease-out group", isCompact
                            ? "h-9 w-9 rounded-xl"
                            : "h-10 w-10 rounded-xl"), title: isFullScreen ? "Sair do modo tela cheia" : "Modo tela cheia", children: isFullScreen ?
                            _jsx(Minimize, { className: "w-4 h-4 transition-transform group-hover:scale-110 duration-200" }) :
                            _jsx(Maximize, { className: "w-4 h-4 transition-transform group-hover:scale-110 duration-200" }) })), !isMobile && !isCompact && (_jsx(Button, { variant: "ghost", size: "sm", className: "h-10 w-10 rounded-xl bg-white/60 hover:bg-white/80 border border-gray-200/60 hover:border-gray-300/80 text-gray-600 hover:text-gray-900 backdrop-blur-sm transition-all duration-200 ease-out group", title: "Gerenciar pacotes", children: _jsx(FolderOpen, { className: "w-4 h-4 transition-transform group-hover:scale-110 duration-200" }) })), !isMobile && (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => console.log(`Settings for sector: ${selectedSector.tipo}`), className: cn("bg-white/60 hover:bg-white/80 border border-gray-200/60 hover:border-gray-300/80 text-gray-600 hover:text-gray-900 backdrop-blur-sm transition-all duration-200 ease-out group", isCompact
                            ? "h-9 w-9 rounded-xl"
                            : "h-10 w-10 rounded-xl"), title: "Configura\u00E7\u00F5es", children: _jsx(Settings, { className: "w-4 h-4 transition-transform group-hover:rotate-90 duration-200" }) }))] })] }));
};
