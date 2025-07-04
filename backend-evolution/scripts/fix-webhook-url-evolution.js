#!/usr/bin/env node

// 🔧 CORREÇÃO DA URL DO WEBHOOK NA EVOLUTION API
// Execute: node backend/scripts/fix-webhook-url-evolution.js

import axios from 'axios';

// Configurações da Evolution API
const EVOLUTION_API_URL = 'https://evochat.devsible.com.br';
const API_KEY = 'AE69F672-751C-41DC-81E7-86BF5074208E';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte-n1';

// URLs corretas para webhook
const WEBHOOK_URLS = {
  development: 'http://localhost:4000/webhook/evolution',
  production: 'https://bkcrm.devsible.com.br/webhook/evolution'
};

async function fixWebhookConfiguration() {
  console.log('🔧 [WEBHOOK-FIX] Corrigindo configuração do webhook...');
  console.log('='.repeat(60));
  
  try {
    // 1. Verificar instância atual
    console.log('1️⃣ Verificando instância atual...');
    const instanceResponse = await axios.get(
      `${EVOLUTION_API_URL}/instance/fetchInstances`,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const instances = instanceResponse.data;
    const targetInstance = instances.find(inst => 
      inst.instance.instanceName === INSTANCE_NAME
    );
    
    if (!targetInstance) {
      console.log('❌ [WEBHOOK-FIX] Instância não encontrada:', INSTANCE_NAME);
      console.log('📋 [WEBHOOK-FIX] Instâncias disponíveis:');
      instances.forEach(inst => {
        console.log(`   - ${inst.instance.instanceName} (${inst.instance.status})`);
      });
      return;
    }
    
    console.log('✅ [WEBHOOK-FIX] Instância encontrada:', {
      name: targetInstance.instance.instanceName,
      status: targetInstance.instance.status,
      state: targetInstance.instance.connectionStatus?.state
    });
    
    // 2. Verificar webhook atual
    console.log('2️⃣ Verificando webhook atual...');
    try {
      const webhookResponse = await axios.get(
        `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
        {
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('📋 [WEBHOOK-FIX] Webhook atual:', {
        url: webhookResponse.data.webhook?.url,
        enabled: webhookResponse.data.webhook?.enabled,
        events: webhookResponse.data.webhook?.events
      });
    } catch (error) {
      console.log('⚠️ [WEBHOOK-FIX] Webhook não configurado ainda');
    }
    
    // 3. Configurar webhook correto
    console.log('3️⃣ Configurando webhook correto...');
    
    // Detectar ambiente
    const isProduction = process.env.NODE_ENV === 'production';
    const webhookUrl = isProduction ? WEBHOOK_URLS.production : WEBHOOK_URLS.development;
    
    console.log(`🌐 [WEBHOOK-FIX] Ambiente detectado: ${isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO'}`);
    console.log(`🔗 [WEBHOOK-FIX] URL do webhook: ${webhookUrl}`);
    
    const webhookConfig = {
      enabled: true,
      url: webhookUrl,
      events: [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED'
      ],
      webhook_by_events: false,
      webhook_base64: false
    };
    
    const setWebhookResponse = await axios.post(
      `${EVOLUTION_API_URL}/webhook/set/${INSTANCE_NAME}`,
      webhookConfig,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (setWebhookResponse.status === 200 || setWebhookResponse.status === 201) {
      console.log('✅ [WEBHOOK-FIX] Webhook configurado com sucesso!');
      console.log('📋 [WEBHOOK-FIX] Configuração aplicada:', webhookConfig);
    } else {
      console.log('❌ [WEBHOOK-FIX] Erro ao configurar webhook:', setWebhookResponse.data);
    }
    
    // 4. Verificar configuração final
    console.log('4️⃣ Verificando configuração final...');
    const finalWebhookResponse = await axios.get(
      `${EVOLUTION_API_URL}/webhook/find/${INSTANCE_NAME}`,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ [WEBHOOK-FIX] Configuração final:', {
      url: finalWebhookResponse.data.webhook?.url,
      enabled: finalWebhookResponse.data.webhook?.enabled,
      events: finalWebhookResponse.data.webhook?.events
    });
    
    // 5. Testar webhook
    console.log('5️⃣ Testando webhook...');
    try {
      const testResponse = await axios.post(webhookUrl, {
        event: 'TEST',
        instance: INSTANCE_NAME,
        data: {
          message: 'Teste de configuração do webhook',
          timestamp: new Date().toISOString()
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      if (testResponse.status === 200) {
        console.log('✅ [WEBHOOK-FIX] Teste do webhook bem-sucedido!');
      }
    } catch (testError) {
      console.log('⚠️ [WEBHOOK-FIX] Erro no teste do webhook:', testError.message);
      if (testError.code === 'ECONNREFUSED') {
        console.log('💡 [WEBHOOK-FIX] Certifique-se de que o servidor WebSocket está rodando na porta 4000');
      }
    }
    
    console.log('='.repeat(60));
    console.log('🎉 [WEBHOOK-FIX] Correção concluída!');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Verificar se servidor WebSocket está rodando (porta 4000)');
    console.log('2. Enviar mensagem de teste via WhatsApp');
    console.log('3. Verificar logs do servidor WebSocket');
    console.log('4. Confirmar se mensagens aparecem no CRM');
    
  } catch (error) {
    console.error('❌ [WEBHOOK-FIX] Erro na correção:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('🔑 [WEBHOOK-FIX] Erro de autenticação - verificar API key');
    } else if (error.response?.status === 404) {
      console.log('🔍 [WEBHOOK-FIX] Instância não encontrada - verificar nome');
    }
  }
}

// Função para listar todas as instâncias
async function listInstances() {
  try {
    const response = await axios.get(
      `${EVOLUTION_API_URL}/instance/fetchInstances`,
      {
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('📋 INSTÂNCIAS DISPONÍVEIS:');
    console.log('='.repeat(40));
    
    response.data.forEach(inst => {
      console.log(`📱 ${inst.instance.instanceName}`);
      console.log(`   Status: ${inst.instance.status}`);
      console.log(`   Estado: ${inst.instance.connectionStatus?.state || 'N/A'}`);
      console.log(`   Criado: ${inst.instance.createdAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Erro ao listar instâncias:', error.message);
  }
}

// Executar correção
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--list')) {
    listInstances();
  } else {
    fixWebhookConfiguration();
  }
}

export {
  fixWebhookConfiguration,
  listInstances
}; 