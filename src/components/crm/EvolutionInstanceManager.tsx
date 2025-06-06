import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Smartphone,
  Wifi,
  WifiOff,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  QrCode,
  Phone,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Globe,
  Shield,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  TrendingUp,
  Headphones,
  Users,
  CreditCard,
  UserCheck,
  Megaphone,
  MoreVertical,
  XCircle,
  PhoneCall,
  MessageCircle,
  Webhook,
  Key,
  Database,
  Sync,
  Activity,
  AlertTriangle,
  CheckCircle,
  Power,
  PowerOff,
  Link,
  Unlink,
  Download,
  Upload,
  Save,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EvolutionAPIService, DepartmentInstanceManager } from '@/lib/evolution-api';
import { DepartmentInstance, EvolutionAPISettings, Department } from '@/types/evolution-api';
import { useDepartments } from '@/hooks/useDepartments';

interface EvolutionInstanceManagerProps {
  serverUrl: string;
  globalApiKey: string;
}

const iconMap = {
  TrendingUp,
  Headphones,
  Users,
  CreditCard,
  UserCheck,
  Megaphone,
};

export const EvolutionInstanceManager = ({ 
  serverUrl, 
  globalApiKey 
}: EvolutionInstanceManagerProps) => {
  const { toast } = useToast();
  const { departments, loading: departmentsLoading } = useDepartments();
  
  // Estados principais
  const [manager, setManager] = useState<DepartmentInstanceManager | null>(null);
  const [instances, setInstances] = useState<DepartmentInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  
  // Estados dos modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Estados dos formulários
  const [createForm, setCreateForm] = useState({
    departmentId: '',
    phoneNumber: '',
    webhookUrl: '',
    settings: {
      reject_call: false,
      msg_call: 'Desculpe, não podemos atender chamadas no momento. Por favor, envie uma mensagem.',
      groups_ignore: true,
      always_online: true,
      read_messages: true,
      read_status: true,
      sync_full_history: false,
    } as EvolutionAPISettings
  });
  
  const [qrCode, setQrCode] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<DepartmentInstance | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string>('');

  // Inicializar manager
  useEffect(() => {
    if (serverUrl && globalApiKey) {
      const evolutionAPI = new EvolutionAPIService(serverUrl, globalApiKey);
      const departmentManager = new DepartmentInstanceManager(evolutionAPI);
      departmentManager.loadFromStorage();
      setManager(departmentManager);
      
      // Carregar instâncias salvas
      const loadedInstances = departmentManager.getAllDepartmentInstances();
      setInstances(loadedInstances);
    }
  }, [serverUrl, globalApiKey]);

  // Sync periódico das instâncias
  useEffect(() => {
    if (manager) {
      const interval = setInterval(async () => {
        try {
          await manager.syncAllInstances();
          setInstances(manager.getAllDepartmentInstances());
        } catch (error) {
          console.error('Erro no sync automático:', error);
        }
      }, 30000); // Sync a cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [manager]);

  const handleCreateInstance = async () => {
    if (!manager || !createForm.departmentId) return;
    
    setIsLoading(true);
    try {
      const department = departments.find(d => d.id === createForm.departmentId);
      if (!department) {
        throw new Error('Departamento não encontrado');
      }

      const instance = await manager.createDepartmentInstance(
        createForm.departmentId,
        department.name,
        {
          phoneNumber: createForm.phoneNumber,
          webhookUrl: createForm.webhookUrl,
          settings: createForm.settings,
        }
      );

      setInstances(manager.getAllDepartmentInstances());
      setShowCreateModal(false);
      resetCreateForm();

      toast({
        title: 'Instância criada',
        description: `Instância criada para ${department.name}`,
      });

      // Auto-conectar após criar
      await handleConnect(createForm.departmentId);
      
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast({
        title: 'Erro ao criar instância',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (departmentId: string) => {
    if (!manager) return;
    
    setIsLoading(true);
    try {
      await manager.connectDepartmentInstance(departmentId);
      setInstances(manager.getAllDepartmentInstances());
      
      toast({
        title: 'Conectando...',
        description: 'Gerando QR Code para conexão',
      });

      // Obter QR Code após conectar
      setTimeout(async () => {
        try {
          const qr = await manager.getDepartmentQRCode(departmentId);
          setQrCode(qr);
          setSelectedDepartment(departmentId);
          setShowQRModal(true);
        } catch (error) {
          console.error('Erro ao obter QR Code:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      toast({
        title: 'Erro ao conectar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (departmentId: string) => {
    if (!manager) return;
    
    setIsLoading(true);
    try {
      await manager.disconnectDepartmentInstance(departmentId);
      setInstances(manager.getAllDepartmentInstances());
      
      toast({
        title: 'Desconectado',
        description: 'Instância desconectada com sucesso',
      });
      
    } catch (error) {
      console.error('Erro ao desconectar instância:', error);
      toast({
        title: 'Erro ao desconectar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!manager || !deleteTargetId) return;
    
    setIsLoading(true);
    try {
      await manager.deleteDepartmentInstance(deleteTargetId);
      setInstances(manager.getAllDepartmentInstances());
      setShowDeleteDialog(false);
      setDeleteTargetId('');
      
      toast({
        title: 'Instância removida',
        description: 'Instância removida com sucesso',
      });
      
    } catch (error) {
      console.error('Erro ao remover instância:', error);
      toast({
        title: 'Erro ao remover',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncAll = async () => {
    if (!manager) return;
    
    setIsLoading(true);
    try {
      await manager.syncAllInstances();
      setInstances(manager.getAllDepartmentInstances());
      
      toast({
        title: 'Sincronização concluída',
        description: 'Status de todas as instâncias atualizado',
      });
      
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Erro ao sincronizar instâncias',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      departmentId: '',
      phoneNumber: '',
      webhookUrl: '',
      settings: {
        reject_call: false,
        msg_call: 'Desculpe, não podemos atender chamadas no momento. Por favor, envie uma mensagem.',
        groups_ignore: true,
        always_online: true,
        read_messages: true,
        read_status: true,
        sync_full_history: false,
      }
    });
  };

  const getStatusColor = (status: DepartmentInstance['status']) => {
    const colors = {
      configured: 'bg-gray-100 text-gray-700',
      connecting: 'bg-blue-100 text-blue-700',
      connected: 'bg-green-100 text-green-700',
      disconnected: 'bg-red-100 text-red-700',
      error: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: DepartmentInstance['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getDepartmentColor = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      amber: 'from-amber-500 to-amber-600',
      pink: 'from-pink-500 to-pink-600',
      orange: 'from-orange-500 to-orange-600',
    };
    return colors[color as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const availableDepartments = departments.filter(dept => 
    dept.isActive && !instances.some(inst => inst.departmentId === dept.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração Evolution API</h2>
          <p className="text-gray-600">Gerencie instâncias do WhatsApp por departamento</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleSyncAll}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Sincronizar
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            disabled={availableDepartments.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Instância
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Instâncias</p>
                <p className="text-2xl font-bold">{instances.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wifi className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conectadas</p>
                <p className="text-2xl font-bold">
                  {instances.filter(i => i.status === 'connected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Globe className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Servidor</p>
                <p className="text-sm font-medium truncate">{serverUrl}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instances.map((instance) => {
          const department = departments.find(d => d.id === instance.departmentId);
          if (!department) return null;

          const IconComponent = iconMap[department.icon as keyof typeof iconMap];

          return (
            <Card key={instance.id} className="overflow-hidden">
              <CardHeader className={cn(
                "pb-3 bg-gradient-to-r text-white",
                getDepartmentColor(department.color)
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      {IconComponent && <IconComponent className="w-5 h-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <p className="text-white/90 text-sm">{instance.phoneNumber || 'Não configurado'}</p>
                    </div>
                  </div>
                  <Badge className={cn("text-xs", getStatusColor(instance.status))}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(instance.status)}
                      <span className="capitalize">{instance.status}</span>
                    </div>
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-gray-600">Instância</Label>
                    <p className="font-mono text-xs truncate">{instance.instanceName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Última Sync</Label>
                    <p className="text-xs">
                      {instance.lastSync 
                        ? new Date(instance.lastSync).toLocaleTimeString()
                        : 'Nunca'
                      }
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {instance.status === 'configured' && (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(instance.departmentId)}
                      disabled={isLoading}
                    >
                      <Wifi className="w-4 h-4 mr-1" />
                      Conectar
                    </Button>
                  )}

                  {instance.status === 'connected' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDisconnect(instance.departmentId)}
                        disabled={isLoading}
                      >
                        <WifiOff className="w-4 h-4 mr-1" />
                        Desconectar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const qr = await manager?.getDepartmentQRCode(instance.departmentId);
                            if (qr) {
                              setQrCode(qr);
                              setSelectedDepartment(instance.departmentId);
                              setShowQRModal(true);
                            }
                          } catch (error) {
                            console.error('Erro ao obter QR:', error);
                          }
                        }}
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        QR Code
                      </Button>
                    </>
                  )}

                  {(instance.status === 'disconnected' || instance.status === 'error') && (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(instance.departmentId)}
                      disabled={isLoading}
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reconectar
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedInstance(instance);
                      setShowSettingsModal(true);
                    }}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Config
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setDeleteTargetId(instance.departmentId);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {instances.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma instância configurada
              </h3>
              <p className="text-gray-600 mb-4">
                Configure instâncias do WhatsApp para seus departamentos
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar primeira instância
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Criação */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Instância WhatsApp</DialogTitle>
            <DialogDescription>
              Configure uma nova instância do WhatsApp para um departamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="department">Departamento</Label>
              <Select
                value={createForm.departmentId}
                onValueChange={(value) => setCreateForm(prev => ({ ...prev, departmentId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um departamento" />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map((dept) => {
                    const IconComponent = iconMap[dept.icon as keyof typeof iconMap];
                    return (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center space-x-2">
                          {IconComponent && <IconComponent className="w-4 h-4" />}
                          <span>{dept.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="phone">Número de Telefone (opcional)</Label>
              <Input
                id="phone"
                value={createForm.phoneNumber}
                onChange={(e) => setCreateForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Ex: +5511999999999"
              />
            </div>

            <div>
              <Label htmlFor="webhook">Webhook URL (opcional)</Label>
              <Input
                id="webhook"
                value={createForm.webhookUrl}
                onChange={(e) => setCreateForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://sua-aplicacao.com/webhook"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Configurações Avançadas</Label>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="always-online">Sempre online</Label>
                  <p className="text-xs text-gray-600">Manter WhatsApp sempre online</p>
                </div>
                <Switch
                  id="always-online"
                  checked={createForm.settings.always_online}
                  onCheckedChange={(checked) => 
                    setCreateForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, always_online: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="read-messages">Marcar como lido</Label>
                  <p className="text-xs text-gray-600">Marcar mensagens como lidas automaticamente</p>
                </div>
                <Switch
                  id="read-messages"
                  checked={createForm.settings.read_messages}
                  onCheckedChange={(checked) => 
                    setCreateForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, read_messages: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="reject-calls">Rejeitar chamadas</Label>
                  <p className="text-xs text-gray-600">Rejeitar chamadas automaticamente</p>
                </div>
                <Switch
                  id="reject-calls"
                  checked={createForm.settings.reject_call}
                  onCheckedChange={(checked) => 
                    setCreateForm(prev => ({
                      ...prev,
                      settings: { ...prev.settings, reject_call: checked }
                    }))
                  }
                />
              </div>

              {createForm.settings.reject_call && (
                <div>
                  <Label htmlFor="call-message">Mensagem para chamadas</Label>
                  <Textarea
                    id="call-message"
                    value={createForm.settings.msg_call}
                    onChange={(e) => 
                      setCreateForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings, msg_call: e.target.value }
                      }))
                    }
                    placeholder="Mensagem enviada quando chamadas são rejeitadas"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateInstance} 
              disabled={isLoading || !createForm.departmentId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Instância'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal QR Code */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie este QR Code com o WhatsApp
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4">
            {qrCode ? (
              <div className="p-4 bg-white rounded-lg border">
                <img 
                  src={qrCode} 
                  alt="QR Code" 
                  className="w-64 h-64 object-contain"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                1. Abra o WhatsApp no seu celular
              </p>
              <p className="text-sm text-gray-600">
                2. Toque em Mais opções &gt; Dispositivos conectados
              </p>
              <p className="text-sm text-gray-600">
                3. Toque em Conectar um dispositivo
              </p>
              <p className="text-sm text-gray-600">
                4. Aponte a câmera para este QR Code
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRModal(false)}>
              Fechar
            </Button>
            <Button
              onClick={async () => {
                if (manager && selectedDepartment) {
                  try {
                    const qr = await manager.getDepartmentQRCode(selectedDepartment);
                    setQrCode(qr);
                  } catch (error) {
                    console.error('Erro ao atualizar QR:', error);
                  }
                }
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Instância</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A instância será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 