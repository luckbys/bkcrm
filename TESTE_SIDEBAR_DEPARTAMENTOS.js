// 🧪 TESTE ESPECÍFICO: Sidebar Departamentos
// Execute no console do browser após fazer login

console.log('🔍 Testando problema da sidebar com departamentos removidos...');

// Função principal de teste
window.testSidebarDepartments = async function() {
  try {
    console.log('📋 1. Testando consulta direta ao banco...');
    
    // Importar Supabase client
    const { supabase } = await import('/src/lib/supabase.js');
    
    // Buscar TODOS os departamentos (para comparar)
    const { data: allDepartments, error: allError } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });
    
    if (allError) {
      console.error('❌ Erro ao buscar todos os departamentos:', allError);
      return;
    }
    
    console.log(`📊 Total de departamentos no banco: ${allDepartments.length}`);
    allDepartments.forEach((dept, index) => {
      const status = dept.is_active ? '✅ ATIVO' : '❌ INATIVO';
      console.log(`   ${index + 1}. ${dept.name} - ${status}`);
    });
    
    console.log('\\n📋 2. Testando consulta com filtro (como o hook useDepartments)...');
    
    // Buscar apenas departamentos ativos (como o hook faz)
    const { data: activeDepartments, error: activeError } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (activeError) {
      console.error('❌ Erro ao buscar departamentos ativos:', activeError);
      return;
    }
    
    console.log(`📊 Departamentos ativos no banco: ${activeDepartments.length}`);
    activeDepartments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name}`);
    });
    
    console.log('\\n📋 3. Verificando estado do hook useDepartments...');
    
    // Verificar se existe estado React (precisa estar na página)
    if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      console.log('React detectado. Tentando acessar estado dos departamentos...');
      // Aqui seria complexo acessar o estado React diretamente
    }
    
    console.log('\\n📋 4. Verificando cache do navegador...');
    
    // Verificar localStorage/sessionStorage
    const selectedSectorId = sessionStorage.getItem('selectedSectorId');
    console.log(`🗂️ Setor selecionado salvo: ${selectedSectorId}`);
    
    // Verificar se o setor selecionado ainda existe e é ativo
    if (selectedSectorId) {
      const selectedDept = allDepartments.find(d => d.id === selectedSectorId);
      if (selectedDept) {
        const status = selectedDept.is_active ? 'ATIVO' : 'INATIVO';
        console.log(`📍 Setor selecionado: ${selectedDept.name} (${status})`);
        
        if (!selectedDept.is_active) {
          console.log('⚠️ PROBLEMA: Setor selecionado está INATIVO!');
          console.log('💡 Solução: Limpar cache e recarregar...');
          sessionStorage.removeItem('selectedSectorId');
        }
      } else {
        console.log('❌ Setor selecionado não existe mais no banco');
        sessionStorage.removeItem('selectedSectorId');
      }
    }
    
    console.log('\\n📋 5. Verificando elementos da sidebar...');
    
    // Verificar elementos visíveis na sidebar
    const sidebarItems = document.querySelectorAll(
      '[data-testid="sidebar-department"], .sidebar-department, .sector-item, [class*="sector"], [class*="department"]'
    );
    
    console.log(`📊 Elementos de departamento encontrados na sidebar: ${sidebarItems.length}`);
    sidebarItems.forEach((item, index) => {
      const text = item.textContent?.trim() || 'Sem texto';
      console.log(`   ${index + 1}. ${text.substring(0, 50)}...`);
    });
    
    console.log('\\n📋 6. DIAGNÓSTICO FINAL...');
    
    const inactiveCount = allDepartments.filter(d => !d.is_active).length;
    const activeCount = activeDepartments.length;
    const visibleCount = sidebarItems.length;
    
    if (inactiveCount > 0) {
      console.log(`❌ PROBLEMA: ${inactiveCount} departamento(s) inativo(s) no banco`);
      console.log('💡 Execute o script SQL de limpeza: CORRECAO_DEPARTAMENTOS_FINAL.sql');
    }
    
    if (visibleCount > activeCount) {
      console.log(`❌ PROBLEMA: Sidebar mostra ${visibleCount} itens mas só há ${activeCount} ativos`);
      console.log('💡 Possível cache ou problema no frontend');
    }
    
    if (visibleCount === activeCount && inactiveCount === 0) {
      console.log('✅ TUDO OK: Sidebar está correta!');
    }
    
    return {
      totalDepartments: allDepartments.length,
      activeDepartments: activeCount,
      inactiveDepartments: inactiveCount,
      visibleInSidebar: visibleCount,
      isCorrect: visibleCount === activeCount && inactiveCount === 0
    };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return null;
  }
};

// Função para forçar refresh da sidebar
window.forceSidebarRefresh = function() {
  console.log('🔄 Forçando refresh da sidebar...');
  
  // Limpar cache
  sessionStorage.removeItem('selectedSectorId');
  
  // Recarregar página (mais garantido)
  if (confirm('Deseja recarregar a página para limpar todo o cache?')) {
    window.location.reload(true);
  } else {
    console.log('💡 Recomenda-se recarregar manualmente (Ctrl+F5)');
  }
};

// Função para criar departamento de teste
window.createTestDepartment = async function() {
  try {
    console.log('🧪 Criando departamento de teste...');
    
    const { supabase } = await import('/src/lib/supabase.js');
    
    const testDept = {
      name: `Teste Departamento ${Date.now()}`,
      description: 'Departamento criado para teste',
      color: 'blue',
      icon: 'TestTube',
      is_active: true,
      metadata: { test: true }
    };
    
    const { data, error } = await supabase
      .from('departments')
      .insert(testDept)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar departamento:', error);
      return null;
    }
    
    console.log('✅ Departamento de teste criado:', data);
    console.log('💡 Agora marque como inativo e teste se some da sidebar');
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
};

console.log('✅ Funções de teste carregadas!');
console.log('📋 Execute: testSidebarDepartments()');
console.log('🔄 Execute: forceSidebarRefresh()');
console.log('🧪 Execute: createTestDepartment()'); 