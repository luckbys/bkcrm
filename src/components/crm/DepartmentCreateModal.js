import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Building2, AlertCircle, Clock, CheckCircle, Loader2, Sparkles, Target, MessageSquare, Users, Phone, Headphones, DollarSign, UserCheck, Megaphone, Settings, Shield, Zap, Heart, Star, Briefcase, Home, Globe, Mail, Calendar, FileText, Database, Server, Wifi, Camera, ShoppingCart, Truck, CreditCard, Lock, Key, Eye, Search, Filter, Plus, Minus, Edit, Trash2, Archive, Flag, Bookmark, ThumbsUp, ThumbsDown, Smile, Frown, Meh } from 'lucide-react';
import { cn } from '../../lib/utils';
const priorityOptions = [
    {
        value: 'high',
        label: 'Alta Prioridade',
        description: 'Departamento crítico com atendimento prioritário',
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
    },
    {
        value: 'medium',
        label: 'Prioridade Média',
        description: 'Departamento padrão com atendimento regular',
        icon: Clock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
    },
    {
        value: 'low',
        label: 'Baixa Prioridade',
        description: 'Departamento com atendimento quando possível',
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
    }
];
const departmentTemplates = [
    {
        name: 'Atendimento ao Cliente',
        priority: 'high',
        description: 'Suporte geral e resolução de problemas dos clientes',
        icon: 'Headphones'
    },
    {
        name: 'Vendas',
        priority: 'high',
        description: 'Captação de leads e fechamento de vendas',
        icon: 'DollarSign'
    },
    {
        name: 'Suporte Técnico',
        priority: 'medium',
        description: 'Assistência técnica especializada',
        icon: 'Settings'
    },
    {
        name: 'Financeiro',
        priority: 'medium',
        description: 'Cobrança, pagamentos e questões financeiras',
        icon: 'CreditCard'
    },
    {
        name: 'RH - Recursos Humanos',
        priority: 'low',
        description: 'Gestão de pessoas e processos internos',
        icon: 'Users'
    },
    {
        name: 'Marketing',
        priority: 'low',
        description: 'Campanhas, promoções e relacionamento',
        icon: 'Megaphone'
    }
];
const availableIcons = [
    { name: 'Building2', icon: Building2, category: 'Geral' },
    { name: 'Users', icon: Users, category: 'Pessoas' },
    { name: 'Headphones', icon: Headphones, category: 'Suporte' },
    { name: 'Phone', icon: Phone, category: 'Comunicação' },
    { name: 'DollarSign', icon: DollarSign, category: 'Financeiro' },
    { name: 'UserCheck', icon: UserCheck, category: 'Pessoas' },
    { name: 'Megaphone', icon: Megaphone, category: 'Marketing' },
    { name: 'Settings', icon: Settings, category: 'Técnico' },
    { name: 'Shield', icon: Shield, category: 'Segurança' },
    { name: 'Zap', icon: Zap, category: 'Energia' },
    { name: 'Heart', icon: Heart, category: 'Emoção' },
    { name: 'Star', icon: Star, category: 'Destaque' },
    { name: 'Briefcase', icon: Briefcase, category: 'Negócios' },
    { name: 'Home', icon: Home, category: 'Local' },
    { name: 'Globe', icon: Globe, category: 'Mundo' },
    { name: 'Mail', icon: Mail, category: 'Comunicação' },
    { name: 'Calendar', icon: Calendar, category: 'Tempo' },
    { name: 'FileText', icon: FileText, category: 'Documentos' },
    { name: 'Database', icon: Database, category: 'Técnico' },
    { name: 'Server', icon: Server, category: 'Técnico' },
    { name: 'Wifi', icon: Wifi, category: 'Técnico' },
    { name: 'Camera', icon: Camera, category: 'Mídia' },
    { name: 'ShoppingCart', icon: ShoppingCart, category: 'Comércio' },
    { name: 'Truck', icon: Truck, category: 'Logística' },
    { name: 'CreditCard', icon: CreditCard, category: 'Financeiro' },
    { name: 'Lock', icon: Lock, category: 'Segurança' },
    { name: 'Key', icon: Key, category: 'Segurança' },
    { name: 'Eye', icon: Eye, category: 'Visual' },
    { name: 'Search', icon: Search, category: 'Busca' },
    { name: 'Filter', icon: Filter, category: 'Filtros' },
    { name: 'Plus', icon: Plus, category: 'Ações' },
    { name: 'Minus', icon: Minus, category: 'Ações' },
    { name: 'Edit', icon: Edit, category: 'Ações' },
    { name: 'Trash2', icon: Trash2, category: 'Ações' },
    { name: 'Archive', icon: Archive, category: 'Ações' },
    { name: 'Flag', icon: Flag, category: 'Marcadores' },
    { name: 'Bookmark', icon: Bookmark, category: 'Marcadores' },
    { name: 'ThumbsUp', icon: ThumbsUp, category: 'Feedback' },
    { name: 'ThumbsDown', icon: ThumbsDown, category: 'Feedback' },
    { name: 'Smile', icon: Smile, category: 'Emoção' },
    { name: 'Frown', icon: Frown, category: 'Emoção' },
    { name: 'Meh', icon: Meh, category: 'Emoção' },
    { name: 'MessageSquare', icon: MessageSquare, category: 'Comunicação' },
    { name: 'Target', icon: Target, category: 'Objetivos' },
    { name: 'AlertCircle', icon: AlertCircle, category: 'Alertas' },
    { name: 'Clock', icon: Clock, category: 'Tempo' },
    { name: 'CheckCircle', icon: CheckCircle, category: 'Status' }
];
export const DepartmentCreateModal = ({ isOpen, onClose, onSubmit, isLoading = false, editMode = false, initialData }) => {
    // Estados do modal
    const [name, setName] = useState('');
    const [priority, setPriority] = useState('medium');
    const [description, setDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Building2');
    const [step, setStep] = useState(editMode ? 'custom' : 'template');
    // Ref para controlar se já inicializou os valores
    const initializedRef = useRef(false);
    const isOpenRef = useRef(isOpen);
    // Atualizar ref quando isOpen mudar
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);
    // Inicializar valores apenas uma vez quando o modal abrir em modo edição
    useEffect(() => {
        if (isOpen && editMode && initialData && !initializedRef.current) {
            setName(initialData.name);
            setPriority(initialData.priority);
            setDescription(initialData.description || '');
            setSelectedIcon(initialData.icon || 'Building2');
            setStep('custom');
            initializedRef.current = true;
        }
        if (!isOpen) {
            initializedRef.current = false;
        }
    }, [isOpen, editMode, initialData]);
    // Resetar estados quando modal fecha (apenas se não for modo edição)
    useEffect(() => {
        if (!isOpen && !editMode) {
            const timer = setTimeout(() => {
                setName('');
                setPriority('medium');
                setDescription('');
                setSelectedIcon('Building2');
                setStep('template');
            }, 300); // Aguardar animação de fechamento
            return () => clearTimeout(timer);
        }
    }, [isOpen, editMode]);
    const selectedPriority = priorityOptions.find(p => p.value === priority);
    const selectedIconData = availableIcons.find(icon => icon.name === selectedIcon);
    const handleTemplateSelect = useCallback((template) => {
        setName(template.name);
        setPriority(template.priority);
        setDescription(template.description);
        setSelectedIcon(template.icon);
        setStep('custom');
    }, []);
    const handleCustomStart = useCallback(() => {
        setName('');
        setPriority('medium');
        setDescription('');
        setSelectedIcon('Building2');
        setStep('custom');
    }, []);
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Por favor, insira um nome para o departamento');
            return;
        }
        try {
            await onSubmit(name.trim(), priority, description.trim() || undefined, selectedIcon);
            // Sucesso - chamar callback de fechamento
            onClose();
            // Feedback visual de sucesso
            console.log('✅ Departamento salvo com sucesso:', name.trim());
        }
        catch (error) {
            console.error('❌ Erro ao salvar departamento:', error);
            // Mostrar erro amigável ao usuário
            alert(`Erro ao salvar departamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    }, [name, priority, description, selectedIcon, onSubmit, onClose]);
    const handleClose = useCallback(() => {
        // Forçar limpeza de overlays residuais
        setTimeout(() => {
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            if (overlays.length > 1) {
                overlays.forEach((overlay, index) => {
                    if (index > 0)
                        overlay.remove();
                });
            }
            // Garantir que body não fique bloqueado
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
        }, 100);
        onClose();
    }, [onClose]);
    const isValid = name.trim().length >= 2 && priority;
    // Se não estiver aberto, não renderizar nada
    if (!isOpen) {
        return null;
    }
    return (_jsx(Dialog, { open: true, onOpenChange: handleClose, children: _jsxs(DialogContent, { className: "sm:max-w-[700px] max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center", children: _jsx(Building2, { className: "w-4 h-4 text-white" }) }), _jsxs("div", { children: [_jsx(DialogTitle, { className: "text-lg font-semibold", children: editMode ? 'Editar Departamento' : 'Novo Departamento' }), _jsx(DialogDescription, { className: "text-sm text-gray-500", children: editMode
                                            ? 'Atualize as informações do departamento'
                                            : step === 'template'
                                                ? 'Escolha um template ou crie do zero'
                                                : 'Configure os detalhes do departamento' })] })] }) }), step === 'template' ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2", children: [_jsx(Sparkles, { className: "w-4 h-4" }), "Templates Sugeridos"] }), _jsx("div", { className: "grid gap-2", children: departmentTemplates.map((template, index) => {
                                        const templatePriority = priorityOptions.find(p => p.value === template.priority);
                                        return (_jsx("button", { onClick: () => handleTemplateSelect(template), className: "w-full p-3 text-left rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400", children: template.name }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1", children: template.description })] }), _jsx(Badge, { variant: "outline", className: cn("text-xs ml-2", templatePriority?.color), children: templatePriority?.label.split(' ')[0] })] }) }, index));
                                    }) })] }), _jsx("div", { className: "pt-2 border-t border-gray-200 dark:border-gray-700", children: _jsx("button", { onClick: handleCustomStart, className: "w-full p-3 text-left rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center transition-colors", children: _jsx(Target, { className: "w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" }) }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400", children: "Criar do Zero" }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Configure manualmente todos os detalhes" })] })] }) }) })] })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", className: "text-sm font-medium", children: "Nome do Departamento *" }), _jsx(Input, { id: "name", type: "text", placeholder: "Ex: Atendimento ao Cliente", value: name, onChange: (e) => setName(e.target.value), className: "h-10", autoFocus: true, disabled: isLoading }), _jsx("p", { className: "text-xs text-gray-500", children: "M\u00EDnimo 2 caracteres. Este nome aparecer\u00E1 nos tickets e relat\u00F3rios." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm font-medium", children: "Prioridade" }), _jsx("div", { className: "grid gap-2", children: priorityOptions.map((option) => {
                                        const Icon = option.icon;
                                        const isSelected = priority === option.value;
                                        return (_jsx("button", { type: "button", onClick: () => setPriority(option.value), disabled: isLoading, className: cn("w-full p-3 text-left rounded-lg border transition-all duration-200", isSelected
                                                ? `${option.bgColor} ${option.borderColor} border-2`
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"), children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: cn("w-8 h-8 rounded-lg flex items-center justify-center", isSelected ? option.bgColor : "bg-gray-100 dark:bg-gray-800"), children: _jsx(Icon, { className: cn("w-4 h-4", isSelected ? option.color : "text-gray-600 dark:text-gray-400") }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h4", { className: cn("text-sm font-medium", isSelected ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"), children: option.label }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5", children: option.description })] }), isSelected && (_jsx(CheckCircle, { className: "w-5 h-5 text-blue-500" }))] }) }, option.value));
                                    }) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { className: "text-sm font-medium", children: "\u00CDcone do Departamento" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800", children: [_jsx("div", { className: "w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center", children: selectedIconData && _jsx(selectedIconData.icon, { className: "w-5 h-5 text-white" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 dark:text-gray-100", children: ["\u00CDcone Selecionado: ", selectedIconData?.name] }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Este \u00EDcone aparecer\u00E1 no sidebar e nos tickets" })] })] }), _jsx("div", { className: "max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3", children: _jsx("div", { className: "grid grid-cols-8 gap-2", children: availableIcons.map((iconData) => {
                                                    const isSelected = selectedIcon === iconData.name;
                                                    const Icon = iconData.icon;
                                                    return (_jsx("button", { type: "button", onClick: () => setSelectedIcon(iconData.name), disabled: isLoading, className: cn("w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105", isSelected
                                                            ? "bg-blue-500 text-white shadow-lg"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"), title: `${iconData.name} (${iconData.category})`, children: _jsx(Icon, { className: "w-5 h-5" }) }, iconData.name));
                                                }) }) }), _jsx("p", { className: "text-xs text-gray-500", children: "Clique em um \u00EDcone para selecion\u00E1-lo. O \u00EDcone aparecer\u00E1 no sidebar e nos tickets do departamento." })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", className: "text-sm font-medium", children: "Descri\u00E7\u00E3o (Opcional)" }), _jsx(Textarea, { id: "description", placeholder: "Descreva as responsabilidades e escopo deste departamento...", value: description, onChange: (e) => setDescription(e.target.value), className: "min-h-[80px] resize-none", disabled: isLoading }), _jsx("p", { className: "text-xs text-gray-500", children: "Ajuda a identificar rapidamente o prop\u00F3sito do departamento." })] }), name && (_jsxs("div", { className: "p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700", children: [_jsxs("h4", { className: "text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-4 h-4" }), "Preview"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: cn("w-8 h-8 rounded-lg flex items-center justify-center", selectedPriority?.bgColor), children: selectedIconData && _jsx(selectedIconData.icon, { className: cn("w-4 h-4", selectedPriority?.color) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h5", { className: "text-sm font-medium text-gray-900 dark:text-gray-100", children: name }), description && (_jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2", children: description }))] }), _jsx(Badge, { variant: "outline", className: selectedPriority?.color, children: selectedPriority?.label.split(' ')[0] })] })] })), _jsxs("div", { className: "flex justify-end gap-2 mt-6", children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleClose, disabled: isLoading, children: "Cancelar" }), _jsx(Button, { type: "submit", disabled: !isValid || isLoading, className: "min-w-[100px]", children: isLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Salvando..."] })) : editMode ? ('Salvar Alterações') : ('Criar Departamento') })] })] }))] }) }));
};
export default DepartmentCreateModal;
