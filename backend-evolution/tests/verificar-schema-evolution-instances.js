const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarSchemaEvolutionInstances() {
  try {
    console.log('🔍 Verificando schema da tabela evolution_instances...\n');
    
    // Tentar buscar qualquer registro para ver as colunas disponíveis
    const { data, error } = await supabase
      .from('evolution_instances')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao consultar tabela:', error);
      
      // Se a tabela não existe, tentar criar
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('📋 Tabela evolution_instances não existe. Vamos criá-la...');
        await criarTabelaEvolutionInstances();
      }
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Tabela existe. Estrutura encontrada:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`├── ${col}: ${typeof data[0][col]}`);
      });
      
      console.log('\n📊 Dados existentes:');
      data.forEach((instance, index) => {
        console.log(`\n${index + 1}. ${instance.instance_name || instance.name || 'Nome não definido'}`);
        Object.entries(instance).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            console.log(`   ${key}: ${value}`);
          }
        });
      });
    } else {
      console.log('✅ Tabela existe mas está vazia');
      console.log('💡 Vamos inserir uma instância simples para ver a estrutura...');
      await inserirInstanciaSimples();
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function inserirInstanciaSimples() {
  try {
    // Tentar inserir com estrutura mínima
    const instanceData = {
      instance_name: 'atendimento-ao-cliente-suporte',
      status: 'active',
      is_default: true
    };
    
    const { data, error } = await supabase
      .from('evolution_instances')
      .insert([instanceData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao inserir instância simples:', error);
      console.log('💡 Erro indica colunas necessárias. Vamos ver...');
      
      // Tentar com estrutura ainda mais simples
      const simpleData = {
        name: 'atendimento-ao-cliente-suporte'
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('evolution_instances')
        .insert([simpleData])
        .select()
        .single();
      
      if (error2) {
        console.error('❌ Erro com estrutura simples:', error2);
        
        // Última tentativa - só ID
        const { data: data3, error: error3 } = await supabase
          .from('evolution_instances')
          .insert([{}])
          .select()
          .single();
        
        if (error3) {
          console.error('❌ Erro mesmo sem dados:', error3);
        } else {
          console.log('✅ Inserção vazia funcionou:', data3);
        }
      } else {
        console.log('✅ Inserção simples funcionou:', data2);
      }
    } else {
      console.log('✅ Instância inserida com sucesso:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao inserir instância simples:', error);
  }
}

async function criarTabelaEvolutionInstances() {
  try {
    console.log('🏗️ Criando tabela evolution_instances...');
    
    // Como não podemos executar SQL diretamente, vamos mostrar o que seria necessário
    console.log(`
📝 SQL necessário para criar a tabela:

CREATE TABLE IF NOT EXISTS evolution_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_name TEXT UNIQUE NOT NULL,
    instance_display_name TEXT,
    status TEXT DEFAULT 'active',
    is_default BOOLEAN DEFAULT false,
    department_id UUID REFERENCES departments(id),
    webhook_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

💡 Execute este SQL no SQL Editor do Supabase Dashboard.
    `);
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  }
}

verificarSchemaEvolutionInstances(); 