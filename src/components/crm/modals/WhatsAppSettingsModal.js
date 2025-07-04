import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { Loader2, Settings2 } from 'lucide-react';
const WhatsAppSettingsModal = ({ isOpen, onClose, instance }) => {
    const { toast } = useToast();
    const { updateSettings } = useWhatsAppInstances();
    const [isSaving, setIsSaving] = useState(false);
    // Estado local para as configurações
    const [settings, setSettings] = useState({
        always_online: instance.always_online ?? true,
        groups_ignore: instance.groups_ignore ?? true,
        read_messages: instance.read_messages ?? true,
        read_status: instance.read_status ?? true,
        reject_call: instance.reject_call ?? true,
        sync_full_history: instance.sync_full_history ?? false
    });
    // Atualizar configuração
    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    // Salvar configurações
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSettings(instance.instanceName, settings);
            toast({
                title: "Configurações salvas",
                description: "As configurações do WhatsApp foram atualizadas",
            });
            onClose();
        }
        catch (error) {
            toast({
                title: "Erro ao salvar",
                description: error.message || "Falha ao atualizar configurações",
                variant: "destructive"
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(Settings2, { className: "w-5 h-5 text-primary" }), "Configura\u00E7\u00F5es do WhatsApp"] }) }), _jsxs("div", { className: "space-y-6 py-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Presen\u00E7a" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Label, { htmlFor: "always_online", className: "flex flex-col", children: [_jsx("span", { children: "Sempre Online" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Manter status online" })] }), _jsx(Switch, { id: "always_online", checked: settings.always_online, onCheckedChange: () => handleToggle('always_online') })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Mensagens" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Label, { htmlFor: "read_messages", className: "flex flex-col", children: [_jsx("span", { children: "Marcar como Lido" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Marcar mensagens como lidas automaticamente" })] }), _jsx(Switch, { id: "read_messages", checked: settings.read_messages, onCheckedChange: () => handleToggle('read_messages') })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Label, { htmlFor: "read_status", className: "flex flex-col", children: [_jsx("span", { children: "Visualizar Status" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Marcar status como visualizados" })] }), _jsx(Switch, { id: "read_status", checked: settings.read_status, onCheckedChange: () => handleToggle('read_status') })] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Grupos e Chamadas" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Label, { htmlFor: "groups_ignore", className: "flex flex-col", children: [_jsx("span", { children: "Ignorar Grupos" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "N\u00E3o processar mensagens de grupos" })] }), _jsx(Switch, { id: "groups_ignore", checked: settings.groups_ignore, onCheckedChange: () => handleToggle('groups_ignore') })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Label, { htmlFor: "reject_call", className: "flex flex-col", children: [_jsx("span", { children: "Rejeitar Chamadas" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Rejeitar chamadas automaticamente" })] }), _jsx(Switch, { id: "reject_call", checked: settings.reject_call, onCheckedChange: () => handleToggle('reject_call') })] })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-4", children: [_jsx("h3", { className: "text-sm font-medium", children: "Hist\u00F3rico" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Label, { htmlFor: "sync_full_history", className: "flex flex-col", children: [_jsx("span", { children: "Sincronizar Hist\u00F3rico" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "Importar hist\u00F3rico completo de conversas" })] }), _jsx(Switch, { id: "sync_full_history", checked: settings.sync_full_history, onCheckedChange: () => handleToggle('sync_full_history') })] })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: onClose, children: "Cancelar" }), _jsx(Button, { onClick: handleSave, disabled: isSaving, children: isSaving ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Salvando..."] })) : ('Salvar') })] })] }) }));
};
export default WhatsAppSettingsModal;
