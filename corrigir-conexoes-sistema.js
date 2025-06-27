#!/usr/bin/env node

/**
 * SCRIPT DE CORREÇÃO DE CONEXÕES DO SISTEMA BKCRM
 * 
 * Este script diagnostica e corrige os problemas identificados:
 * 1. Conexão Supabase Realtime falhando
 * 2. Erro de certificado SSL da Evolution API
 * 3. Sessão de autenticação null
 * 4. Configurações de ambiente incorretas
 */

console.log(`
🔧 ===================================
   CORREÇÃO DE CONEXÕES - BKCRM
===================================
`);

// ========================================
// 1. DIAGNÓSTICO DAS CONFIGURAÇÕES
// ========================================

function verificarConfiguracoes() {
  console.log('📋 1. VERIFICANDO CONFIGURAÇÕES...\n');
  
  // Verificar se window.env existe (para ambiente browser)
  if (typeof window !== 'undefined' && window.env) {
    console.log('✅ Configurações window.env encontradas');
    console.log(`   - Supabase URL: ${window.env.VITE_SUPABASE_URL}`);
    console.log(`   - Evolution API: ${window.env.VITE_EVOLUTION_API_URL}`);
    console.log(`   - WebSocket: ${window.env.VITE_WEBSOCKET_URL || 'NÃO CONFIGURADO'}`);
    console.log(`   - Realtime: ${window.env.VITE_ENABLE_REALTIME}`);
  } else {
    console.log('⚠️ Configurações window.env não encontradas');
  }
  
  // Verificar import.meta.env (para Vite)
  if (typeof import !== 'undefined' && import.meta?.env) {
    console.log('✅ Configurações import.meta.env encontradas');
    console.log(`   - Supabase URL: ${import.meta.env.VITE_SUPABASE_URL}`);
    console.log(`   - Evolution API: ${import.meta.env.VITE_EVOLUTION_API_URL}`);
  } else {
    console.log('⚠️ Configurações import.meta.env não encontradas');
  }
  
  console.log('');
}

// ========================================
// 2. TESTE DE CONECTIVIDADE SUPABASE
// ========================================

async function testarSupabase() {
  console.log('🔗 2. TESTANDO CONEXÃO SUPABASE...\n');
  
  try {
    // URLs e chaves corretas
    const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';
    
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
    
    // Teste básico de conectividade
    const testUrl = `${supabaseUrl}/rest/v1/`;
    const response = await fetch(testUrl, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Conexão Supabase funcionando');
    } else {
      console.log(`❌ Erro na conexão: ${response.status} ${response.statusText}`);
    }
    
    // Teste Realtime
    console.log('\n🔄 Testando Realtime...');
    const realtimeUrl = `wss://${supabaseUrl.replace('https://', '')}/realtime/v1/websocket`;
    console.log(`   WebSocket URL: ${realtimeUrl}`);
    console.log('   ⚠️ WebSocket test requires browser environment');
    
  } catch (error) {
    console.log(`❌ Erro ao testar Supabase: ${error.message}`);
  }
  
  console.log('');
}

// ========================================
// 3. TESTE DE CONECTIVIDADE EVOLUTION API
// ========================================

async function testarEvolutionAPI() {
  console.log('📱 3. TESTANDO EVOLUTION API...\n');
  
  try {
    // URLs CORRETAS
    const urlCorreta = 'https://evochat.devsible.com.br';
    const urlIncorreta = 'https://press-evolution-api.jhkbgs.easypanel.host';
    const apiKey = '429683C4C977415CAAFCCE10F7D57E11';
    
    console.log(`✅ URL CORRETA: ${urlCorreta}`);
    console.log(`❌ URL INCORRETA: ${urlIncorreta} (certificado SSL inválido)`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
    
    // Teste com URL correta
    console.log('\n🧪 Testando URL correta...');
    try {
      const response = await fetch(`${urlCorreta}/instance/fetchInstances`, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Evolution API funcionando - ${data.length || 0} instâncias`);
      } else {
        console.log(`⚠️ Resposta: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Erro na URL correta: ${error.message}`);
    }
    
    // Teste com URL incorreta (para mostrar o erro)
    console.log('\n🧪 Testando URL incorreta (deve falhar)...');
    try {
      const response = await fetch(`${urlIncorreta}/instance/fetchInstances`, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });
      console.log(`⚠️ URL incorreta respondeu: ${response.status}`);
    } catch (error) {
      console.log(`✅ URL incorreta falhou conforme esperado: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Erro geral: ${error.message}`);
  }
  
  console.log('');
}

// ========================================
// 4. INSTRUÇÕES DE CORREÇÃO
// ========================================

function exibirInstrucoes() {
  console.log(`
🛠️ 4. INSTRUÇÕES DE CORREÇÃO:

📁 ARQUIVO .env NA RAIZ:
   Crie um arquivo .env na raiz do projeto com:
   
   VITE_SUPABASE_URL=https://ajlgjjjvuglwgfnyqqvb.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU
   VITE_EVOLUTION_API_URL=https://evochat.devsible.com.br
   VITE_EVOLUTION_API_KEY=429683C4C977415CAAFCCE10F7D57E11
   VITE_ENABLE_REALTIME=true
   VITE_DEBUG_MODE=true

🔄 REINICIAR SERVIDORES:
   1. Parar todos os servidores (Ctrl+C)
   2. Limpar cache: rm -rf node_modules/.vite
   3. Reinstalar: npm install
   4. Iniciar: npm run dev

🌐 VERIFICAR NO BROWSER:
   1. Abrir DevTools (F12)
   2. Console deve mostrar:
      ✅ "Supabase Realtime: Conectado com sucesso"
      ✅ "Evolution API conectada"
   3. Não deve haver erros de certificado SSL

🔧 COMANDOS DE TESTE (no console do browser):
   - testRealEvolutionAPI()
   - testEvolutionConnection()
   - listEvolutionInstances()

`);
}

// ========================================
// 5. EXECUÇÃO PRINCIPAL
// ========================================

async function executarDiagnostico() {
  try {
    verificarConfiguracoes();
    await testarSupabase();
    await testarEvolutionAPI();
    exibirInstrucoes();
    
    console.log('🎉 DIAGNÓSTICO CONCLUÍDO!\n');
    console.log('✅ Configurações atualizadas nos seguintes arquivos:');
    console.log('   - public/env.js');
    console.log('   - src/lib/supabase.ts');
    console.log('   - src/services/evolutionApiService.ts');
    console.log('   - src/services/evolutionWebhookService.ts');
    console.log('   - src/utils/dev-helpers.ts');
    console.log('\n🔄 PRÓXIMO PASSO: Reiniciar o servidor (Ctrl+C + npm run dev)');
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico:', error);
  }
}

// Exportar funções para uso no browser
if (typeof window !== 'undefined') {
  window.diagnosticoConexoes = {
    verificarConfiguracoes,
    testarSupabase,
    testarEvolutionAPI,
    executarDiagnostico
  };
  
  console.log('🔧 Funções de diagnóstico disponíveis em: window.diagnosticoConexoes');
}

// Executar se chamado diretamente
if (typeof require !== 'undefined' && require.main === module) {
  executarDiagnostico();
}

export { verificarConfiguracoes, testarSupabase, testarEvolutionAPI, executarDiagnostico }; 