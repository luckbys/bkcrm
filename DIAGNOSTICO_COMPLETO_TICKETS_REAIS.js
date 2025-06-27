#!/usr/bin/env node

/**
 * 🔍 DIAGNÓSTICO COMPLETO - TICKETS REAIS NÃO CHEGAM NO CRM
 * 
 * Este script verifica todos os pontos críticos do sistema:
 * 1. Webhook Evolution API funcionando
 * 2. Configuração da Evolution API
 * 3. Banco de dados acessível
 * 4. Frontend carregando tickets
 * 5. Filtros e permissões
 * 6. WebSocket funcionando
 */

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// ====== CONFIGURAÇÕES ======
const EVOLUTION_API_URL = 'https://press-evolution-api.jhkbgs.easypanel.host';
const EVOLUTION_API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const WEBHOOK_URL = 'https://websocket.bkcrm.devsible.com.br';
const WEBHOOK_LOCAL = 'http://localhost:4000';
const FRONTEND_URL = 'https://bkcrm.devsible.com.br';

// Credenciais Supabase
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTU0MzE2NiwiZXhwIjoyMDY1MTE5MTY2fQ.dfIdvOZijcwmRW-6yAchp0CVPIytCKMAjezJxz5YXCU';
const supabase = createClient(supabaseUrl, supabaseKey);

// ====== FUNÇÕES DE DIAGNÓSTICO ======

/**
 * 1. TESTE WEBHOOK LOCAL
 */
async function testeWebhookLocal() {
  console.log('\n📡 1. TESTE WEBHOOK LOCAL');
  console.log('=' * 50);
  
  try {
    const response = await axios.get(`${WEBHOOK_LOCAL}/webhook/health`, { timeout: 5000 });
    console.log('✅ Webhook local FUNCIONANDO:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Webhook local NÃO FUNCIONANDO');
    console.log('💡 Solução: Execute "node webhook-evolution-websocket.js"');
    return false;
  }
}

/**
 * 2. TESTE WEBHOOK PRODUÇÃO
 */
async function testeWebhookProducao() {
  console.log('\n📡 2. TESTE WEBHOOK PRODUÇÃO');
  console.log('=' * 50);
  
  try {
    const response = await axios.get(`${WEBHOOK_URL}/webhook/health`, { timeout: 10000 });
    console.log('✅ Webhook produção FUNCIONANDO:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Webhook produção NÃO FUNCIONANDO:', error.message);
    console.log('💡 Solução: Verificar deploy do webhook no EasyPanel');
    return false;
  }
}

/**
 * 3. TESTE EVOLUTION API
 */
async function testeEvolutionAPI() {
  console.log('\n🔗 3. TESTE EVOLUTION API');
  console.log('=' * 50);
  
  try {
    // Listar instâncias
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_API_KEY },
      timeout: 10000
    });
    
    console.log('✅ Evolution API FUNCIONANDO');
    console.log(`📊 Total de instâncias: ${response.data.length}`);
    
    const instances = response.data;
    instances.forEach(instance => {
      console.log(`📱 Instância: ${instance.name} | Status: ${instance.connectionStatus}`);
    });
    
    return { success: true, instances };
  } catch (error) {
    console.log('❌ Evolution API NÃO FUNCIONANDO:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 4. TESTE BANCO DE DADOS
 */
async function testeBancoDados() {
  console.log('\n💾 4. TESTE BANCO DE DADOS');
  console.log('=' * 50);
  
  try {
    // Testar conexão
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
      
    if (profilesError) throw profilesError;
    
    console.log('✅ Conexão Supabase FUNCIONANDO');
    
    // Verificar tickets recentes
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('id, title, created_at, channel, metadata')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (ticketsError) throw ticketsError;
    
    console.log(`📊 Total de tickets recentes: ${tickets.length}`);
    
    tickets.forEach(ticket => {
      const isWhatsapp = ticket.channel === 'whatsapp' || ticket.metadata?.created_from_whatsapp;
      console.log(`🎫 ${ticket.id.substring(0,8)}... | ${ticket.title} | ${ticket.channel} ${isWhatsapp ? '📱' : ''}`);
    });
    
    // Verificar tickets WhatsApp especificamente
    const { data: whatsappTickets, error: whatsappError } = await supabase
      .from('tickets')
      .select('id, title, created_at, metadata')
      .or('channel.eq.whatsapp,metadata->>created_from_whatsapp.eq.true')
      .order('created_at', { ascending: false })
      .limit(5);
      
    if (whatsappError) throw whatsappError;
    
    console.log(`📱 Tickets WhatsApp recentes: ${whatsappTickets.length}`);
    
    return { success: true, totalTickets: tickets.length, whatsappTickets: whatsappTickets.length };
  } catch (error) {
    console.log('❌ Banco de dados com PROBLEMA:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 5. VERIFICAR CONFIGURAÇÃO WEBHOOK NA EVOLUTION API
 */
async function verificarConfigWebhook() {
  console.log('\n⚙️ 5. VERIFICAR CONFIGURAÇÃO WEBHOOK');
  console.log('=' * 50);
  
  try {
    const response = await axios.get(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      headers: { 'apikey': EVOLUTION_API_KEY }
    });
    
    const instances = response.data;
    
    for (const instance of instances) {
      console.log(`\n📱 Verificando instância: ${instance.name}`);
      
      try {
        const webhookResponse = await axios.get(`${EVOLUTION_API_URL}/webhook/find/${instance.name}`, {
          headers: { 'apikey': EVOLUTION_API_KEY }
        });
        
        const webhookConfig = webhookResponse.data;
        
        if (webhookConfig && webhookConfig.url) {
          console.log(`  ✅ Webhook configurado: ${webhookConfig.url}`);
          console.log(`  📊 Enabled: ${webhookConfig.enabled}`);
          console.log(`  🎯 Events: ${webhookConfig.events?.join(', ') || 'N/A'}`);
          
          // Verificar se é nossa URL
          const isOurWebhook = webhookConfig.url.includes('websocket.bkcrm.devsible.com.br') || 
                               webhookConfig.url.includes('localhost:4000');
          
          if (!isOurWebhook) {
            console.log(`  ⚠️  URL DIFERENTE! Esperado: ${WEBHOOK_URL}`);
          }
        } else {
          console.log(`  ❌ Webhook NÃO configurado para ${instance.name}`);
        }
      } catch (webhookError) {
        console.log(`  ❌ Erro ao verificar webhook: ${webhookError.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erro ao verificar configuração webhook:', error.message);
    return false;
  }
}

/**
 * 6. SIMULAR RECEBIMENTO DE MENSAGEM
 */
async function simularMensagemWhatsApp() {
  console.log('\n🧪 6. SIMULAR RECEBIMENTO DE MENSAGEM');
  console.log('=' * 50);
  
  const webhookUrl = await testeWebhookLocal() ? WEBHOOK_LOCAL : WEBHOOK_URL;
  
  const payloadTeste = {
    event: 'MESSAGES_UPSERT',
    instance: 'teste-diagnostico',
    data: {
      key: {
        remoteJid: '5511999887766@s.whatsapp.net',
        fromMe: false,
        id: `TESTE_DIAGNOSTICO_${Date.now()}`
      },
      message: {
        conversation: `[TESTE DIAGNÓSTICO] Mensagem de teste - ${new Date().toLocaleString()}`
      },
      messageTimestamp: Math.floor(Date.now() / 1000),
      pushName: 'Cliente Teste Diagnóstico'
    }
  };
  
  try {
    console.log('📤 Enviando mensagem de teste para webhook...');
    
    const response = await axios.post(`${webhookUrl}/webhook/evolution`, payloadTeste, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('✅ Webhook PROCESSOU mensagem de teste');
    console.log('📊 Resposta:', {
      processed: response.data.processed,
      ticketId: response.data.ticketId,
      message: response.data.message
    });
    
    if (response.data.ticketId) {
      console.log(`🎫 TICKET CRIADO: ${response.data.ticketId}`);
      
      // Verificar se ticket apareceu no banco
      setTimeout(async () => {
        try {
          const { data: createdTicket } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', response.data.ticketId)
            .single();
            
          if (createdTicket) {
            console.log('✅ Ticket CONFIRMADO no banco de dados');
          } else {
            console.log('❌ Ticket NÃO encontrado no banco de dados');
          }
        } catch (error) {
          console.log('❌ Erro ao verificar ticket no banco:', error.message);
        }
      }, 2000);
    }
    
    return true;
  } catch (error) {
    console.log('❌ Erro ao simular mensagem:', error.message);
    if (error.response) {
      console.log('📄 Detalhes do erro:', error.response.data);
    }
    return false;
  }
}

/**
 * 7. TESTAR FRONTEND
 */
async function testarFrontend() {
  console.log('\n🌐 7. TESTE FRONTEND');
  console.log('=' * 50);
  
  try {
    const response = await axios.get(FRONTEND_URL, { timeout: 10000 });
    console.log('✅ Frontend ACESSÍVEL');
    
    // Verificar se tem JavaScript
    if (response.data.includes('window.')) {
      console.log('✅ JavaScript carregado');
    } else {
      console.log('⚠️ JavaScript pode não estar carregando');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Frontend com PROBLEMA:', error.message);
    return false;
  }
}

/**
 * EXECUÇÃO PRINCIPAL
 */
async function executarDiagnosticoCompleto() {
  console.log('🚀 DIAGNÓSTICO COMPLETO - TICKETS REAIS NÃO CHEGAM NO CRM');
  console.log('================================================================');
  
  const resultados = {
    webhookLocal: await testeWebhookLocal(),
    webhookProducao: await testeWebhookProducao(),
    evolutionAPI: await testeEvolutionAPI(),
    bancoDados: await testeBancoDados(),
    configWebhook: await verificarConfigWebhook(),
    simulacaoMensagem: await simularMensagemWhatsApp(),
    frontend: await testarFrontend()
  };
  
  console.log('\n📊 RESUMO DO DIAGNÓSTICO');
  console.log('========================');
  
  Object.entries(resultados).forEach(([teste, resultado]) => {
    const status = resultado ? '✅' : '❌';
    console.log(`${status} ${teste}: ${resultado ? 'OK' : 'PROBLEMA'}`);
  });
  
  console.log('\n💡 PRÓXIMOS PASSOS:');
  
  if (!resultados.webhookLocal && !resultados.webhookProducao) {
    console.log('🔧 1. Iniciar webhook: node webhook-evolution-websocket.js');
  }
  
  if (!resultados.evolutionAPI.success) {
    console.log('🔧 2. Verificar credenciais Evolution API');
  }
  
  if (!resultados.bancoDados.success) {
    console.log('🔧 3. Verificar credenciais Supabase');
  }
  
  if (!resultados.configWebhook) {
    console.log('🔧 4. Reconfigurar webhooks nas instâncias Evolution API');
  }
  
  console.log('\n📞 TESTE MANUAL RECOMENDADO:');
  console.log('1. Envie uma mensagem WhatsApp REAL para um número configurado');
  console.log('2. Verifique os logs do webhook em tempo real');
  console.log('3. Acompanhe se o ticket aparece no CRM');
  
  return resultados;
}

// Executar diagnóstico se chamado diretamente
if (require.main === module) {
  executarDiagnosticoCompleto()
    .then(() => {
      console.log('\n✅ Diagnóstico completo finalizado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erro no diagnóstico:', error);
      process.exit(1);
    });
}

module.exports = { executarDiagnosticoCompleto }; 