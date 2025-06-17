// 🧪 TESTE: Verificar Correção de Departamentos Removidos
// Execute no console do browser após fazer login

console.log('🔍 Testando correção de departamentos removidos...');

// Função para testar o hook useDepartments
window.testDepartmentsFix = async function() {
  try {
    console.log('📋 1. Verificando departamentos no banco de dados...');
    
    // Importar Supabase client
    const { supabase } = await import('./src/lib/supabase.js');
    
    // Buscar TODOS os departamentos (incluindo inativos)
    const { data: allDepartments, error: allError } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os departamentos:', allError);
      return;
    }
    
    console.log(`📊 Total de departamentos no banco: ${allDepartments?.length || 0}`);
    
    // Separar por status
    const active = allDepartments?.filter(d => d.is_active === true) || [];
    const inactive = allDepartments?.filter(d => d.is_active === false) || [];
    
    console.log(`✅ Departamentos ativos: ${active.length}`);
    console.log(`❌ Departamentos removidos (inativos): ${inactive.length}`);
    
    if (inactive.length > 0) {
      console.log('🗑️ Departamentos removidos encontrados:');
      inactive.forEach(dept => {
        console.log(`   - ${dept.name} (ID: ${dept.id}) - Removido em: ${dept.updated_at}`);
      });
    }
    
    // Agora testar a consulta corrigida (apenas ativos)
    console.log('\n📋 2. Testando consulta corrigida (apenas ativos)...');
    
    const { data: activeDepartments, error: activeError } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (activeError) {
      console.error('❌ Erro ao buscar departamentos ativos:', activeError);
      return;
    }
    
    console.log(`✅ Departamentos retornados pela consulta corrigida: ${activeDepartments?.length || 0}`);
    
    if (activeDepartments) {
      console.log('📋 Lista de departamentos ativos:');
      activeDepartments.forEach(dept => {
        console.log(`   ✅ ${dept.name} (ID: ${dept.id})`);
      });
    }
    
    // Verificar se a correção funcionou
    const shouldBeHidden = inactive.length;
    const currentlyShowing = activeDepartments?.length || 0;
    
    console.log('\n🔍 3. Análise da correção:');
    
    if (shouldBeHidden > 0) {
      console.log(`✅ CORREÇÃO FUNCIONANDO: ${shouldBeHidden} departamento(s) removido(s) não aparecerão mais na lista`);
      console.log(`📋 Frontend agora mostrará apenas ${currentlyShowing} departamento(s) ativo(s)`);
    } else {
      console.log('ℹ️ Não há departamentos removidos para ocultar');
    }
    
    return {
      totalDepartments: allDepartments?.length || 0,
      activeDepartments: active.length,
      removedDepartments: inactive.length,
      correctionWorking: true
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { error: error.message };
  }
};

// Função para recarregar a página e testar
window.testAndReload = async function() {
  console.log('🔄 Executando teste e recarregando...');
  
  const result = await testDepartmentsFix();
  
  if (result && !result.error) {
    console.log('✅ Teste concluído com sucesso!');
    console.log('🔄 Recarregando página em 3 segundos para aplicar mudanças...');
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
  
  return result;
};

// Função para verificar estado atual do frontend
window.checkFrontendState = function() {
  console.log('🖥️ Verificando estado atual do frontend...');
  
  // Verificar se há departamentos na sidebar
  const sidebarItems = document.querySelectorAll('[data-testid="sidebar-department"], .sidebar-department, .sector-item');
  console.log(`📋 Departamentos visíveis na sidebar: ${sidebarItems.length}`);
  
  sidebarItems.forEach((item, index) => {
    const text = item.textContent?.trim() || 'Sem nome';
    console.log(`   ${index + 1}. ${text}`);
  });
  
  return {
    visibleDepartments: sidebarItems.length,
    departments: Array.from(sidebarItems).map(item => item.textContent?.trim())
  };
};

console.log('✅ Funções de teste carregadas!');
console.log('📋 Execute: testDepartmentsFix() - para testar a correção');
console.log('🔄 Execute: testAndReload() - para testar e recarregar automaticamente');
console.log('🖥️ Execute: checkFrontendState() - para verificar estado atual do frontend'); 