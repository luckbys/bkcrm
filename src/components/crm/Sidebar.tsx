import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  ChevronLeft, 
  ChevronRight, 
  Headphones, 
  ShoppingCart, 
  ClipboardCheck, 
  BarChart3, 
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  Shield,
  Heart,
  Target,
  Briefcase,
  Home,
  Building,
  Package,
  Truck,
  CreditCard,
  UserCheck,
  HelpCircle,
  Code,
  Database,
  Cloud,
  Laptop,
  Smartphone,
  Monitor,
  Wifi,
  Lock,
  Key,
  Award,
  Flag,
  Bookmark,
  Tag,
  Calendar,
  Clock,
  QrCode,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useDepartments, Department } from '@/hooks/useDepartments';
import { globalWhatsAppManager, evolutionAPIService, EVOLUTION_CONFIG } from '@/lib/evolution-config';

interface SidebarProps {
  sectors: Department[];
  selectedSector: Department | null;
  onSectorChange: (sector: Department) => void;
  collapsed: boolean;
  onToggle: () => void;
  onSectorUpdate?: () => void;
}

interface SectorFormData {
  name: string;
  icon: string;
  color: string;
  description: string;
  priority: 'alta' | 'normal' | 'baixa';
}

export const Sidebar = ({ sectors, selectedSector, onSectorChange, collapsed, onToggle, onSectorUpdate }: SidebarProps) => {
  const { toast } = useToast();
  const { addDepartment, updateDepartment, deleteDepartment, loading: departmentLoading } = useDepartments();
  
  // Estados principais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSector, setEditingSector] = useState<Department | null>(null);
  const [deletingSector, setDeletingSector] = useState<Department | null>(null);
  const [adminPassword, setAdminPassword] = useState('');
  
  // Estados WhatsApp Global (simplificado)
  const [globalWhatsAppStatus, setGlobalWhatsAppStatus] = useState({
    isConnected: false,
    isConnecting: false,
    qrCode: '',
    lastCheck: new Date()
  });
  const [showQRModal, setShowQRModal] = useState(false);
  const [configurationMode, setConfigurationMode] = useState(false);
  const [activeTab, setActiveTab] = useState('geral');

  const [ticketCounts, setTicketCounts] = useState<Record<string, { nonVisualized: number; total: number }>>({});
  
  const [sectorForm, setSectorForm] = useState<SectorFormData>({
    name: '',
    icon: 'Headphones',
    color: 'blue',
    description: '',
    priority: 'normal'
  });

  // Verificar status do WhatsApp global periodicamente
  useEffect(() => {
    const checkGlobalWhatsAppStatus = async () => {
      if (showAddModal || showEditModal || showDeleteDialog || showQRModal || configurationMode) {
        return;
      }

      try {
        const status = globalWhatsAppManager.getStatus();
        const isConnected = globalWhatsAppManager.isConnected();
        
        setGlobalWhatsAppStatus(prev => ({
          ...prev,
          isConnected,
          isConnecting: status === 'connecting',
          lastCheck: new Date()
        }));
      } catch (error) {
        console.error('Erro ao verificar status do WhatsApp global:', error);
      }
    };

    // Verificar imediatamente
    checkGlobalWhatsAppStatus();

    // Verificar a cada 30 segundos
    const interval = setInterval(checkGlobalWhatsAppStatus, 30000);
    return () => clearInterval(interval);
  }, [showAddModal, showEditModal, showDeleteDialog, showQRModal, configurationMode]);

  // Simulate real-time ticket count updates
  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteDialog || showQRModal || configurationMode) {
      return;
    }

    const interval = setInterval(() => {
      if (showAddModal || showEditModal || showDeleteDialog || showQRModal || configurationMode) {
        return;
      }

      setTicketCounts(prev => {
        const updated = { ...prev };
        sectors.forEach(sector => {
          if (Math.random() > 0.8) {
            updated[sector.id] = {
              nonVisualized: Math.max(0, (prev[sector.id]?.nonVisualized || sector.nonVisualized) + (Math.random() > 0.5 ? 1 : -1)),
              total: Math.max(1, (prev[sector.id]?.total || sector.total) + (Math.random() > 0.7 ? 1 : 0))
            };
          }
        });
        return updated;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [sectors, showAddModal, showEditModal, showDeleteDialog, showQRModal, configurationMode]);

  const availableIcons = {
    'clipboard-check': ClipboardCheck,
    'headphones': Headphones,
    'shopping-cart': ShoppingCart,
    'chart-bar': BarChart3,
    'trending-up': TrendingUp,
    'users': Users,
    'message-square': MessageSquare,
    'phone': Phone,
    'mail': Mail,
    'globe': Globe,
    'shield': Shield,
    'heart': Heart,
    'target': Target,
    'briefcase': Briefcase,
    'home': Home,
    'building': Building,
    'package': Package,
    'truck': Truck,
    'credit-card': CreditCard,
    'user-check': UserCheck,
    'help-circle': HelpCircle,
    'code': Code,
    'database': Database,
    'cloud': Cloud,
    'laptop': Laptop,
    'smartphone': Smartphone,
    'monitor': Monitor,
    'wifi': Wifi,
    'lock': Lock,
    'key': Key,
    'award': Award,
    'flag': Flag,
    'bookmark': Bookmark,
    'tag': Tag,
    'calendar': Calendar,
    'clock': Clock
  };

  const availableColors = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-purple-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
    'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-lime-500', 'bg-rose-500'
  ];

  const getIconComponent = (iconName: string) => {
    return availableIcons[iconName as keyof typeof availableIcons] || ClipboardCheck;
  };

  const getSectorCounts = (sector: Department) => {
    return {
      nonVisualized: sector.nonVisualized || 0,
      total: sector.total || 0
    };
  };

  // Funções WhatsApp Global simplificadas
  const initializeGlobalWhatsApp = async () => {
    try {
      setGlobalWhatsAppStatus(prev => ({ ...prev, isConnecting: true }));
      
      toast({
        title: 'Inicializando WhatsApp',
        description: 'Configurando instância global...',
      });

      const result = await globalWhatsAppManager.initializeGlobalWhatsApp();
      
      if (result.needsQR && result.qrCode) {
        setGlobalWhatsAppStatus(prev => ({
          ...prev,
          qrCode: result.qrCode,
          isConnecting: false
        }));
        setShowQRModal(true);
        
        toast({
          title: 'QR Code gerado',
          description: 'Escaneie com seu WhatsApp para conectar',
        });
      } else {
        setGlobalWhatsAppStatus(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false
        }));
        
        toast({
          title: 'WhatsApp conectado',
          description: 'Instância global já está ativa',
        });
      }
    } catch (error: any) {
      console.error('Erro ao inicializar WhatsApp global:', error);
      setGlobalWhatsAppStatus(prev => ({ ...prev, isConnecting: false }));
      
      let title = 'Erro ao conectar';
      let description = error.message || 'Falha na conexão';
      
      // Mensagens específicas baseadas no tipo de erro
      if (error.message.includes('400')) {
        title = 'Erro de Configuração';
        description = 'Dados inválidos. Tente resetar a instância.';
      } else if (error.message.includes('401')) {
        title = 'Credenciais Inválidas';
        description = 'Verifique a API Key da Evolution API.';
      } else if (error.message.includes('404')) {
        title = 'Serviço Não Encontrado';
        description = 'Verifique se a URL da Evolution API está correta.';
      }
      
      toast({
        title,
        description,
        variant: 'destructive',
        action: error.message.includes('400') ? (
          <button 
            onClick={resetGlobalWhatsApp}
            className="px-3 py-1 text-xs bg-white text-red-600 rounded border hover:bg-gray-50"
          >
            Resetar
          </button>
        ) : undefined,
      });
    }
  };

  const disconnectGlobalWhatsApp = async () => {
    try {
      await globalWhatsAppManager.disconnectGlobalWhatsApp();
      setGlobalWhatsAppStatus(prev => ({ ...prev, isConnected: false }));
      
      toast({
        title: 'WhatsApp desconectado',
        description: 'Instância global foi desconectada',
      });
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp global:', error);
      toast({
        title: 'Erro ao desconectar',
        description: error instanceof Error ? error.message : 'Falha na desconexão',
        variant: 'destructive',
      });
    }
  };

  const resetGlobalWhatsApp = async () => {
    try {
      toast({
        title: 'Resetando WhatsApp',
        description: 'Removendo instância e recriando...',
      });

      await globalWhatsAppManager.resetGlobalWhatsApp();
      setGlobalWhatsAppStatus({
        isConnected: false,
        isConnecting: false,
        qrCode: '',
        lastCheck: new Date()
      });
      
      // Aguardar um pouco e tentar reconectar
      setTimeout(() => {
        initializeGlobalWhatsApp();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao resetar WhatsApp global:', error);
      toast({
        title: 'Erro ao resetar',
        description: error instanceof Error ? error.message : 'Falha no reset',
        variant: 'destructive',
      });
    }
  };

  const handleAddSector = () => {
    setSectorForm({
      name: '',
      icon: 'Headphones',
      color: 'blue',
      description: '',
      priority: 'normal'
    });
    setShowAddModal(true);
  };

  const handleEditSector = (sector: Department) => {
    console.log('Abrindo edição do setor:', sector.name);
    setConfigurationMode(true);
    setEditingSector(sector);
    setSectorForm({
      name: sector.name,
      icon: sector.icon,
      color: sector.color,
      description: sector.description || '',
      priority: sector.priority || 'normal'
    });
    
    if (!showEditModal) {
      setActiveTab('geral');
    }
    
    setShowEditModal(true);
  };

  const handleDeleteSector = (sector: Department) => {
    setDeletingSector(sector);
    setAdminPassword('');
    setShowDeleteDialog(true);
  };

  const validateAdminPassword = () => {
    const correctPassword = "admin123";
    if (adminPassword === correctPassword) {
      return true;
    } else {
      toast({
        title: "Senha incorreta",
        description: "A senha de administrador está incorreta.",
        variant: "destructive"
      });
      return false;
    }
  };

  const confirmDeleteSector = async () => {
    if (!validateAdminPassword() || !deletingSector) return;

    try {
      await deleteDepartment(deletingSector.id);
      
      toast({
        title: "Setor removido",
        description: `O setor "${deletingSector.name}" foi removido com sucesso.`,
      });

      onSectorUpdate?.();
      
      // Se o setor deletado era o selecionado, selecionar outro
      if (selectedSector?.id === deletingSector.id && sectors.length > 1) {
        const remainingSectors = sectors.filter(s => s.id !== deletingSector.id && s.isActive);
        if (remainingSectors.length > 0) {
          onSectorChange(remainingSectors[0]);
        }
      }
    } catch (error) {
      toast({
        title: "Erro ao remover setor",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDeletingSector(null);
      setAdminPassword('');
    }
  };

  const saveSector = async () => {
    if (!sectorForm.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, insira um nome para o setor.",
        variant: "destructive"
      });
      return;
    }

    console.log('Salvando setor...');

    try {
      if (editingSector) {
        await updateDepartment(editingSector.id, {
          name: sectorForm.name,
          description: sectorForm.description,
          color: sectorForm.color,
          icon: sectorForm.icon,
          isActive: true
        });
        
        toast({
          title: "Setor atualizado",
          description: `O setor "${sectorForm.name}" foi atualizado com sucesso.`,
        });
        
        setShowEditModal(false);
        setConfigurationMode(false);
      } else {
        await addDepartment({
          name: sectorForm.name,
          description: sectorForm.description,
          color: sectorForm.color,
          icon: sectorForm.icon,
          isActive: true
        });
        
        toast({
          title: "Setor adicionado",
          description: `O setor "${sectorForm.name}" foi adicionado com sucesso.`,
        });
        
        setShowAddModal(false);
        setConfigurationMode(false);
      }

      onSectorUpdate?.();
    } catch (error) {
      toast({
        title: editingSector ? "Erro ao atualizar setor" : "Erro ao adicionar setor",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setEditingSector(null);
      setSectorForm({
        name: '',
        icon: 'Headphones',
        color: 'blue',
        description: '',
        priority: 'normal'
      });
    }
  };

  const handleCloseEditModal = () => {
    console.log('Fechando modal de edição');
    setShowEditModal(false);
    setConfigurationMode(false);
    setEditingSector(null);
    setActiveTab('geral');
  };

  const handleCloseQRModal = () => {
    console.log('Fechando modal QR Code');
    setShowQRModal(false);
  };

  // Componente para os campos do formulário
  const SectorFormFieldsComponent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="geral">Configurações Gerais</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp Global</TabsTrigger>
      </TabsList>
      
      <TabsContent value="geral" className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome do Setor</Label>
        <Input
          id="name"
          value={sectorForm.name}
          onChange={(e) => setSectorForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Atendimento ao Cliente"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={sectorForm.description}
          onChange={(e) => setSectorForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição opcional do setor"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ícone</Label>
          <Select value={sectorForm.icon} onValueChange={(value) => setSectorForm(prev => ({ ...prev, icon: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {Object.entries(availableIcons).map(([key, IconComponent]) => {
                const Icon = IconComponent as React.ComponentType<{ className?: string }>;
                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="capitalize">{key.replace('-', ' ')}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={sectorForm.priority} onValueChange={(value) => setSectorForm(prev => ({ ...prev, priority: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Cor do Setor</Label>
        <div className="grid grid-cols-5 gap-2">
          {availableColors.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                "w-8 h-8 rounded-lg border-2 transition-all",
                color,
                sectorForm.color === color ? "border-foreground scale-110" : "border-border"
              )}
              onClick={() => setSectorForm(prev => ({ ...prev, color }))}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
        <div className={cn(
          "flex items-center justify-center rounded-lg text-white text-xs font-medium w-8 h-8",
          sectorForm.color
        )}>
          {(() => {
            const IconComponent = getIconComponent(sectorForm.icon);
            return <IconComponent className="w-4 h-4" />;
          })()}
        </div>
        <div>
          <div className="font-medium text-sm">{sectorForm.name || 'Nome do Setor'}</div>
          <div className="text-2xs text-muted-foreground">{sectorForm.description || 'Descrição do setor'}</div>
        </div>
      </div>
      </TabsContent>

      <TabsContent value="whatsapp" className="space-y-4 mt-4">
        {/* Status da Conexão Global */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              globalWhatsAppStatus.isConnected 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              {globalWhatsAppStatus.isConnected ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">
                Status: {globalWhatsAppStatus.isConnected ? 'Conectado' : 'Desconectado'}
              </p>
              <p className="text-xs text-gray-600">
                WhatsApp Global
              </p>
            </div>
          </div>
          <Badge 
            variant={globalWhatsAppStatus.isConnected ? 'default' : 'destructive'}
            className="ml-4"
          >
            {globalWhatsAppStatus.isConnected ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Informação sobre Sistema Simplificado */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-blue-700 text-sm font-medium mb-2">
            <Globe className="w-4 h-4" />
            <span>Sistema WhatsApp Simplificado</span>
          </div>
          <p className="text-xs text-blue-600 mb-2">
            ✨ <strong>Nova versão:</strong> Uma única instância WhatsApp para todos os setores
          </p>
          <div className="text-xs text-blue-600 space-y-1">
            <div>📱 <strong>Mensagens:</strong> Roteamento automático entre setores</div>
            <div>🔄 <strong>Webhook único:</strong> Todos os eventos centralizados</div>
            <div>⚡ <strong>Performance:</strong> Mais rápido e estável</div>
            <div>🔧 <strong>Manutenção:</strong> Configuração e gerenciamento simplificados</div>
          </div>
          <p className="text-xs text-blue-500 mt-2 font-medium">
            🌐 Webhook: press-n8n.jhkbgs.easypanel.host
          </p>
        </div>

        {/* Seção de Conexão */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-sm font-medium">Conectar WhatsApp</Label>
          <p className="text-xs text-gray-600">
            Conecte uma instância global que atenderá todos os setores:
          </p>
          
          <div className="flex space-x-2">
            <Button 
              onClick={initializeGlobalWhatsApp}
              disabled={globalWhatsAppStatus.isConnecting}
              className="flex-1"
              variant={globalWhatsAppStatus.isConnected ? "outline" : "default"}
            >
              {globalWhatsAppStatus.isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Conectando...
                </>
              ) : globalWhatsAppStatus.isConnected ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconectar
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 mr-2" />
                  Conectar
                </>
              )}
            </Button>
            
            {globalWhatsAppStatus.isConnected && (
              <>
                <Button 
                  variant="secondary"
                  onClick={resetGlobalWhatsApp}
                  size="sm"
                  className="px-3"
                  title="Resetar instância global"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                
                <Button 
                  variant="destructive"
                  onClick={disconnectGlobalWhatsApp}
                  size="sm"
                  className="px-3"
                  title="Desconectar WhatsApp"
                >
                  <WifiOff className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
          
          {/* Dicas para o usuário */}
          {!globalWhatsAppStatus.isConnected && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
              💡 <strong>Dica:</strong> Ao conectar, será criada uma instância global que receberá mensagens de todos os setores.
            </div>
          )}
          
          {globalWhatsAppStatus.isConnected && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">
              ✅ <strong>Conectado:</strong> Todos os setores agora podem receber e enviar mensagens WhatsApp.
            </div>
          )}
        </div>

        {/* Configuração atual */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Servidor:</strong> {EVOLUTION_CONFIG.SERVER_URL}</div>
            <div><strong>Instância:</strong> crm_whatsapp_global</div>
            <div><strong>Webhook:</strong> Automático via N8N</div>
            <div><strong>Status:</strong> {globalWhatsAppStatus.isConnected ? '🟢 Conectado' : '🔴 Desconectado'}</div>
            <div><strong>Última verificação:</strong> {globalWhatsAppStatus.lastCheck.toLocaleTimeString()}</div>
          </div>
        </div>

        {/* Seção de Debug (apenas quando há problemas) */}
        {!globalWhatsAppStatus.isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-yellow-700 text-sm font-medium mb-2">
              <HelpCircle className="w-4 h-4" />
              <span>Diagnóstico</span>
            </div>
            <div className="text-xs text-yellow-700 space-y-1 mb-3">
              <div>• Verifique se a Evolution API está online</div>
              <div>• Confirme se a API Key está correta</div>
              <div>• Teste a conectividade: <code className="bg-yellow-100 px-1 rounded">{EVOLUTION_CONFIG.SERVER_URL}</code></div>
              <div>• Se erro 400, clique em "Resetar" na próxima tentativa</div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  const test = await evolutionAPIService.testConnection();
                  if (test.success) {
                    toast({
                      title: '✅ API Online',
                      description: `Evolution API v${test.info?.version} funcionando corretamente`,
                    });
                  } else {
                    toast({
                      title: '❌ API Offline',
                      description: test.error,
                      variant: 'destructive',
                    });
                  }
                } catch (error: any) {
                  toast({
                    title: '❌ Erro no teste',
                    description: error.message,
                    variant: 'destructive',
                  });
                }
              }}
              className="w-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300"
            >
              <Globe className="w-4 h-4 mr-2" />
              Testar Conectividade API
            </Button>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );

  return (
    <div 
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-lg",
        collapsed ? "w-16" : "w-72"
      )}
      style={{
        width: collapsed ? '64px' : '288px',
        minWidth: collapsed ? '64px' : '288px',
        maxWidth: collapsed ? '64px' : '288px'
      }}
    >
      {/* Toggle Button */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              console.log('Toggle button clicked - current state:', collapsed);
              onToggle();
            }}
            className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 rounded-md"
            title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>

          {!collapsed && (
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddSector}
                className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                title="Adicionar Setor"
              >
                <Plus className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    title="Configurações"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleAddSector}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Setor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={initializeGlobalWhatsApp}>
                    <Smartphone className="w-4 h-4 mr-2" />
                    Configurar WhatsApp
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Sectors List */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="p-2 space-y-1">
          {sectors.map((sector) => {
            const IconComponent = getIconComponent(sector.icon);
            const counts = getSectorCounts(sector);
            const isSelected = selectedSector?.id === sector.id;

            return (
              <div key={sector.id} className="relative group">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left transition-all duration-200 h-auto p-0 rounded-lg border",
                    collapsed ? "px-2 py-3" : "px-3 py-3",
                    isSelected 
                      ? "bg-blue-50 border-blue-200 text-blue-900 shadow-sm" 
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                  )}
                  onClick={() => onSectorChange(sector)}
                  title={collapsed ? `${sector.name} - ${counts.nonVisualized} não visualizados` : undefined}
                >
                  <div className="flex items-center w-full">
                    <div className={cn(
                      "flex items-center justify-center rounded-lg text-white text-xs font-medium shadow-sm transition-all duration-200 relative",
                      sector.color,
                      collapsed ? "w-8 h-8" : "w-10 h-10 mr-3"
                    )}>
                      <IconComponent className={cn(collapsed ? "w-4 h-4" : "w-5 h-5")} />
                      
                      {/* Indicador WhatsApp Global */}
                      {globalWhatsAppStatus.isConnected && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                          <Smartphone className="w-2 h-2 text-white" />
                        </div>
                      )}
                      
                      {collapsed && counts.nonVisualized > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-2xs rounded-full flex items-center justify-center border-2 border-white animate-pulse font-bold shadow-md">
                          {counts.nonVisualized > 9 ? '9+' : counts.nonVisualized}
                        </div>
                      )}
                    </div>
                    
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "text-sm font-semibold truncate transition-colors",
                              isSelected ? "text-blue-900" : "text-gray-800"
                            )}>
                              {sector.name}
                            </span>
                            {globalWhatsAppStatus.isConnected && (
                              <div className="flex items-center space-x-1 text-green-600" title="WhatsApp Global Conectado">
                                <Smartphone className="w-3 h-3" />
                                <span className="text-2xs font-medium">WA</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5 ml-2">
                            {counts.nonVisualized > 0 && (
                              <Badge 
                                className="text-2xs px-2 py-0.5 bg-red-500 text-white border-0 animate-pulse shadow-sm"
                              >
                                {counts.nonVisualized}
                              </Badge>
                            )}
                            <Badge 
                              variant="secondary" 
                              className="text-2xs px-2 py-0.5 bg-gray-100 text-gray-700 border border-gray-300"
                            >
                              {counts.total}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-2xs text-gray-500 mt-1 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            {counts.nonVisualized} não visualizados de {counts.total}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Button>

                {/* Actions Menu */}
                {!collapsed && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSector(sector)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar Setor
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSector(sector)}
                          className="text-red-600 focus:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Setor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                
                {/* Tooltip rico para modo collapsed */}
                {collapsed && (
                  <div className="absolute left-full top-0 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white text-sm rounded-lg px-3 py-2 shadow-xl border border-gray-700 whitespace-nowrap animate-scale-in">
                      <div className="font-semibold">{sector.name}</div>
                      <div className="text-xs text-gray-300 mt-1">
                        {counts.nonVisualized} não visualizados de {counts.total}
                      </div>
                      {globalWhatsAppStatus.isConnected && (
                        <div className="text-xs text-green-400 mt-1">
                          📱 WhatsApp Global ativo
                        </div>
                      )}
                      <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2">
                        <div className="w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-2xs text-gray-600 font-medium flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            📊 {sectors.length} Setores Ativos
          </div>
          <div className="text-2xs text-gray-500 mt-1 flex items-center">
            <div className={cn(
              "w-2 h-2 rounded-full mr-2",
              globalWhatsAppStatus.isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            )}></div>
            WhatsApp {globalWhatsAppStatus.isConnected ? 'Online' : 'Offline'}
          </div>
        </div>
      )}
      
      {/* Mini indicator quando collapsed */}
      {collapsed && (
        <div className="p-2 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <div className="w-6 h-1 bg-blue-500 rounded-full mx-auto"></div>
            <p className="text-2xs text-gray-600 mt-1 font-medium">
              {sectors.length}
            </p>
            <div className={cn(
              "w-2 h-2 rounded-full mx-auto mt-1",
              globalWhatsAppStatus.isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
            )}></div>
          </div>
        </div>
      )}

      {/* Add Sector Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Adicionar Novo Setor</span>
            </DialogTitle>
          </DialogHeader>
          <SectorFormFieldsComponent />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={saveSector}>
              Adicionar Setor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sector Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        if (!open) {
          handleCloseEditModal();
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="w-5 h-5" />
              <span>Editar Setor</span>
            </DialogTitle>
          </DialogHeader>
          <SectorFormFieldsComponent />
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditModal}>
              Cancelar
            </Button>
            <Button onClick={saveSector}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={(open) => {
        if (!open) {
          handleCloseQRModal();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>Conectar WhatsApp Global</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4">
            {globalWhatsAppStatus.qrCode ? (
              <div className="space-y-2">
                <div className="p-4 bg-white rounded-lg border">
                  {globalWhatsAppStatus.qrCode.startsWith('data:image') ? (
                    <img 
                      src={globalWhatsAppStatus.qrCode} 
                      alt="QR Code para conectar WhatsApp" 
                      className="w-64 h-64 object-contain"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem QR Code');
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-64 h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
                              <p class="text-sm text-gray-600 text-center">QR Code em formato texto:</p>
                              <code class="text-xs bg-gray-200 p-2 rounded mt-2 max-h-32 overflow-auto">${globalWhatsAppStatus.qrCode.substring(0, 200)}...</code>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
                      <p className="text-sm text-gray-600 text-center mb-2">QR Code em formato texto:</p>
                      <code className="text-xs bg-gray-200 p-2 rounded max-h-32 overflow-auto break-all">
                        {globalWhatsAppStatus.qrCode.substring(0, 200)}...
                      </code>
                      <p className="text-xs text-gray-500 mt-2">
                        Formato: {globalWhatsAppStatus.qrCode.startsWith('data:') ? 'Base64' : 'Texto'}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Debug info */}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Tamanho: {globalWhatsAppStatus.qrCode.length} caracteres</div>
                  <div>Tipo: {globalWhatsAppStatus.qrCode.startsWith('data:image') ? 'Imagem' : 'Texto'}</div>
                  <div>Início: {globalWhatsAppStatus.qrCode.substring(0, 30)}...</div>
                </div>
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Gerando QR Code...</p>
                </div>
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
            <Button variant="outline" onClick={handleCloseQRModal}>
              Fechar
            </Button>
            <Button onClick={resetGlobalWhatsApp}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              <span>Confirmar Exclusão</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Você está prestes a excluir o setor <strong>"{deletingSector?.name}"</strong>. 
                Esta ação não pode ser desfeita.
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-red-700 text-sm font-medium mb-2">
                  <Shield className="w-4 h-4" />
                  <span>Autenticação Necessária</span>
                </div>
                <Label htmlFor="admin-password" className="text-sm">
                  Digite a senha de administrador:
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Senha de administrador"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Senha padrão: admin123
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setAdminPassword('');
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSector}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={!adminPassword.trim()}
            >
              Excluir Setor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
