// Teste rápido para identificar problema na criação de instância WhatsApp
import { useWhatsAppInstances } from '../hooks/useWhatsAppInstances';

export async function testCreateInstanceQuick() {
  console.log('🚀 Teste rápido de criação de instância WhatsApp');
  console.log('================================================');
  
  try {
    // Simular chamada do hook
    const hook = useWhatsAppInstances();
    
    // Verificar se o hook carregou
    console.log('📊 Estado do hook:', {
      loading: hook.loading,
      error: hook.error,
      instancesCount: hook.instances.length
    });
    
    // Testar criação de instância
    console.log('\n🔧 Testando criação de instância...');
    
    const result = await hook.createInstance('comercial', {
      number: '5511999999999',
      webhook: 'https://webhook.bkcrm.devsible.com.br/webhook/evolution'
    });
    
    console.log('✅ Instância criada com sucesso:', result);
    
    return { success: true, data: result };
    
  } catch (error) {
    console.error('❌ Erro ao criar instância:', error);
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
    
    return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
}

// Função para verificar configurações primeiro
export function verifyWhatsAppConfig() {
  console.log('🔍 Verificando configurações WhatsApp...');
  console.log('========================================');
  
  const config = {
    evolutionUrl: import.meta.env.VITE_EVOLUTION_API_URL,
    evolutionKey: import.meta.env.VITE_EVOLUTION_API_KEY,
    globalKey: import.meta.env.VITE_EVOLUTION_GLOBAL_API_KEY,
    webhookUrl: import.meta.env.VITE_WEBHOOK_URL
  };
  
  console.log('Configurações:', config);
  
  // Verificar se as configurações estão corretas
  const issues = [];
  
  if (!config.evolutionUrl) {
    issues.push('❌ VITE_EVOLUTION_API_URL não configurada');
  } else {
    console.log('✅ URL Evolution API:', config.evolutionUrl);
  }
  
  if (!config.evolutionKey) {
    issues.push('❌ VITE_EVOLUTION_API_KEY não configurada');
  } else {
    console.log('✅ API Key Evolution:', config.evolutionKey?.slice(0, 10) + '...');
  }
  
  if (!config.webhookUrl) {
    issues.push('❌ VITE_WEBHOOK_URL não configurada');
  } else {
    console.log('✅ Webhook URL:', config.webhookUrl);
  }
  
  if (issues.length > 0) {
    console.log('\n🚨 Problemas encontrados:');
    issues.forEach(issue => console.log(issue));
    return false;
  }
  
  console.log('\n✅ Todas as configurações estão corretas!');
  return true;
}

// Teste final para criação de instância WhatsApp
export function testCreateInstanceFinal() {
  console.log('🚀 TESTE FINAL: Criação de Instância WhatsApp');
  console.log('===============================================');
  
  // 1. Verificar configurações atualizadas
  console.log('\n📋 1. Verificando configurações:');
  const config = {
    baseUrl: (window as any).env?.VITE_EVOLUTION_API_URL || 'https://webhook.bkcrm.devsible.com.br/api',
    apiKey: (window as any).env?.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11'
  };
  
  console.log('✅ Base URL:', config.baseUrl);
  console.log('✅ API Key:', config.apiKey ? '***' + config.apiKey.slice(-4) : 'AUSENTE');
  
  // 2. Testar payload correto
  console.log('\n📦 2. Payload corrigido:');
  const payload = {
    instanceName: `test_${Date.now()}`,
    token: config.apiKey,
    integration: 'WHATSAPP-BAILEYS', // 🔥 CORREÇÃO PRINCIPAL
    qrcode: true,
    number: '5511999999999',
    webhook: 'https://webhook.bkcrm.devsible.com.br/webhook/evolution',
    webhook_by_events: false,
    events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'CONNECTION_UPDATE'],
    reject_call: false,
    msg_call: '',
    groups_ignore: false,
    always_online: true,
    read_messages: true,
    read_status: false,
    sync_full_history: false
  };
  
  console.log('✅ Payload preparado:', payload);
  
  console.log('\n🎯 3. Próximos passos para testar:');
  console.log('   → Execute: debugWhatsAppInstanceCreation("comercial")');
  console.log('   → Ou clique no botão "Criar Instância WhatsApp" no modal');
  console.log('\n📝 4. Correções aplicadas:');
  console.log('   ✅ URL Evolution API corrigida');
  console.log('   ✅ Query Supabase count(*) corrigida');
  console.log('   ✅ Payload com "integration" obrigatório');
  console.log('   ✅ Eventos atualizados para v2');
  console.log('   ✅ Configurações window.env priorizadas');
  
  return payload;
}

// Adicionar funções globais
(window as any).testCreateInstanceQuick = testCreateInstanceQuick;
(window as any).verifyWhatsAppConfig = verifyWhatsAppConfig;
(window as any).testCreateInstanceFinal = testCreateInstanceFinal;

// Configurar helper
console.log(`
🧪 TESTE RÁPIDO WHATSAPP DISPONÍVEL
==================================

Para verificar configurações:
verifyWhatsAppConfig()

Para testar criação de instância:
testCreateInstanceQuick()

Para debug completo:
debugWhatsAppInstance('comercial', '5511999999999')
`); 