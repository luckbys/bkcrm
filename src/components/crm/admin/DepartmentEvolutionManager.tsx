import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEvolutionInstances, DepartmentInstance } from '@/hooks/useEvolutionInstances';
import { useEvolutionConnection } from '@/hooks/useEvolutionConnection';
import { useEvolutionWebhook } from '@/hooks/useEvolutionWebhook';
import { WebhookConfigModal } from './WebhookConfigModal';
import { WhatsAppHub } from '@/components/whatsapp/WhatsAppHub';
import { 
  Smartphone, 
  QrCode, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle,
  XCircle,
  Loader2,
  PowerOff,
  Settings,
  Building2,
  Info,
  Webhook,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const { 
    instances, 
    isLoading, 
    refetchInstances, 
    createInstance, 
    deleteInstance, 
    setAsDefaultInstance 
  } = useEvolutionInstances(departmentId, departmentName);

  const { 
    qrCode, 
    isConnecting, 
    connectInstance, 
    disconnectInstance, 
    monitorConnection, 
    resetConnection 
  } = useEvolutionConnection(departmentId);

  const [selectedInstance, setSelectedInstance] = useState<DepartmentInstance | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showWhatsAppHub, setShowWhatsAppHub] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);

  const { 
    webhook, 
    isLoadingWebhook, 
    saveWebhook, 
    removeWebhook, 
    testWebhook, 
    generateSuggestedWebhookUrl, 
    getRecommendedEvents 
  } = useEvolutionWebhook(selectedInstance?.instanceName || '');

  useEffect(() => {
    if (qrCode && selectedInstance) {
      const interval = setInterval(async () => {
        const connected = await monitorConnection(selectedInstance.instanceName);
        if (connected) {
          clearInterval(interval);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [qrCode, selectedInstance, monitorConnection]);

  const handleCreateInstance = async () => {
    await createInstance({ instanceName: newInstanceName, isDefault: setAsDefault });
    setShowCreateModal(false);
    setNewInstanceName('');
  };

  const handleConnect = async (instance: DepartmentInstance) => {
    setSelectedInstance(instance);
    await connectInstance(instance.instanceName);
  };

  const handleDisconnect = async (instanceName: string) => {
    await disconnectInstance(instanceName);
  };

  const handleDelete = async (instanceName: string) => {
    await deleteInstance(instanceName);
  };

  const handleSetAsDefault = async (instanceName: string) => {
    await setAsDefaultInstance(instanceName);
  };

  const handleOpenWebhookModal = (instance: DepartmentInstance) => {
    setSelectedInstance(instance);
    setShowWebhookModal(true);
  };

  const handleSaveWebhook = async (webhookData: { url: string; enabled: boolean; events: string[] }) => {
    await saveWebhook(webhookData);
    setShowWebhookModal(false);
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
              {connectedCount} de {totalInstances} instâncias conectadas
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetchInstances()} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            <span>Atualizar</span>
          </Button>
          
          <Button 
            onClick={() => setShowWhatsAppHub(true)}
            size="sm"
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Hub</span>
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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Central do {departmentName}:</strong> Gerencie as instâncias WhatsApp do seu departamento.
        </AlertDescription>
      </Alert>

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
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between space-x-2">
                  {instance.connected ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(instance.instanceName)}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <PowerOff className="w-4 h-4 mr-2" />
                      Desconectar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnect(instance)}
                      className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Conectar
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(instance.instanceName)}
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
                      onClick={() => handleSetAsDefault(instance.instanceName)}
                      className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Padrão
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenWebhookModal(instance)}
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
              <p className="text-gray-600 mb-4">Crie a primeira instância para o {departmentName}</p>
              <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Instância
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-green-600" />
              <span>Nova Instância - {departmentName}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instanceName">Nome da Instância *</Label>
              <Input
                id="instanceName"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Ex: principal, atendimento"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="setAsDefault"
                checked={setAsDefault || instances.length === 0}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                disabled={instances.length === 0}
              />
              <Label htmlFor="setAsDefault">Definir como padrão</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateInstance} disabled={!newInstanceName.trim()}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrCode} onOpenChange={() => resetConnection()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp - {selectedInstance?.instanceName}</DialogTitle>
          </DialogHeader>
          
          <div className="py-6 text-center">
            {isConnecting && !qrCode && <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />}
            {qrCode && <img src={qrCode} alt="QR Code" className="w-64 h-64 mx-auto" />}
          </div>
        </DialogContent>
      </Dialog>

      {selectedInstance && (
        <WebhookConfigModal
          isOpen={showWebhookModal}
          onClose={() => setShowWebhookModal(false)}
          instanceName={selectedInstance.instanceName}
          departmentName={departmentName}
          currentWebhook={webhook}
          onSave={handleSaveWebhook}
          isLoading={isLoadingWebhook}
          onTest={testWebhook}
          onRemove={removeWebhook}
          generateSuggestedUrl={generateSuggestedWebhookUrl}
          getRecommendedEvents={getRecommendedEvents}
        />
      )}

      <WhatsAppHub
        isOpen={showWhatsAppHub}
        onClose={() => setShowWhatsAppHub(false)}
      />
    </div>
  );
};