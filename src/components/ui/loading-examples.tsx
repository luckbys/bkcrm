import React, { useState } from 'react';
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

// Exemplos de uso dos componentes de loading
export const LoadingExamples: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);

  // Simular progresso
  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const simulateOverlay = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 2000);
  };

  return (
    <div className="space-y-8 p-8">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sistema de Loading BKCRM</h1>
        <p className="text-gray-600">Componentes de loading modernos e elegantes</p>
      </div>

      {/* Spinners Básicos */}
      <Card>
        <CardHeader>
          <CardTitle>Spinners Básicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <LoadingSpinner size="sm" />
              <p className="mt-2 text-sm text-gray-600">Pequeno</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" />
              <p className="mt-2 text-sm text-gray-600">Médio</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-sm text-gray-600">Grande</p>
            </div>
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="mt-2 text-sm text-gray-600">Extra Grande</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spinners Glassmorphism */}
      <Card>
        <CardHeader>
          <CardTitle>Spinners Glassmorphism</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <GlassLoadingSpinner size="sm" />
              <p className="mt-2 text-sm text-gray-600">Pequeno</p>
            </div>
            <div className="text-center">
              <GlassLoadingSpinner size="md" />
              <p className="mt-2 text-sm text-gray-600">Médio</p>
            </div>
            <div className="text-center">
              <GlassLoadingSpinner size="lg" />
              <p className="mt-2 text-sm text-gray-600">Grande</p>
            </div>
            <div className="text-center">
              <GlassLoadingSpinner size="xl" />
              <p className="mt-2 text-sm text-gray-600">Extra Grande</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spinners Contextuais */}
      <Card>
        <CardHeader>
          <CardTitle>Spinners Contextuais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ContextualLoadingSpinner type="whatsapp" message="Conectando WhatsApp..." />
            <ContextualLoadingSpinner type="crm" message="Carregando dados do CRM..." />
            <ContextualLoadingSpinner type="chat" message="Processando mensagens..." />
            <ContextualLoadingSpinner type="users" message="Carregando usuários..." />
            <ContextualLoadingSpinner type="activity" message="Sincronizando atividades..." />
            <ContextualLoadingSpinner type="server" message="Conectando ao servidor..." />
          </div>
        </CardContent>
      </Card>

      {/* Loading com Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Loading com Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <ProgressLoadingSpinner progress={progress} message="Processando dados..." />
            <Button onClick={simulateProgress}>Simular Progresso</Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading para Formulários */}
      <Card>
        <CardHeader>
          <CardTitle>Loading para Formulários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <FormLoadingSpinner message="Salvando dados..." />
            <p className="text-sm text-gray-600">Ideal para formulários e envios</p>
          </div>
        </CardContent>
      </Card>

      {/* Loading para Conexão */}
      <Card>
        <CardHeader>
          <CardTitle>Loading para Conexão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <ConnectionLoadingSpinner step="Estabelecendo conexão segura..." />
            <p className="text-sm text-gray-600">Específico para conexões WhatsApp</p>
          </div>
        </CardContent>
      </Card>

      {/* Skeletons */}
      <Card>
        <CardHeader>
          <CardTitle>Skeletons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Card Skeleton</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">List Skeleton</h4>
              <ListSkeleton items={5} />
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Table Skeleton</h4>
              <TableSkeleton rows={4} columns={5} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Overlay</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingOverlay isLoading={showOverlay} message="Carregando conteúdo...">
            <div className="p-8 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conteúdo Principal</h3>
              <p className="text-gray-600 mb-4">
                Este é o conteúdo que será coberto pelo overlay quando o loading estiver ativo.
              </p>
              <p className="text-gray-600 mb-4">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                incididunt ut labore et dolore magna aliqua.
              </p>
              <Button onClick={simulateOverlay}>Mostrar Overlay</Button>
            </div>
          </LoadingOverlay>
        </CardContent>
      </Card>

      {/* Loading Adaptável */}
      <Card>
        <CardHeader>
          <CardTitle>Loading Adaptável</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <AdaptiveLoadingSpinner type="minimal" size="md" />
              <p className="mt-2 text-sm text-gray-600">Minimal</p>
            </div>
            <div className="text-center">
              <AdaptiveLoadingSpinner type="standard" size="md" message="Carregando..." />
              <p className="mt-2 text-sm text-gray-600">Standard</p>
            </div>
            <div className="text-center">
              <AdaptiveLoadingSpinner type="glassmorphism" size="md" />
              <p className="mt-2 text-sm text-gray-600">Glassmorphism</p>
            </div>
            <div className="text-center">
              <AdaptiveLoadingSpinner type="detailed" size="md" message="Processando..." />
              <p className="mt-2 text-sm text-gray-600">Detailed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões com Loading */}
      <Card>
        <CardHeader>
          <CardTitle>Botões com Loading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button disabled>
              <ButtonLoadingSpinner />
            </Button>
            <Button disabled>
              <LoadingSpinner size="sm" className="mr-2" />
              Salvando...
            </Button>
            <Button disabled>
              <LoadingSpinner size="sm" className="mr-2" />
              Conectando...
            </Button>
            <Button onClick={simulateLoading} disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processando...
                </>
              ) : (
                'Simular Loading'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demonstração de Página Completa */}
      <Card>
        <CardHeader>
          <CardTitle>Loading de Página Completa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Clique no botão abaixo para ver o loading de página completa em ação.
            </p>
            <Button 
              onClick={() => {
                // Simular loading de página completa
                const overlay = document.createElement('div');
                overlay.innerHTML = `
                  <div class="fixed inset-0 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center z-50">
                    <div class="text-center">
                      <div class="relative mb-8">
                        <div class="w-32 h-32 bg-white/20 backdrop-blur-lg border border-white/30 rounded-3xl flex items-center justify-center shadow-2xl">
                          <div class="relative">
                            <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse opacity-30"></div>
                            <svg class="w-12 h-12 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <div class="w-36 h-36 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                        <div class="absolute inset-0 flex items-center justify-center">
                          <div class="w-44 h-44 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin" style="animation-delay: 0.3s"></div>
                        </div>
                      </div>
                      <h2 class="text-2xl font-bold text-gray-900 mb-2">BKCRM</h2>
                      <p class="text-gray-600 text-lg">Carregando aplicação...</p>
                      <div class="flex justify-center space-x-1 mt-4">
                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        <div class="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                      </div>
                    </div>
                  </div>
                `;
                document.body.appendChild(overlay);
                
                setTimeout(() => {
                  document.body.removeChild(overlay);
                }, 3000);
              }}
            >
              Mostrar Loading de Página Completa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingExamples; 