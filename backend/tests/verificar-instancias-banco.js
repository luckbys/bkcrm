const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarInstanciasBanco() {
  try {
    console.log('🔍 Verificando instâncias no banco de dados Supabase...\n');
    
    const { data: instances, error } = await supabase
      .from('evolution_instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar instâncias:', error);
      return;
    }
    
    if (!instances || instances.length === 0) {
      console.log('⚠️ Nenhuma instância encontrada no banco');
      return;
    }
    
    console.log('📋 Instâncias encontradas no banco:');
    instances.forEach((instance, index) => {
      console.log(`\n${index + 1}. ${instance.instance_name}`);
      console.log(`   - ID: ${instance.id}`);
      console.log(`   - Status: ${instance.status}`);
      console.log(`   - É padrão: ${instance.is_default}`);
      console.log(`   - Departamento: ${instance.department_id}`);
      console.log(`   - API URL: ${instance.api_url}`);
    });
    
    // Verificar instância padrão
    const defaultInstance = instances.find(i => i.is_default);
    if (defaultInstance) {
      console.log(`\n🎯 Instância padrão: ${defaultInstance.instance_name}`);
    } else {
      console.log('\n⚠️ Nenhuma instância marcada como padrão');
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

verificarInstanciasBanco(); 