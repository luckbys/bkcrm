/**
 * 🔍 SCRIPT DE DIAGNÓSTICO COMPLETO DO FRONTEND
 * 
 * INSTRUÇÕES:
 * 1. Abra http://localhost:3003/ no navegador
 * 2. Abra DevTools (F12) → Console
 * 3. Cole este script completo no console
 * 4. Execute: diagnosticoCompleto()
 */

window.diagnosticoCompleto = async function() {
  console.clear();
  console.log('🔍 INICIANDO DIAGNÓSTICO COMPLETO DO FRONTEND...\n');
  
  const resultados = {
    configuracoes: {},
    conexoes: {},
    autenticacao: {},
    problemas: [],
    solucoes: []
  };

  // ========================================
  // 1. VERIFICAR CONFIGURAÇÕES
  // ========================================
  console.log('🔧 1. VERIFICANDO CONFIGURAÇÕES...');
  
  try {
    resultados.configuracoes = {
      windowEnv: !!window.env,
      supabaseUrl: window.env?.VITE_SUPABASE_URL || 'AUSENTE',
      evolutionUrl: window.env?.VITE_EVOLUTION_API_URL || 'AUSENTE',
      websocketUrl: window.env?.VITE_WEBSOCKET_URL || 'AUSENTE',
      realtimeEnabled: window.env?.VITE_ENABLE_REALTIME || 'AUSENTE'
    };
    
    console.log('✅ Configurações carregadas:', resultados.configuracoes);
    
    if (!window.env) {
      resultados.problemas.push('❌ window.env não encontrado');
      resultados.solucoes.push('Verificar arquivo public/env.js');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error);
    resultados.problemas.push('Erro nas configurações: ' + error.message);
  }

  // ========================================
  // 2. TESTAR CONEXÕES
  // ========================================
  console.log('\n🌐 2. TESTANDO CONEXÕES...');
  
  try {
    // Testar Supabase
    console.log('🔗 Testando Supabase...');
    try {
      const supabaseTest = await fetch('https://ajlgjjjvuglwgfnyqqvb.supabase.co/rest/v1/', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU'
        }
      });
      resultados.conexoes.supabase = {
        status: supabaseTest.status,
        ok: supabaseTest.ok
      };
      console.log('✅ Supabase:', resultados.conexoes.supabase);
    } catch (error) {
      resultados.conexoes.supabase = { error: error.message };
      console.error('❌ Supabase falhou:', error.message);
      resultados.problemas.push('Conexão Supabase falhou: ' + error.message);
    }

    // Testar Evolution API
    console.log('🔗 Testando Evolution API...');
    try {
      const evolutionTest = await fetch('https://evochat.devsible.com.br/', {
        method: 'GET',
        mode: 'no-cors' // Para evitar CORS
      });
      resultados.conexoes.evolution = { status: 'conectado' };
      console.log('✅ Evolution API: conectado');
    } catch (error) {
      resultados.conexoes.evolution = { error: error.message };
      console.error('❌ Evolution API falhou:', error.message);
      resultados.problemas.push('Evolution API falhou: ' + error.message);
    }

    // Testar Webhook local
    console.log('🔗 Testando Webhook local...');
    try {
      const webhookTest = await fetch('http://localhost:4000/webhook/health');
      const webhookData = await webhookTest.json();
      resultados.conexoes.webhook = {
        status: webhookTest.status,
        data: webhookData
      };
      console.log('✅ Webhook:', resultados.conexoes.webhook);
    } catch (error) {
      resultados.conexoes.webhook = { error: error.message };
      console.error('❌ Webhook falhou:', error.message);
      resultados.problemas.push('Webhook local falhou: ' + error.message);
    }

  } catch (error) {
    console.error('❌ Erro geral nos testes de conexão:', error);
  }

  // ========================================
  // 3. VERIFICAR AUTENTICAÇÃO
  // ========================================
  console.log('\n🔐 3. VERIFICANDO AUTENTICAÇÃO...');
  
  try {
    const authData = {
      localStorage: {
        supabaseAuth: localStorage.getItem('bkcrm-supabase-auth'),
        hasToken: !!localStorage.getItem('supabase.auth.token')
      },
      sessionStorage: {
        items: Object.keys(sessionStorage).filter(key => key.includes('supabase'))
      }
    };
    
    resultados.autenticacao = authData;
    console.log('✅ Estado da autenticação:', authData);
    
    if (!authData.localStorage.supabaseAuth && !authData.localStorage.hasToken) {
      resultados.problemas.push('❌ Usuário não autenticado');
      resultados.solucoes.push('Fazer login ou verificar credenciais');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
    resultados.problemas.push('Erro na autenticação: ' + error.message);
  }

  // ========================================
  // 4. TESTAR REACT/VITE
  // ========================================
  console.log('\n⚛️ 4. VERIFICANDO REACT/VITE...');
  
  try {
    const reactInfo = {
      reactLoaded: !!window.React,
      viteDefined: !!window.__vite__,
      appMounted: !!document.querySelector('#root'),
      hasContent: document.querySelector('#root')?.children.length > 0
    };
    
    resultados.react = reactInfo;
    console.log('✅ Estado do React:', reactInfo);
    
    if (!reactInfo.appMounted || !reactInfo.hasContent) {
      resultados.problemas.push('❌ App React não carregou corretamente');
      resultados.solucoes.push('Verificar erros JavaScript no console');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar React:', error);
  }

  // ========================================
  // 5. VERIFICAR CONSOLE ERRORS
  // ========================================
  console.log('\n🐛 5. VERIFICANDO ERROS NO CONSOLE...');
  
  // Interceptar console.error temporariamente
  const originalError = console.error;
  const consoleErrors = [];
  
  console.error = function(...args) {
    consoleErrors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalError;
    if (consoleErrors.length > 0) {
      resultados.consoleErrors = consoleErrors;
      console.log('❌ Erros detectados:', consoleErrors);
      resultados.problemas.push(`${consoleErrors.length} erros no console`);
    } else {
      console.log('✅ Nenhum erro novo no console');
    }
  }, 1000);

  // ========================================
  // 6. RELATÓRIO FINAL
  // ========================================
  setTimeout(() => {
    console.log('\n📊 RELATÓRIO FINAL DO DIAGNÓSTICO:');
    console.log('=====================================');
    
    if (resultados.problemas.length === 0) {
      console.log('✅ NENHUM PROBLEMA DETECTADO!');
      console.log('O sistema parece estar funcionando corretamente.');
      console.log('\n💡 Se ainda há problemas, verifique:');
      console.log('- Se consegue fazer login');
      console.log('- Se os dados carregam corretamente');
      console.log('- Se o chat funciona');
    } else {
      console.log('❌ PROBLEMAS DETECTADOS:');
      resultados.problemas.forEach((problema, i) => {
        console.log(`   ${i + 1}. ${problema}`);
      });
      
      console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');
      resultados.solucoes.forEach((solucao, i) => {
        console.log(`   ${i + 1}. ${solucao}`);
      });
      
      console.log('\n🆘 CORREÇÕES RÁPIDAS:');
      console.log('// Limpar cache e autenticação:');
      console.log('localStorage.clear(); sessionStorage.clear(); location.reload();');
      
      console.log('\n// Forçar recarregamento:');
      console.log('location.reload(true);');
    }
    
    console.log('\n📋 DADOS COMPLETOS:');
    console.log(JSON.stringify(resultados, null, 2));
    
    // Tornar dados disponíveis globalmente
    window.diagnosticoResultados = resultados;
    console.log('\n💾 Resultados salvos em: window.diagnosticoResultados');
    
  }, 2000);

  return 'Diagnóstico iniciado... Aguarde o relatório final em 2 segundos.';
};

// ========================================
// FUNÇÕES AUXILIARES DE CORREÇÃO
// ========================================

window.limparTudo = function() {
  console.log('🧹 Limpando TUDO...');
  localStorage.clear();
  sessionStorage.clear();
  
  // Limpar cache do service worker se existir
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }
  
  console.log('✅ Cache limpo! Recarregando página...');
  setTimeout(() => location.reload(true), 1000);
};

window.testarLogin = async function() {
  console.log('🔐 Testando sistema de login...');
  
  // Verificar se há formulário de login
  const loginForm = document.querySelector('form[action*="login"], form input[type="email"]');
  if (loginForm) {
    console.log('✅ Formulário de login encontrado');
  } else {
    console.log('❌ Formulário de login não encontrado');
  }
  
  // Verificar redirecionamentos
  const currentPath = window.location.pathname;
  console.log('📍 Página atual:', currentPath);
  
  if (currentPath.includes('login') || currentPath.includes('auth')) {
    console.log('ℹ️ Você está na página de autenticação');
  } else {
    console.log('ℹ️ Você está na aplicação principal');
  }
};

// ========================================
// INSTRUÇÕES FINAIS
// ========================================
console.log('🎯 SCRIPT DE DIAGNÓSTICO CARREGADO!');
console.log('');
console.log('📋 COMANDOS DISPONÍVEIS:');
console.log('  diagnosticoCompleto() - Executa diagnóstico completo');
console.log('  limparTudo() - Limpa cache e recarrega');
console.log('  testarLogin() - Testa sistema de login');
console.log('');
console.log('🚀 Execute: diagnosticoCompleto()');

// Auto-executar se solicitado
if (window.location.search.includes('autodiag=true')) {
  console.log('🔄 Auto-executando diagnóstico...');
  setTimeout(diagnosticoCompleto, 1000);
} 