import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  QrCode, 
  Wifi, 
  WifiOff, 
  Settings,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Phone,
  PhoneOff,
  Users,
  Shield,
  Webhook,
  Bot,
  Trash2,
  XCircle,
  CheckCircle2,
  RefreshCw,
  Bell,
  BellRing,
  BellOff,
  FileText,
  BarChart,
  Calendar,
  Tag,
  Filter,
  Zap,
  SmilePlus,
  Activity,
  BarChart3,
  Timer,
  Plus,
  Eye,
  User,
  Building2,
  ShieldAlert,
  Megaphone,
  Download,
  ListFilter,
  X,
  Volume2,
  Monitor,
  Copy,
  Archive,
  Edit,
  Scan
} from 'lucide-react';
import { useWhatsAppInstances } from '@/hooks/useWhatsAppInstances';
import { 
  DepartmentWhatsAppConfig, 
  CreateInstanceData,
  QRCodeResponse,
  Template
} from '@/types/whatsapp.types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}

const statusVariants = {
  'active': 'bg-green-100 text-green-800',
  'connecting': 'bg-yellow-100 text-yellow-800',
  'inactive': 'bg-gray-100 text-gray-800',
  'error': 'bg-red-100 text-red-800'
};

const statusIcons = {
  'active': CheckCircle,
  'connecting': Loader2,
  'inactive': WifiOff,
  'error': AlertCircle
};

export default function WhatsAppConfigModal({
  isOpen,
  onClose,
  departmentId,
  departmentName
}: WhatsAppConfigModalProps) {
  const {
    instances,
    loading,
    error,
    createInstance,
    deleteInstance,
    connectInstance,
    disconnectInstance,
    getQRCode,
    updateInstanceConfig,
    checkInstanceHealth,
    refreshInstances
  } = useWhatsAppInstances();

  const [currentInstance, setCurrentInstance] = useState<DepartmentWhatsAppConfig | null>(null);
  const [qrCode, setQrCode] = useState<QRCodeResponse | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [hasInstance, setHasInstance] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Configurações temporárias para edição
  const [tempConfig, setTempConfig] = useState<DepartmentWhatsAppConfig>({
    instanceName: "",
    departmentId: "",
    status: "inactive"
  });

  // Adicionar novos estados
  const [metrics, setMetrics] = useState({
    messagesPerDay: 0,
    responseTime: 0,
    satisfaction: 0,
    activeChats: 0
  });

  const [templates, setTemplates] = useState<Template[]>([
    { 
      id: 1, 
      name: 'Saudação', 
      content: 'Olá {nome}! Como posso ajudar?',
      category: 'saudacao',
      priority: 'alta'
    },
    { 
      id: 2, 
      name: 'Agradecimento', 
      content: 'Obrigado pelo contato, {nome}! A {empresa} agradece sua preferência.',
      category: 'finalizacao',
      priority: 'media'
    },
    { 
      id: 3, 
      name: 'Encerramento', 
      content: 'Foi um prazer atendê-lo, {nome}! Tenha um ótimo dia!',
      category: 'finalizacao',
      priority: 'baixa'
    }
  ]);

  const { toast } = useToast();

  // Handler para fechar o modal
  const handleClose = useCallback(() => {
    // Forçar limpeza de overlays residuais
    setTimeout(() => {
      const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
      if (overlays.length > 1) {
        overlays.forEach((overlay, index) => {
          if (index > 0) overlay.remove();
        });
      }
      
      // Garantir que body não fique bloqueado
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
    }, 100);
    
    // Limpar todos os estados do modal
    setCurrentInstance(null);
    setQrCode(null);
    setShowQR(false);
    setCreatingInstance(false);
    setActiveTab('connection');
    setSaving(false);
    setDeleting(false);
    setConnectionSuccess(false);
    setIsConnecting(false);
    setInstanceStatus("disconnected");
    setHasInstance(false);
    
    onClose();
  }, [onClose]);

  // Buscar instância atual do departamento
  useEffect(() => {
    if (!isOpen) return;
    
    const instance = instances.find(inst => inst.departmentId === departmentId);
    if (instance) {
      setCurrentInstance(instance);
      setHasInstance(true);
      setInstanceStatus(instance.status === 'active' ? 'connected' : 'disconnected');
    } else {
      setCurrentInstance(null);
      setHasInstance(false);
      setInstanceStatus("disconnected");
    }
    
    setShowQR(false);
    setQrCode(null);
  }, [instances, departmentId, isOpen]);

  // Criar nova instância
  const handleCreateInstance = async () => {
    try {
      setCreatingInstance(true);
      const config: Partial<CreateInstanceData> = {
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        reject_call: false,
        groups_ignore: false,
        always_online: true,
        read_messages: true,
        read_status: false,
        sync_full_history: false
      };
      
      await createInstance(departmentId, config);
      await refreshInstances();
      
      toast({
        title: "✅ Instância Criada!",
        description: "Instância WhatsApp criada com sucesso. Agora você pode conectar.",
        duration: 3000,
      });
      
      setActiveTab('connection');
    } catch (err) {
      console.error('Erro ao criar instância:', err);
      toast({
        title: "❌ Erro",
        description: "Erro ao criar instância. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setCreatingInstance(false);
    }
  };

  // Conectar instância
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setInstanceStatus("connecting");
      
      // Se não há instância, criar uma primeiro
      if (!currentInstance) {
        const config: Partial<CreateInstanceData> = {
          integration: 'WHATSAPP-BAILEYS',
          qrcode: true,
          reject_call: false,
          groups_ignore: false,
          always_online: true,
          read_messages: true,
          read_status: false,
          sync_full_history: false
        };
        
        await createInstance(departmentId, config);
        await refreshInstances();
        
        // Aguardar um pouco para que a instância seja criada e então continuar conexão
        setTimeout(async () => {
          try {
            await refreshInstances();
            
            // Buscar a nova instância criada
            const newInstance = instances.find(inst => inst.departmentId === departmentId);
            
            if (newInstance) {
              await connectInstance(newInstance.instanceName);
              const qrResponse = await getQRCode(newInstance.instanceName);
              
              if (qrResponse) {
                setQrCode(qrResponse);
                setShowQR(true);
                
                toast({
                  title: "📱 QR Code Gerado!",
                  description: "Instância criada e QR Code gerado! Escaneie com seu WhatsApp para conectar.",
                  duration: 5000,
                });
              }
            } else {
              // Se não encontrou a instância, tentar novamente em mais 2 segundos
              setTimeout(() => {
                setIsConnecting(false);
                setInstanceStatus("disconnected");
                toast({
                  title: "⚠️ Instância Criada",
                  description: "Instância criada com sucesso! Clique em 'Conectar' novamente para gerar o QR Code.",
                  duration: 5000,
                });
              }, 2000);
            }
          } catch (connectErr) {
            console.error('Erro ao conectar nova instância:', connectErr);
            setIsConnecting(false);
            setInstanceStatus("disconnected");
            
            toast({
              title: "⚠️ Instância Criada", 
              description: "Instância criada com sucesso! Clique em 'Conectar' novamente para gerar o QR Code.",
              duration: 5000,
            });
          }
        }, 1500);
        
        return;
      }
      
      await connectInstance(currentInstance.instanceName);
      const qrResponse = await getQRCode(currentInstance.instanceName);
      
      if (qrResponse) {
        setQrCode(qrResponse);
        setShowQR(true);
        
        toast({
          title: "📱 QR Code Gerado!",
          description: "Escaneie o QR Code com seu WhatsApp para conectar.",
          duration: 5000,
        });
      }
      
    } catch (err) {
      console.error('Erro ao conectar:', err);
      setIsConnecting(false);
      setInstanceStatus("disconnected");
      
      toast({
        title: "❌ Erro de Conexão",
        description: "Não foi possível conectar. Verifique sua conexão e tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Simular sucesso da conexão (seria chamado via webhook ou polling)
  const handleConnectionSuccess = () => {
    setConnectionSuccess(true);
    setShowQR(false);
    setQrCode(null);
    setIsConnecting(false);
    setInstanceStatus("connected");
    
    // Som de sucesso (se suportado)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnEAAABXQVZFZm10IBAAAAABAAEAK...');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
    
    // Vibração (se suportado)
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Toast de sucesso
    toast({
      title: "🎉 WhatsApp Conectado!",
      description: "A instância foi conectada com sucesso e está pronta para uso.",
      duration: 5000,
    });
    
    // Feedback visual por 3 segundos
    setTimeout(() => {
      setConnectionSuccess(false);
      refreshInstances();
    }, 3000);
  };

  // Fechar QR Code
  const handleCloseQR = () => {
    setShowQR(false);
    setQrCode(null);
    setIsConnecting(false);
    setInstanceStatus("disconnected");
  };

  // Desconectar instância
  const handleDisconnect = async () => {
    if (!currentInstance) return;
    try {
      await disconnectInstance(currentInstance.instanceName);
      setQrCode(null);
      setShowQR(false);
      setInstanceStatus("disconnected");
      await refreshInstances();
      
      toast({
        title: "🔌 Desconectado",
        description: "WhatsApp foi desconectado com sucesso.",
        duration: 3000,
      });
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    }
  };

  // Deletar instância
  const handleDeleteInstance = async () => {
    if (!currentInstance) return;
    if (confirm('Tem certeza que deseja deletar esta instância? Esta ação não pode ser desfeita.')) {
      try {
        setDeleting(true);
        await deleteInstance(currentInstance.id);
        setCurrentInstance(null);
        setQrCode(null);
        setShowQR(false);
        setHasInstance(false);
        setInstanceStatus("disconnected");
        setActiveTab('connection');
        await refreshInstances();
        
        toast({
          title: "🗑️ Instância Removida",
          description: "A instância foi deletada com sucesso.",
          duration: 3000,
        });
      } catch (err) {
        console.error('Erro ao deletar instância:', err);
        toast({
          title: "❌ Erro",
          description: "Erro ao deletar instância. Tente novamente.",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setDeleting(false);
      }
    }
  };

  // Se não estiver aberto, não renderizar nada
  if (!isOpen) {
    return null;
  }

  // Renderizar estado inicial quando não há instância
  if (!hasInstance) {
    return (
      <TooltipProvider>
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Smartphone className="w-6 h-6" />
                Configuração do WhatsApp
              </DialogTitle>
              <DialogDescription>
                Departamento: <span className="font-medium">{departmentName}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              {creatingInstance ? (
                <>
                  <div className="p-8 rounded-full bg-blue-100 animate-pulse">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Criando instância...</h3>
                    <p className="text-muted-foreground max-w-md">
                      Aguarde enquanto configuramos sua instância do WhatsApp. Isso pode levar alguns segundos.
                    </p>
                  </div>
                  
                  <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-8 rounded-full bg-gradient-to-br from-green-100 to-blue-100">
                    <Smartphone className="w-16 h-16 text-green-600" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Nenhuma instância configurada</h3>
                    <p className="text-muted-foreground max-w-md">
                      Para começar a usar o WhatsApp neste departamento, você precisa criar e configurar uma instância.
                    </p>
                  </div>

                  <Button 
                    onClick={handleCreateInstance}
                    disabled={creatingInstance}
                    size="lg"
                    className="min-w-[200px] bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Instância WhatsApp
                  </Button>
                </>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose} disabled={creatingInstance}>
                {creatingInstance ? 'Aguarde...' : 'Fechar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Smartphone className="w-6 h-6" />
              Configuração do WhatsApp
            </DialogTitle>
            <DialogDescription>
              Departamento: <span className="font-medium">{departmentName}</span>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="connection" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Conexão
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Mensagens
              </TabsTrigger>
              <TabsTrigger value="automation" className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Automação
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Avançado
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="connection" className="space-y-6">
                {/* Status da Conexão */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="w-5 h-5" />
                      Status da Conexão
                    </CardTitle>
                    <CardDescription>
                      Gerencie a conexão com o WhatsApp
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-4 rounded-lg flex items-center gap-3 transition-colors flex-1",
                        instanceStatus === "connected" ? "bg-green-50 text-green-700 border border-green-200" :
                        instanceStatus === "connecting" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" :
                        "bg-red-50 text-red-700 border border-red-200"
                      )}>
                        {instanceStatus === "connected" && (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <div>
                              <p className="font-medium">Conectado</p>
                              <p className="text-sm opacity-90">WhatsApp está ativo e funcionando</p>
                            </div>
                          </>
                        )}
                        {instanceStatus === "connecting" && (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <div>
                              <p className="font-medium">Conectando</p>
                              <p className="text-sm opacity-90">Aguardando leitura do QR Code</p>
                            </div>
                          </>
                        )}
                        {instanceStatus === "disconnected" && (
                          <>
                            <XCircle className="w-5 h-5" />
                            <div>
                              <p className="font-medium">Desconectado</p>
                              <p className="text-sm opacity-90">WhatsApp não está conectado</p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {instanceStatus === "disconnected" && (
                          <Button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="min-w-[120px]"
                          >
                            {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <Scan className="w-4 h-4 mr-2" />
                            Conectar
                          </Button>
                        )}
                        
                        {instanceStatus === "connecting" && (
                          <Button
                            variant="outline"
                            onClick={handleCloseQR}
                          >
                            Cancelar
                          </Button>
                        )}
                        
                        {instanceStatus === "connected" && (
                          <Button
                            variant="outline"
                            onClick={handleDisconnect}
                          >
                            <PhoneOff className="w-4 h-4 mr-2" />
                            Desconectar
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* QR Code */}
                    {(showQR && qrCode) && (
                      <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-dashed border-green-300">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center gap-6">
                            <div className="flex items-center gap-2 text-xl font-semibold text-green-700">
                              <QrCode className="w-6 h-6" />
                              Escaneie o QR Code
                            </div>
                            
                            <div className="relative p-4 bg-white rounded-xl shadow-lg">
                              <img 
                                src={qrCode.base64} 
                                alt="QR Code" 
                                className="w-64 h-64 rounded-lg"
                              />
                              {connectionSuccess && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                                </div>
                              )}
                              
                              {/* Pulse animation */}
                              <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl opacity-30 animate-pulse"></div>
                            </div>
                            
                            <div className="text-center space-y-3 max-w-sm">
                              <p className="text-base font-medium text-gray-700">
                                📱 Como conectar:
                              </p>
                              <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                  <span>Abra o WhatsApp no seu celular</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                  <span>Vá em <strong>Menu ⋮</strong> → <strong>Dispositivos conectados</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                  <span>Toque em <strong>"Conectar um dispositivo"</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                                  <span>Aponte a câmera para este QR Code</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <Button variant="outline" onClick={handleConnect} className="bg-white/80 hover:bg-white">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Novo QR Code
                              </Button>
                              <Button variant="outline" onClick={handleConnectionSuccess} className="bg-white/80 hover:bg-white">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Simular Conexão
                              </Button>
                            </div>
                            
                            <div className="text-xs text-gray-500 text-center max-w-xs">
                              ⚠️ O QR Code expira em poucos minutos. Se não funcionar, gere um novo.
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                {/* Informações da Instância */}
                {currentInstance && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Informações da Instância
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Nome da Instância</Label>
                          <p className="text-sm text-muted-foreground">{currentInstance.instanceName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <div className="mt-1">
                            <Badge className={statusVariants[currentInstance.status as keyof typeof statusVariants] || statusVariants.error}>
                              {currentInstance.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <div>
                          <Label className="text-sm font-medium text-red-600">Zona de Perigo</Label>
                          <p className="text-sm text-muted-foreground">Remover completamente esta instância</p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteInstance}
                          disabled={deleting}
                        >
                          {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deleting ? 'Removendo...' : 'Remover Instância'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Outras abas simplificadas */}
              <TabsContent value="messages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Mensagens Automáticas</CardTitle>
                    <CardDescription>Configure mensagens de boas-vindas e ausência</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Mensagem de Boas-vindas</Label>
                      <Textarea 
                        placeholder="Ex: Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?"
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Mensagem de Ausência</Label>
                      <Textarea 
                        placeholder="Ex: No momento estamos ausentes. Retornaremos em breve!"
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="automation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Horário Comercial</CardTitle>
                    <CardDescription>Configure o horário de funcionamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="business-hours" />
                      <Label htmlFor="business-hours">Ativar horário comercial</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Início</Label>
                        <Input type="time" defaultValue="09:00" />
                      </div>
                      <div className="space-y-2">
                        <Label>Fim</Label>
                        <Input type="time" defaultValue="18:00" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Configurações Avançadas</CardTitle>
                    <CardDescription>Configurações técnicas da instância</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Ignorar grupos</Label>
                        <p className="text-sm text-muted-foreground">Não processar mensagens de grupos</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Confirmação de leitura</Label>
                        <p className="text-sm text-muted-foreground">Marcar mensagens como lidas</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
            <Button disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
} 