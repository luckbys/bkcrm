// Utilitário para testar as ações de departamento
export const testDepartmentActions = () => {
  console.log('🧪 [Test] Testando funcionalidades de departamento...')
  
  // Verificar se os elementos estão presentes na página
  const sidebar = document.querySelector('[class*="left-6"][class*="top-1/2"]')
  const departments = document.querySelectorAll('[class*="departmentCard"]')
  const dropdownButtons = document.querySelectorAll('[class*="MoreVertical"]')
  
  console.log('📊 [Test] Resultados:')
  console.log(`  - Sidebar encontrado: ${sidebar ? '✅' : '❌'}`)
  console.log(`  - Departamentos encontrados: ${departments.length}`)
  console.log(`  - Botões dropdown encontrados: ${dropdownButtons.length}`)
  
  if (departments.length > 0) {
    console.log('🎯 [Test] Para testar:')
    console.log('  1. Clique no botão "⋮" (três pontos) de qualquer departamento')
    console.log('  2. Teste a opção "Editar departamento" (ícone azul)')
    console.log('  3. Teste a opção "Remover departamento" (ícone vermelho)')
    console.log('  4. Verifique as mudanças de prioridade')
  } else {
    console.log('⚠️ [Test] Nenhum departamento encontrado. Verifique os dados mock.')
  }
  
  return {
    sidebarFound: !!sidebar,
    departmentCount: departments.length,
    dropdownCount: dropdownButtons.length
  }
}

// Disponibilizar globalmente para testes
if (typeof window !== 'undefined') {
  (window as any).testDepartmentActions = testDepartmentActions
} 