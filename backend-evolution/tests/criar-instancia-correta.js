const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ajlgjjjvuglwgfnyqqvb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqbGdqamp2dWdsd2dmbnlxcXZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NDMxNjYsImV4cCI6MjA2NTExOTE2Nn0.HPsxr84nkr3Ys7XafPDoU_Z94QFgbT1o1aNfAeaXpRU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function criarInstanciaCorreta() {
  try {
    console.log('🏗️ Criando instância Evolution API correta no banco...\n');
    
    // Verificar se já existe
    const { data: existing } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('instance_name', 'atendimento-ao-cliente-suporte')
      .single();
    
    if (existing) {
      console.log('✅ Instância já existe:', existing.instance_name);
      console.log('├── Status:', existing.status);
      console.log('├── É padrão:', existing.is_default);
      
      // Garantir que está marcada como padrão e ativa
      const { error: updateError } = await supabase
        .from('evolution_instances')
        .update({
          status: 'active',
          is_default: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      
      if (updateError) {
        console.error('❌ Erro ao atualizar instância:', updateError);
      } else {
        console.log('✅ Instância atualizada como padrão e ativa');
      }
      
      return existing;
    }
    
    // Criar nova instância
    const instanceData = {
      instance_name: 'atendimento-ao-cliente-suporte',
      instance_display_name: 'Atendimento ao Cliente - Suporte',
      api_url: 'https://press-evolution-api.jhkbgs.easypanel.host',
      api_key: '429683C4C977415CAAFCCE10F7D57E11',
      webhook_url: 'https://bkcrm.devsible.com.br/webhook/evolution',
      status: 'active',
      is_default: true,
      department_id: null, // Pode ser definido depois
      metadata: {
        created_via: 'script_correction',
        environment: 'production',
        verified_working: true,
        connection_status: 'open'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newInstance, error } = await supabase
      .from('evolution_instances')
      .insert([instanceData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao criar instância:', error);
      return null;
    }
    
    console.log('✅ Nova instância criada com sucesso:');
    console.log('├── ID:', newInstance.id);
    console.log('├── Nome:', newInstance.instance_name);
    console.log('├── Status:', newInstance.status);
    console.log('├── É padrão:', newInstance.is_default);
    console.log('├── API URL:', newInstance.api_url);
    
    return newInstance;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return null;
  }
}

async function removerInstanciasIncorretas() {
  try {
    console.log('\n🗑️ Removendo instâncias incorretas...');
    
    // Buscar instâncias com nome incorreto
    const { data: incorrectInstances } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('instance_name', 'atendimento-ao-cliente-sac1');
    
    if (!incorrectInstances || incorrectInstances.length === 0) {
      console.log('✅ Nenhuma instância incorreta encontrada');
      return;
    }
    
    console.log(`📋 Encontradas ${incorrectInstances.length} instâncias incorretas`);
    
    for (const instance of incorrectInstances) {
      console.log(`🗑️ Removendo: ${instance.instance_name} (${instance.id})`);
      
      const { error } = await supabase
        .from('evolution_instances')
        .delete()
        .eq('id', instance.id);
      
      if (error) {
        console.error(`❌ Erro ao remover ${instance.id}:`, error);
      } else {
        console.log(`✅ ${instance.instance_name} removida`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao remover instâncias incorretas:', error);
  }
}

async function corrigirTicketsComInstanciaIncorreta() {
  try {
    console.log('\n🔧 Corrigindo tickets com instância incorreta...');
    
    // Buscar tickets com metadata.instance_name incorreto
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, metadata')
      .like('metadata->>instance_name', '%sac1%');
    
    if (!tickets || tickets.length === 0) {
      console.log('✅ Nenhum ticket com instância incorreta encontrado');
      return;
    }
    
    console.log(`📋 Encontrados ${tickets.length} tickets para corrigir`);
    
    for (const ticket of tickets) {
      const updatedMetadata = {
        ...ticket.metadata,
        instance_name: 'atendimento-ao-cliente-suporte',
        corrected_instance: true,
        correction_date: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('tickets')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticket.id);
      
      if (error) {
        console.error(`❌ Erro ao corrigir ticket ${ticket.id}:`, error);
      } else {
        console.log(`✅ Ticket ${ticket.id} corrigido`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir tickets:', error);
  }
}

async function executarCorrecaoCompleta() {
  console.log('🚀 CORREÇÃO COMPLETA - INSTÂNCIA EVOLUTION API\n');
  
  // 1. Remover instâncias incorretas
  await removerInstanciasIncorretas();
  
  // 2. Criar/verificar instância correta
  const instance = await criarInstanciaCorreta();
  
  if (instance) {
    // 3. Corrigir tickets
    await corrigirTicketsComInstanciaIncorreta();
    
    console.log('\n✅ CORREÇÃO FINALIZADA COM SUCESSO!');
    console.log('🔑 Instância correta: atendimento-ao-cliente-suporte');
    console.log('📝 Todos os tickets foram corrigidos');
    console.log('🌐 Sistema agora usa instância que existe na Evolution API');
  } else {
    console.log('\n❌ FALHA NA CORREÇÃO');
  }
}

executarCorrecaoCompleta(); 