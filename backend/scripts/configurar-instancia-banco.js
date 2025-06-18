// 🏗️ Configurador de Instância Evolution no Banco de Dados
// Este script verifica e cria a instância no Supabase se necessário

import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase
const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';

const supabase = createClient(supabaseUrl, supabaseKey);

// Dados da instância Evolution (versão simplificada para teste)
const instanceData = {
  instance_name: 'atendimento-ao-cliente-suporte',
  instance_display_name: 'Atendimento ao Cliente SAC',
  evolution_api_url: 'https://press-evolution-api.jhkbgs.easypanel.host',
  api_key: '429683C4C977415CAAFCCE10F7D57E11',
  status: 'active',
  webhook_url: 'http://localhost:4000/webhook/evolution',
  is_default: true
};

async function main() {
  console.log('🏗️ Configurando instância Evolution no banco...');
  console.log(`📱 Instância: ${instanceData.instance_name}`);
  console.log('');

  try {
    // 1. Verificar se a tabela evolution_instances existe
    console.log('🔍 Verificando estrutura do banco...');
    
    // Tentar buscar a instância para ver se a tabela existe
    const { data: existingInstance, error: checkError } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('instance_name', instanceData.instance_name)
      .single();

    if (existingInstance) {
      console.log('✅ Instância já existe no banco!');
      console.log('📄 Dados atuais:', {
        id: existingInstance.id,
        nome: existingInstance.instance_display_name || existingInstance.instance_name,
        status: existingInstance.status,
        webhook: existingInstance.webhook_url
      });
      return existingInstance;
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erro ao verificar instância ou tabela não existe:', checkError);
      
      // Verificar se existem outras tabelas
      console.log('\n🔍 Verificando tabelas disponíveis...');
      const { data: tables, error: tablesError } = await supabase.rpc('get_tables_info');
      
      if (tables) {
        console.log('📋 Tabelas encontradas:', tables.map(t => t.table_name));
      }
      
      throw new Error(`Tabela evolution_instances pode não existir: ${checkError.message}`);
    }

    console.log('📝 Instância não encontrada, será criada...');

    // 2. Criar a instância simples (sem departamento por enquanto)
    console.log('\n3️⃣ Criando instância Evolution...');
    const { data: newInstance, error: createError } = await supabase
      .from('evolution_instances')
      .insert([{
        instance_name: instanceData.instance_name,
        instance_display_name: instanceData.instance_display_name,
        evolution_api_url: instanceData.evolution_api_url,
        api_key: instanceData.api_key,
        status: instanceData.status,
        webhook_url: instanceData.webhook_url,
        is_default: instanceData.is_default,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (createError) {
      console.error('❌ Erro ao criar instância:', createError);
      console.log('\n🔧 Tentando estrutura alternativa...');
      
      // Tentar com estrutura mais simples
      const { data: simpleInstance, error: simpleError } = await supabase
        .from('evolution_instances')
        .insert([{
          instance_name: instanceData.instance_name,
          status: instanceData.status,
          webhook_url: instanceData.webhook_url
        }])
        .select()
        .single();

      if (simpleError) {
        console.error('❌ Erro na criação simplificada:', simpleError);
        throw simpleError;
      }

      console.log('✅ Instância criada com estrutura simplificada!');
      console.log('📄 Nova instância:', simpleInstance);
      return simpleInstance;
    }

    console.log('✅ Instância criada com sucesso!');
    console.log('📄 Nova instância:', {
      id: newInstance.id,
      nome: newInstance.instance_display_name,
      status: newInstance.status
    });

    return newInstance;

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar configuração
main()
  .then(() => {
    console.log('\n🎉 Configuração concluída!');
    console.log('🧪 Agora você pode testar o webhook novamente com:');
    console.log('   node testar-webhook-local.js');
  })
  .catch(error => {
    console.error('\n❌ Falha na configuração:', error.message);
    
    console.log('\n💡 Soluções possíveis:');
    console.log('1. Verificar se as tabelas estão criadas no Supabase');
    console.log('2. Executar as migrações necessárias');
    console.log('3. Verificar permissões RLS no Supabase');
    
    process.exit(1);
  }); 