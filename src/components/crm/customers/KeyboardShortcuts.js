import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Filter, Eye, Settings, Command } from 'lucide-react';
const shortcuts = [
    {
        category: 'Navegação Geral',
        icon: _jsx(Command, { className: "w-4 h-4" }),
        items: [
            { keys: ['Ctrl', 'N'], description: 'Novo cliente', action: 'onAddCustomer' },
            { keys: ['Ctrl', 'F'], description: 'Buscar cliente', action: 'onSearch' },
            { keys: ['Ctrl', 'E'], description: 'Exportar dados', action: 'onExport' },
            { keys: ['F5'], description: 'Atualizar lista', action: 'onRefresh' },
            { keys: ['Ctrl', 'L'], description: 'Limpar filtros', action: 'onClearFilters' },
            { keys: ['?'], description: 'Mostrar atalhos', action: 'onShowHelp' }
        ]
    },
    {
        category: 'Filtros e Visualização',
        icon: _jsx(Filter, { className: "w-4 h-4" }),
        items: [
            { keys: ['Ctrl', 'Shift', 'F'], description: 'Alternar filtros avançados', action: 'onToggleFilters' },
            { keys: ['Ctrl', 'Shift', 'V'], description: 'Alternar modo de visualização', action: 'onToggleView' },
            { keys: ['Ctrl', 'Shift', '1'], description: 'Filtrar por ativos', action: 'onFilterActive' },
            { keys: ['Ctrl', 'Shift', '2'], description: 'Filtrar por inativos', action: 'onFilterInactive' },
            { keys: ['Ctrl', 'Shift', '3'], description: 'Filtrar por prospects', action: 'onFilterProspects' }
        ]
    },
    {
        category: 'Seleção e Navegação',
        icon: _jsx(Eye, { className: "w-4 h-4" }),
        items: [
            { keys: ['Ctrl', 'A'], description: 'Selecionar todos', action: 'onSelectAll' },
            { keys: ['Escape'], description: 'Limpar seleção', action: 'onClearSelection' },
            { keys: ['↑', '↓'], description: 'Navegar entre clientes', action: 'navigation' },
            { keys: ['Home'], description: 'Primeiro cliente', action: 'onFirstCustomer' },
            { keys: ['End'], description: 'Último cliente', action: 'onLastCustomer' },
            { keys: ['Enter'], description: 'Ver detalhes do cliente', action: 'onViewCustomer' }
        ]
    },
    {
        category: 'Ações do Cliente',
        icon: _jsx(Settings, { className: "w-4 h-4" }),
        items: [
            { keys: ['Ctrl', 'Enter'], description: 'Editar cliente selecionado', action: 'onEditCustomer' },
            { keys: ['Delete'], description: 'Excluir cliente selecionado', action: 'onDeleteCustomer' },
            { keys: ['Ctrl', 'P'], description: 'Ligar para cliente', action: 'onCallCustomer' },
            { keys: ['Ctrl', 'M'], description: 'Enviar email', action: 'onEmailCustomer' },
            { keys: ['Ctrl', 'W'], description: 'Enviar WhatsApp', action: 'onWhatsAppCustomer' }
        ]
    }
];
export const KeyboardShortcuts = ({ isOpen, onClose }) => {
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [_jsx(Keyboard, { className: "w-5 h-5" }), _jsx("span", { children: "Atalhos de Teclado" })] }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: shortcuts.map((category, categoryIndex) => (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "flex items-center space-x-2 text-lg", children: [category.icon, _jsx("span", { children: category.category })] }) }), _jsx(CardContent, { className: "space-y-3", children: category.items.map((item, itemIndex) => (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-700", children: item.description }), _jsx("div", { className: "flex items-center space-x-1", children: item.keys.map((key, keyIndex) => (_jsxs("div", { className: "flex items-center space-x-1", children: [keyIndex > 0 && (_jsx("span", { className: "text-xs text-gray-400", children: "+" })), _jsx(Badge, { variant: "secondary", className: "px-2 py-1 text-xs font-mono", children: key })] }, keyIndex))) })] }, itemIndex))) })] }, categoryIndex))) }), _jsx(Separator, {}), _jsx("div", { className: "text-center text-sm text-gray-600", children: _jsxs("p", { children: ["Pressione ", _jsx(Badge, { variant: "secondary", className: "px-2 py-1 text-xs", children: "?" }), " a qualquer momento para ver estes atalhos"] }) })] }) }));
};
// Hook para gerenciar atalhos de teclado
export const useKeyboardShortcuts = (handlers) => {
    const handleKeyDown = useCallback((event) => {
        const { ctrlKey, shiftKey, key, code } = event;
        // Ignorar se estiver digitando em um input
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.getAttribute('contenteditable'))) {
            return;
        }
        // Atalhos principais
        if (ctrlKey && !shiftKey) {
            switch (key.toLowerCase()) {
                case 'n':
                    event.preventDefault();
                    handlers.onAddCustomer();
                    break;
                case 'f':
                    event.preventDefault();
                    handlers.onSearch();
                    break;
                case 'e':
                    event.preventDefault();
                    handlers.onExport();
                    break;
                case 'a':
                    event.preventDefault();
                    handlers.onSelectAll();
                    break;
                case 'p':
                    event.preventDefault();
                    // handlers.onCallCustomer();
                    break;
                case 'm':
                    event.preventDefault();
                    // handlers.onEmailCustomer();
                    break;
                case 'w':
                    event.preventDefault();
                    // handlers.onWhatsAppCustomer();
                    break;
                case 'l':
                    event.preventDefault();
                    // handlers.onClearFilters();
                    break;
            }
        }
        // Atalhos com Ctrl + Shift
        if (ctrlKey && shiftKey) {
            switch (key.toLowerCase()) {
                case 'f':
                    event.preventDefault();
                    handlers.onToggleFilters();
                    break;
                case 'v':
                    event.preventDefault();
                    handlers.onToggleView();
                    break;
                case '1':
                    event.preventDefault();
                    // handlers.onFilterActive();
                    break;
                case '2':
                    event.preventDefault();
                    // handlers.onFilterInactive();
                    break;
                case '3':
                    event.preventDefault();
                    // handlers.onFilterProspects();
                    break;
            }
        }
        // Atalhos simples
        if (!ctrlKey && !shiftKey) {
            switch (key) {
                case 'F5':
                    event.preventDefault();
                    handlers.onRefresh();
                    break;
                case 'Escape':
                    event.preventDefault();
                    handlers.onClearSelection();
                    break;
                case 'Home':
                    event.preventDefault();
                    handlers.onFirstCustomer();
                    break;
                case 'End':
                    event.preventDefault();
                    handlers.onLastCustomer();
                    break;
                case '?':
                    event.preventDefault();
                    // handlers.onShowHelp();
                    break;
            }
        }
        // Teclas especiais
        switch (code) {
            case 'Delete':
                if (!ctrlKey && !shiftKey) {
                    event.preventDefault();
                    // handlers.onDeleteCustomer();
                }
                break;
        }
    }, [handlers]);
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};
// Componente para mostrar dicas de atalhos
export const ShortcutHint = ({ shortcut, description, className = '' }) => {
    return (_jsxs("div", { className: `flex items-center space-x-2 text-xs text-gray-500 ${className}`, children: [_jsxs("span", { children: [description, ":"] }), _jsx("div", { className: "flex items-center space-x-1", children: shortcut.map((key, index) => (_jsxs("div", { className: "flex items-center space-x-1", children: [index > 0 && _jsx("span", { children: "+" }), _jsx(Badge, { variant: "outline", className: "px-1 py-0 text-xs", children: key })] }, index))) })] }));
};
