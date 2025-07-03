import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { 
  Loader2, 
  Smartphone, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Settings2, 
  Trash2,
  Plus,
  MessageCircle,
  Users,
  PhoneCall,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import WhatsAppSettingsModal from './WhatsAppSettingsModal';

// Bento Grid Item Component
const BentoItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "group relative col-span-1 row-span-1 flex flex-col justify-between overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
    "border border-transparent",
    className
  )}>
    {children}
  </div>
);

// Border Beam Component
const BorderBeam = ({ children, className, intensity = 'normal' }: { 
  children: React.ReactNode; 
  className?: string;
  intensity?: 'light' | 'normal' | 'intense';
}) => {
  const intensityClass = {
    light: 'border-beam-light',
    normal: '',
    intense: 'border-beam-intense'
  }[intensity];

  return (
    <div className={cn(
      "border-beam-container",
      intensityClass,
      className
    )}>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

// Status badge minimalista
const StatusBadge = ({ status, className }: { status: string; className?: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': 
      case 'connected': 
        return {
          color: 'bg-green-500/10 text-green-600 border-green-500/20',
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Conectado'
        };
      case 'connecting':
      case 'qrcode':
        return {
          color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Conectando'
        };
      case 'close':
      case 'disconnected':
        return {
          color: 'bg-red-500/10 text-red-600 border-red-500/20',
          icon: <XCircle className="w-3 h-3" />,
          label: 'Desconectado'
        };
      default:
        return {
          color: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
          icon: <WifiOff className="w-3 h-3" />,
          label: 'Inativo'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      className={cn(
        "h-6 px-2 text-xs font-medium border",
        config.color,
        className
      )}
    >
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </Badge>
  );
};

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}

const WhatsAppConfigModal: React.FC<WhatsAppConfigModalProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName
}) => {
  const { toast } = useToast();
  const { 
    instances, 
    loading, 
    createInstance, 
    deleteInstance, 
    connectInstance, 
    getQRCode,
    refreshInstances 
  } = useWhatsAppInstances();

  // Estados
  const [isCreating, setIsCreating] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
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
  const departmentInstance = instances.find(
    instance => instance.departmentId === departmentId
  );

  // Criar nova instância
  const handleCreateInstance = async () => {
    if (!departmentId) return;

    setIsCreating(true);
    try {
      await createInstance(departmentId, {
        instanceName: `whatsapp-dep-${departmentId}`,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        ...defaultSettings
      });

      toast({
        title: "Integração criada",
        description: "WhatsApp configurado para este departamento",
      });

      await refreshInstances();
    } catch (error: any) {
      toast({
        title: "Erro ao criar integração",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Conectar instância (gerar QR)
  const handleConnectInstance = async (instanceName: string) => {
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
    } catch (error: any) {
      toast({
        title: "Erro ao conectar",
        description: error.message || "Falha na conexão",
        variant: "destructive"
      });
    }
  };

  // Remover instância
  const handleDeleteInstance = async (instanceId: string | undefined) => {
    if (!instanceId) return;
    if (!confirm('Tem certeza que deseja remover a integração do WhatsApp deste departamento?')) return;
    
    try {
      await deleteInstance(instanceId);
      toast({
        title: "Integração removida",
        description: "WhatsApp desvinculado deste departamento",
      });
      
      await refreshInstances();
      setQrCode(null);
    } catch (error: any) {
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
          if (index > 0) overlay.remove();
        });
      }
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    }, 100);
    onClose();
  }, [onClose]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg">
                <Smartphone className="w-5 h-5 text-primary" />
                <span>WhatsApp - {departmentName}</span>
              </div>
              {departmentInstance && (
                <StatusBadge status={departmentInstance.status || 'disconnected'} />
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !departmentInstance ? (
              <BorderBeam intensity="normal">
                <div className="text-center space-y-4 py-2">
                  <div className="flex flex-col items-center gap-3">
                    <Smartphone className="w-12 h-12 text-muted-foreground/50" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Nenhuma integração configurada
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Configure o WhatsApp para este departamento
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateInstance}
                    disabled={isCreating}
                    className="w-full max-w-sm mx-auto bg-green-600 hover:bg-green-700"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Configurando...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Integração WhatsApp
                      </>
                    )}
                  </Button>
                </div>
              </BorderBeam>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <BentoItem>
                  <BorderBeam intensity="light">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <Badge variant="outline" className="text-xs font-medium bg-green-50 text-green-600 border-green-200">
                          Status
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Mensagens</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Leitura automática: {departmentInstance.read_messages ? 'Ativada' : 'Desativada'}
                        </p>
                      </div>
                    </div>
                  </BorderBeam>
                </BentoItem>

                <BentoItem>
                  <BorderBeam intensity="light">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <Badge variant="outline" className="text-xs font-medium bg-green-50 text-green-600 border-green-200">
                          Grupos
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Grupos</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Ignorar grupos: {departmentInstance.groups_ignore ? 'Sim' : 'Não'}
                        </p>
                      </div>
                    </div>
                  </BorderBeam>
                </BentoItem>

                <BentoItem>
                  <BorderBeam intensity="light">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                          <PhoneCall className="w-5 h-5 text-green-600" />
                        </div>
                        <Badge variant="outline" className="text-xs font-medium bg-green-50 text-green-600 border-green-200">
                          Chamadas
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Chamadas</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Rejeitar chamadas: {departmentInstance.reject_call ? 'Sim' : 'Não'}
                        </p>
                      </div>
                    </div>
                  </BorderBeam>
                </BentoItem>

                <BentoItem>
                  <BorderBeam intensity="light">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-green-600" />
                        </div>
                        <Badge variant="outline" className="text-xs font-medium bg-green-50 text-green-600 border-green-200">
                          Online
                        </Badge>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Status Online</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Sempre online: {departmentInstance.always_online ? 'Sim' : 'Não'}
                        </p>
                      </div>
                    </div>
                  </BorderBeam>
                </BentoItem>
              </div>
            )}

            {departmentInstance && (
              <div className="flex items-center justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteInstance(departmentInstance.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remover Integração
                </Button>

                <Button
                  onClick={() => handleConnectInstance(departmentInstance.instanceName)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Reconectar
                </Button>

                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  className="border-green-200"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Configurações
                </Button>
              </div>
            )}

            {qrCode && (
              <BorderBeam intensity="intense" className="max-w-sm mx-auto mt-8">
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="bg-white p-4 rounded-lg shadow-inner">
                    <img 
                      src={`data:image/png;base64,${qrCode}`}
                      alt="QR Code WhatsApp"
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    Escaneie o QR Code com seu WhatsApp
                  </p>
                </div>
              </BorderBeam>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showSettings && departmentInstance && (
        <WhatsAppSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          instance={departmentInstance}
        />
      )}
    </>
  );
};

export default WhatsAppConfigModal; 