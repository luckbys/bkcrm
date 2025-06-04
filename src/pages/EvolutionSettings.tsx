import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Settings, Globe, Key } from 'lucide-react';
import { EvolutionInstanceManager } from '@/components/crm/EvolutionInstanceManager';
import { useToast } from '@/hooks/use-toast';

export const EvolutionSettings = () => {
  const { toast } = useToast();
  
  // Configurações do servidor Evolution API
  const [serverConfig, setServerConfig] = useState({
    serverUrl: 'https://evolution-api.exemplo.com',
    globalApiKey: 'sua-api-key-aqui',
    isConnected: false,
    version: '',
  });
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const testConnection = async () => {
    if (!serverConfig.serverUrl || !serverConfig.globalApiKey) {
      toast({
        title: 'Erro de configuração',
        description: 'Preencha a URL do servidor e a API Key',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingConnection(true);
    
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em um ambiente real, você faria:
      // const evolutionAPI = new EvolutionAPIService(serverConfig.serverUrl, serverConfig.globalApiKey);
      // const info = await evolutionAPI.getInfo();
      
      const mockInfo = {
        status: 200,
        message: 'Welcome to the Evolution API, it is working!',
        version: '1.7.4',
        swagger: `${serverConfig.serverUrl}/docs`,
        manager: `${serverConfig.serverUrl}/manager`,
        documentation: 'https://doc.evolution-api.com'
      };
      
      setServerConfig(prev => ({
        ...prev,
        isConnected: true,
        version: mockInfo.version
      }));
      
      setShowManager(true);
      
      toast({
        title: 'Conexão estabelecida',
        description: `Conectado ao Evolution API v${mockInfo.version}`,
      });
      
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      
      setServerConfig(prev => ({
        ...prev,
        isConnected: false,
        version: ''
      }));
      
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor Evolution API',
        variant: 'destructive',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações Evolution API</h1>
        <p className="text-gray-600 mt-2">
          Configure e gerencie instâncias do WhatsApp usando a Evolution API
        </p>
      </div>

      {/* Configuração do Servidor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configuração do Servidor</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da Conexão */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                serverConfig.isConnected 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {serverConfig.isConnected ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  Status: {serverConfig.isConnected ? 'Conectado' : 'Desconectado'}
                </p>
                {serverConfig.version && (
                  <p className="text-sm text-gray-600">
                    Evolution API v{serverConfig.version}
                  </p>
                )}
              </div>
            </div>
            <Badge 
              variant={serverConfig.isConnected ? 'default' : 'destructive'}
              className="ml-4"
            >
              {serverConfig.isConnected ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <Separator />

          {/* Formulário de Configuração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="server-url" className="flex items-center space-x-2">
                  <Globe className="w-4 h-4" />
                  <span>URL do Servidor</span>
                </Label>
                <Input
                  id="server-url"
                  value={serverConfig.serverUrl}
                  onChange={(e) => setServerConfig(prev => ({ 
                    ...prev, 
                    serverUrl: e.target.value,
                    isConnected: false 
                  }))}
                  placeholder="https://evolution-api.exemplo.com"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL base do seu servidor Evolution API
                </p>
              </div>

              <div>
                <Label htmlFor="api-key" className="flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>API Key Global</span>
                </Label>
                <Input
                  id="api-key"
                  type="password"
                  value={serverConfig.globalApiKey}
                  onChange={(e) => setServerConfig(prev => ({ 
                    ...prev, 
                    globalApiKey: e.target.value,
                    isConnected: false 
                  }))}
                  placeholder="sua-api-key-aqui"
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Chave de API global para autenticação
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">
                  Como obter as configurações
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>1. Acesse seu servidor Evolution API</li>
                  <li>2. Obtenha a URL base (ex: https://api.exemplo.com)</li>
                  <li>3. Configure uma API Key global no servidor</li>
                  <li>4. Teste a conexão antes de prosseguir</li>
                </ul>
              </div>

              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={testConnection}
                  disabled={isTestingConnection || !serverConfig.serverUrl || !serverConfig.globalApiKey}
                  className="w-full"
                >
                  {isTestingConnection ? 'Testando...' : 'Testar Conexão'}
                </Button>
                
                {serverConfig.isConnected && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowManager(!showManager)}
                    className="w-full"
                  >
                    {showManager ? 'Ocultar Gerenciador' : 'Mostrar Gerenciador'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerenciador de Instâncias */}
      {showManager && serverConfig.isConnected && (
        <EvolutionInstanceManager 
          serverUrl={serverConfig.serverUrl}
          globalApiKey={serverConfig.globalApiKey}
        />
      )}

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação e Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Documentação</h4>
              <p className="text-sm text-gray-600 mb-3">
                Acesse a documentação completa da Evolution API
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://doc.evolution-api.com', '_blank')}
              >
                Abrir Docs
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">GitHub</h4>
              <p className="text-sm text-gray-600 mb-3">
                Código fonte e issues no GitHub
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://github.com/EvolutionAPI/evolution-api', '_blank')}
              >
                Ver GitHub
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Comunidade</h4>
              <p className="text-sm text-gray-600 mb-3">
                Participe da comunidade no Discord
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://discord.gg/evolutionapi', '_blank')}
              >
                Discord
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status de Exemplo */}
      {!serverConfig.isConnected && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">
                  Configuração Necessária
                </p>
                <p className="text-sm text-amber-800">
                  Configure e teste a conexão com seu servidor Evolution API para começar a gerenciar instâncias do WhatsApp.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 