// 🔍 Verificar Conectividade Evolution API -> Webhook Local
// Este script verifica se a Evolution API consegue acessar nosso webhook

const EVOLUTION_API_URL = 'https://evochat.devsible.com.br/';
const API_KEY = '429683C4C977415CAAFCCE10F7D57E11';
const INSTANCE_NAME = 'atendimento-ao-cliente-suporte';
const WEBHOOK_LOCAL = 'http://localhost:4000/webhook/evolution';

async function makeRequest(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': API_KEY
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${EVOLUTION_API_URL}${endpoint}`, options);
    const result = await response.json();
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function verificarConectividade() {
  console.log('🔍 VERIFICANDO CONECTIVIDADE EVOLUTION API');
  console.log('='.repeat(50));
  console.log(`🔗 Evolution API: ${EVOLUTION_API_URL}`);
  console.log(`📡 Webhook Local: ${WEBHOOK_LOCAL}`);
  console.log(`🏷️ Instância: ${INSTANCE_NAME}`);
  console.log('');

  // 1. Verificar status da instância
  console.log('1️⃣ Verificando status da instância...');
  const statusResult = await makeRequest(`/instance/connectionState/${INSTANCE_NAME}`);
  
  if (statusResult.success) {
    console.log(`✅ Instância: ${statusResult.data.instance?.state || 'unknown'}`);
  } else {
    console.log(`❌ Erro ao verificar instância: ${statusResult.error}`);
  }
  console.log('');

  // 2. Verificar webhook atual
  console.log('2️⃣ Verificando webhook atual...');
  const webhookResult = await makeRequest(`/webhook/find/${INSTANCE_NAME}`);
  
  if (webhookResult.success) {
    console.log(`📡 URL atual: ${webhookResult.data.url}`);
    console.log(`✅ Habilitado: ${webhookResult.data.enabled}`);
    console.log(`🔔 Eventos: ${webhookResult.data.events?.join(', ')}`);
    
    if (webhookResult.data.url === WEBHOOK_LOCAL) {
      console.log('✅ Webhook configurado para localhost!');
    } else {
      console.log('⚠️ Webhook NÃO está configurado para localhost!');
      console.log(`📍 Esperado: ${WEBHOOK_LOCAL}`);
      console.log(`📍 Atual: ${webhookResult.data.url}`);
    }
  } else {
    console.log(`❌ Erro ao verificar webhook: ${webhookResult.error}`);
  }
  console.log('');

  // 3. Testar se Evolution API consegue acessar nosso webhook
  console.log('3️⃣ Testando conectividade Evolution API -> Webhook Local...');
  
  // A Evolution API está em um servidor remoto, então localhost não vai funcionar!
  console.log('⚠️ PROBLEMA IDENTIFICADO:');
  console.log('🏠 localhost:4000 só funciona na máquina local');
  console.log('🌐 Evolution API está em servidor remoto (EasyPanel)');
  console.log('❌ Servidor remoto NÃO consegue acessar localhost da sua máquina');
  console.log('');

  // 4. Soluções possíveis
  console.log('🔧 SOLUÇÕES POSSÍVEIS:');
  console.log('');
  console.log('A) 🌐 Usar ngrok para expor localhost:');
  console.log('   1. Instalar ngrok: https://ngrok.com/');
  console.log('   2. Executar: ngrok http 4000');
  console.log('   3. Usar URL do ngrok no webhook');
  console.log('');
  console.log('B) 🚀 Deploy do webhook em servidor público:');
  console.log('   1. Deploy no EasyPanel (mesmo servidor da Evolution API)');
  console.log('   2. Usar URL pública do webhook');
  console.log('');
  console.log('C) 🧪 Teste local com túnel SSH:');
  console.log('   1. Criar túnel SSH reverso');
  console.log('   2. Expor porta 4000 publicamente');

  // 5. Verificar se há alguma forma de teste local
  console.log('');
  console.log('🧪 TESTE ALTERNATIVO:');
  console.log('Para testar localmente, você pode:');
  console.log('1. Usar o endpoint de teste do webhook: POST /test');
  console.log('2. Simular mensagens diretamente');
  console.log('3. Verificar se o processamento está funcionando');
}

// Executar verificação
verificarConectividade().catch(console.error); 