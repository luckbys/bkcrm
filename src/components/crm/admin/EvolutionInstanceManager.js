import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Smartphone, QrCode, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2, PowerOff, Bug, TestTube, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
export const EvolutionInstanceManager = () => {
    const { toast } = useToast();
    // Estados principais
    const [instances, setInstances] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDebugging, setIsDebugging] = useState(false);
    // Estados para criação de instância
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newInstanceName, setNewInstanceName] = useState('');
    const [newInstanceDepartment, setNewInstanceDepartment] = useState('');
    // Estados para QR Code
    const [showQRModal, setShowQRModal] = useState(false);
    const [currentQRCode, setCurrentQRCode] = useState('');
    const [qrInstance, setQrInstance] = useState('');
    const [qrRefreshCount, setQrRefreshCount] = useState(0);
    const [isQRLoading, setIsQRLoading] = useState(false);
    // Estados para debug
    const [showDebugModal, setShowDebugModal] = useState(false);
    const [debugResults, setDebugResults] = useState(null);
    // Carregamento inicial
    useEffect(() => {
        loadInstances();
        // Auto-refresh a cada 30 segundos
        const interval = setInterval(loadInstances, 30000);
        return () => clearInterval(interval);
    }, []);
    const loadInstances = async () => {
        setIsLoading(true);
        try {
            // Tentar carregar instâncias reais da Evolution API
            try {
                const realInstances = await evolutionApiService.listInstances();
                if (realInstances && realInstances.length > 0) {
                    const formattedInstances = realInstances.map((inst) => ({
                        instanceName: inst.instanceName || inst.instance?.instanceName,
                        status: inst.instance?.status || 'unknown',
                        connected: inst.instance?.status === 'open',
                        lastUpdate: new Date(),
                        department: 'Carregado da API'
                    }));
                    setInstances(formattedInstances);
                    console.log('✅ Instâncias carregadas da Evolution API:', formattedInstances.length);
                    return;
                }
            }
            catch (apiError) {
                console.warn('⚠️ Não foi possível carregar da Evolution API, usando dados mock:', apiError);
            }
            // Fallback para dados mock
            const mockInstances = [
                {
                    instanceName: 'vendas-principal',
                    status: 'close',
                    department: 'Vendas',
                    phone: '(11) 99999-8888',
                    connected: false,
                    lastUpdate: new Date()
                },
                {
                    instanceName: 'suporte-geral',
                    status: 'close',
                    department: 'Suporte',
                    connected: false,
                    lastUpdate: new Date(Date.now() - 5 * 60 * 1000)
                }
            ];
            setInstances(mockInstances);
            console.log('ℹ️ Usando instâncias mock');
        }
        catch (error) {
            console.error('Erro ao carregar instâncias:', error);
            toast({
                title: "❌ Erro ao carregar instâncias",
                description: "Não foi possível conectar com a Evolution API",
                variant: "destructive"
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const createNewInstance = async () => {
        if (!newInstanceName.trim()) {
            toast({
                title: "⚠️ Nome obrigatório",
                description: "Digite um nome para a instância",
                variant: "destructive"
            });
            return;
        }
        setIsCreating(true);
        try {
            console.log(`🚀 Criando instância: ${newInstanceName}`);
            // Usar a função de teste melhorada
            const result = await evolutionApiService.testCreateInstance(newInstanceName.trim());
            if (!result.success) {
                throw new Error(result.error);
            }
            console.log('✅ Instância criada:', result.data);
            // Adicionar à lista local
            const newInstance = {
                instanceName: newInstanceName.trim(),
                status: 'close',
                department: newInstanceDepartment.trim() || 'Geral',
                connected: false,
                lastUpdate: new Date()
            };
            setInstances(prev => [...prev, newInstance]);
            setShowCreateModal(false);
            setNewInstanceName('');
            setNewInstanceDepartment('');
            toast({
                title: "✅ Instância criada!",
                description: `Instância "${newInstanceName}" foi criada com sucesso. Conecte via QR Code.`,
            });
            // Abrir automaticamente o QR Code
            setTimeout(() => {
                connectInstance(newInstanceName.trim());
            }, 1000);
        }
        catch (error) {
            console.error('❌ Erro ao criar instância:', error);
            // Mostrar erro específico
            let errorMessage = error.message;
            if (error.message.includes('API Key')) {
                errorMessage = 'Chave de API inválida. Verifique suas configurações.';
            }
            else if (error.message.includes('já existe')) {
                errorMessage = 'Esta instância já existe. Escolha um nome diferente.';
            }
            else if (error.message.includes('conectar')) {
                errorMessage = 'Evolution API não está respondendo. Verifique se está rodando.';
            }
            toast({
                title: "❌ Erro ao criar instância",
                description: errorMessage,
                variant: "destructive"
            });
        }
        finally {
            setIsCreating(false);
        }
    };
    const runDebugTest = async () => {
        setIsDebugging(true);
        setShowDebugModal(true);
        try {
            console.log('🔍 Iniciando diagnóstico da Evolution API...');
            const results = await evolutionApiService.debugEvolutionApi();
            setDebugResults(results);
            if (results.success) {
                toast({
                    title: "✅ Diagnóstico concluído",
                    description: "Verifique o console para detalhes completos",
                });
            }
            else {
                toast({
                    title: "⚠️ Problemas detectados",
                    description: "Verifique as configurações da Evolution API",
                    variant: "destructive"
                });
            }
        }
        catch (error) {
            console.error('❌ Erro no diagnóstico:', error);
            setDebugResults({ success: false, error: error.message });
            toast({
                title: "❌ Erro no diagnóstico",
                description: error.message,
                variant: "destructive"
            });
        }
        finally {
            setIsDebugging(false);
        }
    };
    const connectInstance = async (instanceName) => {
        setIsQRLoading(true);
        setQrInstance(instanceName);
        setShowQRModal(true);
        setQrRefreshCount(0);
        setCurrentQRCode('');
        try {
            console.log(`📱 Iniciando conexão para: ${instanceName}`);
            // Verificar se a instância existe
            const exists = await evolutionApiService.instanceExists(instanceName);
            if (!exists) {
                console.log(`⚠️ Instância "${instanceName}" não encontrada. Tentando criar...`);
                toast({
                    title: "⚠️ Instância não encontrada",
                    description: "Criando instância automaticamente...",
                });
                try {
                    const createResult = await evolutionApiService.testCreateInstance(instanceName);
                    if (!createResult.success) {
                        throw new Error(createResult.error);
                    }
                    console.log('✅ Instância criada automaticamente');
                    toast({
                        title: "✅ Instância criada",
                        description: `Instância "${instanceName}" foi criada. Aguarde o QR Code...`,
                    });
                    // Aguardar um pouco para a instância se estabilizar
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
                catch (createError) {
                    console.error('❌ Erro ao criar instância automaticamente:', createError);
                    setIsQRLoading(false);
                    toast({
                        title: "❌ Erro ao criar instância",
                        description: createError.message || "Não foi possível criar a instância automaticamente",
                        variant: "destructive"
                    });
                    return;
                }
            }
            // Tentar obter QR Code
            const qrResponse = await evolutionApiService.getInstanceQRCode(instanceName);
            if (qrResponse && qrResponse.base64) {
                setCurrentQRCode(qrResponse.base64);
                toast({
                    title: "📱 QR Code gerado",
                    description: "Escaneie com seu WhatsApp para conectar",
                });
                // Iniciar monitoramento do status da conexão
                startConnectionMonitoring(instanceName);
            }
            else {
                throw new Error('QR Code não foi gerado pela API');
            }
        }
        catch (error) {
            console.error('❌ Erro ao conectar instância:', error);
            setCurrentQRCode('');
            let errorMessage = error.message;
            let showRetryOption = false;
            if (error.message.includes('não existe') || error.message.includes('404')) {
                errorMessage = `Instância "${instanceName}" não encontrada. Verifique se foi criada corretamente.`;
                showRetryOption = true;
            }
            else if (error.message.includes('já está conectada')) {
                errorMessage = 'Instância já está conectada. Desconecte primeiro se precisar gerar novo QR Code.';
            }
            else if (error.message.includes('estado inválido')) {
                errorMessage = 'Instância em estado inválido. Tente reiniciar a conexão.';
                showRetryOption = true;
            }
            toast({
                title: "❌ Erro ao gerar QR Code",
                description: errorMessage,
                variant: "destructive",
                action: showRetryOption ? (_jsx(Button, { size: "sm", onClick: () => handleInstanceRecovery(instanceName), className: "bg-blue-600 hover:bg-blue-700 text-white", children: "Tentar Corrigir" })) : undefined
            });
        }
        finally {
            setIsQRLoading(false);
        }
    };
    // Função para monitorar o status da conexão após gerar QR Code
    const startConnectionMonitoring = (instanceName) => {
        console.log(`🔍 Iniciando monitoramento de conexão para: ${instanceName}`);
        const monitoringInterval = setInterval(async () => {
            try {
                const status = await evolutionApiService.getInstanceStatus(instanceName, false);
                if (status?.instance?.state === 'open') {
                    // Conexão estabelecida com sucesso!
                    console.log(`✅ Instância ${instanceName} conectada com sucesso!`);
                    // Atualizar lista local
                    setInstances(prev => prev.map(instance => instance.instanceName === instanceName
                        ? { ...instance, status: 'open', connected: true, lastUpdate: new Date() }
                        : instance));
                    // Fechar modal do QR Code
                    setShowQRModal(false);
                    setCurrentQRCode('');
                    // Mostrar mensagem de sucesso
                    toast({
                        title: "🎉 Conectado com sucesso!",
                        description: `A instância "${instanceName}" foi conectada ao WhatsApp. Você já pode enviar e receber mensagens!`,
                        className: "border-green-200 bg-green-50 text-green-800",
                        duration: 5000
                    });
                    // Parar monitoramento
                    clearInterval(monitoringInterval);
                    // Opcional: Recarregar lista completa
                    setTimeout(() => {
                        console.log('🔄 Atualizando lista completa de instâncias...');
                        loadInstances();
                    }, 2000);
                }
                else if (status?.instance?.state === 'connecting') {
                    console.log(`🔄 Instância ${instanceName} ainda conectando...`);
                    // Atualizar status local para connecting
                    setInstances(prev => prev.map(instance => instance.instanceName === instanceName
                        ? { ...instance, status: 'connecting', connected: false, lastUpdate: new Date() }
                        : instance));
                }
            }
            catch (error) {
                console.warn(`⚠️ Erro no monitoramento de ${instanceName}:`, error.message);
            }
        }, 3000); // Verificar a cada 3 segundos
        // Parar monitoramento após 5 minutos para evitar polling infinito
        setTimeout(() => {
            clearInterval(monitoringInterval);
            console.log(`⏱️ Timeout no monitoramento de ${instanceName}`);
        }, 5 * 60 * 1000);
    };
    const handleInstanceRecovery = async (instanceName) => {
        console.log(`🔧 Tentando recuperar instância: ${instanceName}`);
        try {
            toast({
                title: "🔧 Recuperando instância",
                description: "Tentando corrigir problemas de conexão...",
            });
            // Tentar reiniciar a conexão
            await evolutionApiService.restartInstanceConnection(instanceName);
            toast({
                title: "✅ Instância recuperada",
                description: "Tentando gerar QR Code novamente...",
            });
            // Aguardar e tentar conectar novamente
            setTimeout(() => {
                connectInstance(instanceName);
            }, 2000);
        }
        catch (error) {
            console.error('❌ Erro na recuperação:', error);
            toast({
                title: "❌ Falha na recuperação",
                description: "Não foi possível recuperar a instância. Tente criar uma nova.",
                variant: "destructive"
            });
        }
    };
    const refreshQRCode = async () => {
        if (!qrInstance)
            return;
        setIsQRLoading(true);
        setQrRefreshCount(prev => prev + 1);
        try {
            const qrResponse = await evolutionApiService.getInstanceQRCode(qrInstance);
            if (qrResponse.base64) {
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
            await evolutionApiService.logoutInstance(instanceName);
            // Atualizar lista local
            setInstances(prev => prev.map(instance => instance.instanceName === instanceName
                ? { ...instance, status: 'close', connected: false, lastUpdate: new Date() }
                : instance));
            toast({
                title: "👋 Instância desconectada",
                description: `"${instanceName}" foi desconectada do WhatsApp`,
            });
        }
        catch (error) {
            toast({
                title: "❌ Erro ao desconectar",
                description: error.message,
                variant: "destructive"
            });
        }
    };
    const deleteInstance = async (instanceName) => {
        try {
            await evolutionApiService.deleteInstance(instanceName);
            // Remover da lista local
            setInstances(prev => prev.filter(instance => instance.instanceName !== instanceName));
            toast({
                title: "🗑️ Instância removida",
                description: `"${instanceName}" foi deletada permanentemente`,
            });
        }
        catch (error) {
            toast({
                title: "❌ Erro ao deletar",
                description: error.message,
                variant: "destructive"
            });
        }
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
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Inst\u00E2ncias WhatsApp" }), _jsx("p", { className: "text-gray-600", children: "Gerencie as conex\u00F5es da Evolution API" })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs(Button, { variant: "outline", onClick: () => setShowDebugModal(true), disabled: isDebugging, className: "flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50", children: [_jsx(Bug, { className: "w-4 h-4" }), _jsx("span", { children: "Debug API" })] }), _jsxs(Button, { variant: "outline", onClick: loadInstances, disabled: isLoading, className: "flex items-center space-x-2", children: [_jsx(RefreshCw, { className: cn("w-4 h-4", isLoading && "animate-spin") }), _jsx("span", { children: "Atualizar" })] }), _jsxs(Button, { onClick: () => setShowCreateModal(true), className: "flex items-center space-x-2 bg-green-600 hover:bg-green-700", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Nova Inst\u00E2ncia" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [instances.map((instance) => (_jsxs(Card, { className: "hover:shadow-lg transition-all duration-200", children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-lg font-semibold flex items-center space-x-2", children: [_jsx(Smartphone, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { children: instance.instanceName })] }), getStatusIcon(instance.status, instance.connected)] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Status:" }), getStatusBadge(instance.status, instance.connected)] }), instance.department && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Departamento:" }), _jsx(Badge, { variant: "outline", children: instance.department })] })), instance.phone && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Telefone:" }), _jsx("span", { className: "text-sm font-medium", children: instance.phone })] })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u00DAltima atualiza\u00E7\u00E3o:" }), _jsx("span", { className: "text-xs text-gray-500", children: instance.lastUpdate.toLocaleTimeString() })] })] }), _jsx(Separator, {}), _jsxs("div", { className: "flex items-center justify-between space-x-2", children: [instance.connected ? (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => disconnectInstance(instance.instanceName), className: "flex-1 text-red-600 border-red-200 hover:bg-red-50", children: [_jsx(PowerOff, { className: "w-4 h-4 mr-2" }), "Desconectar"] })) : (_jsxs(Button, { variant: "outline", size: "sm", onClick: () => connectInstance(instance.instanceName), className: "flex-1 text-green-600 border-green-200 hover:bg-green-50", children: [_jsx(QrCode, { className: "w-4 h-4 mr-2" }), "Conectar"] })), _jsx(Button, { variant: "outline", size: "sm", onClick: () => deleteInstance(instance.instanceName), className: "text-red-600 border-red-200 hover:bg-red-50", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] })] }, instance.instanceName))), instances.length === 0 && !isLoading && (_jsx(Card, { className: "col-span-full", children: _jsxs(CardContent, { className: "p-8 text-center", children: [_jsx(Smartphone, { className: "w-12 h-12 mx-auto text-gray-400 mb-4" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Nenhuma inst\u00E2ncia configurada" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Crie sua primeira inst\u00E2ncia do WhatsApp para come\u00E7ar a usar o sistema" }), _jsxs(Button, { onClick: () => setShowCreateModal(true), className: "bg-green-600 hover:bg-green-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Criar Primeira Inst\u00E2ncia"] })] }) }))] }), _jsx(Dialog, { open: showCreateModal, onOpenChange: setShowCreateModal, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [_jsx(Plus, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: "Nova Inst\u00E2ncia WhatsApp" })] }), _jsx(DialogDescription, { children: "Crie uma nova inst\u00E2ncia para conectar um n\u00FAmero do WhatsApp" })] }), _jsxs("div", { className: "space-y-4 py-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "instanceName", children: "Nome da Inst\u00E2ncia *" }), _jsx(Input, { id: "instanceName", value: newInstanceName, onChange: (e) => setNewInstanceName(e.target.value), placeholder: "Ex: vendas-principal, suporte-geral", className: "w-full" }), _jsx("p", { className: "text-xs text-gray-500", children: "Use apenas letras, n\u00FAmeros e h\u00EDfens. Ser\u00E1 usado como identificador \u00FAnico." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "department", children: "Departamento" }), _jsx(Input, { id: "department", value: newInstanceDepartment, onChange: (e) => setNewInstanceDepartment(e.target.value), placeholder: "Ex: Vendas, Suporte, Financeiro", className: "w-full" })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowCreateModal(false), children: "Cancelar" }), _jsxs(Button, { onClick: createNewInstance, disabled: isCreating || !newInstanceName.trim(), className: "bg-green-600 hover:bg-green-700", children: [isCreating ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" })) : (_jsx(Plus, { className: "w-4 h-4 mr-2" })), "Criar Inst\u00E2ncia"] })] })] }) }), _jsx(Dialog, { open: showQRModal, onOpenChange: setShowQRModal, children: _jsxs(DialogContent, { className: "max-w-lg", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [_jsx(QrCode, { className: "w-5 h-5 text-blue-600" }), _jsxs("span", { children: ["Conectar WhatsApp - ", qrInstance] })] }), _jsx(DialogDescription, { children: "Escaneie o QR Code com seu WhatsApp para conectar a inst\u00E2ncia" })] }), _jsx("div", { className: "py-6", children: isQRLoading ? (_jsxs("div", { className: "flex flex-col items-center justify-center space-y-4 h-64", children: [_jsx(Loader2, { className: "w-8 h-8 animate-spin text-blue-600" }), _jsx("p", { className: "text-gray-600", children: "Gerando QR Code..." })] })) : currentQRCode ? (_jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "bg-white p-4 rounded-lg border-2 border-gray-200 inline-block", children: _jsx("img", { src: currentQRCode, alt: "QR Code WhatsApp", className: "w-64 h-64 mx-auto" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm text-gray-600", children: "1. Abra o WhatsApp no seu celular" }), _jsxs("p", { className: "text-sm text-gray-600", children: ["2. V\u00E1 em ", _jsx("strong", { children: "Configura\u00E7\u00F5es \u2192 Aparelhos conectados" })] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["3. Toque em ", _jsx("strong", { children: "\"Conectar um aparelho\"" }), " e escaneie o c\u00F3digo"] })] }), qrRefreshCount > 0 && (_jsxs("div", { className: "text-xs text-amber-600 bg-amber-50 p-2 rounded", children: ["QR Code atualizado ", qrRefreshCount, " vez(es)"] }))] })) : (_jsxs("div", { className: "text-center text-gray-600", children: [_jsx(XCircle, { className: "w-12 h-12 mx-auto mb-2 text-red-500" }), _jsx("p", { children: "Erro ao gerar QR Code" })] })) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowQRModal(false), children: "Fechar" }), currentQRCode && (_jsxs(Button, { onClick: refreshQRCode, disabled: isQRLoading, className: "bg-blue-600 hover:bg-blue-700", children: [isQRLoading ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" })) : (_jsx(RefreshCw, { className: "w-4 h-4 mr-2" })), "Atualizar QR Code"] }))] })] }) }), _jsx(Dialog, { open: showDebugModal, onOpenChange: setShowDebugModal, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center space-x-2", children: [_jsx(Bug, { className: "w-5 h-5 text-red-600" }), _jsx("span", { children: "Diagn\u00F3stico da Evolution API" })] }), _jsx(DialogDescription, { children: "Verifique a sa\u00FAde e configura\u00E7\u00E3o da Evolution API" })] }), _jsxs("div", { className: "space-y-6 py-4", children: [_jsxs("div", { className: "space-y-3", children: [_jsxs("h3", { className: "font-medium text-gray-900 flex items-center", children: [_jsx(Info, { className: "w-4 h-4 mr-2 text-blue-600" }), "Configura\u00E7\u00F5es Atuais"] }), _jsxs("div", { className: "bg-gray-50 p-4 rounded-lg space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "URL da API:" }), _jsx("span", { className: "font-mono", children: import.meta.env.VITE_EVOLUTION_API_URL || 'Não configurada' })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-gray-600", children: "API Key:" }), _jsx("span", { className: "font-mono", children: import.meta.env.VITE_EVOLUTION_API_KEY
                                                                ? `${import.meta.env.VITE_EVOLUTION_API_KEY.substring(0, 8)}...`
                                                                : '❌ Não configurada' })] })] })] }), _jsxs(Button, { onClick: runDebugTest, disabled: isDebugging, className: "w-full bg-red-600 hover:bg-red-700", children: [isDebugging ? (_jsx(Loader2, { className: "w-4 h-4 animate-spin mr-2" })) : (_jsx(TestTube, { className: "w-4 h-4 mr-2" })), isDebugging ? 'Executando Diagnóstico...' : 'Executar Diagnóstico Completo'] }), debugResults && (_jsxs("div", { className: "space-y-4", children: [_jsxs("h3", { className: "font-medium text-gray-900 flex items-center", children: [debugResults.success ? (_jsx(CheckCircle, { className: "w-4 h-4 mr-2 text-green-600" })) : (_jsx(XCircle, { className: "w-4 h-4 mr-2 text-red-600" })), "Resultados do Diagn\u00F3stico"] }), _jsx("div", { className: cn("p-4 rounded-lg text-sm", debugResults.success
                                                ? "bg-green-50 border border-green-200"
                                                : "bg-red-50 border border-red-200"), children: debugResults.success ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center text-green-800", children: [_jsx(CheckCircle, { className: "w-4 h-4 mr-2" }), _jsx("span", { className: "font-medium", children: "Evolution API est\u00E1 funcionando!" })] }), _jsx("p", { className: "text-green-700", children: "A conex\u00E3o foi estabelecida com sucesso. Voc\u00EA pode criar inst\u00E2ncias." })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center text-red-800", children: [_jsx(XCircle, { className: "w-4 h-4 mr-2" }), _jsx("span", { className: "font-medium", children: "Problemas detectados:" })] }), _jsx("p", { className: "text-red-700", children: debugResults.error }), _jsxs("div", { className: "mt-3 p-3 bg-red-100 rounded text-red-800", children: [_jsx("p", { className: "font-medium mb-2", children: "\uD83D\uDCA1 Solu\u00E7\u00F5es sugeridas:" }), _jsxs("ul", { className: "space-y-1 text-sm list-disc list-inside", children: [_jsx("li", { children: "Verifique se a Evolution API est\u00E1 rodando" }), _jsx("li", { children: "Confirme se a URL est\u00E1 correta no arquivo .env" }), _jsx("li", { children: "Verifique se a API Key est\u00E1 configurada corretamente" }), _jsxs("li", { children: ["Teste o acesso direto: ", import.meta.env.VITE_EVOLUTION_API_URL] })] })] })] })) }), _jsxs("p", { className: "text-xs text-gray-500 flex items-center", children: [_jsx(Info, { className: "w-3 h-3 mr-1" }), "Verifique o console do navegador (F12) para logs detalhados"] })] }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: () => setShowDebugModal(false), children: "Fechar" }), debugResults?.success && (_jsxs(Button, { onClick: () => {
                                        setShowDebugModal(false);
                                        setShowCreateModal(true);
                                    }, className: "bg-green-600 hover:bg-green-700", children: [_jsx(Plus, { className: "w-4 h-4 mr-2" }), "Criar Nova Inst\u00E2ncia"] }))] })] }) })] }));
};
