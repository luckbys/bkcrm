import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { evolutionApi, EvolutionInstanceStatus, QRCode, QRCodeResponse } from '@/services/evolutionApi';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { WebhookConfigModal } from './WebhookConfigModal';
import { 
  Smartphone, 
  QrCode, 
  Wifi, 
  WifiOff, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Power,
  PowerOff,
  Settings,
  Users,
  Building2,
  Info,
  Webhook,
  Link,
  Check,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepartmentInstance {
  id?: string;
  instanceName: string;
  status: 'open' | 'close' | 'connecting' | 'unknown';
  departmentId: string;
  departmentName: string;
  phone?: string;
  connected: boolean;
  lastUpdate: Date;
  qrCode?: string;
  isDefault?: boolean;
  createdBy?: string;
}

interface DepartmentEvolutionManagerProps {
  departmentId: string;
  departmentName: string;
  departmentColor?: string;
}

export const DepartmentEvolutionManager = ({ 
  departmentId, 
  departmentName, 
  departmentColor = '#3B82F6' 
}: DepartmentEvolutionManagerProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados principais
  const [instances, setInstances] = useState<DepartmentInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados para criação de instância
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  
  // Estados para QR Code
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentQRCode, setCurrentQRCode] = useState<string>('');
  const [qrInstance, setQrInstance] = useState<string>('');
  const [qrRefreshCount, setQrRefreshCount] = useState(0);
  const [isQRLoading, setIsQRLoading] = useState(false);
  
  // Estados para configuração de webhook
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookInstance, setWebhookInstance] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookEnabled, setWebhookEnabled] = useState(true);
  const [currentWebhookConfig, setCurrentWebhookConfig] = useState<any>(null);
  const [isWebhookLoading, setIsWebhookLoading] = useState(false);
  
  // Carregamento inicial
  const loadDepartmentInstances = useCallback(async () => {
    if (!departmentId) return;

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
        let evolutionStatus: 'open' | 'close' | 'connecting' | 'unknown' = 'close';
        let isConnected = false;
        
        try {
          // Tentar verificar status na Evolution API (com timeout)
          const statusPromise = evolutionApi.getInstanceStatus(instance.instance_name);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
          );
          
          const status = await Promise.race([statusPromise, timeoutPromise]) as EvolutionInstanceStatus;
          if (status?.instance?.state) {
            evolutionStatus = status.instance.state;
            isConnected = status.instance.state === 'open';
          }
          
        } catch (error: any) {
          console.warn(`⚠️ Evolution API indisponível para ${instance.instance_name}:`, error.message);
          evolutionStatus = 'unknown';
        }

        // Mapear para o formato esperado pelo componente
        const mappedInstance: DepartmentInstance = {
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
        .filter((result): result is PromiseFulfilledResult<DepartmentInstance> => result.status === 'fulfilled')
        .map(result => result.value);

      setInstances(validInstances);

    } catch (error: any) {
      console.error('❌ Erro ao carregar instâncias:', error);
      setInstances([]);
      toast({
        title: "⚠️ Erro ao carregar instâncias",
        description: "Usando modo offline. Evolution API pode estar indisponível.",
        variant: "destructive"
      });
    } finally {
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
      } catch (error) {
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

      if (error) throw error;

      // Recarregar dados
      await loadDepartmentInstances();

      setShowCreateModal(false);
      setNewInstanceName('');

      toast({
        title: "✅ Instância criada",
        description: "A instância foi criada com sucesso. Aguarde o QR Code.",
      });

    } catch (error: any) {
      console.error('❌ Erro ao criar instância:', error);
      toast({
        title: "⚠️ Erro ao criar instância",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para obter QR Code
  const getQRCode = async (instanceName: string): Promise<string | null> => {
    try {
      const qrResponse = await evolutionApi.getInstanceQRCode(instanceName);
      if (qrResponse && qrResponse.success && qrResponse.qrcode) {
        return qrResponse.qrcode.base64;
      }
      return null;
    } catch (error: any) {
      console.error('❌ Erro ao obter QR Code:', error);
      return null;
    }
  };

  // Função para monitorar conexão
  const startConnectionMonitoring = async (instanceName: string) => {
    try {
      const status = await evolutionApi.getInstanceStatus(instanceName);
      if (status.instance.state === 'open') {
        // Instância já conectada
        await loadDepartmentInstances();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erro ao monitorar conexão:', error);
      return false;
    }
  };

  // Função para conectar instância
  const connectInstance = async (instanceName: string) => {
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
    } catch (error: any) {
      console.error('❌ Erro ao conectar instância:', error);
      toast({
        title: "⚠️ Erro ao conectar instância",
        description: error.message,
        variant: "destructive"
      });
    } finally {
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
      setIsLoading(true);
      await evolutionApi.logoutInstance(instanceName);
      await loadDepartmentInstances();
      
      toast({
        title: "✅ Instância desconectada",
        description: "A instância foi desconectada com sucesso.",
      });
    } catch (error: any) {
      console.error('❌ Erro ao desconectar instância:', error);
      toast({
        title: "⚠️ Erro ao desconectar instância",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInstance = async (instanceName: string) => {
    try {
      setIsLoading(true);

      // Deletar da Evolution API
      await evolutionApi.deleteInstance(instanceName);

      // Deletar do banco (soft delete)
      const { error } = await supabase
        .from('evolution_instances')
        .update({ is_active: false })
        .eq('instance_name', instanceName);

      if (error) throw error;

      // Recarregar dados
      await loadDepartmentInstances();

      toast({
        title: "✅ Instância deletada",
        description: "A instância foi removida com sucesso.",
      });
    } catch (error: any) {
      console.error('❌ Erro ao deletar instância:', error);
      toast({
        title: "⚠️ Erro ao deletar instância",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setAsDefaultInstance = async (instanceName: string) => {
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
    } catch (error: any) {
      toast({
        title: "❌ Erro ao definir padrão",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // ===== FUNÇÕES DE WEBHOOK =====

  const openWebhookModal = async (instanceName: string) => {
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
      } else {
        // Webhook não configurado, usar URL sugerida
        const suggestedUrl = webhookService.generateSuggestedWebhookUrl();
        setWebhookUrl(suggestedUrl);
        setWebhookEnabled(true);
        setCurrentWebhookConfig(null);
      }
    } catch (error: any) {
      console.error('❌ Erro ao carregar webhook:', error);
      toast({
        title: "⚠️ Erro ao carregar webhook",
        description: error.message || "Não foi possível carregar a configuração",
        variant: "destructive"
      });
    } finally {
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
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('❌ Erro ao configurar webhook:', error);
      toast({
        title: "❌ Erro ao configurar webhook",
        description: error.message || "Não foi possível salvar a configuração",
        variant: "destructive"
      });
    } finally {
      setIsWebhookLoading(false);
    }
  };

  const saveWebhookConfigWithData = async (webhookData: { url: string; enabled: boolean; events: string[] }) => {
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
      } else {
        console.error('❌ Falha na configuração do webhook:', result);
        throw new Error(result.error || 'Erro desconhecido na configuração');
      }

    } catch (error: any) {
      console.error('❌ Erro ao configurar webhook:', error);
      toast({
        title: "❌ Erro ao configurar webhook",
        description: error.message || "Não foi possível salvar a configuração",
        variant: "destructive"
      });
    } finally {
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
      } else {
        toast({
          title: "⚠️ Problema no webhook",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao testar webhook:', error);
      toast({
        title: "❌ Erro no teste",
        description: error.message || "Não foi possível testar o webhook",
        variant: "destructive"
      });
    } finally {
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
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('❌ Erro ao remover webhook:', error);
      toast({
        title: "❌ Erro ao remover webhook",
        description: error.message || "Não foi possível remover a configuração",
        variant: "destructive"
      });
    } finally {
      setIsWebhookLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "📋 Copiado!",
      description: "URL copiada para a área de transferência",
    });
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

  const connectedCount = instances.filter(i => i.connected).length;
  const totalInstances = instances.length;

  // Função para recuperar instância com problemas
  const handleInstanceRecovery = async (instanceName: string) => {
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
    } catch (error: any) {
      console.error('❌ Erro ao recuperar instância:', error);
      toast({
        title: "⚠️ Erro ao recuperar instância",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar se instância existe
  const checkInstanceExists = async (instanceName: string): Promise<boolean> => {
    try {
      const instances = await evolutionApi.fetchInstances(instanceName);
      return instances.length > 0;
    } catch (error) {
      console.error('❌ Erro ao verificar instância:', error);
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Departamento */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: departmentColor }}
          />
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              {departmentName} - WhatsApp
            </h3>
            <p className="text-gray-600 text-sm">
              {connectedCount} de {totalInstances} instância(s) conectada(s)
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={async () => {
              setIsLoading(true);
              try {
                // Recarregar dados de instâncias do banco e da Evolution API
                const { data: dbInstances } = await supabase
                  .from('evolution_instances')
                  .select('*')
                  .eq('department_id', departmentId)
                  .eq('is_active', true);

                // Tentar obter status atual de cada instância da Evolution API
                const updatedInstances: DepartmentInstance[] = [];
                
                for (const dbInstance of (dbInstances || [])) {
                  let currentStatus: 'open' | 'close' | 'connecting' | 'unknown' = 'unknown';
                  let connected = false;
                  
                                     try {
                     const statusResponse = await evolutionApi.getInstanceStatus(dbInstance.instance_name);
                     currentStatus = statusResponse.instance.state as 'open' | 'close' | 'connecting';
                     connected = currentStatus === 'open';
                   } catch (error) {
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
              } catch (error: any) {
                console.error('❌ Erro ao atualizar status:', error);
                toast({
                  title: "❌ Erro na atualização",
                  description: "Não foi possível atualizar o status das instâncias",
                  variant: "destructive"
                });
              } finally {
                setIsLoading(false);
              }
            }} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span>Atualizar</span>
          </Button>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            size="sm"
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Instância</span>
          </Button>
        </div>
      </div>

      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Central do {departmentName}:</strong> Aqui você gerencia as instâncias WhatsApp exclusivas do seu departamento. 
          Tickets criados neste setor usarão automaticamente a instância padrão configurada.
        </AlertDescription>
      </Alert>

      {/* Lista de Instâncias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {instances.map((instance) => (
          <Card key={instance.instanceName} className="hover:shadow-lg transition-all duration-200 relative">
            {instance.isDefault && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
                ⭐ Padrão
              </div>
            )}
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span className="truncate">{instance.instanceName}</span>
                </CardTitle>
                {getStatusIcon(instance.status, instance.connected)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(instance.status, instance.connected)}
                </div>
                
                {instance.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Telefone:</span>
                    <span className="text-sm font-medium">{instance.phone}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última atualização:</span>
                  <span className="text-xs text-gray-500">
                    {instance.lastUpdate ? new Date(instance.lastUpdate).toLocaleTimeString() : 'Nunca'}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
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

                <div className="grid grid-cols-2 gap-2">
                  {!instance.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAsDefaultInstance(instance.instanceName)}
                      className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Padrão
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openWebhookModal(instance.instanceName)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Webhook className="w-4 h-4 mr-2" />
                    Webhook
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {instances.length === 0 && !isLoading && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Smartphone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma instância configurada</h4>
              <p className="text-gray-600 mb-4">Crie a primeira instância WhatsApp para o {departmentName}</p>
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
              <span>Nova Instância - {departmentName}</span>
            </DialogTitle>
            <DialogDescription>
              Crie uma nova instância WhatsApp exclusiva para o {departmentName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância *</Label>
              <Input
                id="instanceName"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Ex: principal, atendimento, vendas"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Nome final: {departmentName.toLowerCase().replace(/\s+/g, '-')}-{newInstanceName.toLowerCase().replace(/\s+/g, '-')}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="setAsDefault"
                checked={setAsDefault || instances.length === 0}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                disabled={instances.length === 0}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <Label htmlFor="setAsDefault" className="text-sm">
                Definir como instância padrão do departamento
                {instances.length === 0 && " (primeira instância)"}
              </Label>
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
              Escaneie o QR Code com seu WhatsApp para conectar esta instância ao {departmentName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 qr-code-container">
            {isQRLoading ? (
              <div className="flex flex-col items-center justify-center space-y-4 h-64 qr-loading-container">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-gray-600">Gerando QR Code...</p>
                <div className="text-xs text-gray-500">
                  Conectando com a Evolution API...
                </div>
              </div>
            ) : currentQRCode ? (
              <div className="text-center space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block qr-image-container shadow-lg">
                  <img 
                    src={currentQRCode} 
                    alt="QR Code WhatsApp" 
                    className="w-64 h-64 mx-auto object-contain rounded border"
                    style={{
                      maxWidth: '256px',
                      maxHeight: '256px',
                      background: 'white'
                    }}
                    onError={(e) => {
                      console.error('❌ Erro ao carregar imagem do QR Code');
                      e.currentTarget.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('✅ QR Code carregado com sucesso');
                    }}
                  />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <p className="text-sm text-gray-600 font-medium">
                    📱 Como conectar:
                  </p>
                  <div className="text-xs text-gray-600 space-y-1 text-left bg-gray-50 p-3 rounded">
                    <p><strong>1.</strong> Abra o WhatsApp no seu celular</p>
                    <p><strong>2.</strong> Vá em <strong>Configurações → Aparelhos conectados</strong></p>
                    <p><strong>3.</strong> Toque em <strong>"Conectar um aparelho"</strong></p>
                    <p><strong>4.</strong> Escaneie este código QR</p>
                  </div>
                </div>
                
                {qrRefreshCount > 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    🔄 QR Code atualizado {qrRefreshCount} vez(es)
                  </div>
                )}
                
                <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200">
                  ⏰ O QR Code expira em alguns minutos. Clique em "Atualizar" se necessário.
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-600 qr-error-container">
                <XCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <p className="font-medium text-red-600 mb-2">Erro ao gerar QR Code</p>
                <div className="text-xs text-gray-500 max-w-xs mx-auto bg-red-50 p-3 rounded border border-red-200">
                  <p>Possíveis causas:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Evolution API offline</li>
                    <li>Instância não encontrada</li>
                    <li>Problemas de rede</li>
                  </ul>
                </div>
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

      {/* Modal de Configuração de Webhook */}
      <WebhookConfigModal
        isOpen={showWebhookModal}
        onClose={() => setShowWebhookModal(false)}
        instanceName={webhookInstance}
        departmentName={departmentName}
        currentWebhook={currentWebhookConfig}
        onSave={async (webhookData) => {
          console.log('💾 Salvando dados do modal:', webhookData);
          
          // Atualizar estados locais
          setCurrentWebhookConfig(webhookData);
          setWebhookUrl(webhookData.url);
          setWebhookEnabled(webhookData.enabled);
          
          // Salvar na Evolution API usando os dados corretos do modal
          await saveWebhookConfigWithData(webhookData);
        }}
      />
    </div>
  );
}; 