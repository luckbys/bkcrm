import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Smartphone, 
  Zap, 
  Settings, 
  Plus, 
  Play, 
  Pause, 
  CheckCircle,
  AlertTriangle,
  Trash2,
  QrCode,
  Wifi,
  WifiOff,
  Users,
  Bot,
  Shield,
  BarChart3,
  Headphones,
  Globe,
  Sparkles,
  Activity,
  Clock,
  TrendingUp,
  X,
  MoreHorizontal,
  Edit,
  Copy,
  Download,
  RefreshCw,
  Eye,
  Filter,
  Search,
  Calendar,
  Target,
  Zap as ZapIcon,
  MessageCircle,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Importar os novos componentes
import { WhatsAppCreationWizard } from './WhatsAppCreationWizard';
import { QRCodeModal } from './QRCodeModal';
import { InstanceSettingsModal } from './InstanceSettingsModal';

interface WhatsAppHubProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId?: string;
  departmentName?: string;
}

interface WhatsAppInstance {
  id: string;
  name: string;
  displayName: string;
  description: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  department: string;
  createdAt: string;
  lastActivity: string;
  stats: {
    totalMessages: number;
    todayMessages: number;
    activeChats: number;
    responseTime: number;
    uptime: number;
  };
  settings: {
    autoReply: boolean;
    webhook: boolean;
    businessHours: boolean;
  };
}

export const WhatsAppHub: React.FC<WhatsAppHubProps> = ({
  isOpen,
  onClose,
  departmentId,
  departmentName
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [instances, setInstances] = useState<WhatsAppInstance[]>([
    {
      id: '1',
      name: 'comercial-vendas',
      displayName: 'Atendimento Comercial',
      description: 'Instância para vendas e prospecção',
      status: 'connected',
      department: 'Comercial',
      createdAt: '2024-01-15',
      lastActivity: '2 minutos atrás',
      stats: {
        totalMessages: 1247,
        todayMessages: 89,
        activeChats: 12,
        responseTime: 2.3,
        uptime: 99.2
      },
      settings: {
        autoReply: true,
        webhook: true,
        businessHours: true
      }
    },
    {
      id: '2',
      name: 'suporte-tecnico',
      displayName: 'Suporte Técnico',
      description: 'Instância para atendimento técnico',
      status: 'connected',
      department: 'Suporte',
      createdAt: '2024-01-10',
      lastActivity: '5 minutos atrás',
      stats: {
        totalMessages: 892,
        todayMessages: 34,
        activeChats: 8,
        responseTime: 1.8,
        uptime: 97.5
      },
      settings: {
        autoReply: false,
        webhook: true,
        businessHours: true
      }
    },
    {
      id: '3',
      name: 'marketing-digital',
      displayName: 'Marketing Digital',
      description: 'Instância para campanhas',
      status: 'disconnected',
      department: 'Marketing',
      createdAt: '2024-01-20',
      lastActivity: '1 hora atrás',
      stats: {
        totalMessages: 2156,
        todayMessages: 156,
        activeChats: 0,
        responseTime: 0,
        uptime: 0
      },
      settings: {
        autoReply: false,
        webhook: false,
        businessHours: false
      }
    }
  ]);

  // Estados dos modais
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Dados agregados
  const totalInstances = instances.length;
  const connectedInstances = instances.filter(i => i.status === 'connected').length;
  const totalMessages = instances.reduce((sum, i) => sum + i.stats.totalMessages, 0);
  const todayMessages = instances.reduce((sum, i) => sum + i.stats.todayMessages, 0);
  const activeChats = instances.reduce((sum, i) => sum + i.stats.activeChats, 0);
  const avgResponseTime = instances.reduce((sum, i) => sum + i.stats.responseTime, 0) / instances.length;
  const avgUptime = instances.reduce((sum, i) => sum + i.stats.uptime, 0) / instances.length;

  // Filtrar instâncias
  const filteredInstances = instances.filter(instance => {
    const matchesSearch = instance.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         instance.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || instance.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || instance.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleCreateInstance = (instanceData: any) => {
    const newInstance: WhatsAppInstance = {
      id: Date.now().toString(),
      name: instanceData.name,
      displayName: instanceData.displayName,
      description: instanceData.description,
      status: 'disconnected',
      department: instanceData.department,
      createdAt: new Date().toISOString().split('T')[0],
      lastActivity: 'Nunca',
      stats: {
        totalMessages: 0,
        todayMessages: 0,
        activeChats: 0,
        responseTime: 0,
        uptime: 0
      },
      settings: instanceData.settings
    };
    
    setInstances(prev => [...prev, newInstance]);
    setShowCreationWizard(false);
    
    // Mostrar QR Code para conectar
    setSelectedInstance(newInstance);
    setShowQRModal(true);
  };

  const handleConnectInstance = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setShowQRModal(true);
  };

  const handleConfigureInstance = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance);
    setShowSettingsModal(true);
  };

  const handleDeleteInstance = (instanceId: string) => {
    setInstances(prev => prev.filter(i => i.id !== instanceId));
    setShowSettingsModal(false);
    toast({
      title: "Instância excluída",
      description: "A instância foi removida com sucesso",
    });
  };

  const handleConnectionSuccess = () => {
    if (selectedInstance) {
      setInstances(prev => prev.map(i => 
        i.id === selectedInstance.id 
          ? { ...i, status: 'connected' as const, lastActivity: 'Agora' }
          : i
      ));
      
      toast({
        title: "Instância conectada!",
        description: `${selectedInstance.displayName} foi conectada com sucesso`,
      });
    }
    // O modal será fechado automaticamente pelo QRCodeModal após 3 segundos
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Instâncias Ativas</p>
                <p className="text-2xl font-bold text-green-700">{connectedInstances}</p>
                <p className="text-xs text-green-500">de {totalInstances} total</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Mensagens Hoje</p>
                <p className="text-2xl font-bold text-blue-700">{todayMessages}</p>
                <p className="text-xs text-blue-500">Total: {totalMessages.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Conversas Ativas</p>
                <p className="text-2xl font-bold text-purple-700">{activeChats}</p>
                <p className="text-xs text-purple-500">Em andamento</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 font-medium">Tempo Resposta</p>
                <p className="text-2xl font-bold text-amber-700">{avgResponseTime.toFixed(1)}s</p>
                <p className="text-xs text-amber-500">Média geral</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Taxa de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Entregues</span>
                <span className="font-medium">87%</span>
              </div>
              <Progress value={87} className="h-2" />
              <p className="text-xs text-gray-500">+5% desde ontem</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Uptime Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Disponibilidade</span>
                <span className="font-medium">{avgUptime.toFixed(1)}%</span>
              </div>
              <Progress value={avgUptime} className="h-2" />
              <p className="text-xs text-gray-500">Últimas 24h</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              Respostas Automáticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Automatizadas</span>
                <span className="font-medium">76%</span>
              </div>
              <Progress value={76} className="h-2" />
              <p className="text-xs text-gray-500">234 mensagens hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => setShowCreationWizard(true)}
              className="h-auto p-4 flex-col gap-2"
            >
              <Plus className="w-6 h-6" />
              <span>Nova Instância</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('instances')}
              className="h-auto p-4 flex-col gap-2"
            >
              <Settings className="w-6 h-6" />
              <span>Gerenciar</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('analytics')}
              className="h-auto p-4 flex-col gap-2"
            >
              <BarChart3 className="w-6 h-6" />
              <span>Relatórios</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setActiveTab('settings')}
              className="h-auto p-4 flex-col gap-2"
            >
              <Shield className="w-6 h-6" />
              <span>Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInstancesTab = () => (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </span>
            <Button onClick={() => setShowCreationWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Instância
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar instâncias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="connected">Conectado</SelectItem>
                <SelectItem value="disconnected">Desconectado</SelectItem>
                <SelectItem value="connecting">Conectando</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
                <SelectItem value="Suporte">Suporte</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setDepartmentFilter('all');
            }}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Instâncias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredInstances.map((instance) => (
          <Card key={instance.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    instance.status === 'connected' ? 'bg-green-100' : 
                    instance.status === 'connecting' ? 'bg-blue-100' : 'bg-gray-100'
                  )}>
                    {instance.status === 'connected' ? 
                      <Wifi className="w-5 h-5 text-green-600" /> :
                      <WifiOff className="w-5 h-5 text-gray-600" />
                    }
                  </div>
                  <div>
                    <CardTitle className="text-lg">{instance.displayName}</CardTitle>
                    <p className="text-sm text-gray-600">{instance.description}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {instance.status === 'disconnected' && (
                      <DropdownMenuItem onClick={() => handleConnectInstance(instance)}>
                        <QrCode className="w-4 h-4 mr-2" />
                        Conectar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleConfigureInstance(instance)}>
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={instance.status === 'connected' ? 'default' : 'secondary'}>
                  {instance.status === 'connected' ? 'Online' : 
                   instance.status === 'connecting' ? 'Conectando' : 'Offline'}
                </Badge>
                <Badge variant="outline">{instance.department}</Badge>
                {instance.settings.autoReply && (
                  <Badge variant="outline" className="text-xs">
                    <Bot className="w-3 h-3 mr-1" />
                    Auto
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Mensagens Hoje</p>
                    <p className="font-semibold">{instance.stats.todayMessages}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conversas Ativas</p>
                    <p className="font-semibold">{instance.stats.activeChats}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tempo Resposta</p>
                    <p className="font-semibold">{instance.stats.responseTime}s</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Uptime</p>
                    <p className="font-semibold">{instance.stats.uptime}%</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Última atividade: {instance.lastActivity}</span>
                    <span>Criado em: {instance.createdAt}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInstances.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma instância encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou criar uma nova instância
            </p>
            <Button onClick={() => setShowCreationWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Instância
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Analytics em Desenvolvimento
          </h3>
          <p className="text-gray-600">
            Dashboard de analytics avançado será implementado em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Configurações Globais
          </h3>
          <p className="text-gray-600">
            Painel de configurações globais será implementado em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              WhatsApp Hub
              {departmentName && (
                <Badge variant="outline" className="ml-2">
                  {departmentName}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="instances" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Instâncias ({totalInstances})
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
              <TabsContent value="instances">{renderInstancesTab()}</TabsContent>
              <TabsContent value="analytics">{renderAnalyticsTab()}</TabsContent>
              <TabsContent value="settings">{renderSettingsTab()}</TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Modais */}
      <WhatsAppCreationWizard
        isOpen={showCreationWizard}
        onClose={() => setShowCreationWizard(false)}
        onComplete={handleCreateInstance}
        departmentId={departmentId}
        departmentName={departmentName}
      />

      {selectedInstance && (
        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          instanceName={selectedInstance.displayName}
          instanceId={selectedInstance.id}
          onConnectionSuccess={handleConnectionSuccess}
        />
      )}

      {selectedInstance && (
        <InstanceSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          instanceData={selectedInstance}
          onSave={(settings) => {
            console.log('Saving settings:', settings);
            setShowSettingsModal(false);
          }}
          onDelete={() => handleDeleteInstance(selectedInstance.id)}
        />
      )}
    </>
  );
}; 