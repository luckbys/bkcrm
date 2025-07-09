import React, { useState, useEffect } from 'react';
import { 
  LoadingSpinner, 
  GlassLoadingSpinner, 
  ContextualLoadingSpinner, 
  PageLoadingSpinner, 
  ButtonLoadingSpinner, 
  ProgressLoadingSpinner, 
  CardSkeleton, 
  ListSkeleton, 
  TableSkeleton, 
  FormLoadingSpinner, 
  ConnectionLoadingSpinner, 
  LoadingOverlay, 
  AdaptiveLoadingSpinner 
} from './loading';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Smartphone, Wifi, MessageSquare, Users, Activity, AlertTriangle } from 'lucide-react';

// Simulação de dados do BKCRM
interface InstanceData {
  id: string;
  name: string;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  messages: number;
  uptime: string;
}

export const ImprovedLoadingDemo: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [instances, setInstances] = useState<InstanceData[]>([]);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [showPageLoading, setShowPageLoading] = useState(false);

  // Simular carregamento de dados
  const loadInstances = async () => {
    setIsLoading(true);
    
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setInstances([
      { id: '1', name: 'Atendimento Vendas', status: 'connected', messages: 142, uptime: '2h 15m' },
      { id: '2', name: 'Suporte Técnico', status: 'connecting', messages: 89, uptime: '45m' },
      { id: '3', name: 'Marketing', status: 'disconnected', messages: 203, uptime: '0m' },
      { id: '4', name: 'Administração', status: 'connected', messages: 67, uptime: '1h 30m' }
    ]);
    
    setIsLoading(false);
  };

  // Simular progresso de conexão
  const simulateConnection = () => {
    setConnectionProgress(0);
    const interval = setInterval(() => {
      setConnectionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  useEffect(() => {
    if (activeDemo === 'dashboard') {
      loadInstances();
    }
  }, [activeDemo]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-600" />;
      case 'connecting': return <LoadingSpinner size="sm" className="text-blue-600" />;
      case 'disconnected': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Smartphone className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-blue-500';
      case 'disconnected': return 'bg-red-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">BKCRM - Sistema de Loading Melhorado</h1>
          <p className="text-gray-600 text-lg">Demonstração dos novos componentes de loading modernos e elegantes</p>
        </div>

        {/* Navigation */}
        <Tabs value={activeDemo} onValueChange={setActiveDemo} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-white/20 backdrop-blur-lg border border-white/30 rounded-xl">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="connection">Conexão</TabsTrigger>
            <TabsTrigger value="forms">Formulários</TabsTrigger>
            <TabsTrigger value="loading-states">Estados</TabsTrigger>
            <TabsTrigger value="comparison">Antes/Depois</TabsTrigger>
          </TabsList>

          {/* Dashboard Demo */}
          <TabsContent value="dashboard" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Estatísticas */}
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Instâncias Ativas</p>
                      {isLoading ? (
                        <div className="w-8 h-8 bg-white/20 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">
                          {instances.filter(i => i.status === 'connected').length}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Wifi className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Mensagens/Hora</p>
                      {isLoading ? (
                        <div className="w-12 h-8 bg-white/20 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">1,247</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Usuários Online</p>
                      {isLoading ? (
                        <div className="w-10 h-8 bg-white/20 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-gray-900">34</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Performance</p>
                      {isLoading ? (
                        <div className="w-12 h-8 bg-white/20 rounded animate-pulse"></div>
                      ) : (
                        <p className="text-2xl font-bold text-green-600">98%</p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Instâncias */}
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Instâncias WhatsApp</span>
                  <Button onClick={loadInstances} size="sm">
                    {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    Atualizar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <ListSkeleton items={4} />
                ) : (
                  <div className="space-y-4">
                    {instances.map(instance => (
                      <div key={instance.id} className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Smartphone className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{instance.name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              {getStatusIcon(instance.status)}
                              <span>{instance.status}</span>
                              <span>•</span>
                              <span>{instance.messages} msgs</span>
                              <span>•</span>
                              <span>{instance.uptime}</span>
                            </div>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(instance.status)} text-white`}>
                          {instance.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connection Demo */}
          <TabsContent value="connection" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Conectando Instância WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConnectionLoadingSpinner step="Estabelecendo conexão segura..." />
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Aguarde enquanto estabelecemos uma conexão segura com o WhatsApp Business.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Progresso de Configuração</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgressLoadingSpinner 
                    progress={connectionProgress} 
                    message="Configurando webhooks e validando instância..." 
                  />
                  <Button onClick={simulateConnection} className="w-full mt-4">
                    Simular Conexão
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Processamento de Dados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ContextualLoadingSpinner type="whatsapp" message="Sincronizando contatos e histórico..." />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Carregamento Elegante</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <GlassLoadingSpinner size="lg" />
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-4">
                    Loading com efeito glassmorphism
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Forms Demo */}
          <TabsContent value="forms" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Salvando Configurações</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormLoadingSpinner message="Salvando configurações da instância..." />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Envio de Mensagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <LoadingOverlay isLoading={true} message="Enviando mensagem...">
                    <div className="p-6 bg-gray-50 rounded-lg h-32">
                      <p className="text-gray-600">Conteúdo do formulário...</p>
                    </div>
                  </LoadingOverlay>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Loading States Demo */}
          <TabsContent value="loading-states" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Minimal</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <LoadingSpinner size="lg" />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Glassmorphism</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <GlassLoadingSpinner size="md" />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Contextual</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <ContextualLoadingSpinner type="crm" message="Carregando..." />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Card Skeleton</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardSkeleton />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Table Skeleton</CardTitle>
                </CardHeader>
                <CardContent>
                  <TableSkeleton rows={3} columns={3} />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle>Adaptável</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <AdaptiveLoadingSpinner type="detailed" message="Processando..." />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison Demo */}
          <TabsContent value="comparison" className="space-y-6 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-red-600">❌ Antes (Loading Básico)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <p className="mt-2 text-gray-600">Carregando...</p>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Problemas do Loading Antigo</AlertTitle>
                    <AlertDescription>
                      • Aparência básica e sem personalidade<br/>
                      • Não segue o design system<br/>
                      • Sem feedback contextual<br/>
                      • Experiência inferior
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
                <CardHeader>
                  <CardTitle className="text-green-600">✅ Depois (Loading Moderno)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <GlassLoadingSpinner size="md" />
                  
                  <Alert className="bg-green-50 border-green-200">
                    <Activity className="h-4 w-4" />
                    <AlertTitle>Benefícios do Novo Sistema</AlertTitle>
                    <AlertDescription>
                      • Design glassmorphism elegante<br/>
                      • Feedback contextual inteligente<br/>
                      • Múltiplos tipos para cada situação<br/>
                      • Experiência premium
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
              <CardHeader>
                <CardTitle>Demonstração Interativa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-6">
                  <Button onClick={() => setShowPageLoading(true)}>
                    Ver Loading de Página Completa
                  </Button>
                  <Button onClick={loadInstances}>
                    Recarregar Dashboard
                  </Button>
                  <Button onClick={simulateConnection}>
                    Simular Conexão
                  </Button>
                </div>
                
                <div className="text-center text-gray-600">
                  <p>Use os botões acima para testar diferentes tipos de loading em ação.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Page Loading Overlay */}
      {showPageLoading && (
        <PageLoadingSpinner message="Carregando aplicação BKCRM..." />
      )}

      {/* Auto-hide page loading */}
      {showPageLoading && setTimeout(() => setShowPageLoading(false), 3000)}
    </div>
  );
};

export default ImprovedLoadingDemo; 