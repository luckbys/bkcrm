import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Switch } from '../../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
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
  XCircle
} from 'lucide-react';
import { useWhatsAppInstances } from '../../../hooks/useWhatsAppInstances';
import { 
  DepartmentWhatsAppConfig, 
  CreateInstanceData,
  QRCodeResponse 
} from '../../../types/whatsapp.types';
import { useToast } from '../../../hooks/use-toast';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Configurações temporárias para edição
  const [tempConfig, setTempConfig] = useState<Partial<DepartmentWhatsAppConfig>>({});

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
    setActiveTab('overview');
    setSaving(false);
    setDeleting(false);
    setConnectionSuccess(false);
    setIsConnecting(false);
    setTempConfig({});
    
    onClose();
  }, [onClose]);

  // Buscar instância atual do departamento
  useEffect(() => {
    const instance = instances.find(inst => inst.departmentId === departmentId);
    setCurrentInstance(instance || null);
    if (instance) {
      setTempConfig({
        autoReply: instance.autoReply,
        businessHours: instance.businessHours,
        welcomeMessage: instance.welcomeMessage,
        awayMessage: instance.awayMessage,
        settings: instance.settings
      });
    } else {
      setTempConfig({});
    }
    setShowQR(false);
    setQrCode(null);
  }, [instances, departmentId]);

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
      setActiveTab('connection');
      await refreshInstances();
    } catch (err) {
      console.error('Erro ao criar instância:', err);
    } finally {
      setCreatingInstance(false);
    }
  };

  // Conectar instância
  const handleConnect = async () => {
    if (!currentInstance) return;
    try {
      setIsConnecting(true);
      await connectInstance(currentInstance.instanceName);
      const qrResponse = await getQRCode(currentInstance.instanceName);
      setQrCode(qrResponse);
      setShowQR(true);
      setActiveTab('connection');
    } catch (err) {
      console.error('Erro ao conectar:', err);
      setIsConnecting(false);
    }
  };

  // Simular sucesso da conexão (seria chamado via webhook ou polling)
  const handleConnectionSuccess = () => {
    setConnectionSuccess(true);
    setShowQR(false);
    setQrCode(null);
    setIsConnecting(false);
    
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
  };

  // Desconectar instância
  const handleDisconnect = async () => {
    if (!currentInstance) return;
    try {
      await disconnectInstance(currentInstance.instanceName);
      setQrCode(null);
      setShowQR(false);
      await refreshInstances();
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
        setActiveTab('overview');
        await refreshInstances();
      } catch (err) {
        console.error('Erro ao deletar instância:', err);
      } finally {
        setDeleting(false);
      }
    }
  };

  // Salvar configurações
  const handleSaveConfig = async () => {
    if (!currentInstance) return;
    try {
      setSaving(true);
      await updateInstanceConfig(currentInstance.id, tempConfig);
      await refreshInstances();
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    } finally {
      setSaving(false);
    }
  };

  // Renderizar badge de status
  const getStatusBadge = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || AlertCircle;
    return (
      <Badge className={statusVariants[status as keyof typeof statusVariants] || statusVariants.error}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Se não estiver aberto, não renderizar nada
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            WhatsApp - {departmentName}
          </DialogTitle>
          <DialogDescription>
            Configure a instância WhatsApp para este departamento
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="connection">Conexão</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>
          {/* Visão Geral */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Status da Instância</CardTitle>
                <CardDescription>
                  Gerencie a instância WhatsApp deste departamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentInstance ? (
                  <div className="space-y-4">
                    {/* Status e informações principais */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <Smartphone className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusBadge(currentInstance.status || 'inactive')}
                            <span className="font-medium text-gray-900">{currentInstance.instanceName}</span>
                          </div>
                          <p className="text-sm text-gray-500">Instância WhatsApp do {departmentName}</p>
                        </div>
                      </div>
                      {currentInstance.status === 'active' && (
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Online</span>
                        </div>
                      )}
                    </div>

                    {/* Estatísticas rápidas */}
                    {currentInstance.status === 'active' && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-lg font-semibold text-blue-700">0</p>
                          <p className="text-xs text-blue-600">Mensagens hoje</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <p className="text-lg font-semibold text-green-700">0</p>
                          <p className="text-xs text-green-600">Contatos ativos</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Clock className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                          <p className="text-lg font-semibold text-purple-700">-</p>
                          <p className="text-xs text-purple-600">Último contato</p>
                        </div>
                      </div>
                    )}

                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleConnect} disabled={loading || creatingInstance || currentInstance.status === 'active'}>
                        <Wifi className="w-4 h-4 mr-1" /> 
                        {currentInstance.status === 'active' ? 'Conectado' : 'Conectar'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={loading || creatingInstance || currentInstance.status !== 'active'}>
                        <WifiOff className="w-4 h-4 mr-1" /> Desconectar
                      </Button>
                      <Button size="sm" variant="destructive" onClick={handleDeleteInstance} disabled={deleting}>
                        <Trash2 className="w-4 h-4 mr-1" /> Deletar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-gray-500">Nenhuma instância criada para este departamento.</p>
                    <Button onClick={handleCreateInstance} disabled={creatingInstance}>
                      {creatingInstance && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}<QrCode className="w-4 h-4 mr-1" /> Criar Instância WhatsApp
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Conexão */}
          <TabsContent value="connection">
            <Card>
              <CardHeader>
                <CardTitle>Conexão WhatsApp</CardTitle>
                <CardDescription>Conecte a instância via QR Code.</CardDescription>
              </CardHeader>
              <CardContent>
                {currentInstance ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(currentInstance.status || 'inactive')}
                      <span className="text-xs text-gray-500">{currentInstance.instanceName}</span>
                    </div>
                    {showQR && qrCode?.base64 ? (
                      <div className="flex flex-col items-center gap-2">
                        <img src={qrCode.base64} alt="QR Code" className="w-56 h-56 border rounded shadow" />
                        <span className="text-xs text-gray-500">Escaneie o QR Code no WhatsApp</span>
                        
                        {/* Indicador de carregamento */}
                        {isConnecting && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm">Aguardando conexão...</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleCloseQR} variant="outline">
                            Fechar QR Code
                          </Button>
                          <Button size="sm" onClick={handleConnectionSuccess} variant="default">
                            Simular Sucesso
                          </Button>
                        </div>
                      </div>
                    ) : connectionSuccess ? (
                      <div className="flex flex-col items-center gap-4 py-8">
                        {/* Animação de sucesso */}
                        <div className="relative">
                          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          </div>
                          
                          {/* Ondas de sucesso */}
                          <div className="absolute inset-0 rounded-full border-4 border-green-300 animate-ping opacity-30"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-green-200 animate-ping opacity-20" style={{animationDelay: '0.5s'}}></div>
                        </div>
                        
                        <div className="text-center">
                          <h3 className="text-xl font-bold text-green-700 mb-2">
                            🎉 Conectado com sucesso!
                          </h3>
                          <p className="text-green-600 mb-1">WhatsApp foi conectado ao departamento</p>
                          <p className="text-sm text-gray-500">Você já pode receber e enviar mensagens</p>
                        </div>
                        
                        {/* Barra de progresso animada */}
                        <div className="w-full max-w-xs">
                          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        
                        {/* Confetes animados */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          {[...Array(20)].map((_, i) => (
                            <div
                              key={i}
                              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-bounce opacity-70"
                              style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" onClick={handleConnect} disabled={isConnecting}>
                        {isConnecting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Conectando...
                          </>
                        ) : (
                          <>
                            <QrCode className="w-4 h-4 mr-1" /> Gerar QR Code
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500">Crie uma instância primeiro.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Mensagens */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens Automáticas</CardTitle>
                <CardDescription>Configure mensagens de boas-vindas, ausência e respostas automáticas.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Mensagem de Boas-vindas</Label>
                  <Textarea
                    value={typeof tempConfig.welcomeMessage === 'string' ? tempConfig.welcomeMessage : ''}
                    onChange={e => setTempConfig(tc => ({ ...tc, welcomeMessage: e.target.value as any }))}
                    placeholder="Olá! Seja bem-vindo ao nosso atendimento."
                  />
                </div>
                <div>
                  <Label>Mensagem de Ausência</Label>
                  <Textarea
                    value={typeof tempConfig.awayMessage === 'string' ? tempConfig.awayMessage : ''}
                    onChange={e => setTempConfig(tc => ({ ...tc, awayMessage: e.target.value as any }))}
                    placeholder="Estamos fora do horário de atendimento. Responderemos em breve."
                  />
                </div>
                <div>
                  <Label>Resposta Automática</Label>
                  <Textarea
                    value={typeof tempConfig.autoReply === 'string' ? tempConfig.autoReply : ''}
                    onChange={e => setTempConfig(tc => ({ ...tc, autoReply: e.target.value as any }))}
                    placeholder="Obrigado por entrar em contato!"
                  />
                </div>
                <div>
                  <Label>Horário Comercial</Label>
                  <Input
                    type="text"
                    value={typeof tempConfig.businessHours === 'string' ? tempConfig.businessHours : ''}
                    onChange={e => setTempConfig(tc => ({ ...tc, businessHours: e.target.value as any }))}
                    placeholder="Ex: Seg-Sex 08:00-18:00"
                  />
                </div>
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Salvar Mensagens
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Configurações Avançadas */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>Personalize o comportamento da instância.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!tempConfig.settings?.reject_call}
                    onCheckedChange={v => setTempConfig(tc => ({ ...tc, settings: { ...tc.settings, reject_call: v } }))}
                  />
                  <Label>Rejeitar chamadas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!tempConfig.settings?.groups_ignore}
                    onCheckedChange={v => setTempConfig(tc => ({ ...tc, settings: { ...tc.settings, groups_ignore: v } }))}
                  />
                  <Label>Ignorar mensagens de grupos</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!tempConfig.settings?.always_online}
                    onCheckedChange={v => setTempConfig(tc => ({ ...tc, settings: { ...tc.settings, always_online: v } }))}
                  />
                  <Label>Sempre online</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!tempConfig.settings?.read_messages}
                    onCheckedChange={v => setTempConfig(tc => ({ ...tc, settings: { ...tc.settings, read_messages: v } }))}
                  />
                  <Label>Marcar mensagens como lidas automaticamente</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!tempConfig.settings?.sync_full_history}
                    onCheckedChange={v => setTempConfig(tc => ({ ...tc, settings: { ...tc.settings, sync_full_history: v } }))}
                  />
                  <Label>Sincronizar histórico completo</Label>
                </div>
                <Button onClick={handleSaveConfig} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-300 rounded p-3 mt-4">
            <p className="text-red-700">Erro: {error}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 