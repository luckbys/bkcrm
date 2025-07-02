import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { evolutionApi } from '@/services/evolutionApiService';
import { useToast } from '@/hooks/use-toast';
import { 
  Smartphone, 
  QrCode, 
  Wifi, 
  WifiOff, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  Copy,
  Power,
  PowerOff,
  Bug,
  TestTube,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EvolutionInstance {
  id?: string;
  instanceName: string;
  status: 'open' | 'close' | 'connecting' | 'unknown';
  department?: string;
  phone?: string;
  connected: boolean;
  lastUpdate: Date;
  qrCode?: string;
}

export const EvolutionInstanceManager = () => {
  const { toast } = useToast();
  
  // Estados principais
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  
  // Estados para criação de instância
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newInstanceDepartment, setNewInstanceDepartment] = useState('');
  
  // Estados para QR Code
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState<string>('');
  const [qrInstance, setQrInstance] = useState<string>('');
  const [qrRefreshCount, setQrRefreshCount] = useState(0);
  const [isQRLoading, setIsQRLoading] = useState(false);
  
  // Estados para debug
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);

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
          const formattedInstances: EvolutionInstance[] = realInstances.map((inst: any) => ({
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
      } catch (apiError) {
        console.warn('⚠️ Não foi possível carregar da Evolution API, usando dados mock:', apiError);
      }

      // Fallback para dados mock
      const mockInstances: EvolutionInstance[] = [
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
      
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast({
        title: "❌ Erro ao carregar instâncias",
        description: "Não foi possível conectar com a Evolution API",
        variant: "destructive"
      });
    } finally {
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
      const newInstance: EvolutionInstance = {
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
      
    } catch (error: any) {
      console.error('❌ Erro ao criar instância:', error);
      
      // Mostrar erro específico
      let errorMessage = error.message;
      if (error.message.includes('API Key')) {
        errorMessage = 'Chave de API inválida. Verifique suas configurações.';
      } else if (error.message.includes('já existe')) {
        errorMessage = 'Esta instância já existe. Escolha um nome diferente.';
      } else if (error.message.includes('conectar')) {
        errorMessage = 'Evolution API não está respondendo. Verifique se está rodando.';
      }
      
      toast({
        title: "❌ Erro ao criar instância",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
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
      } else {
        toast({
          title: "⚠️ Problemas detectados",
          description: "Verifique as configurações da Evolution API",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Erro no diagnóstico:', error);
      setDebugResults({ success: false, error: error.message });
      toast({
        title: "❌ Erro no diagnóstico",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const connectInstance = async (instanceName: string) => {
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
          
        } catch (createError: any) {
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
        
      } else {
        throw new Error('QR Code não foi gerado pela API');
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao conectar instância:', error);
      setCurrentQRCode('');
      
      let errorMessage = error.message;
      let showRetryOption = false;
      
      if (error.message.includes('não existe') || error.message.includes('404')) {
        errorMessage = `Instância "${instanceName}" não encontrada. Verifique se foi criada corretamente.`;
        showRetryOption = true;
      } else if (error.message.includes('já está conectada')) {
        errorMessage = 'Instância já está conectada. Desconecte primeiro se precisar gerar novo QR Code.';
      } else if (error.message.includes('estado inválido')) {
        errorMessage = 'Instância em estado inválido. Tente reiniciar a conexão.';
        showRetryOption = true;
      }
      
      toast({
        title: "❌ Erro ao gerar QR Code",
        description: errorMessage,
        variant: "destructive",
        action: showRetryOption ? (
          <Button 
            size="sm" 
            onClick={() => handleInstanceRecovery(instanceName)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Tentar Corrigir
          </Button>
        ) : undefined
      });
    } finally {
      setIsQRLoading(false);
    }
  };

  // Função para monitorar o status da conexão após gerar QR Code
  const startConnectionMonitoring = (instanceName: string) => {
    console.log(`🔍 Iniciando monitoramento de conexão para: ${instanceName}`);
    
    const monitoringInterval = setInterval(async () => {
      try {
        const status = await evolutionApiService.getInstanceStatus(instanceName, false);
        
        if (status?.instance?.state === 'open') {
          // Conexão estabelecida com sucesso!
          console.log(`✅ Instância ${instanceName} conectada com sucesso!`);
          
          // Atualizar lista local
          setInstances(prev => prev.map(instance => 
            instance.instanceName === instanceName 
              ? { ...instance, status: 'open', connected: true, lastUpdate: new Date() }
              : instance
          ));
          
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
          
        } else if (status?.instance?.state === 'connecting') {
          console.log(`🔄 Instância ${instanceName} ainda conectando...`);
          
          // Atualizar status local para connecting
          setInstances(prev => prev.map(instance => 
            instance.instanceName === instanceName 
              ? { ...instance, status: 'connecting', connected: false, lastUpdate: new Date() }
              : instance
          ));
        }
        
      } catch (error: any) {
        console.warn(`⚠️ Erro no monitoramento de ${instanceName}:`, error.message);
      }
    }, 3000); // Verificar a cada 3 segundos
    
    // Parar monitoramento após 5 minutos para evitar polling infinito
    setTimeout(() => {
      clearInterval(monitoringInterval);
      console.log(`⏱️ Timeout no monitoramento de ${instanceName}`);
    }, 5 * 60 * 1000);
  };

  const handleInstanceRecovery = async (instanceName: string) => {
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
      
    } catch (error: any) {
      console.error('❌ Erro na recuperação:', error);
      toast({
        title: "❌ Falha na recuperação",
        description: "Não foi possível recuperar a instância. Tente criar uma nova.",
        variant: "destructive"
      });
    }
  };

  const refreshQRCode = async () => {
    if (!qrInstance) return;
    
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
    } catch (error: any) {
      toast({
        title: "❌ Erro ao atualizar QR Code",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsQRLoading(false);
    }
  };

  const disconnectInstance = async (instanceName: string) => {
    try {
      await evolutionApiService.logoutInstance(instanceName);
      
      // Atualizar lista local
      setInstances(prev => prev.map(instance => 
        instance.instanceName === instanceName 
          ? { ...instance, status: 'close', connected: false, lastUpdate: new Date() }
          : instance
      ));
      
      toast({
        title: "👋 Instância desconectada",
        description: `"${instanceName}" foi desconectada do WhatsApp`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao desconectar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteInstance = async (instanceName: string) => {
    try {
      await evolutionApiService.deleteInstance(instanceName);
      
      // Remover da lista local
      setInstances(prev => prev.filter(instance => instance.instanceName !== instanceName));
      
      toast({
        title: "🗑️ Instância removida",
        description: `"${instanceName}" foi deletada permanentemente`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro ao deletar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string, connected: boolean) => {
    if (connected && status === 'open') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (status === 'connecting') {
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: string, connected: boolean) => {
    if (connected && status === 'open') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>;
    } else if (status === 'connecting') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Conectando</Badge>;
    } else {
      return <Badge variant="destructive">Desconectado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Instâncias WhatsApp</h2>
          <p className="text-gray-600">Gerencie as conexões da Evolution API</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowDebugModal(true)}
            disabled={isDebugging}
            className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Bug className="w-4 h-4" />
            <span>Debug API</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={loadInstances} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span>Atualizar</span>
          </Button>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Instância</span>
          </Button>
        </div>
      </div>

      {/* Lista de Instâncias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances.map((instance) => (
          <Card key={instance.instanceName} className="hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>{instance.instanceName}</span>
                </CardTitle>
                {getStatusIcon(instance.status, instance.connected)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(instance.status, instance.connected)}
                </div>
                
                {instance.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Departamento:</span>
                    <Badge variant="outline">{instance.department}</Badge>
                  </div>
                )}
                
                {instance.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Telefone:</span>
                    <span className="text-sm font-medium">{instance.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última atualização:</span>
                  <span className="text-xs text-gray-500">
                    {instance.lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between space-x-2">
                {instance.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectInstance(instance.instanceName)}
                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <PowerOff className="w-4 h-4 mr-2" />
                    Desconectar
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => connectInstance(instance.instanceName)}
                    className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Conectar
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteInstance(instance.instanceName)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {instances.length === 0 && !isLoading && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Smartphone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma instância configurada</h3>
              <p className="text-gray-600 mb-4">Crie sua primeira instância do WhatsApp para começar a usar o sistema</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Instância
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Criação */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-green-600" />
              <span>Nova Instância WhatsApp</span>
            </DialogTitle>
            <DialogDescription>
              Crie uma nova instância para conectar um número do WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância *</Label>
              <Input
                id="instanceName"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Ex: vendas-principal, suporte-geral"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Use apenas letras, números e hífens. Será usado como identificador único.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={newInstanceDepartment}
                onChange={(e) => setNewInstanceDepartment(e.target.value)}
                placeholder="Ex: Vendas, Suporte, Financeiro"
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={createNewInstance} 
              disabled={isCreating || !newInstanceName.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Criar Instância
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal do QR Code */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span>Conectar WhatsApp - {qrInstance}</span>
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar a instância
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {isQRLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4 h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Gerando QR Code...</p>
              </div>
            ) : currentQRCode ? (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                  <img 
                    src={currentQRCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    1. Abra o WhatsApp no seu celular
                  </p>
                  <p className="text-sm text-gray-600">
                    2. Vá em <strong>Configurações → Aparelhos conectados</strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    3. Toque em <strong>"Conectar um aparelho"</strong> e escaneie o código
                  </p>
                </div>
                
                {qrRefreshCount > 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    QR Code atualizado {qrRefreshCount} vez(es)
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-600">
                <XCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                <p>Erro ao gerar QR Code</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRModal(false)}>
              Fechar
            </Button>
            {currentQRCode && (
              <Button 
                onClick={refreshQRCode} 
                disabled={isQRLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isQRLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Atualizar QR Code
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

             {/* Modal de Debug */}
       <Dialog open={showDebugModal} onOpenChange={setShowDebugModal}>
         <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle className="flex items-center space-x-2">
               <Bug className="w-5 h-5 text-red-600" />
               <span>Diagnóstico da Evolution API</span>
             </DialogTitle>
             <DialogDescription>
               Verifique a saúde e configuração da Evolution API
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-6 py-4">
             {/* Informações atuais */}
             <div className="space-y-3">
               <h3 className="font-medium text-gray-900 flex items-center">
                 <Info className="w-4 h-4 mr-2 text-blue-600" />
                 Configurações Atuais
               </h3>
               <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                 <div className="flex justify-between">
                   <span className="text-gray-600">URL da API:</span>
                   <span className="font-mono">{import.meta.env.VITE_EVOLUTION_API_URL || 'Não configurada'}</span>
                 </div>
                 <div className="flex justify-between">
                   <span className="text-gray-600">API Key:</span>
                   <span className="font-mono">
                     {import.meta.env.VITE_EVOLUTION_API_KEY 
                       ? `${import.meta.env.VITE_EVOLUTION_API_KEY.substring(0, 8)}...` 
                       : '❌ Não configurada'}
                   </span>
                 </div>
               </div>
             </div>

             {/* Botão de teste */}
             <Button 
               onClick={runDebugTest} 
               disabled={isDebugging}
               className="w-full bg-red-600 hover:bg-red-700"
             >
               {isDebugging ? (
                 <Loader2 className="w-4 h-4 animate-spin mr-2" />
               ) : (
                 <TestTube className="w-4 h-4 mr-2" />
               )}
               {isDebugging ? 'Executando Diagnóstico...' : 'Executar Diagnóstico Completo'}
             </Button>

             {/* Resultados do debug */}
             {debugResults && (
               <div className="space-y-4">
                 <h3 className="font-medium text-gray-900 flex items-center">
                   {debugResults.success ? (
                     <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                   ) : (
                     <XCircle className="w-4 h-4 mr-2 text-red-600" />
                   )}
                   Resultados do Diagnóstico
                 </h3>
                 
                 <div className={cn(
                   "p-4 rounded-lg text-sm",
                   debugResults.success 
                     ? "bg-green-50 border border-green-200" 
                     : "bg-red-50 border border-red-200"
                 )}>
                   {debugResults.success ? (
                     <div className="space-y-2">
                       <div className="flex items-center text-green-800">
                         <CheckCircle className="w-4 h-4 mr-2" />
                         <span className="font-medium">Evolution API está funcionando!</span>
                       </div>
                       <p className="text-green-700">
                         A conexão foi estabelecida com sucesso. Você pode criar instâncias.
                       </p>
                     </div>
                   ) : (
                     <div className="space-y-2">
                       <div className="flex items-center text-red-800">
                         <XCircle className="w-4 h-4 mr-2" />
                         <span className="font-medium">Problemas detectados:</span>
                       </div>
                       <p className="text-red-700">{debugResults.error}</p>
                       <div className="mt-3 p-3 bg-red-100 rounded text-red-800">
                         <p className="font-medium mb-2">💡 Soluções sugeridas:</p>
                         <ul className="space-y-1 text-sm list-disc list-inside">
                           <li>Verifique se a Evolution API está rodando</li>
                           <li>Confirme se a URL está correta no arquivo .env</li>
                           <li>Verifique se a API Key está configurada corretamente</li>
                           <li>Teste o acesso direto: {import.meta.env.VITE_EVOLUTION_API_URL}</li>
                         </ul>
                       </div>
                     </div>
                   )}
                 </div>
                 
                 <p className="text-xs text-gray-500 flex items-center">
                   <Info className="w-3 h-3 mr-1" />
                   Verifique o console do navegador (F12) para logs detalhados
                 </p>
               </div>
             )}
           </div>
           
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowDebugModal(false)}>
               Fechar
             </Button>
             {debugResults?.success && (
               <Button 
                 onClick={() => {
                   setShowDebugModal(false);
                   setShowCreateModal(true);
                 }}
                 className="bg-green-600 hover:bg-green-700"
               >
                 <Plus className="w-4 h-4 mr-2" />
                 Criar Nova Instância
               </Button>
             )}
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </div>
  );
}; 