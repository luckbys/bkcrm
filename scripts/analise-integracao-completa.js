/**
 * 🔍 ANÁLISE COMPLETA DA INTEGRAÇÃO TICKET > WEBHOOK > WEBSOCKET
 * Diagnostica o estado atual e identifica melhorias necessárias
 */

const axios = require('axios');

// 🔧 CONFIGURAÇÕES
const LOCALHOST = 'http://localhost:4000';
const PRODUCTION = 'https://bkcrm.devsible.com.br';
const EVOLUTION_API = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_KEY = '429683C4C977415CAAFCCE10F7D57E11';

class IntegrationAnalyzer {
  constructor() {
    this.results = {
      webhook: { status: 'unknown', details: {} },
      websocket: { status: 'unknown', details: {} },
      evolution: { status: 'unknown', details: {} },
      integration: { status: 'unknown', details: {} },
      improvements: []
    };
  }

  async analyzeWebhook() {
    console.log('🔍 Analisando Webhook...');
    
    try {
      // Testar localhost
      const localResponse = await axios.get(`${LOCALHOST}/webhook/health`, { timeout: 5000 });
      this.results.webhook.status = 'active_local';
      this.results.webhook.details.local = localResponse.data;
      console.log('✅ Webhook LOCAL ativo na porta 4000');
    } catch (error) {
      console.log('❌ Webhook LOCAL não está rodando');
      this.results.webhook.details.localError = error.message;
    }

    try {
      // Testar produção
      const prodResponse = await axios.get(`${PRODUCTION}/webhook/health`, { timeout: 10000 });
      this.results.webhook.status = this.results.webhook.status === 'active_local' 
        ? 'active_both' 
        : 'active_production';
      this.results.webhook.details.production = prodResponse.data;
      console.log('✅ Webhook PRODUÇÃO ativo');
    } catch (error) {
      console.log('❌ Webhook PRODUÇÃO não acessível');
      this.results.webhook.details.productionError = error.message;
    }

    if (this.results.webhook.status === 'unknown') {
      this.results.webhook.status = 'inactive';
      this.results.improvements.push({
        priority: 'HIGH',
        issue: 'Webhook não está ativo',
        solution: 'Executar: node webhook-evolution-websocket.js'
      });
    }
  }

  async analyzeWebSocket() {
    console.log('🔍 Analisando WebSocket...');
    
    // Verificar se WebSocket está configurado no webhook
    if (this.results.webhook.details.local?.websocket || this.results.webhook.details.production?.websocket) {
      this.results.websocket.status = 'integrated';
      const wsData = this.results.webhook.details.local?.websocket || this.results.webhook.details.production?.websocket;
      this.results.websocket.details = wsData;
      
      console.log(`✅ WebSocket integrado - ${wsData.connections} conexões ativas`);
      
      if (wsData.connections === 0) {
        this.results.improvements.push({
          priority: 'MEDIUM',
          issue: 'Nenhuma conexão WebSocket ativa',
          solution: 'Frontend precisa se conectar ao WebSocket'
        });
      }
    } else {
      this.results.websocket.status = 'not_integrated';
      this.results.improvements.push({
        priority: 'HIGH',
        issue: 'WebSocket não está integrado ao webhook',
        solution: 'Usar webhook-evolution-websocket.js com Socket.IO'
      });
    }
  }

  async analyzeEvolutionAPI() {
    console.log('🔍 Analisando Evolution API...');
    
    try {
      const response = await axios.get(`${EVOLUTION_API}/instance/fetchInstances`, {
        headers: { 'apikey': EVOLUTION_KEY },
        timeout: 10000
      });
      
      this.results.evolution.status = 'connected';
      this.results.evolution.details = {
        totalInstances: response.data.length,
        instances: response.data.map(instance => ({
          name: instance.instance.instanceName,
          state: instance.instance.state,
          serverUrl: instance.instance.serverUrl
        }))
      };
      
      console.log(`✅ Evolution API conectada - ${response.data.length} instâncias`);
      
      // Verificar instâncias ativas
      const activeInstances = response.data.filter(i => i.instance.state === 'open');
      if (activeInstances.length === 0) {
        this.results.improvements.push({
          priority: 'HIGH',
          issue: 'Nenhuma instância WhatsApp conectada',
          solution: 'Conectar pelo menos uma instância no painel Evolution API'
        });
      }
      
    } catch (error) {
      this.results.evolution.status = 'error';
      this.results.evolution.details.error = error.message;
      console.log('❌ Evolution API inacessível:', error.message);
      
      this.results.improvements.push({
        priority: 'CRITICAL',
        issue: 'Evolution API não acessível',
        solution: 'Verificar credenciais e URL da Evolution API'
      });
    }
  }

  async analyzeIntegration() {
    console.log('🔍 Analisando Integração Completa...');
    
    const { webhook, websocket, evolution } = this.results;
    
    // Critérios para integração funcional
    const webhookOk = webhook.status.includes('active');
    const websocketOk = websocket.status === 'integrated';
    const evolutionOk = evolution.status === 'connected';
    
    if (webhookOk && websocketOk && evolutionOk) {
      this.results.integration.status = 'fully_functional';
      console.log('✅ Integração TOTALMENTE FUNCIONAL');
      
      // Verificar melhorias de performance
      this.checkPerformanceImprovements();
    } else if (webhookOk && websocketOk) {
      this.results.integration.status = 'partial_functional';
      console.log('⚠️ Integração PARCIALMENTE FUNCIONAL (sem Evolution API)');
    } else if (webhookOk) {
      this.results.integration.status = 'webhook_only';
      console.log('⚠️ Apenas WEBHOOK funcionando');
    } else {
      this.results.integration.status = 'broken';
      console.log('❌ Integração QUEBRADA');
    }
  }

  checkPerformanceImprovements() {
    // Rate limiting
    this.results.improvements.push({
      priority: 'LOW',
      issue: 'Rate limiting pode ser otimizado',
      solution: 'Implementar rate limiting inteligente com burst tokens'
    });
    
    // Cache de mensagens
    this.results.improvements.push({
      priority: 'MEDIUM',
      issue: 'Cache de mensagens pode ser melhorado',
      solution: 'Implementar Redis para cache distribuído'
    });
    
    // Monitoramento
    this.results.improvements.push({
      priority: 'LOW',
      issue: 'Falta monitoramento avançado',
      solution: 'Adicionar métricas Prometheus + Grafana'
    });
  }

  generateReport() {
    console.log('\n🎯 RELATÓRIO DE ANÁLISE DA INTEGRAÇÃO');
    console.log('='*50);
    
    console.log('\n📊 STATUS DOS COMPONENTES:');
    console.log(`   Webhook: ${this.getStatusEmoji(this.results.webhook.status)} ${this.results.webhook.status}`);
    console.log(`   WebSocket: ${this.getStatusEmoji(this.results.websocket.status)} ${this.results.websocket.status}`);
    console.log(`   Evolution API: ${this.getStatusEmoji(this.results.evolution.status)} ${this.results.evolution.status}`);
    console.log(`   Integração: ${this.getStatusEmoji(this.results.integration.status)} ${this.results.integration.status}`);
    
    if (this.results.improvements.length > 0) {
      console.log('\n🔧 MELHORIAS RECOMENDADAS:');
      this.results.improvements.forEach((improvement, index) => {
        const priorityEmoji = {
          'CRITICAL': '🚨',
          'HIGH': '🔴',
          'MEDIUM': '🟡',
          'LOW': '🟢'
        }[improvement.priority];
        
        console.log(`${index + 1}. ${priorityEmoji} [${improvement.priority}] ${improvement.issue}`);
        console.log(`   💡 Solução: ${improvement.solution}\n`);
      });
    }
    
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    if (this.results.integration.status === 'fully_functional') {
      console.log('✅ Sistema funcionando perfeitamente!');
      console.log('   Foque nas melhorias de performance listadas acima.');
    } else {
      console.log('❌ Sistema precisa de correções urgentes:');
      const criticalIssues = this.results.improvements.filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGH');
      criticalIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.solution}`);
      });
    }
  }

  getStatusEmoji(status) {
    const emojis = {
      'fully_functional': '✅',
      'active_both': '✅',
      'active_local': '🟡',
      'active_production': '🟡',
      'integrated': '✅',
      'connected': '✅',
      'partial_functional': '⚠️',
      'webhook_only': '⚠️',
      'not_integrated': '❌',
      'error': '❌',
      'broken': '❌',
      'inactive': '❌',
      'unknown': '❓'
    };
    return emojis[status] || '❓';
  }

  async run() {
    console.log('🚀 INICIANDO ANÁLISE COMPLETA DA INTEGRAÇÃO...\n');
    
    try {
      await this.analyzeWebhook();
      await this.analyzeWebSocket();
      await this.analyzeEvolutionAPI();
      await this.analyzeIntegration();
      
      this.generateReport();
      
      // Salvar resultados em arquivo
      const fs = require('fs');
      fs.writeFileSync(
        'analise-integracao-resultado.json',
        JSON.stringify(this.results, null, 2)
      );
      console.log('\n💾 Resultados salvos em: analise-integracao-resultado.json');
      
    } catch (error) {
      console.error('❌ Erro durante análise:', error);
    }
  }
}

// 🚀 EXECUTAR ANÁLISE
if (require.main === module) {
  const analyzer = new IntegrationAnalyzer();
  analyzer.run();
}

module.exports = IntegrationAnalyzer;