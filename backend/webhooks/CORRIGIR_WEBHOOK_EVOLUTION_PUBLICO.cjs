/**
 * CORREÇÃO - WEBHOOK EVOLUTION API PÚBLICO
 * 
 * Corrige a configuração da Evolution API para usar o endpoint correto
 * que está funcionando localmente
 */

const axios = require('axios');

// Configurações
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL_LOCAL = 'http://localhost:4000/webhook/evolution';
const WEBHOOK_URL_PUBLICO = 'https://bkcrm.devsible.com.br/webhook/evolution';

console.log('🔧 CORRIGINDO CONFIGURAÇÃO WEBHOOK EVOLUTION API\n');

async function verificarStatusInstancias() {
  try {
    console.log('🔍 Verificando instâncias...');
    
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Instâncias encontradas:', response.data.length);
    
    for (const instance of response.data) {
      console.log(`📱 Instância: ${instance.instance.instanceName}`);
      console.log(`   Status: ${instance.instance.status}`);
      console.log(`   Webhook: ${instance.instance.webhook || 'Não configurado'}`);
    }
    
    return response.data;
    
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

async function executarCorrecao() {
  try {
    console.log('🚀 INICIANDO CORREÇÃO...\n');
    
    // 1. Verificar instâncias
    const instancias = await verificarStatusInstancias();
    
    if (instancias.length === 0) {
      console.log('❌ Nenhuma instância encontrada');
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 2. Testar webhooks
    const localOk = await testarWebhookLocal();
    const publicoOk = await testarWebhookPublico();
    
    console.log('\n' + '='.repeat(50));
    
    // 3. Decidir qual URL usar
    let webhookUrl;
    if (publicoOk) {
      webhookUrl = WEBHOOK_URL_PUBLICO;
      console.log('🌐 Usando webhook público (recomendado)');
    } else if (localOk) {
      webhookUrl = WEBHOOK_URL_LOCAL;
      console.log('🏠 Usando webhook local (apenas para testes)');
      console.log('⚠️ ATENÇÃO: Webhook local não funcionará em produção!');
    } else {
      console.log('❌ Nenhum webhook está funcionando!');
      console.log('\n🔧 SOLUÇÕES:');
      console.log('   1. Verifique se o servidor local está rodando: node webhook-evolution-complete.js');
      console.log('   2. Configure o webhook público no servidor de produção');
      return;
    }
    
    console.log('\n' + '='.repeat(50));
    
    // 4. Configurar todas as instâncias
    let sucessos = 0;
    for (const instanceData of instancias) {
      const instanceName = instanceData.instance.instanceName;
      const sucesso = await configurarWebhookInstancia(instanceName, webhookUrl);
      if (sucesso) sucessos++;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 CORREÇÃO CONCLUÍDA!`);
    console.log(`✅ ${sucessos}/${instancias.length} instâncias configuradas`);
    
    if (sucessos > 0) {
      console.log('\n💡 PRÓXIMOS PASSOS:');
      console.log('   1. Envie uma mensagem WhatsApp para testar');
      console.log('   2. Verifique os logs do webhook para confirmar recebimento');
      console.log('   3. Confirme se o ticket é criado automaticamente no CRM');
      
      if (webhookUrl === WEBHOOK_URL_LOCAL) {
        console.log('\n⚠️ IMPORTANTE:');
        console.log('   O webhook está configurado para localhost');
        console.log('   Isso só funciona para testes locais');
        console.log('   Para produção, configure o webhook público');
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERRO NA CORREÇÃO:', error);
  }
}

// Executar correção
executarCorrecao(); 