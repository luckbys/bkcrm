import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { evolutionApi } from '@/services/evolutionApi';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { WebhookConfigModal } from './WebhookConfigModal';
import { Smartphone, QrCode, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2, PowerOff, Settings, Building2, Info, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';
export const DepartmentEvolutionManager = ({ departmentId, departmentName, departmentColor = '#3B82F6' }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    // Estados principais
    const [instances, setInstances] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    // Estados para criação de instância
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState('');
    const [setAsDefault, setSetAsDefault] = useState(false);
    // Estados para QR Code
    const [showQRModal, setShowQRModal] = useState(false);
    const [currentQRCode, setCurrentQRCode] = useState('');
    const [qrInstance, setQrInstance] = useState('');
    const [qrRefreshCount, setQrRefreshCount] = useState(0);
    const [isQRLoading, setIsQRLoading] = useState(false);
    // Estados para configuração de webhook
    const [showWebhookModal, setShowWebhookModal] = useState(false);
    const [webhookInstance, setWebhookInstance] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [webhookEnabled, setWebhookEnabled] = useState(true);
    const [currentWebhookConfig, setCurrentWebhookConfig] = useState(null);
    const [isWebhookLoading, setIsWebhookLoading] = useState(false);
    // Carregamento inicial
    const loadDepartmentInstances = useCallback(async () => {
        if (!departmentId)
            return;
        try {
            console.log('🏢 Carregando instâncias do departamento:', departmentName);
            setIsLoading(true);
            // Buscar instâncias do departamento no banco
            const { data: dbInstances, error } = await supabase
                .from('evolution_instances')
                .select('*')
                .eq('department_id', departmentId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Erro ao carregar instâncias do banco:', error);
                throw error;
            }
            console.log('📋 Instâncias do banco:', dbInstances?.length || 0);
            // Mapear instâncias com status padrão
            const instancesWithStatus = await Promise.allSettled((dbInstances || []).map(async (instance) => {
                let evolutionStatus = 'close';
                let isConnected = false;
                try {
                    // Tentar verificar status na Evolution API (com timeout)
                    const statusPromise = evolutionApi.getInstanceStatus(instance.instance_name);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 5s')), 5000));
                    const status = await Promise.race([statusPromise, timeoutPromise]);
                    if (status?.instance?.state) {
                        evolutionStatus = status.instance.state;
                        isConnected = status.instance.state === 'open';
                    }
                }
                catch (error) {
                    console.warn(`⚠️ Evolution API indisponível para ${instance.instance_name}:`, error.message);
                    evolutionStatus = 'unknown';
                }
                // Mapear para o formato esperado pelo componente
                const mappedInstance = {
                    id: instance.id,
                    instanceName: instance.instance_name,
                    status: evolutionStatus,
                    departmentId: instance.department_id,
                    departmentName: instance.department_name,
                    phone: instance.phone || undefined,
                    connected: isConnected,
                    lastUpdate: instance.updated_at ? new Date(instance.updated_at) : new Date(),
                    isDefault: instance.is_default || false,
                    createdBy: instance.created_by || undefined
                };
                return mappedInstance;
            }));
            // Filtrar resultados bem sucedidos
            const validInstances = instancesWithStatus
                .filter((result) => result.status === 'fulfilled')
                .map(result => result.value);
            setInstances(validInstances);
        }
        catch (error) {
            console.error('❌ Erro ao carregar instâncias:', error);
            setInstances([]);
            toast({
                title: "⚠️ Erro ao carregar instâncias",
                description: "Usando modo offline. Evolution API pode estar indisponível.",
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    }, [departmentId, departmentName, toast]);
    useEffect(() => {
        loadDepartmentInstances();
        // Auto-refresh a cada 45 segundos (somente se Evolution API estiver disponível)
        const interval = setInterval(async () => {
            try {
                // Teste rápido se Evolution API está disponível
                const health = await evolutionApi.checkHealth();
                if (health.status === 'ok') {
                    loadDepartmentInstances();
                }
            }
            catch (error) {
                console.warn('⚠️ Evolution API indisponível para auto-refresh');
            }
        }, 45000);
        return () => clearInterval(interval);
    }, [departmentId, departmentName, loadDepartmentInstances]);
    const createNewInstance = async () => {
        try {
            if (!newInstanceName) {
                throw new Error('Nome da instância é obrigatório');
            }
            setIsLoading(true);
            // Verificar se instância já existe
            const exists = await evolutionApi.instanceExists(newInstanceName);
            if (exists) {
                throw new Error('Instância já existe');
            }
            // Criar instância na Evolution API
            await evolutionApi.createInstance({
                instanceName: newInstanceName,
                qrcode: true,
                webhook: `${window.location.origin}/webhook/evolution`
            });
            // Salvar no banco
            const { error } = await supabase
                .from('evolution_instances')
                .insert({
                instance_name: newInstanceName,
                department_id: departmentId,
                department_name: departmentName,
                is_active: true,
                created_by: 'system'
            });
            if (error)
                throw error;
            // Recarregar dados
            await loadDepartmentInstances();
            setShowCreateModal(false);
            setNewInstanceName('');
            toast({
                title: "✅ Instância criada",
                description: "A instância foi criada com sucesso. Aguarde o QR Code.",
            });
        }
        catch (error) {
            console.error('❌ Erro ao criar instância:', error);
            toast({
                title: "⚠️ Erro ao criar instância",
                description: error.message,
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    // Função para obter QR Code
    const getQRCode = async (instanceName) => {
        try {
            const qrResponse = await evolutionApi.getInstanceQRCode(instanceName);
            if (qrResponse && qrResponse.success && qrResponse.qrcode) {
                return qrResponse.qrcode.base64;
            }
            return null;
        }
        catch (error) {
            console.error('❌ Erro ao obter QR Code:', error);
            return null;
        }
    };
    // Função para monitorar conexão
    const startConnectionMonitoring = async (instanceName) => {
        try {
            const status = await evolutionApi.getInstanceStatus(instanceName);
            if (status.instance.state === 'open') {
                // Instância já conectada
                await loadDepartmentInstances();
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('❌ Erro ao monitorar conexão:', error);
            return false;
        }
    };
    // Função para conectar instância
    const connectInstance = async (instanceName) => {
        try {
            setIsLoading(true);
            // Obter QR Code
            const qrCode = await getQRCode(instanceName);
            if (!qrCode) {
                throw new Error('QR Code não disponível');
            }
            // Iniciar monitoramento
            const isConnected = await startConnectionMonitoring(instanceName);
            if (!isConnected) {
                throw new Error('Falha ao conectar instância');
            }
            toast({
                title: "✅ Instância conectada",
                description: "A instância foi conectada com sucesso.",
            });
        }
        catch (error) {
            console.error('❌ Erro ao conectar instância:', error);
            toast({
                title: "⚠️ Erro ao conectar instância",
                description: error.message,
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const refreshQRCode = async () => {
        setIsQRLoading(true);
        setQrRefreshCount(prev => prev + 1);
        try {
            const qrResponse = await evolutionApi.getInstanceQRCode(qrInstance);
            if (qrResponse && qrResponse.base64) {
                // O serviço já retorna com o prefixo correto
                setCurrentQRCode(qrResponse.base64);
                toast({
                    title: "🔄 QR Code atualizado",
                    description: "Novo código gerado com sucesso",
                });
            }
        }
        catch (error) {
            toast({
                title: "❌ Erro ao atualizar QR Code",
                description: error.message,
                variant: "destructive"
            });
        }
        finally {
            setIsQRLoading(false);
        }
    };
    const disconnectInstance = async (instanceName) => {
        try {
            setIsLoading(true);
            await evolutionApi.logoutInstance(instanceName);
            await loadDepartmentInstances();
            toast({
                title: "✅ Instância desconectada",
                description: "A instância foi desconectada com sucesso.",
            });
        }
        catch (error) {
            console.error('❌ Erro ao desconectar instância:', error);
            toast({
                title: "⚠️ Erro ao desconectar instância",
                description: error.message,
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const deleteInstance = async (instanceName) => {
        try {
            setIsLoading(true);
            // Deletar da Evolution API
            await evolutionApi.deleteInstance(instanceName);
            // Deletar do banco (soft delete)
            const { error } = await supabase
                .from('evolution_instances')
                .update({ is_active: false })
                .eq('instance_name', instanceName);
            if (error)
                throw error;
            // Recarregar dados
            await loadDepartmentInstances();
            toast({
                title: "✅ Instância deletada",
                description: "A instância foi removida com sucesso.",
            });
        }
        catch (error) {
            console.error('❌ Erro ao deletar instância:', error);
            toast({
                title: "⚠️ Erro ao deletar instância",
                description: error.message,
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const setAsDefaultInstance = async (instanceName) => {
        try {
            // Atualizar no banco
            await supabase
                .from('evolution_instances')
                .update({ is_default: false })
                .eq('department_id', departmentId);
            await supabase
                .from('evolution_instances')
                .update({ is_default: true })
                .eq('instance_name', instanceName)
                .eq('department_id', departmentId);
            // Atualizar lista local
            setInstances(prev => prev.map(instance => ({
                ...instance,
                isDefault: instance.instanceName === instanceName
            })));
            toast({
                title: "⭐ Instância padrão definida",
                description: `"${instanceName}" agora é a instância padrão do ${departmentName}`,
            });
        }
        catch (error) {
            toast({
                title: "❌ Erro ao definir padrão",
                description: error.message,
                variant: "destructive"
            });
        }
    };
    // ===== FUNÇÕES DE WEBHOOK =====
    const openWebhookModal = async (instanceName) => {
        setWebhookInstance(instanceName);
        setIsWebhookLoading(true);
        setShowWebhookModal(true);
        try {
            // Obter configuração atual do webhook
            const webhookService = await import('@/services/evolutionWebhookService');
            const result = await webhookService.getInstanceWebhook(instanceName);
            if (result.success && result.webhook) {
                setCurrentWebhookConfig(result.webhook);
                setWebhookUrl(result.webhook.url);
                setWebhookEnabled(result.webhook.enabled);
            }
            else {
                // Webhook não configurado, usar URL sugerida
                const suggestedUrl = webhookService.generateSuggestedWebhookUrl();
                setWebhookUrl(suggestedUrl);
                setWebhookEnabled(true);
                setCurrentWebhookConfig(null);
            }
        }
        catch (error) {
            console.error('❌ Erro ao carregar webhook:', error);
            toast({
                title: "⚠️ Erro ao carregar webhook",
                description: error.message || "Não foi possível carregar a configuração",
                variant: "destructive"
            });
        }
        finally {
            setIsWebhookLoading(false);
        }
    };
    const saveWebhookConfig = async () => {
        setIsWebhookLoading(true);
        try {
            const webhookService = await import('@/services/evolutionWebhookService');
            // Usar dados do modal
            const configData = currentWebhookConfig || {
                url: webhookUrl,
                enabled: webhookEnabled,
                events: webhookService.getRecommendedEvents()
            };
            // Validar URL
            const validation = webhookService.validateWebhookUrl(configData.url);
            if (!validation.valid) {
                toast({
                    title: "⚠️ URL inválida",
                    description: validation.error,
                    variant: "destructive"
                });
                return;
            }
            // Configurar webhook
            const result = await webhookService.setInstanceWebhook(webhookInstance, {
                url: configData.url,
                enabled: configData.enabled,
                events: configData.events
            });
            if (result.success) {
                toast({
                    title: "✅ Webhook configurado",
                    description: "Configuração salva com sucesso. Agora você receberá eventos do WhatsApp.",
                });
                setShowWebhookModal(false);
            }
            else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        }
        catch (error) {
            console.error('❌ Erro ao configurar webhook:', error);
            toast({
                title: "❌ Erro ao configurar webhook",
                description: error.message || "Não foi possível salvar a configuração",
                variant: "destructive"
            });
        }
        finally {
            setIsWebhookLoading(false);
        }
    };
    const saveWebhookConfigWithData = async (webhookData) => {
        setIsWebhookLoading(true);
        try {
            console.log('🔧 Configurando webhook com dados do modal:', {
                instance: webhookInstance,
                url: webhookData.url,
                enabled: webhookData.enabled,
                events: webhookData.events
            });
            const webhookService = await import('@/services/evolutionWebhookService');
            // Validar URL dos dados vindos do modal
            const validation = webhookService.validateWebhookUrl(webhookData.url);
            if (!validation.valid) {
                toast({
                    title: "⚠️ URL inválida",
                    description: validation.error,
                    variant: "destructive"
                });
                return;
            }
            // Configurar webhook com os dados corretos do modal
            const result = await webhookService.setInstanceWebhook(webhookInstance, {
                url: webhookData.url,
                enabled: webhookData.enabled,
                events: webhookData.events
            });
            if (result.success) {
                console.log('✅ Webhook configurado com sucesso!', result);
                toast({
                    title: "✅ Webhook configurado",
                    description: `URL ${webhookData.url} configurada para ${webhookInstance}`,
                });
                setShowWebhookModal(false);
                // Atualizar as configurações locais com os dados salvos
                setCurrentWebhookConfig(webhookData);
            }
            else {
                console.error('❌ Falha na configuração do webhook:', result);
                throw new Error(result.error || 'Erro desconhecido na configuração');
            }
        }
        catch (error) {
            console.error('❌ Erro ao configurar webhook:', error);
            toast({
                title: "❌ Erro ao configurar webhook",
                description: error.message || "Não foi possível salvar a configuração",
                variant: "destructive"
            });
        }
        finally {
            setIsWebhookLoading(false);
        }
    };
    const testWebhook = async () => {
        setIsWebhookLoading(true);
        try {
            const webhookService = await import('@/services/evolutionWebhookService');
            const result = await webhookService.testInstanceWebhook(webhookInstance);
            if (result.success) {
                toast({
                    title: "✅ Webhook funcionando",
                    description: result.message,
                });
            }
            else {
                toast({
                    title: "⚠️ Problema no webhook",
                    description: result.error,
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('❌ Erro ao testar webhook:', error);
            toast({
                title: "❌ Erro no teste",
                description: error.message || "Não foi possível testar o webhook",
                variant: "destructive"
            });
        }
        finally {
            setIsWebhookLoading(false);
        }
    };
    const removeWebhook = async () => {
        setIsWebhookLoading(true);
        try {
            const webhookService = await import('@/services/evolutionWebhookService');
            const result = await webhookService.removeInstanceWebhook(webhookInstance);
            if (result.success) {
                toast({
                    title: "🗑️ Webhook removido",
                    description: "Configuração de webhook removida com sucesso",
                });
                setShowWebhookModal(false);
            }
            else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        }
        catch (error) {
            console.error('❌ Erro ao remover webhook:', error);
            toast({
                title: "❌ Erro ao remover webhook",
                description: error.message || "Não foi possível remover a configuração",
                variant: "destructive"
            });
        }
        finally {
            setIsWebhookLoading(false);
        }
    };
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "📋 Copiado!",
            description: "URL copiada para a área de transferência",
        });
    };
    const getStatusIcon = (status, connected) => {
        if (connected && status === 'open') {
            return _jsx(CheckCircle, { className: "w-4 h-4 text-green-600" });
        }
        else if (status === 'connecting') {
            return _jsx(Loader2, { className: "w-4 h-4 text-blue-600 animate-spin" });
        }
        else {
            return _jsx(XCircle, { className: "w-4 h-4 text-red-600" });
        }
    };
    const getStatusBadge = (status, connected) => {
        if (connected && status === 'open') {
            return _jsx(Badge, { className: "bg-green-100 text-green-800 border-green-200", children: "Conectado" });
        }
        else if (status === 'connecting') {
            return _jsx(Badge, { className: "bg-blue-100 text-blue-800 border-blue-200", children: "Conectando" });
        }
        else {
            return _jsx(Badge, { variant: "destructive", children: "Desconectado" });
        }
    };
    const connectedCount = instances.filter(i => i.connected).length;
    const totalInstances = instances.length;
    // Função para recuperar instância com problemas
    const handleInstanceRecovery = async (instanceName) => {
        try {
            setIsLoading(true);
            // Tentar reconectar a instância
            await evolutionApi.createInstance({
                instanceName,
                qrcode: true,
                webhook: `${window.location.origin}/webhook/evolution`
            });
            // Recarregar dados
            await loadDepartmentInstances();
            toast({
                title: "✅ Instância recuperada",
                description: "A instância foi reconectada com sucesso.",
            });
        }
        catch (error) {
            console.error('❌ Erro ao recuperar instância:', error);
            toast({
                title: "⚠️ Erro ao recuperar instância",
                description: error.message,
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    // Função para verificar se instância existe
    const checkInstanceExists = async (instanceName) => {
        try {
            const instances = await evolutionApi.fetchInstances(instanceName);
            return instances.length > 0;
        }
        catch (error) {
            console.error('❌ Erro ao verificar instância:', error);
            return false;
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "w-4 h-4 rounded-full flex-shrink-0", style: { backgroundColor: departmentColor } }), _jsxs("div", { children: [_jsxs("h3", { className: "text-xl font-bold text-gray-900 flex items-center", children: [_jsx(Building2, { className: "w-5 h-5 mr-2" }), departmentName, " - WhatsApp"] }), _jsxs("p", { className: "text-gray-600 text-sm", children: [connectedCount, " de ", totalInstances, " inst\u00E2ncia(s) conectada(s)"] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: async () => {
                                    setIsLoading(true);
                                    try {
                                        // Recarregar dados de instâncias do banco e da Evolution API
                                        const { data: dbInstances } = await supabase
                                            .from('evolution_instances')
                                            .select('*')
                                            .eq('department_id', departmentId)
                                            .eq('is_active', true);
                                        // Tentar obter status atual de cada instância da Evolution API
                                        const updatedInstances = [];
                                        for (const dbInstance of (dbInstances || [])) {
                                            let currentStatus = 'unknown';
                                            let connected = false;
                                            try {
                                                const statusResponse = await evolutionApi.getInstanceStatus(dbInstance.instance_name);
                                                currentStatus = statusResponse.instance.state;
                                                connected = currentStatus === 'open';
                                            }
                                            catch (error) {
                                                console.warn(`⚠️ Não foi possível obter status de ${dbInstance.instance_name}:`, error);
                                            }
                                            updatedInstances.push({
                                                id: dbInstance.id,
                                                instanceName: dbInstance.instance_name,
                                                status: currentStatus,
                                                departmentId: dbInstance.department_id,
                                                departmentName: dbInstance.department_name,
                                                phone: dbInstance.phone || undefined,
                                                connected,
                                                lastUpdate: new Date(),
                                                isDefault: dbInstance.is_default || false,
                                                createdBy: dbInstance.created_by || undefined
                                            });
                                        }
                                        setInstances(updatedInstances);
                                        toast({
                                            title: "🔄 Status atualizado",
                                            description: `${updatedInstances.length} instância(s) verificada(s)`,
                                        });
                                    }
                                    catch (error) {
                                        console.error('❌ Erro ao atualizar status:', error);
                                        toast({
                                            title: "❌ Erro na atualização",
                                            description: "Não foi possível atualizar o status das instâncias",
                                            variant: "destructive"
                                        });
                                    }
                                    finally {
                                        setIsLoading(false);
                                    }
                                }, disabled: isLoading, className: "flex items-center space-x-2", children: [_jsx(RefreshCw, { className: cn("w-4 h-4", isLoading && "animate-spin") }), _jsx("span", { children: "Atualizar" })] }), _jsxs(Button, { onClick: () => setShowCreateModal(true), size: "sm", className: "flex items-center space-x-2 bg-green-600 hover:bg-green-700", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Nova Inst\u00E2ncia" })] })] })] }), _jsxs(Alert, { children: [_jsx(Info, { className: "h-4 w-4" }), _jsxs(AlertDescription, { children: [_jsxs("strong", { children: ["Central do ", departmentName, ":"] }), " Aqui voc\u00EA gerencia as inst\u00E2ncias WhatsApp exclusivas do seu departamento. Tickets criados neste setor usar\u00E3o automaticamente a inst\u00E2ncia padr\u00E3o configurada."] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [instances.map((instance) => (_jsxs(Card, { className: "hover:shadow-lg transition-all duration-200 relative", children: [instance.isDefault && (_jsx("div", { className: "absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10", children: "\u2B50 Padr\u00E3o" })), _jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-base font-semibold flex items-center space-x-2", children: [_jsx(Smartphone, { className: "w-4 h-4 text-blue-600" }), _jsx("span", { className: "truncate", children: instance.instanceName })] }), getStatusIcon(instance.status, instance.connected)] }) }), _jsxs(CardContent, { className: "space-y-3", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Status:" }), getStatusBadge(instance.status, instance.connected)] }), instance.phone && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Telefone:" }), _jsx("span", { className: "text-sm font-medium", children: instance.phone })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u00DAltima atualiza\u00E7\u00E3o:" }), _jsx("span", { className: "text-xs text-gray-500", children: instance.lastUpdate ? new Date(instance.lastUpdate).toLocaleTimeString() : 'Nunca' })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between space-x-2", children: [instance.connected ? (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => disconnectInstance(instance.instanceName), className: "flex-1 text-red-600 border-red-200 hover:bg-red-50", children: [_jsx(PowerOff, { className: "w-4 h-4 mr-2" }), "Desconectar"] })) : (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => connectInstance(instance.instanceName), className: "flex-1 text-green-600 border-green-200 hover:bg-green-50", children: [_jsx(QrCode, { className: "w-4 h-4 mr-2" }), "Conectar"] })), _jsx(Button, { variant: "outline", size: "sm", onClick: () => deleteInstance(instance.instanceName), className: "text-red-600 border-red-200 hover:bg-red-50", children: _jsx(Trash2, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [!instance.isDefault && (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setAsDefaultInstance(instance.instanceName), className: "text-yellow-600 border-yellow-200 hover:bg-yellow-50", children: [_jsx(Settings, { className: "w-4 h-4 mr-2" }), "Padr\u00E3o"] })), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => openWebhookModal(instance.instanceName), className: "text-blue-600 border-blue-200 hover:bg-blue-50", children: [_jsx(Webhook, { className: "w-4 h-4 mr-2" }), "Webhook"] })] })] })] })] }, instance.instanceName))), instances.length === 0 && !isLoading && (_jsx(Card, { className: "col-span-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx(Smartphone, { className: "w-12 h-12 mx-auto text-gray-400 mb-4" }), _jsx("h4", { className: "text-lg font-medium text-gray-900 mb-2", children: "Nenhuma inst\u00E2ncia configurada" }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["Crie a primeira inst\u00E2ncia WhatsApp para o ", departmentName] }), _jsxs(Button, { onClick: () => setShowCreateModal(true), className: "bg-green-600 hover:bg-green-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Criar Primeira Inst\u00E2ncia"] })] }) }))] }), _jsx(Dialog, { open: showCreateModal, onOpenChange: setShowCreateModal, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [_jsx(Plus, { className: "w-5 h-5 text-green-600" }), _jsxs("span", { children: ["Nova Inst\u00E2ncia - ", departmentName] })] }), _jsxs(DialogDescription, { children: ["Crie uma nova inst\u00E2ncia WhatsApp exclusiva para o ", departmentName] })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "instanceName", children: "Nome da Inst\u00E2ncia *" }), _jsx(Input, { id: "instanceName", value: newInstanceName, onChange: (e) => setNewInstanceName(e.target.value), placeholder: "Ex: principal, atendimento, vendas", className: "w-full" }), _jsxs("p", { className: "text-xs text-gray-500", children: ["Nome final: ", departmentName.toLowerCase().replace(/\s+/g, '-'), "-", newInstanceName.toLowerCase().replace(/\s+/g, '-')] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "setAsDefault", checked: setAsDefault || instances.length === 0, onChange: (e) => setSetAsDefault(e.target.checked), disabled: instances.length === 0, className: "w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" }), _jsxs(Label, { htmlFor: "setAsDefault", className: "text-sm", children: ["Definir como inst\u00E2ncia padr\u00E3o do departamento", instances.length === 0 && " (primeira instância)"] })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowCreateModal(false), children: "Cancelar" }), _jsxs(Button, { onClick: createNewInstance, disabled: isCreating || !newInstanceName.trim(), className: "bg-green-600 hover:bg-green-700", children: [isCreating ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" })) : (_jsx(Plus, { className: "w-4 h-4 mr-2" })), "Criar Inst\u00E2ncia"] })] })] }) }), _jsx(Dialog, { open: showQRModal, onOpenChange: setShowQRModal, children: _jsxs(DialogContent, { className: "max-w-lg", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [_jsx(QrCode, { className: "w-5 h-5 text-blue-600" }), _jsxs("span", { children: ["Conectar WhatsApp - ", qrInstance] })] }), _jsxs(DialogDescription, { children: ["Escaneie o QR Code com seu WhatsApp para conectar esta inst\u00E2ncia ao ", departmentName] })] }), _jsx("div", { className: "py-6 qr-code-container", children: isQRLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center space-y-4 h-64 qr-loading-container", children: [_jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-600" }), _jsx("p", { className: "text-gray-600", children: "Gerando QR Code..." }), _jsx("div", { className: "text-xs text-gray-500", children: "Conectando com a Evolution API..." })] })) : currentQRCode ? (_jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "bg-white p-4 rounded-lg border-2 border-gray-200 inline-block qr-image-container shadow-lg", children: _jsx("img", { src: currentQRCode, alt: "QR Code WhatsApp", className: "w-64 h-64 mx-auto object-contain rounded border", style: {
                                                maxWidth: '256px',
                                                maxHeight: '256px',
                                                background: 'white'
                                            }, onError: (e) => {
                                                console.error('❌ Erro ao carregar imagem do QR Code');
                                                e.currentTarget.style.display = 'none';
                                            }, onLoad: () => {
                                                console.log('✅ QR Code carregado com sucesso');
                                            } }) }), _jsxs("div", { className: "space-y-2 max-w-sm mx-auto", children: [_jsx("p", { className: "text-sm text-gray-600 font-medium", children: "\uD83D\uDCF1 Como conectar:" }), _jsxs("div", { className: "text-xs text-gray-600 space-y-1 text-left bg-gray-50 p-3 rounded", children: [_jsxs("p", { children: [_jsx("strong", { children: "1." }), " Abra o WhatsApp no seu celular"] }), _jsxs("p", { children: [_jsx("strong", { children: "2." }), " V\u00E1 em ", _jsx("strong", { children: "Configura\u00E7\u00F5es \u2192 Aparelhos conectados" })] }), _jsxs("p", { children: [_jsx("strong", { children: "3." }), " Toque em ", _jsx("strong", { children: "\"Conectar um aparelho\"" })] }), _jsxs("p", { children: [_jsx("strong", { children: "4." }), " Escaneie este c\u00F3digo QR"] })] })] }), qrRefreshCount > 0 && (_jsxs("div", { className: "text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200", children: ["\uD83D\uDD04 QR Code atualizado ", qrRefreshCount, " vez(es)"] })), _jsx("div", { className: "text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200", children: "\u23F0 O QR Code expira em alguns minutos. Clique em \"Atualizar\" se necess\u00E1rio." })] })) : (_jsxs("div", { className: "text-center text-gray-600 qr-error-container", children: [_jsx(XCircle, { className: "w-12 h-12 mx-auto mb-3 text-red-500" }), _jsx("p", { className: "font-medium text-red-600 mb-2", children: "Erro ao gerar QR Code" }), _jsxs("div", { className: "text-xs text-gray-500 max-w-xs mx-auto bg-red-50 p-3 rounded border border-red-200", children: [_jsx("p", { children: "Poss\u00EDveis causas:" }), _jsxs("ul", { className: "list-disc list-inside mt-1 space-y-1", children: [_jsx("li", { children: "Evolution API offline" }), _jsx("li", { children: "Inst\u00E2ncia n\u00E3o encontrada" }), _jsx("li", { children: "Problemas de rede" })] })] })] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowQRModal(false), children: "Fechar" }), currentQRCode && (_jsxs(Button, { onClick: refreshQRCode, disabled: isQRLoading, className: "bg-blue-600 hover:bg-blue-700", children: [isQRLoading ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" })) : (_jsx(RefreshCw, { className: "w-4 h-4 mr-2" })), "Atualizar QR Code"] }))] })] }) }), _jsx(WebhookConfigModal, { isOpen: showWebhookModal, onClose: () => setShowWebhookModal(false), instanceName: webhookInstance, departmentName: departmentName, currentWebhook: currentWebhookConfig, onSave: async (webhookData) => {
                    console.log('💾 Salvando dados do modal:', webhookData);
                    // Atualizar estados locais
                    setCurrentWebhookConfig(webhookData);
                    setWebhookUrl(webhookData.url);
                    setWebhookEnabled(webhookData.enabled);
                    // Salvar na Evolution API usando os dados corretos do modal
                    await saveWebhookConfigWithData(webhookData);
                } })] }));
};
