import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { menuItems } from '@/data/sectors';
import { Menu, ExternalLink, BarChart3, User, Package, TrendingUp, Folder, ClipboardCheck, Settings, Boxes, Activity, ChevronRight, Smartphone } from 'lucide-react';
export const MainMenu = ({ onNavigate }) => {
    const handleMenuClick = (item) => {
        if (item.external) {
            window.open(item.url, '_blank');
        }
        else {
            console.log(`Navegando para: ${item.url}`);
            // Mapear URLs para views do sistema
            const viewMap = {
                '/dashboard': 'dashboard',
                '/clientes': 'clientes',
                '/produtos': 'produtos',
                '/disparos': 'disparos',
                '/tarefas': 'tarefas',
                '/processos': 'processos',
                '/kanban': 'kanban',
                '/estatisticas': 'estatisticas',
                '/admin': 'admin',
                '/setup': 'setup'
            };
            const view = viewMap[item.url];
            if (view && onNavigate) {
                onNavigate(view);
            }
        }
    };
    const getIconComponent = (iconName) => {
        const iconMap = {
            'tachometer-alt': BarChart3,
            'user': User,
            'box-open': Package,
            'chart-line': TrendingUp,
            'smartphone': Smartphone,
            'sitemap': Folder,
            'clipboard-check': ClipboardCheck,
            'chart-bar': Activity,
            'cogs': Settings,
            'cubes': Boxes
        };
        const IconComponent = iconMap[iconName] || ClipboardCheck;
        return _jsx(IconComponent, { className: "w-4 h-4" });
    };
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", size: "sm", className: "\r\n            h-10 px-3 rounded-xl\r\n            bg-white/60 hover:bg-white/80\r\n            border border-gray-200/60 hover:border-gray-300/80\r\n            text-gray-600 hover:text-gray-900\r\n            shadow-sm hover:shadow-md\r\n            backdrop-blur-sm\r\n            transition-all duration-200 ease-out\r\n            group\r\n          ", children: [_jsx(Menu, { className: "w-4 h-4 mr-2 transition-transform group-hover:scale-110 duration-200" }), _jsx("span", { className: "hidden sm:inline font-medium text-sm", children: "Menus" })] }) }), _jsxs(DropdownMenuContent, { align: "start", className: "\r\n          w-72 p-3\r\n          bg-white/95 backdrop-blur-xl\r\n          border border-gray-200/50\r\n          shadow-2xl shadow-black/5\r\n          rounded-2xl\r\n          animate-in slide-in-from-top-2 duration-300\r\n        ", children: [_jsxs("div", { className: "mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-1", children: "Navega\u00E7\u00E3o" }), _jsx("p", { className: "text-xs text-gray-500", children: "Acesse os m\u00F3dulos do sistema" })] }), _jsx("div", { className: "space-y-1", children: menuItems.map((item, index) => (_jsxs("div", { children: [_jsxs(DropdownMenuItem, { onClick: () => handleMenuClick(item), className: "\r\n                  flex items-center p-3 rounded-xl\r\n                  hover:bg-gray-50/80 hover:backdrop-blur-sm\r\n                  transition-all duration-200 ease-out\r\n                  cursor-pointer group\r\n                  focus:bg-gray-50/80\r\n                  focus:outline-none focus:ring-2 focus:ring-blue-500/20\r\n                  border border-transparent hover:border-gray-200/50\r\n                ", children: [_jsx("div", { className: "\r\n                  mr-3 p-2 rounded-lg\r\n                  bg-gray-100/50 group-hover:bg-blue-50/80\r\n                  transition-all duration-200\r\n                  group-hover:scale-105\r\n                ", children: _jsx("div", { className: "text-gray-500 group-hover:text-blue-600 transition-colors duration-200", children: getIconComponent(item.icon) }) }), _jsx("div", { className: "flex-1 min-w-0", children: _jsx("span", { className: "\r\n                    text-sm font-medium text-gray-700\r\n                    group-hover:text-gray-900\r\n                    transition-colors duration-200\r\n                    block truncate\r\n                  ", children: item.name }) }), _jsx("div", { className: "flex items-center ml-3", children: item.external ? (_jsx(ExternalLink, { className: "\r\n                      w-4 h-4 text-gray-400\r\n                      group-hover:text-blue-500\r\n                      transition-all duration-200\r\n                    " })) : (_jsx(ChevronRight, { className: "\r\n                      w-4 h-4 text-gray-300\r\n                      group-hover:text-gray-500\r\n                      transition-all duration-200\r\n                      group-hover:translate-x-0.5\r\n                    " })) })] }), index === 4 && (_jsx(DropdownMenuSeparator, { className: "\r\n                  my-3 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent\r\n                  h-px border-0\r\n                " }))] }, item.name))) }), _jsxs("div", { className: "\r\n          mt-4 pt-3 border-t border-gray-100/60\r\n          text-xs text-gray-500 text-center\r\n          font-medium\r\n        ", children: [menuItems.length, " m\u00F3dulos dispon\u00EDveis"] })] })] }));
};
