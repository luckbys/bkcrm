// Test Evolution API Integration
import { evolutionApi } from '@/services/evolutionApiService';
import { API_CONFIG } from '@/config';

export interface IntegrationTestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

export class EvolutionIntegrationTester {
  private results: IntegrationTestResult[] = [];

  async runAllTests(): Promise<IntegrationTestResult[]> {
    this.results = [];
    
    console.log('🧪 Iniciando testes de integração Evolution API...');
    
    await this.testWebhookConnection();
    await this.testEvolutionApiService();
    await this.testWebSocketConnection();
    await this.testInstanceStatus();
    
    console.log('✅ Testes de integração concluídos:', this.results);
    return this.results;
  }

  private async testWebhookConnection(): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.WEBSOCKET_URL}/webhook/health`);
      const data = await response.json();
      
      if (response.ok && data.status === 'healthy') {
        this.addResult('webhook-health', 'success', 'Webhook server está rodando e saudável', data);
      } else {
        this.addResult('webhook-health', 'error', 'Webhook server retornou status inválido', data);
      }
    } catch (error: any) {
      this.addResult('webhook-health', 'error', `Falha na conexão webhook: ${error.message}`);
    }
  }

  private async testEvolutionApiService(): Promise<void> {
    try {
      const health = await evolutionApi.checkHealth();
      this.addResult('evolution-service', 'success', 'Serviço Evolution API funcionando', health);
    } catch (error: any) {
      this.addResult('evolution-service', 'error', `Erro no serviço Evolution: ${error.message}`);
    }
  }

  private async testWebSocketConnection(): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.WEBSOCKET_URL}/webhook/ws-stats`);
      const data = await response.json();
      
      if (response.ok) {
        this.addResult('websocket-stats', 'success', 'WebSocket stats disponíveis', data);
      } else {
        this.addResult('websocket-stats', 'warning', 'WebSocket stats indisponíveis');
      }
    } catch (error: any) {
      this.addResult('websocket-stats', 'error', `Erro WebSocket stats: ${error.message}`);
    }
  }

  private async testInstanceStatus(): Promise<void> {
    try {
      const instances = await evolutionApi.fetchInstances();
      
      if (instances && instances.length > 0) {
        this.addResult('evolution-instances', 'success', `${instances.length} instância(s) encontrada(s)`, instances);
      } else {
        this.addResult('evolution-instances', 'warning', 'Nenhuma instância Evolution encontrada');
      }
    } catch (error: any) {
      this.addResult('evolution-instances', 'error', `Erro ao buscar instâncias: ${error.message}`);
    }
  }

  private addResult(test: string, status: 'success' | 'error' | 'warning', message: string, data?: any): void {
    this.results.push({ test, status, message, data });
  }
}

// Função global para teste rápido
export async function testEvolutionIntegration(): Promise<void> {
  const tester = new EvolutionIntegrationTester();
  const results = await tester.runAllTests();
  
  console.table(results.map(r => ({
    Teste: r.test,
    Status: r.status,
    Mensagem: r.message
  })));
  
  const errors = results.filter(r => r.status === 'error');
  const warnings = results.filter(r => r.status === 'warning');
  const successes = results.filter(r => r.status === 'success');
  
  console.log(`\n📊 Resumo dos Testes:`);
  console.log(`✅ Sucessos: ${successes.length}`);
  console.log(`⚠️ Avisos: ${warnings.length}`);
  console.log(`❌ Erros: ${errors.length}`);
  
  if (errors.length === 0) {
    console.log(`\n🎉 Integração Evolution API está funcionando corretamente!`);
  } else {
    console.log(`\n⚠️ Há ${errors.length} problema(s) que precisam ser resolvidos.`);
  }
}

// Disponibilizar globalmente para testes
if (typeof window !== 'undefined') {
  (window as any).testEvolutionIntegration = testEvolutionIntegration;
  (window as any).EvolutionIntegrationTester = EvolutionIntegrationTester;
} 