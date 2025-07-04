// DEBUG: Investigar problemas na remoção de setores
// Cole este código no Console do Browser (F12) e execute

console.log('🔍 DEBUG: Investigando problema na remoção de setores...\n');

// 1. Verificar usuário atual e suas permissões
async function checkCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    console.log('👤 Usuário atual:', {
      id: user?.id,
      email: user?.email
    });

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) throw profileError;
    
    console.log('📋 Perfil do usuário:', profile);
    
    // Verificar se é admin
    const isAdmin = profile.role === 'admin';
    console.log('🔐 É administrador?', isAdmin);
    
    return { user, profile, isAdmin };
  } catch (error) {
    console.error('❌ Erro ao verificar usuário:', error);
    return null;
  }
}

// 2. Testar operação de update em departments
async function testDepartmentUpdate() {
  try {
    console.log('\n🧪 Testando operação UPDATE em departments...');
    
    // Primeiro, listar todos os departamentos
    const { data: departments, error: listError } = await supabase
      .from('departments')
      .select('*')
      .order('name');
      
    if (listError) throw listError;
    
    console.log('📋 Departamentos encontrados:', departments.length);
    console.table(departments);
    
    if (departments.length === 0) {
      console.log('⚠️ Nenhum departamento encontrado!');
      return;
    }
    
    // Tentar fazer um update de teste (sem alterar nada importante)
    const testDepartment = departments[0];
    console.log(`\n🎯 Testando UPDATE no departamento: ${testDepartment.name}`);
    
    const { data: updateResult, error: updateError } = await supabase
      .from('departments')
      .update({ 
        updated_at: new Date().toISOString() // Apenas atualizar timestamp
      })
      .eq('id', testDepartment.id)
      .select();
      
    if (updateError) {
      console.error('❌ ERRO NO UPDATE:', updateError);
      console.log('Código do erro:', updateError.code);
      console.log('Detalhes:', updateError.details);
      console.log('Hint:', updateError.hint);
      console.log('Message:', updateError.message);
    } else {
      console.log('✅ UPDATE funcionou:', updateResult);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de UPDATE:', error);
  }
}

// 3. Verificar políticas RLS
async function checkRLSPolicies() {
  try {
    console.log('\n🔒 Verificando políticas RLS...');
    
    // Esta query só funciona se o usuário tiver permissões adequadas
    const { data: policies, error } = await supabase
      .rpc('get_policies', { table_name: 'departments' });
      
    if (error) {
      console.log('⚠️ Não foi possível consultar políticas RLS:', error.message);
    } else {
      console.log('📋 Políticas RLS encontradas:', policies);
    }
  } catch (error) {
    console.log('⚠️ Erro ao verificar RLS:', error.message);
  }
}

// 4. Teste completo de remoção de setor
async function testSectorDeletion() {
  try {
    console.log('\n🗑️ Simulando remoção de setor...');
    
    const userInfo = await checkCurrentUser();
    if (!userInfo) {
      console.log('❌ Não foi possível verificar usuário');
      return;
    }
    
    if (!userInfo.isAdmin) {
      console.log('❌ Usuário não é admin - remoção bloqueada');
      return;
    }
    
    await testDepartmentUpdate();
    await checkRLSPolicies();
    
  } catch (error) {
    console.error('❌ Erro no teste completo:', error);
  }
}

// Executar diagnóstico
testSectorDeletion();

// Funções auxiliares para debug manual
window.debugDepartments = {
  checkUser: checkCurrentUser,
  testUpdate: testDepartmentUpdate,
  checkRLS: checkRLSPolicies,
  fullTest: testSectorDeletion
};

console.log('\n💡 Funções de debug disponíveis:');
console.log('- debugDepartments.checkUser()');
console.log('- debugDepartments.testUpdate()');
console.log('- debugDepartments.checkRLS()');
console.log('- debugDepartments.fullTest()'); 