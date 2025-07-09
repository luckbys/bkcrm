import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Bot,
  Shield,
  Clock,
  MessageSquare,
  Users,
  Webhook,
  Database,
  Zap,
  Globe,
  Bell,
  Eye,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  Copy,
  Download,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface InstanceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceData: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    department: string;
    createdAt: string;
    lastActivity: string;
  };
  onSave: (settings: any) => void;
  onDelete: () => void;
}

interface InstanceSettings {
  // Configurações Gerais
  general: {
    name: string;
    displayName: string;
    description: string;
    department: string;
    timezone: string;
    language: string;
  };
  
  // Comportamento
  behavior: {
    autoReply: boolean;
    readReceipts: boolean;
    typing: boolean;
    onlineStatus: boolean;
    groupSupport: boolean;
    statusBroadcast: boolean;
  };
  
  // Mensagens
  messages: {
    maxLength: number;
    allowMedia: boolean;
    allowDocuments: boolean;
    allowVoice: boolean;
    allowStickers: boolean;
    messageDelay: number;
    retryAttempts: number;
  };
  
  // Automação
  automation: {
    welcomeMessage: string;
    awayMessage: string;
    businessHours: {
      enabled: boolean;
      start: string;
      end: string;
      days: string[];
    };
    autoAssignment: boolean;
    escalationRules: boolean;
  };
  
  // Webhook
  webhook: {
    enabled: boolean;
    url: string;
    secret: string;
    events: string[];
    retryAttempts: number;
    timeout: number;
  };
  
  // Segurança
  security: {
    ipWhitelist: string[];
    rateLimit: {
      enabled: boolean;
      maxRequests: number;
      windowMs: number;
    };
    encryption: boolean;
    logging: boolean;
  };
}

export const InstanceSettingsModal: React.FC<InstanceSettingsModalProps> = ({
  isOpen,
  onClose,
  instanceData,
  onSave,
  onDelete
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<InstanceSettings>({
    general: {
      name: instanceData.name,
      displayName: instanceData.displayName,
      description: instanceData.description,
      department: instanceData.department,
      timezone: 'America/Sao_Paulo',
      language: 'pt-BR'
    },
    behavior: {
      autoReply: true,
      readReceipts: true,
      typing: false,
      onlineStatus: true,
      groupSupport: false,
      statusBroadcast: false
    },
    messages: {
      maxLength: 4096,
      allowMedia: true,
      allowDocuments: true,
      allowVoice: true,
      allowStickers: true,
      messageDelay: 1000,
      retryAttempts: 3
    },
    automation: {
      welcomeMessage: 'Olá! Como posso ajudá-lo hoje?',
      awayMessage: 'Obrigado pela sua mensagem. Retornaremos em breve.',
      businessHours: {
        enabled: false,
        start: '09:00',
        end: '18:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      },
      autoAssignment: false,
      escalationRules: false
    },
    webhook: {
      enabled: false,
      url: '',
      secret: '',
      events: ['message', 'status'],
      retryAttempts: 3,
      timeout: 30000
    },
    security: {
      ipWhitelist: [],
      rateLimit: {
        enabled: false,
        maxRequests: 100,
        windowMs: 60000
      },
      encryption: true,
      logging: true
    }
  });

  const updateSettings = (section: keyof InstanceSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const updateNestedSettings = (section: keyof InstanceSettings, nestedKey: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedKey]: {
          ...(prev[section] as any)[nestedKey],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(settings);
    setHasChanges(false);
    toast({
      title: "Configurações salvas",
      description: "As configurações da instância foram atualizadas com sucesso",
    });
  };

  const handleReset = () => {
    // Reset to original values
    setHasChanges(false);
    toast({
      title: "Configurações resetadas",
      description: "As configurações foram restauradas para os valores originais",
    });
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza que deseja excluir esta instância? Esta ação não pode ser desfeita.')) {
      onDelete();
      onClose();
    }
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Instância</Label>
              <Input
                id="name"
                value={settings.general.name}
                onChange={(e) => updateSettings('general', 'name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição</Label>
              <Input
                id="displayName"
                value={settings.general.displayName}
                onChange={(e) => updateSettings('general', 'displayName', e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={settings.general.description}
              onChange={(e) => updateSettings('general', 'description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={settings.general.department}
                onChange={(e) => updateSettings('general', 'department', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select
                value={settings.general.timezone}
                onValueChange={(value) => updateSettings('general', 'timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">São Paulo (UTC-3)</SelectItem>
                  <SelectItem value="America/New_York">Nova York (UTC-5)</SelectItem>
                  <SelectItem value="Europe/London">Londres (UTC+0)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tóquio (UTC+9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-green-600" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-gray-600">ID da Instância</Label>
              <p className="font-mono text-gray-900">{instanceData.id}</p>
            </div>
            <div>
              <Label className="text-gray-600">Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={instanceData.status === 'connected' ? 'default' : 'secondary'}>
                  {instanceData.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Criado em</Label>
              <p className="text-gray-900">{instanceData.createdAt}</p>
            </div>
            <div>
              <Label className="text-gray-600">Última Atividade</Label>
              <p className="text-gray-900">{instanceData.lastActivity}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBehaviorTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-600" />
            Comportamento Automático
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Respostas Automáticas</Label>
                <p className="text-xs text-gray-500">Enviar mensagens automáticas</p>
              </div>
              <Switch
                checked={settings.behavior.autoReply}
                onCheckedChange={(checked) => updateSettings('behavior', 'autoReply', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Confirmações de Leitura</Label>
                <p className="text-xs text-gray-500">Marcar mensagens como lidas</p>
              </div>
              <Switch
                checked={settings.behavior.readReceipts}
                onCheckedChange={(checked) => updateSettings('behavior', 'readReceipts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Indicador de Digitação</Label>
                <p className="text-xs text-gray-500">Mostrar "digitando..."</p>
              </div>
              <Switch
                checked={settings.behavior.typing}
                onCheckedChange={(checked) => updateSettings('behavior', 'typing', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Status Online</Label>
                <p className="text-xs text-gray-500">Mostrar como online</p>
              </div>
              <Switch
                checked={settings.behavior.onlineStatus}
                onCheckedChange={(checked) => updateSettings('behavior', 'onlineStatus', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Suporte a Grupos</Label>
                <p className="text-xs text-gray-500">Permitir mensagens em grupos</p>
              </div>
              <Switch
                checked={settings.behavior.groupSupport}
                onCheckedChange={(checked) => updateSettings('behavior', 'groupSupport', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Status Broadcast</Label>
                <p className="text-xs text-gray-500">Enviar para status</p>
              </div>
              <Switch
                checked={settings.behavior.statusBroadcast}
                onCheckedChange={(checked) => updateSettings('behavior', 'statusBroadcast', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMessagesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Configurações de Mensagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Comprimento Máximo da Mensagem</Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.messages.maxLength]}
                  onValueChange={(value) => updateSettings('messages', 'maxLength', value[0])}
                  max={4096}
                  min={100}
                  step={100}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>100 caracteres</span>
                  <span className="font-medium">{settings.messages.maxLength} caracteres</span>
                  <span>4096 caracteres</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Delay entre Mensagens (ms)</Label>
              <div className="space-y-2">
                <Slider
                  value={[settings.messages.messageDelay]}
                  onValueChange={(value) => updateSettings('messages', 'messageDelay', value[0])}
                  max={10000}
                  min={0}
                  step={100}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0ms</span>
                  <span className="font-medium">{settings.messages.messageDelay}ms</span>
                  <span>10s</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tentativas de Reenvio</Label>
              <Select
                value={settings.messages.retryAttempts.toString()}
                onValueChange={(value) => updateSettings('messages', 'retryAttempts', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nenhuma</SelectItem>
                  <SelectItem value="1">1 tentativa</SelectItem>
                  <SelectItem value="2">2 tentativas</SelectItem>
                  <SelectItem value="3">3 tentativas</SelectItem>
                  <SelectItem value="5">5 tentativas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Tipos de Mídia Permitidos</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Imagens e Vídeos</Label>
                <Switch
                  checked={settings.messages.allowMedia}
                  onCheckedChange={(checked) => updateSettings('messages', 'allowMedia', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Documentos</Label>
                <Switch
                  checked={settings.messages.allowDocuments}
                  onCheckedChange={(checked) => updateSettings('messages', 'allowDocuments', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Áudios</Label>
                <Switch
                  checked={settings.messages.allowVoice}
                  onCheckedChange={(checked) => updateSettings('messages', 'allowVoice', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Stickers</Label>
                <Switch
                  checked={settings.messages.allowStickers}
                  onCheckedChange={(checked) => updateSettings('messages', 'allowStickers', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAutomationTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Mensagens Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
            <Textarea
              id="welcomeMessage"
              value={settings.automation.welcomeMessage}
              onChange={(e) => updateSettings('automation', 'welcomeMessage', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="awayMessage">Mensagem de Ausência</Label>
            <Textarea
              id="awayMessage"
              value={settings.automation.awayMessage}
              onChange={(e) => updateSettings('automation', 'awayMessage', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Horário Comercial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar Horário Comercial</Label>
              <p className="text-xs text-gray-500">Definir horários de funcionamento</p>
            </div>
            <Switch
              checked={settings.automation.businessHours.enabled}
              onCheckedChange={(checked) => updateNestedSettings('automation', 'businessHours', 'enabled', checked)}
            />
          </div>
          
          {settings.automation.businessHours.enabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={settings.automation.businessHours.start}
                    onChange={(e) => updateNestedSettings('automation', 'businessHours', 'start', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={settings.automation.businessHours.end}
                    onChange={(e) => updateNestedSettings('automation', 'businessHours', 'end', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Dias da Semana</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'monday', label: 'Segunda' },
                    { key: 'tuesday', label: 'Terça' },
                    { key: 'wednesday', label: 'Quarta' },
                    { key: 'thursday', label: 'Quinta' },
                    { key: 'friday', label: 'Sexta' },
                    { key: 'saturday', label: 'Sábado' },
                    { key: 'sunday', label: 'Domingo' }
                  ].map(day => (
                    <div key={day.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day.key}
                        checked={settings.automation.businessHours.days.includes(day.key)}
                        onChange={(e) => {
                          const days = e.target.checked
                            ? [...settings.automation.businessHours.days, day.key]
                            : settings.automation.businessHours.days.filter(d => d !== day.key);
                          updateNestedSettings('automation', 'businessHours', 'days', days);
                        }}
                      />
                      <Label htmlFor={day.key} className="text-sm">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderWebhookTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-orange-600" />
            Configurações de Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ativar Webhook</Label>
              <p className="text-xs text-gray-500">Integração via webhook</p>
            </div>
            <Switch
              checked={settings.webhook.enabled}
              onCheckedChange={(checked) => updateSettings('webhook', 'enabled', checked)}
            />
          </div>
          
          {settings.webhook.enabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL do Webhook</Label>
                <Input
                  id="webhookUrl"
                  value={settings.webhook.url}
                  onChange={(e) => updateSettings('webhook', 'url', e.target.value)}
                  placeholder="https://seu-site.com/webhook"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Secret (Opcional)</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={settings.webhook.secret}
                  onChange={(e) => updateSettings('webhook', 'secret', e.target.value)}
                  placeholder="Chave secreta para validação"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'message', label: 'Mensagens' },
                    { key: 'status', label: 'Status' },
                    { key: 'presence', label: 'Presença' },
                    { key: 'connection', label: 'Conexão' }
                  ].map(event => (
                    <div key={event.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={event.key}
                        checked={settings.webhook.events.includes(event.key)}
                        onChange={(e) => {
                          const events = e.target.checked
                            ? [...settings.webhook.events, event.key]
                            : settings.webhook.events.filter(ev => ev !== event.key);
                          updateSettings('webhook', 'events', events);
                        }}
                      />
                      <Label htmlFor={event.key} className="text-sm">{event.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tentativas de Reenvio</Label>
                  <Select
                    value={settings.webhook.retryAttempts.toString()}
                    onValueChange={(value) => updateSettings('webhook', 'retryAttempts', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Nenhuma</SelectItem>
                      <SelectItem value="1">1 tentativa</SelectItem>
                      <SelectItem value="2">2 tentativas</SelectItem>
                      <SelectItem value="3">3 tentativas</SelectItem>
                      <SelectItem value="5">5 tentativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Timeout (ms)</Label>
                  <Input
                    type="number"
                    value={settings.webhook.timeout}
                    onChange={(e) => updateSettings('webhook', 'timeout', parseInt(e.target.value))}
                    min="1000"
                    max="60000"
                    step="1000"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-600" />
            Configurações de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Criptografia</Label>
              <p className="text-xs text-gray-500">Criptografar dados sensíveis</p>
            </div>
            <Switch
              checked={settings.security.encryption}
              onCheckedChange={(checked) => updateSettings('security', 'encryption', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Logs de Auditoria</Label>
              <p className="text-xs text-gray-500">Registrar atividades</p>
            </div>
            <Switch
              checked={settings.security.logging}
              onCheckedChange={(checked) => updateSettings('security', 'logging', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Rate Limiting</Label>
              <p className="text-xs text-gray-500">Limitar taxa de requisições</p>
            </div>
            <Switch
              checked={settings.security.rateLimit.enabled}
              onCheckedChange={(checked) => updateNestedSettings('security', 'rateLimit', 'enabled', checked)}
            />
          </div>
          
          {settings.security.rateLimit.enabled && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máximo de Requisições</Label>
                  <Input
                    type="number"
                    value={settings.security.rateLimit.maxRequests}
                    onChange={(e) => updateNestedSettings('security', 'rateLimit', 'maxRequests', parseInt(e.target.value))}
                    min="1"
                    max="1000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Janela de Tempo (ms)</Label>
                  <Input
                    type="number"
                    value={settings.security.rateLimit.windowMs}
                    onChange={(e) => updateNestedSettings('security', 'rateLimit', 'windowMs', parseInt(e.target.value))}
                    min="1000"
                    max="3600000"
                    step="1000"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            Configurações - {instanceData.displayName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="automation">Automação</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="general">{renderGeneralTab()}</TabsContent>
            <TabsContent value="behavior">{renderBehaviorTab()}</TabsContent>
            <TabsContent value="messages">{renderMessagesTab()}</TabsContent>
            <TabsContent value="automation">{renderAutomationTab()}</TabsContent>
            <TabsContent value="webhook">{renderWebhookTab()}</TabsContent>
            <TabsContent value="security">{renderSecurityTab()}</TabsContent>
          </div>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Excluir Instância
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Resetar
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 