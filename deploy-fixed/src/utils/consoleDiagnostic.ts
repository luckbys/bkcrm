import { runDepartmentDiagnostic } from './fixDepartmentIssues';

// Função global para executar diagnóstico via console
(window as any).runTicketDiagnostic = async () => {
  console.log('🔍 Iniciando diagnóstico de tickets por departamento...');
  
  try {
    const result = await runDepartmentDiagnostic();
    
    console.log('📊 Resultado do diagnóstico:', result);
    
    if (result.issues.length === 0) {
      console.log('✅ Sistema OK - Nenhum problema encontrado');
    } else {
      console.log(`⚠️ ${result.issues.length} problemas encontrados e corrigidos:`);
      result.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.userName} (${issue.userRole}): ${issue.issue}`);
      });
    }
    
    console.log('🔄 Recarregue a página para ver as mudanças aplicadas');
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
};

// Instruções no console
console.log(`
🛠️ DIAGNÓSTICO DE TICKETS POR DEPARTAMENTO

Para executar o diagnóstico e correção automática, digite no console:
runTicketDiagnostic()

Ou acesse: Menu > Administração > Diagnóstico de Departamentos
`);

export {}; 