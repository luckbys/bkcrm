import React, { useState, useEffect } from 'react';
import { 
  LoadingSpinner, 
  GlassLoadingSpinner, 
  ContextualLoadingSpinner, 
  ConnectionLoadingSpinner, 
  ProgressLoadingSpinner,
  FormLoadingSpinner,
  LoadingOverlay,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  ButtonLoadingSpinner
} from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

// === EXEMPLO 1: DASHBOARD PRINCIPAL ===
export const DashboardWithModernLoading: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setStats({
        activeInstances: 5,
        totalMessages: 1247,
        onlineUsers: 34,
        systemHealth: 98
      });
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
        <CardContent className="p-6">
          <div className="text-2xl font-bold text-gray-900">{stats.activeInstances}</div>
          <p className="text-gray-600">Instâncias Ativas</p>
        </CardContent>
      </Card>
      {/* Outros cards... */}
    </div>
  );
};

// === EXEMPLO 2: CONEXÃO WHATSAPP ===
export const WhatsAppConnectionWithLoading: React.FC = () => {
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'qr-code' | 'connected' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [connectionStep, setConnectionStep] = useState('');

  const handleConnect = async () => {
    setConnectionState('connecting');
    setConnectionStep('Iniciando conexão...');
    setProgress(0);

    // Simular etapas de conexão
    const steps = [
      { step: 'Validando credenciais...', progress: 20 },
      { step: 'Estabelecendo conexão segura...', progress: 40 },
      { step: 'Configurando webhooks...', progress: 60 },
      { step: 'Verificando instância...', progress: 80 },
      { step: 'Finalizando configuração...', progress: 100 }
    ];

    for (const { step, progress: stepProgress } of steps) {
      setConnectionStep(step);
      setProgress(stepProgress);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setConnectionState('connected');
    toast({
      title: "Conectado com sucesso!",
      description: "Instância WhatsApp está online e funcionando.",
    });
  };

  const renderConnectionState = () => {
    switch (connectionState) {
      case 'connecting':
        return (
          <div className="space-y-6">
            <ConnectionLoadingSpinner step={connectionStep} />
            <ProgressLoadingSpinner progress={progress} message={connectionStep} />
          </div>
        );
      
      case 'connected':
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Conectado com Sucesso!</h3>
            <p className="text-gray-600">Sua instância WhatsApp está online e funcionando.</p>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8">
            <Button onClick={handleConnect} size="lg">
              Conectar WhatsApp
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
      <CardHeader>
        <CardTitle>Conexão WhatsApp Business</CardTitle>
      </CardHeader>
      <CardContent>
        {renderConnectionState()}
      </CardContent>
    </Card>
  );
};

// === EXEMPLO 3: LISTA DE INSTÂNCIAS ===
export const InstanceListWithLoading: React.FC = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInstances = async () => {
    setLoading(true);
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setInstances([
      { id: '1', name: 'Vendas', status: 'connected', messages: 142 },
      { id: '2', name: 'Suporte', status: 'connecting', messages: 89 },
      { id: '3', name: 'Marketing', status: 'disconnected', messages: 203 }
    ]);
    setLoading(false);
  };

  const refreshInstances = async () => {
    setRefreshing(true);
    await loadInstances();
    setRefreshing(false);
  };

  useEffect(() => {
    loadInstances();
  }, []);

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Instâncias WhatsApp</CardTitle>
          <Button onClick={refreshInstances} disabled={refreshing || loading} size="sm">
            {refreshing ? <LoadingSpinner size="sm" className="mr-2" /> : null}
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <ListSkeleton items={3} />
        ) : (
          <div className="space-y-3">
            {instances.map(instance => (
              <div key={instance.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{instance.name[0]}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{instance.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      {instance.status === 'connecting' && (
                        <LoadingSpinner size="sm" className="text-blue-600" />
                      )}
                      <span>{instance.status}</span>
                      <span>•</span>
                      <span>{instance.messages} msgs</span>
                    </div>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  instance.status === 'connected' ? 'bg-green-500' :
                  instance.status === 'connecting' ? 'bg-blue-500' :
                  'bg-red-500'
                }`} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// === EXEMPLO 4: FORMULÁRIO DE CONFIGURAÇÃO ===
export const ConfigFormWithLoading: React.FC = () => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    instanceName: '',
    webhook: '',
    token: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setSaving(false);
    toast({
      title: "Configurações salvas!",
      description: "As configurações foram salvas com sucesso.",
    });
  };

  if (saving) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
        <CardContent className="p-8">
          <FormLoadingSpinner message="Salvando configurações da instância..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
      <CardHeader>
        <CardTitle>Configurar Instância</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Instância
            </label>
            <input
              type="text"
              value={formData.instanceName}
              onChange={(e) => setFormData({...formData, instanceName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.webhook}
              onChange={(e) => setFormData({...formData, webhook: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token de Acesso
            </label>
            <input
              type="password"
              value={formData.token}
              onChange={(e) => setFormData({...formData, token: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? <ButtonLoadingSpinner /> : 'Salvar Configurações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// === EXEMPLO 5: MODAL COM OVERLAY ===
export const ModalWithLoadingOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    setProcessing(true);
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 3000));
    setProcessing(false);
    setIsOpen(false);
    
    toast({
      title: "Processamento concluído!",
      description: "Os dados foram processados com sucesso.",
    });
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Modal com Loading
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <LoadingOverlay isLoading={processing} message="Processando dados...">
              <h2 className="text-xl font-semibold mb-4">Processar Dados</h2>
              <p className="text-gray-600 mb-6">
                Este processo irá sincronizar todos os dados da instância com o servidor.
              </p>
              <div className="flex space-x-3">
                <Button onClick={handleProcess} disabled={processing}>
                  Iniciar Processamento
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)} disabled={processing}>
                  Cancelar
                </Button>
              </div>
            </LoadingOverlay>
          </div>
        </div>
      )}
    </>
  );
};

// === EXEMPLO 6: TABELA DE MENSAGENS ===
export const MessagesTableWithLoading: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de mensagens
    setTimeout(() => {
      setMessages([
        { id: '1', from: 'Cliente A', content: 'Olá, preciso de ajuda...', time: '10:30' },
        { id: '2', from: 'Cliente B', content: 'Quando será entregue?', time: '10:25' },
        { id: '3', from: 'Cliente C', content: 'Obrigado pelo atendimento!', time: '10:20' }
      ]);
      setLoading(false);
    }, 1800);
  }, []);

  if (loading) {
    return <TableSkeleton rows={5} columns={4} />;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
      <CardHeader>
        <CardTitle>Mensagens Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">De</th>
                <th className="text-left py-3 px-4">Mensagem</th>
                <th className="text-left py-3 px-4">Hora</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {messages.map(message => (
                <tr key={message.id} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{message.from}</td>
                  <td className="py-3 px-4 text-gray-600">{message.content}</td>
                  <td className="py-3 px-4 text-gray-500">{message.time}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Entregue
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// === EXEMPLO 7: BUSCA COM LOADING ===
export const SearchWithLoading: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    
    // Simular busca
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setResults([
      { id: '1', name: 'Instância Vendas', type: 'instance' },
      { id: '2', name: 'Cliente João Silva', type: 'contact' },
      { id: '3', name: 'Mensagem: Pedido #123', type: 'message' }
    ]);
    
    setSearching(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300); // Debounce

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
      <CardHeader>
        <CardTitle>Busca Global</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar instâncias, contatos, mensagens..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LoadingSpinner size="sm" />
            </div>
          )}
        </div>
        
        <div className="mt-4">
          {searching ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-2 animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map(result => (
                <div key={result.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">
                      {result.type[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{result.name}</div>
                    <div className="text-sm text-gray-500">{result.type}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <p className="text-gray-500 text-center py-4">Nenhum resultado encontrado</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

// === EXEMPLO COMPLETO: DASHBOARD PRINCIPAL ===
export const CompleteLoadingExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">BKCRM - Loadings Modernos</h1>
          <p className="text-gray-600">Exemplos práticos dos novos componentes de loading</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <DashboardWithModernLoading />
          <WhatsAppConnectionWithLoading />
          <InstanceListWithLoading />
          <ConfigFormWithLoading />
          <MessagesTableWithLoading />
          <SearchWithLoading />
        </div>

        <ModalWithLoadingOverlay />
      </div>
    </div>
  );
};

export default CompleteLoadingExample; 