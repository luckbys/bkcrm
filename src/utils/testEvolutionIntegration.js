// Test Evolution API Integration
import { evolutionApi } from '@/services/evolutionApi';
import { API_CONFIG } from '@/config';
export class EvolutionIntegrationTester {
    constructor() {
        Object.defineProperty(this, "results", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
    }
    async runAllTests() {
        this.results = [];
        console.log('🧪 Iniciando testes de integração Evolution API...');
        await this.testWebhookConnection();
        await this.testEvolutionApiService();
        await this.testWebSocketConnection();
        await this.testInstanceStatus();
        console.log('✅ Testes de integração concluídos:', this.results);
        return this.results;
    }
    async testWebhookConnection() {
        try {
            const response = await fetch(`${API_CONFIG.WEBSOCKET_URL}/webhook/health`);
            const data = await response.json();
            if (response.ok && data.status === 'healthy') {
                this.addResult('webhook-health', 'success', 'Webhook server está rodando e saudável', data);
            }
            else {
                this.addResult('webhook-health', 'error', 'Webhook server retornou status inválido', data);
            }
        }
        catch (error) {
            this.addResult('webhook-health', 'error', `Falha na conexão webhook: ${error.message}`);
        }
    }
    async testEvolutionApiService() {
        try {
            const health = await evolutionApi.checkHealth();
            this.addResult('evolution-service', 'success', 'Serviço Evolution API funcionando', health);
        }
        catch (error) {
            this.addResult('evolution-service', 'error', `Erro no serviço Evolution: ${error.message}`);
        }
    }
    async testWebSocketConnection() {
        try {
            const response = await fetch(`${API_CONFIG.WEBSOCKET_URL}/webhook/ws-stats`);
            const data = await response.json();
            if (response.ok) {
                this.addResult('websocket-stats', 'success', 'WebSocket stats disponíveis', data);
            }
            else {
                this.addResult('websocket-stats', 'warning', 'WebSocket stats indisponíveis');
            }
        }
        catch (error) {
            this.addResult('websocket-stats', 'error', `Erro WebSocket stats: ${error.message}`);
        }
    }
    async testInstanceStatus() {
        try {
            const instances = await evolutionApi.fetchInstances();
            if (instances && instances.length > 0) {
                this.addResult('evolution-instances', 'success', `${instances.length} instância(s) encontrada(s)`, instances);
            }
            else {
                this.addResult('evolution-instances', 'warning', 'Nenhuma instância Evolution encontrada');
            }
        }
        catch (error) {
            this.addResult('evolution-instances', 'error', `Erro ao buscar instâncias: ${error.message}`);
        }
    }
    addResult(test, status, message, data) {
        this.results.push({ test, status, message, data });
    }
}
// Função global para teste rápido
export async function testEvolutionIntegration() {
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
    }
    else {
        console.log(`\n⚠️ Há ${errors.length} problema(s) que precisam ser resolvidos.`);
    }
}
// Disponibilizar globalmente para testes
if (typeof window !== 'undefined') {
    window.testEvolutionIntegration = testEvolutionIntegration;
    window.EvolutionIntegrationTester = EvolutionIntegrationTester;
}
