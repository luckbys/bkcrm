import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Webhook, 
  Copy, 
  Check, 
  AlertTriangle, 
  Zap, 
  TestTube,
  Loader2,
  CheckCircle2,
  XCircle,
  Shield,
  Bug
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebhookConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  departmentName: string;
  currentWebhook?: {
    url: string;
    enabled: boolean;
    events: string[];
  };
  onSave: (webhookData: {
    url: string;
    enabled: boolean;
    events: string[];
  }) => Promise<void>;
}

export const WebhookConfigModal = ({
  isOpen,
  onClose,
  instanceName,
  departmentName,
  currentWebhook,
  onSave
}: WebhookConfigModalProps) => {
  const { toast } = useToast();
  
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'MESSAGES_UPSERT',
    'CONNECTION_UPDATE'
  ]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean;
    message: string;
  }>({ isValid: true, message: '' });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [debugResult, setDebugResult] = useState<any>(null);

  const availableEvents = [
    {
      name: 'MESSAGES_UPSERT',
      label: 'Mensagens Recebidas/Enviadas',
      description: 'Dispara quando novas mensagens são recebidas ou enviadas',
      required: true
    },
    {
      name: 'MESSAGES_UPDATE',
      label: 'Mensagens Atualizadas',
      description: 'Dispara quando mensagens são atualizadas (lidas, editadas, etc.)',
      required: false
    },
    {
      name: 'CONNECTION_UPDATE',
      label: 'Status da Conexão',
      description: 'Dispara quando o status da conexão WhatsApp muda',
      required: true
    },
    {
      name: 'SEND_MESSAGE',
      label: 'Envio de Mensagens',
      description: 'Dispara confirmações de envio de mensagens',
      required: false
    },
    {
      name: 'QRCODE_UPDATED',
      label: 'QR Code Atualizado',
      description: 'Dispara quando o QR Code é atualizado',
      required: false
    },
    {
      name: 'CONTACTS_UPSERT',
      label: 'Contatos Atualizados',
      description: 'Dispara quando contatos são criados ou atualizados',
      required: false
    },
    {
      name: 'CHATS_UPSERT',
      label: 'Conversas Atualizadas',
      description: 'Dispara quando conversas são criadas ou atualizadas',
      required: false
    },
    {
      name: 'PRESENCE_UPDATE',
      label: 'Status de Presença',
      description: 'Dispara quando status online/offline é atualizado',
      required: false
    }
  ];

  useEffect(() => {
    if (isOpen) {
      if (currentWebhook) {
        setWebhookUrl(currentWebhook.url);
        setIsEnabled(currentWebhook.enabled);
        setSelectedEvents(currentWebhook.events);
      } else {
        const currentDomain = window.location.origin;
        const suggestedUrl = `${currentDomain}/api/webhooks/evolution`;
        setWebhookUrl(suggestedUrl);
      }
      setTestResult(null);
      setUrlValidation({ isValid: true, message: '' });
    }
  }, [isOpen, currentWebhook]);

  useEffect(() => {
    if (!webhookUrl) {
      setUrlValidation({ isValid: false, message: 'URL é obrigatória' });
      return;
    }

    try {
      const url = new URL(webhookUrl);
      
      if (url.protocol !== 'https:' && !url.hostname.includes('localhost')) {
        setUrlValidation({ 
          isValid: false, 
          message: 'URL deve usar HTTPS em produção' 
        });
        return;
      }

      setUrlValidation({ isValid: true, message: 'URL válida' });
    } catch (error) {
      setUrlValidation({ 
        isValid: false, 
        message: 'Formato de URL inválido' 
      });
    }
  }, [webhookUrl]);

  const toggleEvent = (eventName: string) => {
    const event = availableEvents.find(e => e.name === eventName);
    if (event?.required) return;

    setSelectedEvents(prev => 
      prev.includes(eventName)
        ? prev.filter(e => e !== eventName)
        : [...prev, eventName]
    );
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setIsUrlCopied(true);
      setTimeout(() => setIsUrlCopied(false), 2000);
      toast({
        title: "📋 URL copiada",
        description: "URL do webhook copiada para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "❌ Erro ao copiar",
        description: "Não foi possível copiar a URL",
        variant: "destructive"
      });
    }
  };

  const testWebhook = async () => {
    if (!urlValidation.isValid) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const testPayload = {
        event: 'TEST_CONNECTION',
        timestamp: new Date().toISOString(),
        instanceName: instanceName,
        data: {
          message: 'Teste de conectividade do webhook',
          status: 'success'
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Evolution-API-Webhook-Test'
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Conectividade OK (${response.status})`
        });
        toast({
          title: "✅ Teste bem-sucedido",
          description: "Webhook respondeu corretamente ao teste",
        });
      } else {
        setTestResult({
          success: false,
          message: `Erro HTTP ${response.status}`
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erro de conectividade'
      });
      toast({
        title: "⚠️ Teste falhou",
        description: "Verifique se a URL está correta e acessível",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const runAdvancedDebug = async () => {
    if (!urlValidation.isValid) return;
    
    setIsDebugging(true);
    setDebugResult(null);
    
    try {
      const evolutionWebhookService = await import('@/services/evolutionWebhookService');
      const result = await evolutionWebhookService.debugWebhookConfiguration(instanceName, webhookUrl);
      
      setDebugResult(result);
      
      if (result.success) {
        toast({
          title: "🔧 Debug completado",
          description: "Todas as verificações foram executadas. Veja o console para detalhes.",
        });
      } else {
        toast({
          title: "⚠️ Problema encontrado",
          description: result.error || "Verifique o console para mais detalhes",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro no debug avançado:', error);
      toast({
        title: "❌ Erro no debug",
        description: error.message || "Não foi possível executar o debug",
        variant: "destructive"
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const handleSave = async () => {
    if (!urlValidation.isValid || selectedEvents.length === 0) return;
    
    setIsSaving(true);
    
    try {
      // Validar eventos antes de salvar
      const evolutionWebhookService = await import('@/services/evolutionWebhookService');
      const eventValidation = evolutionWebhookService.validateEvents(selectedEvents);
      
      if (!eventValidation.valid) {
        toast({
          title: "⚠️ Eventos inválidos",
          description: `Eventos inválidos: ${eventValidation.invalidEvents.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      await onSave({
        url: webhookUrl,
        enabled: isEnabled,
        events: selectedEvents
      });
      
      toast({
        title: "✅ Webhook configurado",
        description: `Webhook salvo para a instância ${instanceName}`,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar webhook:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: error.message || "Não foi possível salvar a configuração",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Webhook className="w-6 h-6 mr-3 text-blue-600" />
            Configurar Webhook Evolution API
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure o webhook para receber eventos da instância <strong>{instanceName}</strong> do departamento <strong>{departmentName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="webhook-url" className="text-base font-semibold">
                URL do Webhook
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      disabled={!webhookUrl}
                      className="flex items-center gap-2"
                    >
                      {isUrlCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      {isUrlCopied ? 'Copiado!' : 'Copiar'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Copiar URL para área de transferência</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="relative">
              <Input
                id="webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://seu-dominio.com/api/webhooks/evolution"
                className={cn(
                  "pr-10",
                  !urlValidation.isValid && "border-red-300 focus:border-red-500"
                )}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {urlValidation.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            </div>
            
            {urlValidation.message && (
              <div className={cn(
                "text-sm flex items-center gap-2",
                urlValidation.isValid ? "text-green-600" : "text-red-600"
              )}>
                {urlValidation.isValid ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                {urlValidation.message}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={testWebhook}
                disabled={!urlValidation.isValid || isTesting}
                className="flex items-center gap-2"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                {isTesting ? 'Testando...' : 'Testar Conectividade'}
              </Button>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={runAdvancedDebug}
                      disabled={!urlValidation.isValid || isDebugging}
                      className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      {isDebugging ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bug className="w-4 h-4" />
                      )}
                      {isDebugging ? 'Debugando...' : 'Debug Avançado'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Executar diagnóstico completo da configuração</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {testResult && (
                <div className={cn(
                  "flex items-center gap-2 text-sm",
                  testResult.success ? "text-green-600" : "text-red-600"
                )}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {testResult.message}
                </div>
              )}
            </div>

            {debugResult && (
              <Card className={cn(
                "border-2 mt-4",
                debugResult.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
              )}>
                <CardHeader className="pb-2">
                  <CardTitle className={cn(
                    "text-sm flex items-center",
                    debugResult.success ? "text-green-800" : "text-red-800"
                  )}>
                    <Bug className="w-4 h-4 mr-2" />
                    Resultado do Debug Avançado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className={cn(
                        "flex items-center gap-2",
                        debugResult.details.instanceExists ? "text-green-700" : "text-red-700"
                      )}>
                        {debugResult.details.instanceExists ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Instância existe
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        debugResult.details.urlValid ? "text-green-700" : "text-red-700"
                      )}>
                        {debugResult.details.urlValid ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        URL válida
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className={cn(
                        "flex items-center gap-2",
                        debugResult.details.configurationResult?.success ? "text-green-700" : "text-red-700"
                      )}>
                        {debugResult.details.configurationResult?.success ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        Configuração OK
                      </div>
                      <div className={cn(
                        "flex items-center gap-2",
                        debugResult.details.newWebhookConfig?.enabled ? "text-green-700" : "text-orange-700"
                      )}>
                        {debugResult.details.newWebhookConfig?.enabled ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        Webhook ativo
                      </div>
                    </div>
                  </div>
                  {debugResult.error && (
                    <div className="p-2 bg-red-100 rounded text-xs text-red-800 mt-2">
                      <strong>Erro:</strong> {debugResult.error}
                    </div>
                  )}
                  <div className="text-xs text-gray-600 mt-2">
                    <strong>💡 Dica:</strong> Abra o console do navegador (F12) para ver logs detalhados de cada etapa.
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400"
              )} />
              <div>
                <Label htmlFor="webhook-enabled" className="font-medium cursor-pointer">
                  Webhook Ativo
                </Label>
                <p className="text-sm text-gray-600">
                  {isEnabled ? 'Recebendo eventos da Evolution API' : 'Webhook desabilitado'}
                </p>
              </div>
            </div>
            <Switch
              id="webhook-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-semibold">Eventos do Webhook</Label>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Selecione quais eventos devem ser enviados para o seu webhook
              </p>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Eventos validados pela Evolution API
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Os eventos listados abaixo são oficialmente suportados pela Evolution API v1.7+
                </p>
              </div>
            </div>
            
            <div className="grid gap-3">
              {availableEvents.map((event) => {
                const isSelected = selectedEvents.includes(event.name);
                const isRequired = event.required;
                
                return (
                  <Card
                    key={event.name}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-sm",
                      isSelected ? "border-blue-300 bg-blue-50" : "hover:border-gray-300",
                      isRequired && "border-amber-300 bg-amber-50"
                    )}
                    onClick={() => !isRequired && toggleEvent(event.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center",
                              isSelected 
                                ? "bg-blue-600 border-blue-600" 
                                : "border-gray-300",
                              isRequired && "bg-amber-500 border-amber-500"
                            )}>
                              {(isSelected || isRequired) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {event.label}
                                {isRequired && (
                                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                    Obrigatório
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {event.description}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Badge variant="default" className="text-xs">
                              Ativo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center text-amber-800">
                <Shield className="w-4 h-4 mr-2" />
                Dicas de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-amber-700 space-y-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Use sempre HTTPS em produção</li>
                <li>Implemente validação de origem nas requisições</li>
                <li>Configure rate limiting no seu endpoint</li>
                <li>Monitore logs de erro e tentativas suspeitas</li>
                <li>Use tokens de autenticação quando possível</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!urlValidation.isValid || selectedEvents.length === 0 || isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Salvar Webhook
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 