import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { evolutionApiService } from '@/services/evolutionApiService';
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
  PowerOff
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
      // Aqui você buscaria as instâncias do seu banco de dados
      // Por enquanto, vou simular algumas instâncias
      const mockInstances: EvolutionInstance[] = [
        {
          instanceName: 'vendas-principal',
          status: 'open',
          department: 'Vendas',
          phone: '(11) 99999-8888',
          connected: true,
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
      
      // Verificar status real de cada instância
      const updatedInstances = await Promise.allSettled(
        mockInstances.map(async (instance) => {
          try {
            const statusResponse = await evolutionApiService.getInstanceStatus(instance.instanceName);
            return {
              ...instance,
              status: statusResponse.instance.status,
              connected: statusResponse.instance.status === 'open',
              lastUpdate: new Date()
            };
          } catch (error) {
            return {
              ...instance,
              status: 'unknown' as const,
              connected: false,
              lastUpdate: new Date()
            };
          }
        })
      );
      
      const finalInstances = updatedInstances.map((result, index) => 
        result.status === 'fulfilled' ? result.value : mockInstances[index]
      );
      
      setInstances(finalInstances);
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
      
      const response = await evolutionApiService.createInstance(
        newInstanceName.trim(),
        `${window.location.origin}/api/webhooks/evolution`
      );
      
      console.log('✅ Instância criada:', response);
      
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
      toast({
        title: "❌ Erro ao criar instância",
        description: error.message || "Falha na criação da instância",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const connectInstance = async (instanceName: string) => {
    setIsQRLoading(true);
    setQrInstance(instanceName);
    setShowQRModal(true);
    setQrRefreshCount(0);
    
    try {
      console.log(`📱 Obtendo QR Code para: ${instanceName}`);
      
      const qrResponse = await evolutionApiService.getInstanceQRCode(instanceName);
      
      if (qrResponse.base64) {
        setCurrentQRCode(`data:image/png;base64,${qrResponse.base64}`);
        console.log('✅ QR Code obtido com sucesso');
        
        toast({
          title: "📱 QR Code gerado!",
          description: "Escaneie o código com seu WhatsApp para conectar",
        });
      } else {
        throw new Error('QR Code não retornado pela API');
      }
    } catch (error: any) {
      console.error('❌ Erro ao obter QR Code:', error);
      setShowQRModal(false);
      toast({
        title: "❌ Erro ao gerar QR Code",
        description: error.message || "Não foi possível gerar o QR Code",
        variant: "destructive"
      });
    } finally {
      setIsQRLoading(false);
    }
  };

  const refreshQRCode = async () => {
    if (!qrInstance) return;
    
    setIsQRLoading(true);
    setQrRefreshCount(prev => prev + 1);
    
    try {
      const qrResponse = await evolutionApiService.getInstanceQRCode(qrInstance);
      
      if (qrResponse.base64) {
        setCurrentQRCode(`data:image/png;base64,${qrResponse.base64}`);
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
    </div>
  );
}; 