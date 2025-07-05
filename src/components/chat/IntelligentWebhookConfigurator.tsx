import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  setInstanceWebhook, 
  getInstanceWebhook, 
  removeInstanceWebhook,
  testInstanceWebhook,
  validateWebhookUrl,
  generateSuggestedWebhookUrl,
  getValidEvolutionEvents,
  getEventDescription,
  getRecommendedEvents
} from '@/services/evolutionWebhookService';
import { 
  Webhook, 
  Globe, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Settings, 
  TestTube, 
  Copy, 
  ExternalLink,
  Zap,
  RefreshCw,
  Shield,
  Info,
  Target,
  Code,
  Play,
  Pause,
  Save,
  Trash2,
  Lightbulb,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebhookConfig {
  url: string;
  enabled: boolean;
  events: string[];
  headers?: Record<string, string>;
  retryAttempts?: number;
  timeout?: number;
}

interface WebhookValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface WebhookTest {
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  details?: any;
}

interface IntelligentWebhookConfiguratorProps {
  instanceName: string;
  onConfigUpdated?: (config: WebhookConfig) => void;
  onClose?: () => void;
}

export const IntelligentWebhookConfigurator: React.FC<IntelligentWebhookConfiguratorProps> = ({
  instanceName,
  onConfigUpdated,
  onClose
}) => {
  const { toast } = useToast();
  
  // Estados principais
  const [config, setConfig] = useState<WebhookConfig>({
    url: '',
    enabled: true,
    events: getRecommendedEvents(),
    headers: {},
    retryAttempts: 3,
    timeout: 30000
  });
  
  const [originalConfig, setOriginalConfig] = useState<WebhookConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validation, setValidation] = useState<WebhookValidation>({
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: []
  });
  const [testResult, setTestResult] = useState<WebhookTest | null>(null);
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('basic');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showEventDescriptions, setShowEventDescriptions] = useState(false);
  const [showTestResults, setShowTestResults] = useState(false);

  // Carregar configuração existente
  useEffect(() => {
    loadExistingConfig();
  }, [instanceName]);

  // Validar configuração em tempo real
  useEffect(() => {
    validateConfiguration();
  }, [config]);

  const loadExistingConfig = async () => {
    try {
      setIsLoading(true);
      console.log(`🔧 [Webhook] Carregando configuração para: ${instanceName}`);
      
      const result = await getInstanceWebhook(instanceName);
      
      if (result.success && result.webhook) {
        const existingConfig: WebhookConfig = {
          url: result.webhook.url,
          enabled: result.webhook.enabled,
          events: result.webhook.events || getRecommendedEvents(),
          headers: {},
          retryAttempts: 3,
          timeout: 30000
        };
        
        setConfig(existingConfig);
        setOriginalConfig(existingConfig);
        
        console.log('✅ [Webhook] Configuração carregada:', existingConfig);
      } else {
        // Não existe configuração, usar sugestões
        const suggestedUrl = generateSuggestedWebhookUrl();
        setConfig(prev => ({ ...prev, url: suggestedUrl }));
        
        console.log('💡 [Webhook] URL sugerida:', suggestedUrl);
      }
      
    } catch (error: any) {
      console.error('❌ [Webhook] Erro ao carregar configuração:', error);
      
      toast({
        title: "Erro ao Carregar Configuração",
        description: "Usando configuração padrão",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateConfiguration = () => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar URL
    if (!config.url.trim()) {
      errors.push('URL do webhook é obrigatória');
    } else {
      const urlValidation = validateWebhookUrl(config.url);
      if (!urlValidation.valid) {
        errors.push(urlValidation.error || 'URL inválida');
      }
    }

    // Validar eventos
    if (config.events.length === 0) {
      warnings.push('Nenhum evento selecionado - webhook não receberá notificações');
    } else if (config.events.length > 10) {
      warnings.push('Muitos eventos selecionados - pode impactar performance');
    }

    // Sugestões inteligentes
    if (config.url.includes('localhost') || config.url.includes('127.0.0.1')) {
      suggestions.push('URLs localhost não funcionam em produção. Use ngrok ou um domínio público.');
    }

    if (!config.url.startsWith('https://') && process.env.NODE_ENV === 'production') {
      suggestions.push('Use HTTPS para maior segurança em produção');
    }

    if (!config.events.includes('MESSAGES_UPSERT')) {
      suggestions.push('Evento MESSAGES_UPSERT é essencial para receber mensagens');
    }

    if (!config.events.includes('CONNECTION_UPDATE')) {
      suggestions.push('Evento CONNECTION_UPDATE é importante para monitorar status de conexão');
    }

    const validation: WebhookValidation = {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };

    setValidation(validation);
  };

  const testWebhook = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      
      console.log(`🧪 [Webhook] Testando webhook: ${config.url}`);
      
      const startTime = Date.now();
      const result = await testInstanceWebhook(instanceName);
      const responseTime = Date.now() - startTime;
      
      const testResult: WebhookTest = {
        success: result.success,
        responseTime,
        statusCode: result.success ? 200 : 400,
        error: result.error,
        details: result
      };
      
      setTestResult(testResult);
      setShowTestResults(true);
      
      toast({
        title: testResult.success ? "Teste Bem-sucedido" : "Teste Falhou",
        description: testResult.success 
          ? `Webhook respondeu em ${responseTime}ms`
          : testResult.error || "Erro desconhecido",
        variant: testResult.success ? "default" : "destructive"
      });
      
    } catch (error: any) {
      console.error('❌ [Webhook] Erro no teste:', error);
      
      const testResult: WebhookTest = {
        success: false,
        responseTime: 0,
        error: error.message,
        details: error
      };
      
      setTestResult(testResult);
      setShowTestResults(true);
      
      toast({
        title: "Erro no Teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfiguration = async () => {
    if (!validation.isValid) {
      toast({
        title: "Configuração Inválida",
        description: "Corrija os erros antes de salvar",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      console.log(`💾 [Webhook] Salvando configuração:`, config);
      
      const result = await setInstanceWebhook(instanceName, {
        url: config.url,
        enabled: config.enabled,
        events: config.events
      });
      
      if (result.success) {
        setOriginalConfig({ ...config });
        
        toast({
          title: "Configuração Salva",
          description: "Webhook configurado com sucesso",
        });
        
        onConfigUpdated?.(config);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error: any) {
      console.error('❌ [Webhook] Erro ao salvar:', error);
      
      toast({
        title: "Erro ao Salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeConfiguration = async () => {
    if (!confirm('Tem certeza que deseja remover a configuração do webhook?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await removeInstanceWebhook(instanceName);
      
      if (result.success) {
        setConfig({
          url: generateSuggestedWebhookUrl(),
          enabled: true,
          events: getRecommendedEvents(),
          headers: {},
          retryAttempts: 3,
          timeout: 30000
        });
        setOriginalConfig(null);
        
        toast({
          title: "Configuração Removida",
          description: "Webhook foi desconfigurado",
        });
        
        onConfigUpdated?.(config);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
      
    } catch (error: any) {
      console.error('❌ [Webhook] Erro ao remover:', error);
      
      toast({
        title: "Erro ao Remover",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateUrl = () => {
    const suggested = generateSuggestedWebhookUrl();
    setConfig(prev => ({ ...prev, url: suggested }));
    
    toast({
      title: "URL Gerada",
      description: "URL de webhook sugerida foi aplicada",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "Texto copiado para a área de transferência",
    });
  };

  const selectAllEvents = () => {
    setConfig(prev => ({ ...prev, events: getValidEvolutionEvents() }));
  };

  const selectRecommendedEvents = () => {
    setConfig(prev => ({ ...prev, events: getRecommendedEvents() }));
  };

  const clearAllEvents = () => {
    setConfig(prev => ({ ...prev, events: [] }));
  };

  const toggleEvent = (event: string) => {
    setConfig(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event]
    }));
  };

  const hasChanges = originalConfig ? 
    JSON.stringify(config) !== JSON.stringify(originalConfig) : 
    true;

  const validEvents = getValidEvolutionEvents();
  const recommendedEvents = getRecommendedEvents();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Webhook className="w-6 h-6 text-blue-600" />
            Configurador de Webhook Inteligente
          </h2>
          <p className="text-gray-600">
            Configuração automatizada para <strong>{instanceName}</strong>
          </p>
        </div>
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>

      {/* Status de Validação */}
      {!validation.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validation.errors.map((error, index) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validation.warnings.length > 0 && (
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            <div className="space-y-1">
              <strong>Avisos:</strong>
              {validation.warnings.map((warning, index) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {validation.suggestions.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="w-4 h-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-1">
              <strong className="text-blue-800">Sugestões:</strong>
              {validation.suggestions.map((suggestion, index) => (
                <div key={index} className="text-blue-700">• {suggestion}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de Configuração */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuração Básica
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Configuração Básica */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                URL do Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL de Destino</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhookUrl"
                    value={config.url}
                    onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://seu-dominio.com/webhook/evolution"
                    className={cn(
                      validation.errors.some(e => e.includes('URL')) && "border-red-500"
                    )}
                  />
                  <Button 
                    variant="outline" 
                    onClick={generateUrl}
                    title="Gerar URL sugerida"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => copyToClipboard(config.url)}
                    title="Copiar URL"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  URL onde os eventos do WhatsApp serão enviados
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="webhookEnabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: !!checked }))}
                />
                <Label htmlFor="webhookEnabled">Webhook ativo</Label>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={testWebhook}
                  disabled={!validation.isValid || isTesting}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isTesting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  {isTesting ? 'Testando...' : 'Testar Webhook'}
                </Button>

                {testResult && (
                  <Button
                    variant="outline"
                    onClick={() => setShowTestResults(!showTestResults)}
                    className="flex items-center gap-2"
                  >
                    {showTestResults ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {testResult.success ? 'Teste OK' : 'Teste Falhou'}
                  </Button>
                )}
              </div>

              {/* Resultados do Teste */}
              {showTestResults && testResult && (
                <Card className={cn(
                  "border-2",
                  testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={cn(
                        "font-medium",
                        testResult.success ? "text-green-800" : "text-red-800"
                      )}>
                        {testResult.success ? 'Teste Bem-sucedido' : 'Teste Falhou'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tempo de Resposta:</span>
                        <span className="ml-2">{testResult.responseTime}ms</span>
                      </div>
                      {testResult.statusCode && (
                        <div>
                          <span className="font-medium">Status Code:</span>
                          <span className="ml-2">{testResult.statusCode}</span>
                        </div>
                      )}
                    </div>
                    
                    {testResult.error && (
                      <div className="mt-2 text-sm text-red-700">
                        <strong>Erro:</strong> {testResult.error}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eventos */}
        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Seleção de Eventos
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEventDescriptions(!showEventDescriptions)}
                  >
                    {showEventDescriptions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Descrições
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectRecommendedEvents}
                  className="flex items-center gap-1"
                >
                  <Target className="w-3 h-3" />
                  Recomendados ({recommendedEvents.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={selectAllEvents}
                  className="flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Todos ({validEvents.length})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllEvents}
                  className="flex items-center gap-1"
                >
                  <XCircle className="w-3 h-3" />
                  Limpar
                </Button>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                Selecionados: {config.events.length} de {validEvents.length} eventos
                <Progress 
                  value={(config.events.length / validEvents.length) * 100} 
                  className="h-2 mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {validEvents.map((event) => {
                  const isSelected = config.events.includes(event);
                  const isRecommended = recommendedEvents.includes(event);
                  
                  return (
                    <div 
                      key={event} 
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors",
                        isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      )}
                      onClick={() => toggleEvent(event)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleEvent(event)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-medium",
                            isSelected && "text-blue-800"
                          )}>
                            {event}
                          </span>
                          {isRecommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        {showEventDescriptions && (
                          <p className="text-xs text-gray-600 mt-1">
                            {getEventDescription(event)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Avançadas */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configurações Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
                  <Select
                    value={config.retryAttempts?.toString()}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, retryAttempts: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 tentativa</SelectItem>
                      <SelectItem value="2">2 tentativas</SelectItem>
                      <SelectItem value="3">3 tentativas</SelectItem>
                      <SelectItem value="5">5 tentativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Select
                    value={config.timeout?.toString()}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, timeout: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10000">10 segundos</SelectItem>
                      <SelectItem value="30000">30 segundos</SelectItem>
                      <SelectItem value="60000">60 segundos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Headers Personalizados (JSON)</Label>
                <Textarea
                  value={JSON.stringify(config.headers || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const headers = JSON.parse(e.target.value);
                      setConfig(prev => ({ ...prev, headers }));
                    } catch (error) {
                      // Ignorar erro durante digitação
                    }
                  }}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  className="font-mono text-sm"
                  rows={4}
                />
                <p className="text-sm text-gray-600">
                  Headers HTTP que serão enviados com cada webhook
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex gap-2">
          {originalConfig && (
            <Button
              variant="destructive"
              onClick={removeConfiguration}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Remover Configuração
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadExistingConfig}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Recarregar
          </Button>
          
          <Button
            onClick={saveConfiguration}
            disabled={!validation.isValid || !hasChanges || isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </div>
      </div>
    </div>
  );
};