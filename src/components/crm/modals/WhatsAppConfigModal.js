import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { Loader2, Smartphone, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, Settings2, Trash2, Plus, MessageCircle, Users, PhoneCall, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import WhatsAppSettingsModal from './WhatsAppSettingsModal';
// Bento Grid Item Component
const BentoItem = ({ children, className }) => (_jsx("div", { className: cn("group relative col-span-1 row-span-1 flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1", "border border-transparent", className), children: children }));
// Border Beam Component
const BorderBeam = ({ children, className, intensity = 'normal' }) => {
    const intensityClass = {
        light: 'border-beam-light',
        normal: '',
        intense: 'border-beam-intense'
    }[intensity];
    return (_jsx("div", { className: cn("border-beam-container", intensityClass, className), children: _jsx("div", { className: "p-4", children: children }) }));
};
// Status badge minimalista
const StatusBadge = ({ status, className }) => {
    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'open':
            case 'connected':
                return {
                    color: 'bg-green-500/10 text-green-600 border-green-500/20',
                    icon: _jsx(CheckCircle, { className: "w-3 h-3" }),
                    label: 'Conectado'
                };
            case 'connecting':
            case 'qrcode':
                return {
                    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                    icon: _jsx(AlertCircle, { className: "w-3 h-3" }),
                    label: 'Conectando'
                };
            case 'close':
            case 'disconnected':
                return {
                    color: 'bg-red-500/10 text-red-600 border-red-500/20',
                    icon: _jsx(XCircle, { className: "w-3 h-3" }),
                    label: 'Desconectado'
                };
            default:
                return {
                    color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
                    icon: _jsx(WifiOff, { className: "w-3 h-3" }),
                    label: 'Inativo'
                };
        }
    };
    const config = getStatusConfig(status);
    return (_jsxs(Badge, { className: cn("h-6 px-2 text-xs font-medium border", config.color, className), children: [config.icon, _jsx("span", { className: "ml-1", children: config.label })] }));
};
const WhatsAppConfigModal = ({ isOpen, onClose, departmentId, departmentName }) => {
    const { toast } = useToast();
    const { instances, loading, createInstance, deleteInstance, connectInstance, getQRCode, refreshInstances, createInstanceEvolutionAPI } = useWhatsAppInstances();
    // Estados
    const [isCreating, setIsCreating] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    // Configurações padrão
    const defaultSettings = {
        always_online: true,
        groups_ignore: true,
        read_messages: true,
        read_status: true,
        reject_call: true,
        sync_full_history: false
    };
    // Buscar instância do departamento
    useEffect(() => {
        if (isOpen && departmentId) {
            refreshInstances();
        }
    }, [isOpen, departmentId, refreshInstances]);
    // Filtrar instância do departamento atual
    const departmentInstance = instances.find(instance => instance.departmentId === departmentId);
    // Criar nova instância
    const handleCreateInstance = async () => {
        if (!departmentId)
            return;
        setIsCreating(true);
        try {
            await createInstanceEvolutionAPI({
                instanceName: `whatsapp-dep-${departmentId}`,
                token: '', // preencha se necessário
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
                alwaysOnline: true,
                groupsIgnore: true,
                readMessages: true,
                readStatus: true,
                rejectCall: true,
                syncFullHistory: false,
                // ...adicione outros campos obrigatórios conforme necessário
            });
            toast({
                title: "Integração criada",
                description: "WhatsApp configurado para este departamento",
            });
            await refreshInstances();
        }
        catch (error) {
            toast({
                title: "Erro ao criar integração",
                description: error.message || "Ocorreu um erro inesperado",
                variant: "destructive"
            });
        }
        finally {
            setIsCreating(false);
        }
    };
    // Conectar instância (gerar QR)
    const handleConnectInstance = async (instanceName) => {
        try {
            await connectInstance(instanceName);
            const qrResponse = await getQRCode(instanceName);
            if (qrResponse.base64) {
                setQrCode(qrResponse.base64);
                toast({
                    title: "QR Code gerado",
                    description: "Escaneie o código com seu WhatsApp",
                });
            }
        }
        catch (error) {
            toast({
                title: "Erro ao conectar",
                description: error.message || "Falha na conexão",
                variant: "destructive"
            });
        }
    };
    // Remover instância
    const handleDeleteInstance = async (instanceId) => {
        if (!instanceId)
            return;
        if (!confirm('Tem certeza que deseja remover a integração do WhatsApp deste departamento?'))
            return;
        try {
            await deleteInstance(instanceId);
            toast({
                title: "Integração removida",
                description: "WhatsApp desvinculado deste departamento",
            });
            await refreshInstances();
            setQrCode(null);
        }
        catch (error) {
            toast({
                title: "Erro ao remover",
                description: error.message || "Falha ao remover integração",
                variant: "destructive"
            });
        }
    };
    // Handler customizado para fechar o modal (solução do DepartmentCreateModal)
    const handleClose = React.useCallback(() => {
        setTimeout(() => {
            const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
            if (overlays.length > 1) {
                overlays.forEach((overlay, index) => {
                    if (index > 0)
                        overlay.remove();
                });
            }
            document.body.style.pointerEvents = '';
            document.body.style.overflow = '';
        }, 100);
        onClose();
    }, [onClose]);
    return (_jsxs(_Fragment, { children: [_jsx(Dialog, { open: isOpen, onOpenChange: handleClose, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[85vh] p-0 overflow-hidden", children: [_jsx(DialogHeader, { className: "px-6 py-4 border-b", children: _jsxs(DialogTitle, { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-lg", children: [_jsx(Smartphone, { className: "w-5 h-5 text-primary" }), _jsxs("span", { children: ["WhatsApp - ", departmentName] })] }), departmentInstance && (_jsx(StatusBadge, { status: departmentInstance.status || 'disconnected' }))] }) }), _jsxs("div", { className: "p-6 space-y-6", children: [loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(Loader2, { className: "w-6 h-6 animate-spin text-muted-foreground" }) })) : !departmentInstance ? (_jsx(BorderBeam, { intensity: "normal", children: _jsxs("div", { className: "text-center space-y-4 py-2", children: [_jsxs("div", { className: "flex flex-col items-center gap-3", children: [_jsx(Smartphone, { className: "w-12 h-12 text-muted-foreground/50" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-muted-foreground", children: "Nenhuma integra\u00E7\u00E3o configurada" }), _jsx("p", { className: "text-xs text-muted-foreground/70", children: "Configure o WhatsApp para este departamento" })] })] }), _jsx(Button, { onClick: handleCreateInstance, disabled: isCreating, className: "w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700", children: isCreating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Configurando..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Criar Integra\u00E7\u00E3o WhatsApp"] })) })] }) })) : (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsx(BentoItem, { children: _jsx(BorderBeam, { intensity: "light", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center", children: _jsx(MessageCircle, { className: "w-5 h-5 text-green-600" }) }), _jsx(Badge, { variant: "outline", className: "text-xs font-medium bg-green-50 text-green-600 border-green-200", children: "Status" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Mensagens" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Leitura autom\u00E1tica: ", departmentInstance.read_messages ? 'Ativada' : 'Desativada'] })] })] }) }) }), _jsx(BentoItem, { children: _jsx(BorderBeam, { intensity: "light", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center", children: _jsx(Users, { className: "w-5 h-5 text-green-600" }) }), _jsx(Badge, { variant: "outline", className: "text-xs font-medium bg-green-50 text-green-600 border-green-200", children: "Grupos" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Grupos" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Ignorar grupos: ", departmentInstance.groups_ignore ? 'Sim' : 'Não'] })] })] }) }) }), _jsx(BentoItem, { children: _jsx(BorderBeam, { intensity: "light", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center", children: _jsx(PhoneCall, { className: "w-5 h-5 text-green-600" }) }), _jsx(Badge, { variant: "outline", className: "text-xs font-medium bg-green-50 text-green-600 border-green-200", children: "Chamadas" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Chamadas" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Rejeitar chamadas: ", departmentInstance.reject_call ? 'Sim' : 'Não'] })] })] }) }) }), _jsx(BentoItem, { children: _jsx(BorderBeam, { intensity: "light", children: _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center", children: _jsx(Bell, { className: "w-5 h-5 text-green-600" }) }), _jsx(Badge, { variant: "outline", className: "text-xs font-medium bg-green-50 text-green-600 border-green-200", children: "Online" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-gray-900", children: "Status Online" }), _jsxs("p", { className: "text-xs text-gray-500 mt-1", children: ["Sempre online: ", departmentInstance.always_online ? 'Sim' : 'Não'] })] })] }) }) })] })), departmentInstance && (_jsxs("div", { className: "flex items-center justify-end gap-2 mt-6", children: [_jsxs(Button, { variant: "outline", onClick: () => handleDeleteInstance(departmentInstance.id), className: "text-red-600 hover:text-red-700", children: [_jsx(Trash2, { className: "w-4 h-4 mr-2" }), "Remover Integra\u00E7\u00E3o"] }), _jsxs(Button, { onClick: () => handleConnectInstance(departmentInstance.instanceName), className: "bg-green-600 hover:bg-green-700", children: [_jsx(Wifi, { className: "w-4 h-4 mr-2" }), "Reconectar"] }), _jsxs(Button, { onClick: () => setShowSettings(true), variant: "outline", className: "border-green-200", children: [_jsx(Settings2, { className: "w-4 h-4 mr-2" }), "Configura\u00E7\u00F5es"] })] })), qrCode && (_jsx(BorderBeam, { intensity: "intense", className: "max-w-sm mx-auto mt-8", children: _jsxs("div", { className: "flex flex-col items-center gap-4 py-2", children: [_jsx("div", { className: "bg-white p-4 rounded-lg shadow-inner", children: _jsx("img", { src: `data:image/png;base64,${qrCode}`, alt: "QR Code WhatsApp", className: "w-48 h-48" }) }), _jsx("p", { className: "text-sm text-gray-600 font-medium", children: "Escaneie o QR Code com seu WhatsApp" })] }) }))] })] }) }), showSettings && departmentInstance && (_jsx(WhatsAppSettingsModal, { isOpen: showSettings, onClose: () => setShowSettings(false), instance: departmentInstance }))] }));
};
export default WhatsAppConfigModal;
