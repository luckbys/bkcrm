// 🔍 Diagnóstico Completo Chaves Supabase
// Executar: window.debugSupabaseKeys() no console

interface KeySource {
  source: string;
  key: string | undefined;
  isValid: boolean;
  length: number;
  preview: string;
}

interface SupabaseKeyDiagnostic {
  environment: string;
  expectedKey: string;
  foundKeys: KeySource[];
  incorrectKeyInLogs: string;
  recommendations: string[];
  cacheLocations: string[];
}

// 🎯 Função principal de diagnóstico
export function debugSupabaseKeys(): SupabaseKeyDiagnostic {
  console.log('🔍 [SUPABASE-DEBUG] Iniciando diagnóstico completo das chaves...');
  console.log('==================================================');
  
  // Chave que aparece nos logs (incorreta)
  const incorrectKeyInLogs = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.KKnJRh4rqWKV3WlHWNLcfccULlK2GGGQFtGHqOC_4zI';
  
  // Chave correta que deveria estar sendo usada
  const expectedKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5MjMzOTIsImV4cCI6MjA1MDQ5OTM5Mn0.D_kQOCkdeGFmam-htVNa2C0M5l1uKxlX9eCcmf5fE-8';
  
  const foundKeys: KeySource[] = [];
  
  // 🔍 1. Verificar window.env
  console.log('🔧 [SUPABASE-DEBUG] 1. Verificando window.env...');
  const windowEnvKey = (window as any).env?.VITE_SUPABASE_ANON_KEY;
  foundKeys.push({
    source: 'window.env',
    key: windowEnvKey,
    isValid: windowEnvKey === expectedKey,
    length: windowEnvKey?.length || 0,
    preview: windowEnvKey ? windowEnvKey.substring(0, 30) + '...' : 'N/A'
  });
  
  // 🔍 2. Verificar import.meta.env
  console.log('�� [SUPABASE-DEBUG] 2. Verificando import.meta.env...');
  const importMetaKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  foundKeys.push({
    source: 'import.meta.env',
    key: importMetaKey,
    isValid: importMetaKey === expectedKey,
    length: importMetaKey?.length || 0,
    preview: importMetaKey ? importMetaKey.substring(0, 30) + '...' : 'N/A'
  });
  
  // 🔍 3. Verificar localStorage
  console.log('🔧 [SUPABASE-DEBUG] 3. Verificando localStorage...');
  const localStorageItems = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('VITE_'))) {
      const value = localStorage.getItem(key);
      localStorageItems.push({ key, value: value?.substring(0, 50) + '...' });
    }
  }
  
  // 🔍 4. Verificar sessionStorage
  console.log('🔧 [SUPABASE-DEBUG] 4. Verificando sessionStorage...');
  const sessionStorageItems = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('supabase') || key.includes('VITE_'))) {
      const value = sessionStorage.getItem(key);
      sessionStorageItems.push({ key, value: value?.substring(0, 50) + '...' });
    }
  }
  
  // 🔍 5. Verificar Service Worker Cache
  console.log('🔧 [SUPABASE-DEBUG] 5. Verificando Service Worker...');
  const hasServiceWorker = 'serviceWorker' in navigator;
  
  // 🔍 6. Verificar ambiente atual
  console.log('🔧 [SUPABASE-DEBUG] 6. Verificando ambiente...');
  const hostname = window.location.hostname;
  const isProduction = hostname !== 'localhost' && hostname !== '127.0.0.1';
  const environment = isProduction ? 'PRODUÇÃO' : 'DESENVOLVIMENTO';
  
  // Recomendações baseadas no diagnóstico
  const recommendations = [];
  
  if (foundKeys.some(k => k.key === incorrectKeyInLogs)) {
    recommendations.push('❌ CHAVE INCORRETA DETECTADA: Uma das fontes contém a chave que aparece nos logs de erro');
  }
  
  if (!foundKeys.some(k => k.isValid)) {
    recommendations.push('🔧 ATUALIZAR CHAVES: Nenhuma fonte contém a chave correta');
  }
  
  if (isProduction) {
    recommendations.push('🚀 PRODUÇÃO: Verificar variáveis de ambiente no servidor de deploy (EasyPanel/Heroku)');
  }
  
  // Locais de cache que podem estar interferindo
  const cacheLocations = [
    'Browser Cache (Ctrl+F5 para limpar)',
    'Service Worker Cache',
    'dist/ folder (npm run build)',
    'node_modules/.vite cache',
    'Browser DevTools Application Cache'
  ];
  
  // Resultado final
  const result: SupabaseKeyDiagnostic = {
    environment,
    expectedKey,
    foundKeys,
    incorrectKeyInLogs,
    recommendations,
    cacheLocations
  };
  
  // Logs detalhados
  console.log('📊 [SUPABASE-DEBUG] === RESULTADO DO DIAGNÓSTICO ===');
  console.table(foundKeys);
  console.log('🌐 Ambiente:', environment);
  console.log('✅ Chave correta:', expectedKey.substring(0, 30) + '...');
  console.log('❌ Chave incorreta (logs):', incorrectKeyInLogs.substring(0, 30) + '...');
  console.log('📦 LocalStorage items:', localStorageItems);
  console.log('📦 SessionStorage items:', sessionStorageItems);
  console.log('🔧 Service Worker:', hasServiceWorker ? 'Presente' : 'Ausente');
  console.log('💡 Recomendações:', recommendations);
  console.log('🗑️ Locais de cache para limpar:', cacheLocations);
  
  return result;
}

// 🧹 Função para limpar todos os caches
export function clearAllSupabaseCaches(): void {
  console.log('🧹 [SUPABASE-DEBUG] Limpando todos os caches...');
  
  try {
    // Limpar localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('VITE_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('🗑️ Removido localStorage:', key);
    });
    
    // Limpar sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('supabase') || key.includes('auth') || key.includes('VITE_'))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => {
      sessionStorage.removeItem(key);
      console.log('🗑️ Removido sessionStorage:', key);
    });
    
    console.log('✅ [SUPABASE-DEBUG] Caches limpos com sucesso!');
    console.log('🔄 [SUPABASE-DEBUG] Recarregue a página (Ctrl+F5) para aplicar mudanças');
    
  } catch (error) {
    console.error('❌ [SUPABASE-DEBUG] Erro ao limpar caches:', error);
  }
}

// 🔄 Função para forçar refresh completo
export function forceFullRefresh(): void {
  console.log('🔄 [SUPABASE-DEBUG] Forçando refresh completo...');
  
  // Limpar caches primeiro
  clearAllSupabaseCaches();
  
  // Aguardar um momento e recarregar
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Tornar funções disponíveis globalmente
(window as any).debugSupabaseKeys = debugSupabaseKeys;
(window as any).clearAllSupabaseCaches = clearAllSupabaseCaches;
(window as any).forceFullRefresh = forceFullRefresh;

console.log('🔧 [SUPABASE-DEBUG] Funções de diagnóstico carregadas:');
console.log('   debugSupabaseKeys() - Diagnóstico completo');
console.log('   clearAllSupabaseCaches() - Limpar todos os caches');
console.log('   forceFullRefresh() - Refresh completo'); 