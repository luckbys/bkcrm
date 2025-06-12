import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import evolutionApiService, { logoutInstance } from '@/services/evolutionApiService';
import { useToast } from '@/hooks/use-toast';
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
  useEffect(() => {
    if (!departmentId) return;

    const loadDepartmentInstances = async () => {
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
         const instancesWithStatus = await Promise.all((dbInstances || []).map(async (instance) => {
           let evolutionStatus: 'open' | 'close' | 'connecting' | 'unknown' = 'close';
           let isConnected = false;
           
           try {
             // Tentar verificar status na Evolution API (com timeout)
             const statusPromise = evolutionApiService.getInstanceStatus(instance.instance_name);
             const timeoutPromise = new Promise((_, reject) => 
               setTimeout(() => reject(new Error('Timeout')), 5000)
             );
             
             const status = await Promise.race([statusPromise, timeoutPromise]) as any;
             if (status?.instance?.state) {
               evolutionStatus = status.instance.state === 'open' ? 'open' : 'close';
               isConnected = status.instance.state === 'open';
             }
             
           } catch (error: any) {
             console.warn(`⚠️ Evolution API indisponível para ${instance.instance_name}:`, error.message);
             // Manter status como close se Evolution API não estiver disponível
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

        setInstances(instancesWithStatus);
        console.log(`✅ ${instancesWithStatus.length} instâncias carregadas para ${departmentName}`);
        
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
    };

    loadDepartmentInstances();

    // Auto-refresh a cada 45 segundos (somente se Evolution API estiver disponível)
    const interval = setInterval(async () => {
      try {
        // Teste rápido se Evolution API está disponível
        const connectionTest = await evolutionApiService.testConnection();
        if (connectionTest.success) {
          loadDepartmentInstances();
        } else {
          throw new Error('API offline');
        }
      } catch {
        // Se Evolution API não estiver disponível, apenas recarregar dados do banco
        console.log('⚠️ Evolution API offline - recarregando apenas dados do banco');
        const { data: dbInstances } = await supabase
          .from('evolution_instances')
          .select('*')
          .eq('department_id', departmentId)
          .eq('is_active', true);
        
                 setInstances((dbInstances || []).map(instance => ({
           id: instance.id,
           instanceName: instance.instance_name,
           status: 'unknown' as const,
           departmentId: instance.department_id,
           departmentName: instance.department_name,
           phone: instance.phone || undefined,
           connected: false,
           lastUpdate: instance.updated_at ? new Date(instance.updated_at) : new Date(),
           isDefault: instance.is_default || false,
           createdBy: instance.created_by || undefined
         })));
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [departmentId, toast]);

  const createNewInstance = async () => {
    if (!newInstanceName.trim()) {
      toast({
        title: "⚠️ Nome obrigatório",
        description: "Digite um nome para a instância",
        variant: "destructive"
      });
      return;
    }

    // Gerar nome único baseado no departamento
    const fullInstanceName = `${departmentName.toLowerCase().replace(/\s+/g, '-')}-${newInstanceName.trim().toLowerCase().replace(/\s+/g, '-')}`;

    setIsCreating(true);
    try {
      console.log(`🚀 Criando instância para ${departmentName}: ${fullInstanceName}`);
      
      // Verificar se Evolution API está configurada
      const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
      let evolutionApiCreated = false;
      
      if (evolutionApiUrl && evolutionApiUrl !== 'http://localhost:8080') {
        try {
          const response = await evolutionApiService.createInstance(
            fullInstanceName,
            { webhookUrl: `${window.location.origin}/api/webhooks/evolution` }
          );
          console.log('✅ Instância criada na Evolution API:', response);
          evolutionApiCreated = true;
        } catch (apiError: any) {
          console.warn('⚠️ Erro na Evolution API, continuando apenas local:', apiError.message);
        }
      } else {
        console.log('📱 Modo offline - criando apenas localmente');
      }
      
      // Salvar no banco de dados
      try {
        const { data: savedInstance, error: dbError } = await supabase
          .from('evolution_instances')
          .insert([{
            instance_name: fullInstanceName,
            department_id: departmentId,
            department_name: departmentName,
            is_default: setAsDefault || instances.length === 0,
            created_by: user?.id,
            status: 'close',
            metadata: {
              creation_source: 'department_manager',
              department_color: departmentColor
            }
          }])
          .select()
          .single();

        if (dbError) {
          console.warn('⚠️ Erro ao salvar no banco, mas instância criada:', dbError);
        } else {
          console.log('✅ Instância salva no banco:', savedInstance);
        }
      } catch (dbError) {
        console.warn('⚠️ Banco pode não ter tabela evolution_instances, continuando...');
      }
      
      // Adicionar à lista local
      const newInstance: DepartmentInstance = {
        instanceName: fullInstanceName,
        status: 'close',
        departmentId,
        departmentName,
        connected: false,
        lastUpdate: new Date(),
        isDefault: setAsDefault || instances.length === 0,
        createdBy: user?.id
      };
      
      setInstances(prev => [...prev, newInstance]);
      setShowCreateModal(false);
      setNewInstanceName('');
      setSetAsDefault(false);
      
      toast({
        title: "✅ Instância criada!",
        description: evolutionApiCreated 
          ? `Instância "${fullInstanceName}" criada para ${departmentName}. Conecte via QR Code.`
          : `Instância "${fullInstanceName}" criada localmente para ${departmentName}. Configure Evolution API para WhatsApp real.`,
      });
      
      // Abrir automaticamente o QR Code apenas se Evolution API estiver configurada
      if (evolutionApiCreated) {
        setTimeout(() => {
          connectInstance(fullInstanceName);
        }, 1000);
      }
      
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
    // Verificar se Evolution API está configurada
    const evolutionApiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
    
    if (!evolutionApiUrl || evolutionApiUrl === 'http://localhost:8080') {
      toast({
        title: "📱 Modo Offline",
        description: `Instância "${instanceName}" está disponível apenas localmente. Configure Evolution API para WhatsApp real.`,
        variant: "default"
      });
      
      // Simular conexão bem-sucedida no modo offline
      setInstances(prev => prev.map(instance => 
        instance.instanceName === instanceName 
          ? { ...instance, status: 'open', connected: true, lastUpdate: new Date() }
          : instance
      ));
      
      return;
    }

    setIsQRLoading(true);
    setQrInstance(instanceName);
    setShowQRModal(true);
    setQrRefreshCount(0);
    
    try {
      console.log(`📱 Obtendo QR Code para ${departmentName}: ${instanceName}`);
      
      const qrResponse = await evolutionApiService.getInstanceQRCode(instanceName);
      
      if (qrResponse && qrResponse.base64) {
        // O serviço já retorna com o prefixo correto
        setCurrentQRCode(qrResponse.base64);
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
      
      if (error.message?.includes('404') || error.message?.includes('Request failed')) {
        toast({
          title: "🔧 Evolution API não configurada",
          description: `Instância "${instanceName}" criada localmente. Configure Evolution API para WhatsApp real.`,
          variant: "default"
        });
        
        // Marcar como conectada localmente
        setInstances(prev => prev.map(instance => 
          instance.instanceName === instanceName 
            ? { ...instance, status: 'open', connected: true, lastUpdate: new Date() }
            : instance
        ));
      } else {
        toast({
          title: "❌ Erro ao gerar QR Code",
          description: error.message || "Não foi possível gerar o QR Code",
          variant: "destructive"
        });
      }
    } finally {
      setIsQRLoading(false);
    }
  };

  const refreshQRCode = async () => {
    setIsQRLoading(true);
    setQrRefreshCount(prev => prev + 1);
    
    try {
      const qrResponse = await evolutionApiService.getInstanceQRCode(qrInstance);
      
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
      await logoutInstance(instanceName);
      
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
      let deletedFromApi = false;
      
      // Tentar deletar da Evolution API primeiro
      try {
        await evolutionApiService.deleteInstance(instanceName);
        deletedFromApi = true;
        console.log('✅ Instância deletada da Evolution API:', instanceName);
      } catch (apiError: any) {
        if (apiError.response?.status === 404) {
          console.log('ℹ️ Instância não existe na Evolution API (404) - apenas removendo do banco:', instanceName);
        } else {
          console.warn('⚠️ Erro ao deletar da Evolution API:', apiError.message);
          // Para outros erros além de 404, ainda vamos tentar continuar
        }
      }
      
      // Sempre tentar remover do banco de dados local
      try {
        const { error: dbError } = await supabase
          .from('evolution_instances')
          .delete()
          .eq('instance_name', instanceName)
          .eq('department_id', departmentId);
          
        if (dbError) {
          console.error('❌ Erro ao remover do banco:', dbError);
          throw new Error(`Erro no banco de dados: ${dbError.message}`);
        }
        
        console.log('✅ Instância removida do banco:', instanceName);
      } catch (dbError: any) {
        console.error('❌ Erro crítico ao remover do banco:', dbError);
        
        // Se não conseguiu remover do banco, mas removeu da API, alertar
        if (deletedFromApi) {
          toast({
            title: "⚠️ Remoção parcial",
            description: `Instância removida da Evolution API, mas erro no banco: ${dbError.message}`,
            variant: "destructive"
          });
          return;
        } else {
          throw dbError;
        }
      }
      
      // Remover da lista local (interface)
      setInstances(prev => prev.filter(instance => instance.instanceName !== instanceName));
      
      // Mensagem de sucesso adequada
      const successMessage = deletedFromApi 
        ? `"${instanceName}" foi deletada da Evolution API e banco local`
        : `"${instanceName}" foi removida do banco local (não existia na Evolution API)`;
      
      toast({
        title: "🗑️ Instância removida",
        description: successMessage,
      });
      
    } catch (error: any) {
      console.error('❌ Erro geral ao deletar instância:', error);
      toast({
        title: "❌ Erro ao deletar",
        description: error.message || 'Erro desconhecido ao deletar instância',
        variant: "destructive"
      });
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
                     const statusResponse = await evolutionApiService.getInstanceStatus(dbInstance.instance_name);
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