import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Settings, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useState } from 'react';
export const UserProfile = () => {
    const { signOut, user } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut();
        }
        catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
        finally {
            setIsLoggingOut(false);
        }
    };
    // Pega as iniciais do usuário para o avatar
    const getUserInitials = () => {
        if (user?.email) {
            return user.email.substring(0, 2).toUpperCase();
        }
        return 'US';
    };
    // Pega o nome do usuário ou email
    const getUserName = () => {
        if (user?.user_metadata?.name) {
            return user.user_metadata.name;
        }
        if (user?.email) {
            return user.email.split('@')[0];
        }
        return 'Usuário';
    };
    const getUserEmail = () => {
        return user?.email || '';
    };
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", className: "\r\n            h-10 px-2 py-1 rounded-xl\r\n            bg-white/60 hover:bg-white/80\r\n            border border-gray-200/60 hover:border-gray-300/80\r\n            shadow-sm hover:shadow-md\r\n            backdrop-blur-sm\r\n            transition-all duration-200 ease-out\r\n            group\r\n          ", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs(Avatar, { className: "h-7 w-7 ring-2 ring-white/80 shadow-sm", children: [_jsx(AvatarImage, { src: user?.user_metadata?.avatar_url }), _jsx(AvatarFallback, { className: "\r\n                bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 \r\n                text-white font-semibold text-xs\r\n              ", children: getUserInitials() })] }), _jsx("div", { className: "hidden lg:block text-left", children: _jsx("span", { className: "text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors", children: getUserName() }) }), _jsx(ChevronDown, { className: "w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-all group-hover:rotate-180 duration-200" })] }) }) }), _jsxs(DropdownMenuContent, { align: "end", className: "\r\n          w-64 p-3\r\n          bg-white/95 backdrop-blur-xl\r\n          border border-gray-200/50\r\n          shadow-2xl shadow-black/5\r\n          rounded-2xl\r\n          animate-in slide-in-from-top-2 duration-300\r\n        ", children: [_jsx(DropdownMenuLabel, { className: "p-0 mb-3", children: _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs(Avatar, { className: "h-12 w-12 ring-2 ring-blue-100 shadow-sm", children: [_jsx(AvatarImage, { src: user?.user_metadata?.avatar_url }), _jsx(AvatarFallback, { className: "\r\n                bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 \r\n                text-white font-semibold\r\n              ", children: getUserInitials() })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold text-gray-900 truncate", children: getUserName() }), _jsx("p", { className: "text-xs text-gray-500 truncate", children: getUserEmail() }), _jsxs("div", { className: "flex items-center mt-1", children: [_jsx("div", { className: "w-2 h-2 bg-emerald-400 rounded-full mr-2" }), _jsx("span", { className: "text-xs text-gray-400 font-medium", children: "Online" })] })] })] }) }), _jsx(DropdownMenuSeparator, { className: "my-3 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent h-px border-0" }), _jsxs("div", { className: "space-y-1", children: [_jsxs(DropdownMenuItem, { className: "\r\n            flex items-center p-3 rounded-xl\r\n            hover:bg-gray-50/80 hover:backdrop-blur-sm\r\n            transition-all duration-200 ease-out\r\n            cursor-pointer group\r\n            focus:bg-gray-50/80\r\n            focus:outline-none focus:ring-2 focus:ring-blue-500/20\r\n            border border-transparent hover:border-gray-200/50\r\n          ", children: [_jsx("div", { className: "\r\n              mr-3 p-2 rounded-lg\r\n              bg-gray-100/50 group-hover:bg-blue-50/80\r\n              transition-all duration-200\r\n              group-hover:scale-105\r\n            ", children: _jsx(User, { className: "w-4 h-4 text-gray-500 group-hover:text-blue-600 transition-colors duration-200" }) }), _jsx("span", { className: "text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors", children: "Minha Conta" })] }), _jsxs(DropdownMenuItem, { className: "\r\n            flex items-center p-3 rounded-xl\r\n            hover:bg-gray-50/80 hover:backdrop-blur-sm\r\n            transition-all duration-200 ease-out\r\n            cursor-pointer group\r\n            focus:bg-gray-50/80\r\n            focus:outline-none focus:ring-2 focus:ring-blue-500/20\r\n            border border-transparent hover:border-gray-200/50\r\n          ", children: [_jsx("div", { className: "\r\n              mr-3 p-2 rounded-lg\r\n              bg-gray-100/50 group-hover:bg-amber-50/80\r\n              transition-all duration-200\r\n              group-hover:scale-105\r\n            ", children: _jsx(Settings, { className: "w-4 h-4 text-gray-500 group-hover:text-amber-600 transition-colors duration-200" }) }), _jsx("span", { className: "text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors", children: "Configura\u00E7\u00F5es" })] }), _jsxs(DropdownMenuItem, { className: "\r\n            flex items-center p-3 rounded-xl\r\n            hover:bg-gray-50/80 hover:backdrop-blur-sm\r\n            transition-all duration-200 ease-out\r\n            cursor-pointer group\r\n            focus:bg-gray-50/80\r\n            focus:outline-none focus:ring-2 focus:ring-blue-500/20\r\n            border border-transparent hover:border-gray-200/50\r\n          ", children: [_jsx("div", { className: "\r\n              mr-3 p-2 rounded-lg\r\n              bg-gray-100/50 group-hover:bg-emerald-50/80\r\n              transition-all duration-200\r\n              group-hover:scale-105\r\n            ", children: _jsx(Shield, { className: "w-4 h-4 text-gray-500 group-hover:text-emerald-600 transition-colors duration-200" }) }), _jsx("span", { className: "text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors", children: "Privacidade" })] })] }), _jsx(DropdownMenuSeparator, { className: "my-3 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent h-px border-0" }), _jsxs(DropdownMenuItem, { className: "\r\n            flex items-center p-3 rounded-xl\r\n            hover:bg-red-50/80 hover:backdrop-blur-sm\r\n            transition-all duration-200 ease-out\r\n            cursor-pointer group\r\n            focus:bg-red-50/80\r\n            focus:outline-none focus:ring-2 focus:ring-red-500/20\r\n            border border-transparent hover:border-red-200/50\r\n          ", onClick: handleLogout, disabled: isLoggingOut, children: [_jsx("div", { className: "\r\n            mr-3 p-2 rounded-lg\r\n            bg-gray-100/50 group-hover:bg-red-50/80\r\n            transition-all duration-200\r\n            group-hover:scale-105\r\n          ", children: _jsx(LogOut, { className: "w-4 h-4 text-gray-500 group-hover:text-red-600 transition-colors duration-200" }) }), _jsx("span", { className: "text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors", children: isLoggingOut ? 'Saindo...' : 'Sair da Conta' })] })] })] }));
};
