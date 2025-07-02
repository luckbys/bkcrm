// Script de teste para verificar edição de departamentos
// Execute no console do navegador

window.testDepartmentEdit = async () => {
  console.log('🧪 Iniciando teste de edição de departamentos...')
  
  try {
    // 1. Verificar se o hook useDepartments está disponível
    if (typeof window.useDepartments === 'undefined') {
      console.log('❌ Hook useDepartments não encontrado')
      return
    }
    
    // 2. Verificar se há departamentos para editar
    const departments = window.departments || []
    if (departments.length === 0) {
      console.log('❌ Nenhum departamento encontrado para testar')
      return
    }
    
    // 3. Pegar o primeiro departamento para teste
    const testDepartment = departments[0]
    console.log('📋 Departamento para teste:', testDepartment)
    
    // 4. Simular edição
    const updatedData = {
      name: `${testDepartment.name} (Editado)`,
      priority: testDepartment.priority === 'high' ? 'medium' : 'high',
      description: 'Descrição de teste editada',
      icon: 'TestTube'
    }
    
    console.log('✏️ Dados de edição:', updatedData)
    
    // 5. Verificar se a função updateDepartment existe
    if (typeof window.updateDepartment === 'function') {
      console.log('✅ Função updateDepartment encontrada')
      
      // 6. Tentar atualizar
      await window.updateDepartment(testDepartment.id, updatedData)
      console.log('✅ Atualização bem-sucedida')
      
      // 7. Recarregar departamentos
      if (typeof window.refreshDepartments === 'function') {
        await window.refreshDepartments()
        console.log('✅ Departamentos recarregados')
      }
      
    } else {
      console.log('❌ Função updateDepartment não encontrada')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Função para verificar estrutura da tabela departments
window.checkDepartmentsTable = async () => {
  console.log('🔍 Verificando estrutura da tabela departments...')
  
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao consultar tabela:', error)
      return
    }
    
    if (data && data.length > 0) {
      const dept = data[0]
      console.log('📊 Estrutura do departamento:', Object.keys(dept))
      console.log('📋 Dados do departamento:', dept)
      
      // Verificar campos obrigatórios
      const requiredFields = ['id', 'name', 'priority', 'icon', 'description']
      const missingFields = requiredFields.filter(field => !(field in dept))
      
      if (missingFields.length > 0) {
        console.log('⚠️ Campos faltando:', missingFields)
        console.log('💡 Execute o script CORRECAO_COLUNA_PRIORITY_DEPARTMENTS.sql no Supabase')
      } else {
        console.log('✅ Todos os campos necessários estão presentes')
      }
    } else {
      console.log('ℹ️ Tabela departments está vazia')
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error)
  }
}

// Função para testar criação de departamento
window.testCreateDepartment = async () => {
  console.log('🧪 Testando criação de departamento...')
  
  try {
    const testData = {
      name: 'Departamento Teste',
      priority: 'medium',
      description: 'Departamento criado para teste',
      icon: 'TestTube'
    }
    
    console.log('📋 Dados de teste:', testData)
    
    if (typeof window.addDepartment === 'function') {
      const result = await window.addDepartment(
        testData.name,
        testData.priority,
        testData.description,
        testData.icon
      )
      
      console.log('✅ Departamento criado:', result)
      
      // Limpar teste
      if (result && result.id) {
        await window.archiveDepartment(result.id)
        console.log('🧹 Departamento de teste removido')
      }
      
    } else {
      console.log('❌ Função addDepartment não encontrada')
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de criação:', error)
  }
}

// Função para diagnóstico completo
window.diagnoseDepartmentSystem = async () => {
  console.log('🔍 Iniciando diagnóstico completo do sistema de departamentos...')
  
  // 1. Verificar estrutura da tabela
  await window.checkDepartmentsTable()
  
  // 2. Verificar funções disponíveis
  const functions = [
    'useDepartments',
    'addDepartment', 
    'updateDepartment',
    'archiveDepartment',
    'refreshDepartments'
  ]
  
  console.log('🔧 Verificando funções disponíveis:')
  functions.forEach(func => {
    const available = typeof window[func] === 'function'
    console.log(`${available ? '✅' : '❌'} ${func}`)
  })
  
  // 3. Verificar estado atual
  console.log('📊 Estado atual:')
  console.log('- Departamentos:', window.departments?.length || 0)
  console.log('- Loading:', window.departmentsLoading)
  console.log('- Error:', window.departmentsError)
  
  // 4. Testar operações básicas
  if (window.departments && window.departments.length > 0) {
    await window.testDepartmentEdit()
  } else {
    await window.testCreateDepartment()
  }
  
  console.log('✅ Diagnóstico concluído')
}

console.log('📋 Scripts de teste carregados:')
console.log('- testDepartmentEdit() - Testa edição de departamento')
console.log('- checkDepartmentsTable() - Verifica estrutura da tabela')
console.log('- testCreateDepartment() - Testa criação de departamento')
console.log('- diagnoseDepartmentSystem() - Diagnóstico completo') 