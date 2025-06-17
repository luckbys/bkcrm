// 🐛 DEBUG: Departamento Específico Não Removido
// Execute no console do browser

console.log('🔍 Debugando departamento problemático: 5ddc3a64-b4ae-4389-b7e3-46caefbf0260');

window.debugProblematicDepartment = async function() {
  try {
    const { supabase } = await import('/src/lib/supabase.js');
    const problematicId = '5ddc3a64-b4ae-4389-b7e3-46caefbf0260';
    
    console.log('📊 1. Verificando se o departamento existe no banco...');
    
    const { data: dept, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('id', problematicId)
      .maybeSingle();
    
    if (deptError) {
      console.error('❌ Erro ao buscar departamento:', deptError);
      return;
    }
    
    if (dept) {
      console.log('⚠️ PROBLEMA: Departamento ainda existe no banco!');
      console.log('📋 Dados do departamento:', dept);
      console.log(`   - Nome: ${dept.name}`);
      console.log(`   - Ativo: ${dept.is_active}`);
      console.log(`   - Atualizado: ${dept.updated_at}`);
      
      // Forçar exclusão
      if (confirm(`Departamento "${dept.name}" ainda existe. Deseja forçar a exclusão?`)) {
        console.log('🗑️ Forçando exclusão...');
        
        const { error: deleteError } = await supabase
          .from('departments')
          .delete()
          .eq('id', problematicId);
        
        if (deleteError) {
          console.error('❌ Erro ao forçar exclusão:', deleteError);
        } else {
          console.log('✅ Departamento excluído com sucesso!');
          console.log('💡 Recarregue a página para ver as mudanças');
        }
      }
    } else {
      console.log('✅ Departamento não existe mais no banco');
      console.log('🔍 Problema pode ser cache do browser ou estado React');
    }
    
    console.log('\\n📊 2. Verificando todos os departamentos...');
    
    const { data: allDepts, error: allError } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    
    if (allError) {
      console.error('❌ Erro ao buscar todos departamentos:', allError);
      return;
    }
    
    console.log(`📋 Total de departamentos no banco: ${allDepts.length}`);
    allDepts.forEach((d, index) => {
      const status = d.is_active ? '✅ ATIVO' : '❌ INATIVO';
      console.log(`   ${index + 1}. ${d.name} (${d.id.substring(0, 8)}...) - ${status}`);
    });
    
    console.log('\\n📊 3. Verificando cache do sessionStorage...');
    
    const selectedSectorId = sessionStorage.getItem('selectedSectorId');
    console.log(`🗂️ Setor selecionado no cache: ${selectedSectorId}`);
    
    if (selectedSectorId === problematicId) {
      console.log('⚠️ PROBLEMA: Setor problemático está salvo como selecionado!');
      console.log('🧹 Limpando cache...');
      sessionStorage.removeItem('selectedSectorId');
      console.log('✅ Cache limpo. Recarregue a página.');
    }
    
    console.log('\\n📊 4. Limpeza de cache completa...');
    
    // Limpar todos os caches relacionados
    sessionStorage.removeItem('selectedSectorId');
    sessionStorage.removeItem('sidebarCollapsed');
    sessionStorage.removeItem('currentView');
    
    console.log('✅ Todos os caches limpos!');
    console.log('💡 Pressione Ctrl+F5 para recarregar completamente');
    
    return {
      departmentExists: !!dept,
      wasInCache: selectedSectorId === problematicId,
      totalDepartments: allDepts.length
    };
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    return null;
  }
};

// Função para forçar exclusão direta
window.forceDeleteDepartment = async function(departmentId) {
  try {
    console.log(`🗑️ Forçando exclusão do departamento: ${departmentId}`);
    
    const { supabase } = await import('/src/lib/supabase.js');
    
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', departmentId);
    
    if (error) {
      console.error('❌ Erro ao forçar exclusão:', error);
      return false;
    }
    
    console.log('✅ Departamento excluído com sucesso!');
    
    // Limpar cache
    sessionStorage.removeItem('selectedSectorId');
    
    console.log('💡 Recarregue a página (Ctrl+F5)');
    return true;
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
};

console.log('✅ Funções de debug carregadas!');
console.log('🐛 Execute: debugProblematicDepartment()');
console.log('🗑️ Execute: forceDeleteDepartment("ID_DO_DEPARTAMENTO")'); 