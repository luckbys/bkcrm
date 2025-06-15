/**
 * CORREÇÃO V2 - WEBHOOK EVOLUTION API PÚBLICO
 * 
 * Versão corrigida que lida com a estrutura correta da API
 */

const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL_LOCAL = 'http://localhost:4000/webhook/evolution';
const WEBHOOK_URL_PUBLICO = 'https://bkcrm.devsible.com.br/webhook/evolution';

console.log('🔧 CORRIGINDO CONFIGURAÇÃO WEBHOOK EVOLUTION API V2\n');

async function verificarStatusInstancias() {
  try {
    console.log('🔍 Verificando instâncias...');
    
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Resposta da API:', JSON.stringify(response.data, null, 2));
    
    let instancias = [];
    
    // Tentar diferentes estruturas de dados
    if (Array.isArray(response.data)) {
      instancias = response.data;
    } else if (response.data.instances && Array.isArray(response.data.instances)) {
      instancias = response.data.instances;
    } else if (response.data.data && Array.isArray(response.data.data)) {
      instancias = response.data.data;
    }
    
    console.log('✅ Instâncias encontradas:', instancias.length);
    
    for (const instance of instancias) {
      // Tentar diferentes estruturas para acessar os dados
      const instanceName = instance.instanceName || instance.instance?.instanceName || instance.name;
      const status = instance.status || instance.instance?.status || 'unknown';
      const webhook = instance.webhook || instance.instance?.webhook || 'Não configurado';
      
      console.log(`📱 Instância: ${instanceName}`);
      console.log(`   Status: ${status}`);
      console.log(`   Webhook: ${webhook}`);
    }
    
    return instancias;
    
  } catch (error) {
    console.error('❌ Erro ao verificar instâncias:', error.response?.data || error.message);
    return [];
  }
}

async function configurarWebhookInstancia(instanceName, webhookUrl) {
  try {
    console.log(`🔧 Configurando webhook para ${instanceName}...`);
    
    const webhookConfig = {
      webhook: {
        url: webhookUrl,
        events: [
          'MESSAGES_UPSERT',
          'MESSAGES_UPDATE', 
          'MESSAGES_DELETE',
          'SEND_MESSAGE',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED'
        ],
        webhook_by_events: false,
        webhook_base64: false
      }
    };
    
    const response = await axios.put(
      `${EVOLUTION_API_URL}/webhook/set/${instanceName}`,
      webhookConfig,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Webhook configurado para ${instanceName}:`, response.data);
    return true;
    
  } catch (error) {
    console.error(`❌ Erro ao configurar webhook para ${instanceName}:`, error.response?.data || error.message);
    return false;
  }
}

async function testarWebhookLocal() {
  try {
    console.log('🧪 Testando webhook local...');
    
    const response = await axios.get('http://localhost:4000/webhook/health');
    console.log('✅ Webhook local funcionando:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Webhook local não está funcionando:', error.message);
    return false;
  }
}

async function testarWebhookPublico() {
  try {
    console.log('🌐 Testando webhook público...');
    
    const response = await axios.get('https://bkcrm.devsible.com.br/webhook/health');
    console.log('✅ Webhook público funcionando:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Webhook público não está acessível:', error.message);
    return false;
  }
}

async function configurarWebhookManual() {
  try {
    console.log('🔧 Configuração manual para instância conhecida...');
    
    // Usar a instância que sabemos que existe
    const instanceName = 'atendimento-ao-cliente-sac1';
    
    // Testar qual webhook usar
    const localOk = await testarWebhookLocal();
    const publicoOk = await testarWebhookPublico();
    
    let webhookUrl;
    if (publicoOk) {
      webhookUrl = WEBHOOK_URL_PUBLICO;
      console.log('🌐 Usando webhook público');
    } else if (localOk) {
      webhookUrl = WEBHOOK_URL_LOCAL;
      console.log('🏠 Usando webhook local');
    } else {
      console.log('❌ Nenhum webhook funcionando!');
      return false;
    }
    
    const sucesso = await configurarWebhookInstancia(instanceName, webhookUrl);
    
    if (sucesso) {
      console.log('✅ Configuração manual bem-sucedida!');
      console.log('\n💡 TESTE AGORA:');
      console.log('   Envie uma mensagem WhatsApp para verificar se funciona');
    }
    
    return sucesso;
    
  } catch (error) {
    console.error('❌ Erro na configuração manual:', error);
    return false;
  }
}

async function executarCorrecao() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO V2...\n');
    
    // 1. Tentar verificar instâncias automaticamente
    const instancias = await verificarStatusInstancias();
    
    if (instancias.length === 0) {
      console.log('⚠️ Não foi possível obter instâncias automaticamente');
      console.log('🔧 Tentando configuração manual...\n');
      
      const sucesso = await configurarWebhookManual();
      
      if (sucesso) {
        console.log('\n🎉 CORREÇÃO MANUAL CONCLUÍDA!');
      } else {
        console.log('\n❌ Correção manual falhou');
      }
      
      return;
    }
    
    // 2. Configuração automática se conseguiu obter instâncias
    console.log('\n' + '='.repeat(50));
    
    const localOk = await testarWebhookLocal();
    const publicoOk = await testarWebhookPublico();
    
    let webhookUrl;
    if (publicoOk) {
      webhookUrl = WEBHOOK_URL_PUBLICO;
      console.log('🌐 Usando webhook público');
    } else if (localOk) {
      webhookUrl = WEBHOOK_URL_LOCAL;
      console.log('🏠 Usando webhook local');
    } else {
      console.log('❌ Nenhum webhook funcionando!');
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    
    let sucessos = 0;
    for (const instance of instancias) {
      const instanceName = instance.instanceName || instance.instance?.instanceName || instance.name;
      
      if (instanceName) {
        const sucesso = await configurarWebhookInstancia(instanceName, webhookUrl);
        if (sucesso) sucessos++;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 CORREÇÃO AUTOMÁTICA CONCLUÍDA!`);
    console.log(`✅ ${sucessos}/${instancias.length} instâncias configuradas`);
    
  } catch (error) {
    console.error('\n❌ ERRO NA CORREÇÃO:', error);
  }
}

// Executar correção
executarCorrecao(); 