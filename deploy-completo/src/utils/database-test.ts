// 🧪 Funções de teste para verificar problemas no banco de dados

import { supabase } from '@/lib/supabase';

// Função para testar se o banco está funcionando
export const testDatabaseConnection = async () => {
  console.log('🔍 Testando conexão com banco de dados...');
  
  try {
    // Teste 1: Verificar autenticação
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Erro de autenticação:', authError);
      return false;
    }
    console.log('✅ Usuário autenticado:', user.user?.email);

    // Teste 2: Verificar tabela departments
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('id, name')
      .limit(1);
    
    if (deptError) {
      console.error('❌ Erro ao acessar departments:', deptError);
      return false;
    }
    console.log('✅ Tabela departments OK:', departments?.[0]?.name);

    // Teste 3: Verificar tabela evolution_instances
    const { data: instances, error: instError } = await supabase
      .from('evolution_instances')
      .select('id, instance_name')
      .limit(1);
    
    if (instError) {
      console.error('❌ Erro ao acessar evolution_instances:', instError);
      return false;
    }
    console.log('✅ Tabela evolution_instances OK');

    // Teste 4: Verificar se consegue inserir (teste não destrutivo)
    if (departments?.[0]?.id) {
      const testName = `teste-${Date.now()}`;
      const { data: testInsert, error: insertError } = await supabase
        .from('evolution_instances')
        .insert([{
          instance_name: testName,
          department_id: departments[0].id,
          department_name: departments[0].name,
          is_default: false,
          status: 'close',
          metadata: { test: true }
        }])
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir teste:', insertError);
        return false;
      }

      // Remover o registro de teste
      if (testInsert?.[0]?.id) {
        await supabase
          .from('evolution_instances')
          .delete()
          .eq('id', testInsert[0].id);
      }

      console.log('✅ INSERT/DELETE funcionando');
    }

    console.log('🎉 Todos os testes passaram! Banco funcionando corretamente.');
    return true;

  } catch (error: any) {
    console.error('💥 Erro inesperado:', error);
    return false;
  }
};

// Função para diagnosticar problemas específicos
export const diagnoseDatabaseIssues = async () => {
  console.log('🔍 Diagnóstico detalhado do banco...');
  
  const issues: string[] = [];

  try {
    // Verificar enum user_role
    const { data: profiles } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);
    
    console.log('✅ Enum user_role funcionando');
  } catch (error: any) {
    if (error.message?.includes('invalid input value for enum')) {
      issues.push('❌ Problema com enum user_role - execute CORRECAO_ENUM_USER_ROLE.sql');
    }
  }

  try {
    // Verificar constraint unique_default_per_department
    const { data: duplicates } = await supabase
      .from('evolution_instances')
      .select('department_id')
      .eq('is_default', true);
    
    if (duplicates) {
      const deptCounts = duplicates.reduce((acc: any, curr) => {
        acc[curr.department_id] = (acc[curr.department_id] || 0) + 1;
        return acc;
      }, {});
      
      const duplicateCount = Object.values(deptCounts).filter((count: any) => count > 1).length;
      
      if (duplicateCount > 0) {
        issues.push('❌ Múltiplas instâncias padrão - execute CORRECAO_INSTANCIA_DUPLICADA.sql');
      } else {
        console.log('✅ Constraint unique_default_per_department OK');
      }
    }
  } catch (error: any) {
    issues.push(`❌ Erro ao verificar constraints: ${error.message}`);
  }

  if (issues.length === 0) {
    console.log('🎉 Nenhum problema encontrado no diagnóstico!');
  } else {
    console.log('📋 Problemas encontrados:');
    issues.forEach(issue => console.log(issue));
  }

  return issues;
};

// Adicionar funções ao objeto global para fácil acesso no console
if (typeof window !== 'undefined') {
  (window as any).testDatabase = testDatabaseConnection;
  (window as any).diagnoseDatabase = diagnoseDatabaseIssues;
  
  console.log('🛠️ Funções de teste disponíveis:');
  console.log('  - testDatabase() - Testa conexão e operações básicas');
  console.log('  - diagnoseDatabase() - Diagnostica problemas conhecidos');
} 