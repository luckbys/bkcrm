import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Smartphone,
  Settings,
  Shield,
  Zap,
  MessageSquare,
  Users,
  Bot,
  Headphones,
  Building,
  Globe,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WhatsAppCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (instanceData: any) => void;
  departmentId?: string;
  departmentName?: string;
}

interface InstanceTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
  settings: {
    autoReply: boolean;
    readReceipts: boolean;
    typing: boolean;
    groups: boolean;
    webhook: boolean;
  };
}

const templates: InstanceTemplate[] = [
  {
    id: 'commercial',
    name: 'Comercial',
    displayName: 'Atendimento Comercial',
    description: 'Ideal para vendas e prospecção de clientes',
    icon: <Headphones className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500',
    features: ['Respostas automáticas', 'Integração CRM', 'Relatórios de vendas', 'Horário comercial'],
    settings: {
      autoReply: true,
      readReceipts: true,
      typing: true,
      groups: false,
      webhook: true
    }
  },
  {
    id: 'support',
    name: 'Suporte',
    displayName: 'Suporte Técnico',
    description: 'Focado em atendimento e resolução de problemas',
    icon: <Shield className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    features: ['Sistema de tickets', 'Base de conhecimento', 'Escalação automática', 'SLA tracking'],
    settings: {
      autoReply: true,
      readReceipts: true,
      typing: false,
      groups: true,
      webhook: true
    }
  },
  {
    id: 'marketing',
    name: 'Marketing',
    displayName: 'Marketing Digital',
    description: 'Campanhas e comunicação em massa',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    features: ['Broadcast lists', 'Campanhas segmentadas', 'Analytics avançados', 'A/B testing'],
    settings: {
      autoReply: false,
      readReceipts: false,
      typing: false,
      groups: true,
      webhook: true
    }
  },
  {
    id: 'custom',
    name: 'Personalizada',
    displayName: 'Configuração Personalizada',
    description: 'Configure manualmente todas as opções',
    icon: <Settings className="w-6 h-6" />,
    color: 'from-gray-500 to-slate-500',
    features: ['Configuração manual', 'Controle total', 'Flexibilidade máxima', 'Sem limitações'],
    settings: {
      autoReply: false,
      readReceipts: true,
      typing: false,
      groups: false,
      webhook: false
    }
  }
];

const steps = [
  { id: 1, title: 'Template', description: 'Escolha um modelo' },
  { id: 2, title: 'Configuração', description: 'Defina as configurações' },
  { id: 3, title: 'Finalização', description: 'Revise e confirme' }
];

export const WhatsAppCreationWizard: React.FC<WhatsAppCreationWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  departmentId,
  departmentName
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<InstanceTemplate | null>(null);
  const [instanceData, setInstanceData] = useState({
    name: '',
    displayName: '',
    description: '',
    department: departmentName || '',
    settings: {
      autoReply: false,
      readReceipts: true,
      typing: false,
      groups: false,
      webhook: false
    },
    advanced: {
      maxConnections: 100,
      messageDelay: 1000,
      retryAttempts: 3,
      timezone: 'America/Sao_Paulo'
    }
  });

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTemplateSelect = (template: InstanceTemplate) => {
    setSelectedTemplate(template);
    setInstanceData(prev => ({
      ...prev,
      name: template.name.toLowerCase().replace(/\s+/g, '-'),
      displayName: template.displayName,
      description: template.description,
      settings: template.settings
    }));
  };

  const handleComplete = () => {
    if (!selectedTemplate || !instanceData.name || !instanceData.displayName) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    onComplete({
      ...instanceData,
      template: selectedTemplate.id,
      departmentId
    });

    toast({
      title: "Instância criada!",
      description: `A instância ${instanceData.displayName} foi criada com sucesso`,
    });

    onClose();
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                currentStep >= step.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {currentStep > step.id ? (
                <Check className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>
            <div className="ml-3 text-left">
              <div className={cn(
                "text-sm font-medium",
                currentStep >= step.id ? "text-blue-600" : "text-gray-500"
              )}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500">{step.description}</div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-16 mx-4 transition-all",
                currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Escolha um Template
        </h3>
        <p className="text-gray-600">
          Selecione o modelo que melhor se adequa ao seu caso de uso
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg",
              selectedTemplate?.id === template.id
                ? "ring-2 ring-blue-500 border-blue-200"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-r text-white",
                  template.color
                )}>
                  {template.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{template.displayName}</CardTitle>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
                {selectedTemplate?.id === template.id && (
                  <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">Recursos inclusos:</div>
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Configuração da Instância
        </h3>
        <p className="text-gray-600">
          Defina as configurações básicas e avançadas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              Configurações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Instância *</Label>
              <Input
                id="name"
                value={instanceData.name}
                onChange={(e) => setInstanceData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: comercial-vendas"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de Exibição *</Label>
              <Input
                id="displayName"
                value={instanceData.displayName}
                onChange={(e) => setInstanceData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="ex: Atendimento Comercial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={instanceData.description}
                onChange={(e) => setInstanceData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito desta instância..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Departamento</Label>
              <Input
                id="department"
                value={instanceData.department}
                onChange={(e) => setInstanceData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="Nome do departamento"
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Comportamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-600" />
              Comportamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Respostas Automáticas</Label>
                <p className="text-xs text-gray-500">Enviar mensagens automáticas</p>
              </div>
              <Switch
                checked={instanceData.settings.autoReply}
                onCheckedChange={(checked) => 
                  setInstanceData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, autoReply: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Confirmações de Leitura</Label>
                <p className="text-xs text-gray-500">Marcar mensagens como lidas</p>
              </div>
              <Switch
                checked={instanceData.settings.readReceipts}
                onCheckedChange={(checked) => 
                  setInstanceData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, readReceipts: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Indicador de Digitação</Label>
                <p className="text-xs text-gray-500">Mostrar "digitando..."</p>
              </div>
              <Switch
                checked={instanceData.settings.typing}
                onCheckedChange={(checked) => 
                  setInstanceData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, typing: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Suporte a Grupos</Label>
                <p className="text-xs text-gray-500">Permitir mensagens em grupos</p>
              </div>
              <Switch
                checked={instanceData.settings.groups}
                onCheckedChange={(checked) => 
                  setInstanceData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, groups: checked }
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Webhook Integração</Label>
                <p className="text-xs text-gray-500">Integração via webhook</p>
              </div>
              <Switch
                checked={instanceData.settings.webhook}
                onCheckedChange={(checked) => 
                  setInstanceData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, webhook: checked }
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Revisão e Confirmação
        </h3>
        <p className="text-gray-600">
          Revise as configurações antes de criar a instância
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo da Configuração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Resumo da Configuração
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Template Selecionado</Label>
              <p className="text-gray-900">{selectedTemplate?.displayName}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Nome da Instância</Label>
              <p className="text-gray-900">{instanceData.name}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Nome de Exibição</Label>
              <p className="text-gray-900">{instanceData.displayName}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Departamento</Label>
              <p className="text-gray-900">{instanceData.department || 'Não especificado'}</p>
            </div>

            {instanceData.description && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Descrição</Label>
                <p className="text-gray-900 text-sm">{instanceData.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configurações Ativas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-600" />
              Configurações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(instanceData.settings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <Badge variant={value ? "default" : "secondary"}>
                    {value ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aviso */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">Importante</h4>
              <p className="text-sm text-amber-700 mt-1">
                Após criar a instância, você precisará escanear o QR Code para conectar seu WhatsApp. 
                Certifique-se de ter seu celular em mãos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            Nova Instância WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {renderStepIndicator()}

          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 1 && !selectedTemplate}
                >
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Criar Instância
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 