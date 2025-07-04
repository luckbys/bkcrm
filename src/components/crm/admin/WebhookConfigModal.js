import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/ui/tooltip';
import { Webhook, Copy, Check, AlertTriangle, Zap, TestTube, Loader2, CheckCircle2, XCircle, Shield, Bug } from 'lucide-react';
import { cn } from '@/lib/utils';
export const WebhookConfigModal = ({ isOpen, onClose, instanceName, departmentName, currentWebhook, onSave }) => {
    const { toast } = useToast();
    const [webhookUrl, setWebhookUrl] = useState('');
    const [isEnabled, setIsEnabled] = useState(true);
    const [selectedEvents, setSelectedEvents] = useState([
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE'
    ]);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isDebugging, setIsDebugging] = useState(false);
    const [isUrlCopied, setIsUrlCopied] = useState(false);
    const [urlValidation, setUrlValidation] = useState({ isValid: true, message: '' });
    const [testResult, setTestResult] = useState(null);
    const [debugResult, setDebugResult] = useState(null);
    const availableEvents = [
        {
            name: 'MESSAGES_UPSERT',
            label: 'Mensagens Recebidas/Enviadas',
            description: 'Dispara quando novas mensagens são recebidas ou enviadas',
            required: true
        },
        {
            name: 'MESSAGES_UPDATE',
            label: 'Mensagens Atualizadas',
            description: 'Dispara quando mensagens são atualizadas (lidas, editadas, etc.)',
            required: false
        },
        {
            name: 'CONNECTION_UPDATE',
            label: 'Status da Conexão',
            description: 'Dispara quando o status da conexão WhatsApp muda',
            required: true
        },
        {
            name: 'SEND_MESSAGE',
            label: 'Envio de Mensagens',
            description: 'Dispara confirmações de envio de mensagens',
            required: false
        },
        {
            name: 'QRCODE_UPDATED',
            label: 'QR Code Atualizado',
            description: 'Dispara quando o QR Code é atualizado',
            required: false
        },
        {
            name: 'CONTACTS_UPSERT',
            label: 'Contatos Atualizados',
            description: 'Dispara quando contatos são criados ou atualizados',
            required: false
        },
        {
            name: 'CHATS_UPSERT',
            label: 'Conversas Atualizadas',
            description: 'Dispara quando conversas são criadas ou atualizadas',
            required: false
        },
        {
            name: 'PRESENCE_UPDATE',
            label: 'Status de Presença',
            description: 'Dispara quando status online/offline é atualizado',
            required: false
        }
    ];
    useEffect(() => {
        if (isOpen) {
            if (currentWebhook) {
                setWebhookUrl(currentWebhook.url);
                setIsEnabled(currentWebhook.enabled);
                setSelectedEvents(currentWebhook.events);
            }
            else {
                const currentDomain = window.location.origin;
                const suggestedUrl = `${currentDomain}/api/webhooks/evolution`;
                setWebhookUrl(suggestedUrl);
            }
            setTestResult(null);
            setUrlValidation({ isValid: true, message: '' });
        }
    }, [isOpen, currentWebhook]);
    useEffect(() => {
        if (!webhookUrl) {
            setUrlValidation({ isValid: false, message: 'URL é obrigatória' });
            return;
        }
        try {
            const url = new URL(webhookUrl);
            if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
                setUrlValidation({
                    isValid: false,
                    message: 'URL deve usar HTTPS em produção'
                });
                return;
            }
            setUrlValidation({ isValid: true, message: 'URL válida' });
        }
        catch (error) {
            setUrlValidation({
                isValid: false,
                message: 'Formato de URL inválido'
            });
        }
    }, [webhookUrl]);
    const toggleEvent = (eventName) => {
        const event = availableEvents.find(e => e.name === eventName);
        if (event?.required)
            return;
        setSelectedEvents(prev => prev.includes(eventName)
            ? prev.filter(e => e !== eventName)
            : [...prev, eventName]);
    };
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(webhookUrl);
            setIsUrlCopied(true);
            setTimeout(() => setIsUrlCopied(false), 2000);
            toast({
                title: "📋 URL copiada",
                description: "URL do webhook copiada para a área de transferência",
            });
        }
        catch (error) {
            toast({
                title: "❌ Erro ao copiar",
                description: "Não foi possível copiar a URL",
                variant: "destructive"
            });
        }
    };
    const testWebhook = async () => {
        if (!urlValidation.isValid)
            return;
        setIsTesting(true);
        setTestResult(null);
        try {
            const testPayload = {
                event: 'TEST_CONNECTION',
                timestamp: new Date().toISOString(),
                instanceName: instanceName,
                data: {
                    message: 'Teste de conectividade do webhook',
                    status: 'success'
                }
            };
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Evolution-API-Webhook-Test'
                },
                body: JSON.stringify(testPayload)
            });
            if (response.ok) {
                setTestResult({
                    success: true,
                    message: `Conectividade OK (${response.status})`
                });
                toast({
                    title: "✅ Teste bem-sucedido",
                    description: "Webhook respondeu corretamente ao teste",
                });
            }
            else {
                setTestResult({
                    success: false,
                    message: `Erro HTTP ${response.status}`
                });
            }
        }
        catch (error) {
            setTestResult({
                success: false,
                message: error.message || 'Erro de conectividade'
            });
            toast({
                title: "⚠️ Teste falhou",
                description: "Verifique se a URL está correta e acessível",
                variant: "destructive"
            });
        }
        finally {
            setIsTesting(false);
        }
    };
    const runAdvancedDebug = async () => {
        if (!urlValidation.isValid)
            return;
        setIsDebugging(true);
        setDebugResult(null);
        try {
            const evolutionWebhookService = await import('@/services/evolutionWebhookService');
            const result = await evolutionWebhookService.debugWebhookConfiguration(instanceName, webhookUrl);
            setDebugResult(result);
            if (result.success) {
                toast({
                    title: "🔧 Debug completado",
                    description: "Todas as verificações foram executadas. Veja o console para detalhes.",
                });
            }
            else {
                toast({
                    title: "⚠️ Problema encontrado",
                    description: result.error || "Verifique o console para mais detalhes",
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('Erro no debug avançado:', error);
            toast({
                title: "❌ Erro no debug",
                description: error.message || "Não foi possível executar o debug",
                variant: "destructive"
            });
        }
        finally {
            setIsDebugging(false);
        }
    };
    const handleSave = async () => {
        if (!urlValidation.isValid || selectedEvents.length === 0)
            return;
        setIsSaving(true);
        try {
            // Validar eventos antes de salvar
            const evolutionWebhookService = await import('@/services/evolutionWebhookService');
            const eventValidation = evolutionWebhookService.validateEvents(selectedEvents);
            if (!eventValidation.valid) {
                toast({
                    title: "⚠️ Eventos inválidos",
                    description: `Eventos inválidos: ${eventValidation.invalidEvents.join(', ')}`,
                    variant: "destructive"
                });
                return;
            }
            await onSave({
                url: webhookUrl,
                enabled: isEnabled,
                events: selectedEvents
            });
            toast({
                title: "✅ Webhook configurado",
                description: `Webhook salvo para a instância ${instanceName}`,
            });
            onClose();
        }
        catch (error) {
            console.error('Erro ao salvar webhook:', error);
            toast({
                title: "❌ Erro ao salvar",
                description: error.message || "Não foi possível salvar a configuração",
                variant: "destructive"
            });
        }
        finally {
            setIsSaving(false);
        }
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-3xl max-h-[90vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center text-xl", children: [_jsx(Webhook, { className: "w-6 h-6 mr-3 text-blue-600" }), "Configurar Webhook Evolution API"] }), _jsxs(DialogDescription, { className: "text-base", children: ["Configure o webhook para receber eventos da inst\u00E2ncia ", _jsx("strong", { children: instanceName }), " do departamento ", _jsx("strong", { children: departmentName })] })] }), _jsxs("div", { className: "space-y-6 py-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "webhook-url", className: "text-base font-semibold", children: "URL do Webhook" }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", onClick: copyToClipboard, disabled: !webhookUrl, className: "flex items-center gap-2", children: [isUrlCopied ? (_jsx(Check, { className: "w-4 h-4 text-green-600" })) : (_jsx(Copy, { className: "w-4 h-4" })), isUrlCopied ? 'Copiado!' : 'Copiar'] }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Copiar URL para \u00E1rea de transfer\u00EAncia" }) })] }) })] }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "webhook-url", type: "url", value: webhookUrl, onChange: (e) => setWebhookUrl(e.target.value), placeholder: "https://seu-dominio.com/api/webhooks/evolution", className: cn("pr-10", !urlValidation.isValid && "border-red-300 focus:border-red-500") }), _jsx("div", { className: "absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none", children: urlValidation.isValid ? (_jsx(CheckCircle2, { className: "w-5 h-5 text-green-500" })) : (_jsx(XCircle, { className: "w-5 h-5 text-red-500" })) })] }), urlValidation.message && (_jsxs("div", { className: cn("text-sm flex items-center gap-2", urlValidation.isValid ? "text-green-600" : "text-red-600"), children: [urlValidation.isValid ? (_jsx(CheckCircle2, { className: "w-4 h-4" })) : (_jsx(AlertTriangle, { className: "w-4 h-4" })), urlValidation.message] })), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: testWebhook, disabled: !urlValidation.isValid || isTesting, className: "flex items-center gap-2", children: [isTesting ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(TestTube, { className: "w-4 h-4" })), isTesting ? 'Testando...' : 'Testar Conectividade'] }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", onClick: runAdvancedDebug, disabled: !urlValidation.isValid || isDebugging, className: "flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50", children: [isDebugging ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin" })) : (_jsx(Bug, { className: "w-4 h-4" })), isDebugging ? 'Debugando...' : 'Debug Avançado'] }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Executar diagn\u00F3stico completo da configura\u00E7\u00E3o" }) })] }) }), testResult && (_jsxs("div", { className: cn("flex items-center gap-2 text-sm", testResult.success ? "text-green-600" : "text-red-600"), children: [testResult.success ? (_jsx(CheckCircle2, { className: "w-4 h-4" })) : (_jsx(XCircle, { className: "w-4 h-4" })), testResult.message] }))] }), debugResult && (_jsxs(Card, { className: cn("border-2 mt-4", debugResult.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"), children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: cn("text-sm flex items-center", debugResult.success ? "text-green-800" : "text-red-800"), children: [_jsx(Bug, { className: "w-4 h-4 mr-2" }), "Resultado do Debug Avan\u00E7ado"] }) }), _jsxs(CardContent, { className: "space-y-2", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: cn("flex items-center gap-2", debugResult.details.instanceExists ? "text-green-700" : "text-red-700"), children: [debugResult.details.instanceExists ? _jsx(CheckCircle2, { className: "w-3 h-3" }) : _jsx(XCircle, { className: "w-3 h-3" }), "Inst\u00E2ncia existe"] }), _jsxs("div", { className: cn("flex items-center gap-2", debugResult.details.urlValid ? "text-green-700" : "text-red-700"), children: [debugResult.details.urlValid ? _jsx(CheckCircle2, { className: "w-3 h-3" }) : _jsx(XCircle, { className: "w-3 h-3" }), "URL v\u00E1lida"] })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: cn("flex items-center gap-2", debugResult.details.configurationResult?.success ? "text-green-700" : "text-red-700"), children: [debugResult.details.configurationResult?.success ? _jsx(CheckCircle2, { className: "w-3 h-3" }) : _jsx(XCircle, { className: "w-3 h-3" }), "Configura\u00E7\u00E3o OK"] }), _jsxs("div", { className: cn("flex items-center gap-2", debugResult.details.newWebhookConfig?.enabled ? "text-green-700" : "text-orange-700"), children: [debugResult.details.newWebhookConfig?.enabled ? _jsx(CheckCircle2, { className: "w-3 h-3" }) : _jsx(AlertTriangle, { className: "w-3 h-3" }), "Webhook ativo"] })] })] }), debugResult.error && (_jsxs("div", { className: "p-2 bg-red-100 rounded text-xs text-red-800 mt-2", children: [_jsx("strong", { children: "Erro:" }), " ", debugResult.error] })), _jsxs("div", { className: "text-xs text-gray-600 mt-2", children: [_jsx("strong", { children: "\uD83D\uDCA1 Dica:" }), " Abra o console do navegador (F12) para ver logs detalhados de cada etapa."] })] })] }))] }), _jsxs("div", { className: "flex items-center justify-between p-4 bg-gray-50 rounded-lg border", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: cn("w-3 h-3 rounded-full", isEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400") }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "webhook-enabled", className: "font-medium cursor-pointer", children: "Webhook Ativo" }), _jsx("p", { className: "text-sm text-gray-600", children: isEnabled ? 'Recebendo eventos da Evolution API' : 'Webhook desabilitado' })] })] }), _jsx(Switch, { id: "webhook-enabled", checked: isEnabled, onCheckedChange: setIsEnabled })] }), _jsxs("div", { className: "space-y-3", children: [_jsx(Label, { className: "text-base font-semibold", children: "Eventos do Webhook" }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-600", children: "Selecione quais eventos devem ser enviados para o seu webhook" }), _jsxs("div", { className: "p-3 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 text-blue-800 text-sm font-medium", children: [_jsx(CheckCircle2, { className: "w-4 h-4" }), "Eventos validados pela Evolution API"] }), _jsx("p", { className: "text-xs text-blue-700 mt-1", children: "Os eventos listados abaixo s\u00E3o oficialmente suportados pela Evolution API v1.7+" })] })] }), _jsx("div", { className: "grid gap-3", children: availableEvents.map((event) => {
                                        const isSelected = selectedEvents.includes(event.name);
                                        const isRequired = event.required;
                                        return (_jsx(Card, { className: cn("cursor-pointer transition-all hover:shadow-sm", isSelected ? "border-blue-300 bg-blue-50" : "hover:border-gray-300", isRequired && "border-amber-300 bg-amber-50"), onClick: () => !isRequired && toggleEvent(event.name), children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "flex-1", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: cn("w-4 h-4 rounded border-2 flex items-center justify-center", isSelected
                                                                            ? "bg-blue-600 border-blue-600"
                                                                            : "border-gray-300", isRequired && "bg-amber-500 border-amber-500"), children: (isSelected || isRequired) && (_jsx(Check, { className: "w-3 h-3 text-white" })) }), _jsxs("div", { children: [_jsxs("div", { className: "font-medium flex items-center gap-2", children: [event.label, isRequired && (_jsx(Badge, { variant: "secondary", className: "text-xs bg-amber-100 text-amber-800", children: "Obrigat\u00F3rio" }))] }), _jsx("p", { className: "text-sm text-gray-600", children: event.description })] })] }) }), _jsx("div", { className: "flex items-center gap-2", children: isSelected && (_jsx(Badge, { variant: "default", className: "text-xs", children: "Ativo" })) })] }) }) }, event.name));
                                    }) })] }), _jsxs(Card, { className: "border-amber-200 bg-amber-50", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs(CardTitle, { className: "text-sm flex items-center text-amber-800", children: [_jsx(Shield, { className: "w-4 h-4 mr-2" }), "Dicas de Seguran\u00E7a"] }) }), _jsx(CardContent, { className: "text-sm text-amber-700 space-y-2", children: _jsxs("ul", { className: "list-disc list-inside space-y-1", children: [_jsx("li", { children: "Use sempre HTTPS em produ\u00E7\u00E3o" }), _jsx("li", { children: "Implemente valida\u00E7\u00E3o de origem nas requisi\u00E7\u00F5es" }), _jsx("li", { children: "Configure rate limiting no seu endpoint" }), _jsx("li", { children: "Monitore logs de erro e tentativas suspeitas" }), _jsx("li", { children: "Use tokens de autentica\u00E7\u00E3o quando poss\u00EDvel" })] }) })] })] }), _jsxs(DialogFooter, { className: "gap-3", children: [_jsx(Button, { variant: "outline", onClick: onClose, disabled: isSaving, children: "Cancelar" }), _jsx(Button, { onClick: handleSave, disabled: !urlValidation.isValid || selectedEvents.length === 0 || isSaving, className: "bg-blue-600 hover:bg-blue-700", children: isSaving ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" }), "Salvando..."] })) : (_jsxs(_Fragment, { children: [_jsx(Zap, { className: "w-4 h-4 mr-2" }), "Salvar Webhook"] })) })] })] }) }));
};
