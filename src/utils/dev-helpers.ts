import { supabase } from '@/lib/supabase';

// Helper para teste rápido de criação de tickets
(window as any).testTicketCreation = async (numero?: string, nome?: string, mensagem?: string) => {
  console.log('🧪 [DEV] Testando criação de ticket...');
  const defaultNumber = numero || '5511999888777';
  const defaultName = nome || 'Teste Dev';
  const defaultMessage = mensagem || `Teste de criação automática: ${new Date().toLocaleString()}`;
  
  // Criar ticket diretamente no banco
  try {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert([{
        title: `Contato de ${defaultName}`,
        description: defaultMessage,
        status: 'open',
        priority: 'medium',
        customer_id: null,
        department: 'suporte',
        client_phone: defaultNumber,
        channel: 'chat',
        metadata: {
          anonymous_contact: true,
          contact_name: defaultName,
          contact_phone: defaultNumber
        }
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ [DEV] Erro ao criar ticket:', error);
      return false;
    }

    console.log('✅ [DEV] Ticket criado com sucesso:', ticket);
    return true;
  } catch (error) {
    console.error('❌ [DEV] Erro inesperado:', error);
    return false;
  }
};

// Helper para listar tickets por canal
(window as any).queryTickets = async (canal?: string) => {
  console.log('📋 [DEV] Listando tickets...');
  
  let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });
  
  if (canal) {
    query = query.eq('channel', canal);
    console.log(`🔍 [DEV] Filtrando por canal: ${canal}`);
  }
  
  const { data: tickets, error } = await query.limit(10);
  
  if (error) {
    console.error('❌ [DEV] Erro ao buscar tickets:', error);
    return [];
  }
  
  console.log(`📊 [DEV] ${tickets?.length || 0} tickets encontrados:`, tickets);
  return tickets || [];
};

// Helper para limpar tickets de teste
(window as any).cleanTestTickets = async () => {
  console.log('🧹 [DEV] Limpando tickets de teste...');
  
  const { data, error } = await supabase
    .from('tickets')
    .delete()
    .like('title', '%Teste%')
    .select();
  
  if (error) {
    console.error('❌ [DEV] Erro ao limpar tickets:', error);
    return 0;
  }
  
  console.log(`✅ [DEV] ${data?.length || 0} tickets de teste removidos`);
  return data?.length || 0;
};

// Helper para verificar estrutura da tabela tickets
(window as any).checkTicketsTable = async () => {
  console.log('🔍 [DEV] Verificando estrutura da tabela tickets...');
  
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ [DEV] Erro ao verificar tabela:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('📋 [DEV] Exemplo de ticket (estrutura):', data[0]);
    console.log('🗂️ [DEV] Campos disponíveis:', Object.keys(data[0]));
  } else {
    console.log('📭 [DEV] Tabela tickets está vazia');
  }
};

// 📱 Helper para testar Evolution API
(window as any).testEvolutionAPI = async () => {
  console.log('🧪 [DEV] Testando Evolution API...');
  
  try {
    console.log('📡 [DEV] Testando formatação de telefone...');
    const testPhones = ['11999998888', '(11) 99999-8888', '5511999998888'];
    
    // Simular formatação (sem importar o serviço para evitar erro)
    testPhones.forEach(phone => {
      const cleanPhone = phone.replace(/\D/g, '');
      let formatted = cleanPhone;
      
      if (cleanPhone.length === 11) {
        formatted = `55${cleanPhone}`;
      } else if (cleanPhone.length === 10) {
        const ddd = cleanPhone.substring(0, 2);
        const number = cleanPhone.substring(2);
        formatted = `55${ddd}9${number}`;
      }
      
      const isValid = formatted.length >= 12 && formatted.startsWith('55');
      console.log(`📞 [DEV] ${phone} → ${formatted} (válido: ${isValid})`);
    });
    
    console.log('✅ [DEV] Teste de formatação concluído');
    console.log('💡 [DEV] Para testes completos da Evolution API, use o TicketChat com instância configurada');
    return { success: true };
    
  } catch (error) {
    console.error('❌ [DEV] Erro ao testar Evolution API:', error);
    return { success: false, error };
  }
};

// 🔄 Helper para simular recebimento de mensagem WhatsApp
(window as any).simulateWhatsAppMessage = async (ticketId: string, content = 'Mensagem de teste via WhatsApp') => {
  console.log('🧪 [DEV] Simulando mensagem WhatsApp...');
  
  try {
    const testMessage = {
      ticket_id: ticketId,
      content: content,
      sender_name: 'Cliente Teste',
      type: 'text',
      is_internal: false,
      is_read: false,
      metadata: {
        is_from_whatsapp: true,
        evolution_instance: 'teste-instance',
        evolution_message_id: 'msg-' + Date.now(),
        sender_phone: '5511999998888',
        test_message: true
      }
    };

    const { data, error } = await supabase
      .from('messages')
      .insert([testMessage])
      .select()
      .single();

    if (error) {
      console.error('❌ [DEV] Erro ao simular mensagem WhatsApp:', error);
      return { success: false, error };
    }

    console.log('✅ [DEV] Mensagem WhatsApp simulada:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ [DEV] Erro na simulação:', error);
    return { success: false, error };
  }
};

// 🎫 Helper para criar ticket de teste com WhatsApp
(window as any).createWhatsAppTestTicket = async () => {
  console.log('🧪 [DEV] Criando ticket de teste com WhatsApp...');
  
  try {
    const testTicket = {
      title: 'Ticket Teste WhatsApp',
      subject: 'Teste de integração Evolution API',
      description: 'Ticket criado automaticamente para teste da integração WhatsApp',
      status: 'pendente',
      priority: 'normal',
      channel: 'chat',
      metadata: {
        evolution_instance_name: 'teste-principal',
        client_phone: '5511999998888',
        client_name: 'Cliente Teste WhatsApp',
        created_from_whatsapp: true,
        auto_created: true,
        test_ticket: true,
        anonymous_contact: 'Cliente Teste WhatsApp'
      },
      unread: true,
      tags: ['whatsapp', 'teste', 'auto-created'],
      is_internal: false,
      last_message_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('tickets')
      .insert([testTicket])
      .select()
      .single();

    if (error) {
      console.error('❌ [DEV] Erro ao criar ticket teste:', error);
      return { success: false, error };
    }

    console.log('✅ [DEV] Ticket WhatsApp teste criado:', data);
    
    // Criar mensagem inicial
    const initialMessage = await (window as any).simulateWhatsAppMessage(
      data.id, 
      'Olá! Esta é uma mensagem de teste do WhatsApp 📱'
    );
    
    if (initialMessage.success) {
      console.log('✅ [DEV] Mensagem inicial adicionada ao ticket');
    }
    
    return { success: true, ticket: data, message: initialMessage.data };
  } catch (error) {
    console.error('❌ [DEV] Erro ao criar ticket teste:', error);
    return { success: false, error };
  }
};

// 🧹 Helper para limpar dados de teste WhatsApp
(window as any).cleanWhatsAppTestData = async () => {
  console.log('🧹 [DEV] Limpando dados de teste WhatsApp...');
  
  try {
    // Limpar mensagens de teste
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('metadata->>test_message', 'true');

    if (messagesError) {
      console.error('❌ [DEV] Erro ao limpar mensagens de teste:', messagesError);
    } else {
      console.log('✅ [DEV] Mensagens de teste removidas');
    }

    // Limpar tickets de teste
    const { error: ticketsError } = await supabase
      .from('tickets')
      .delete()
      .eq('metadata->>test_ticket', 'true');

    if (ticketsError) {
      console.error('❌ [DEV] Erro ao limpar tickets de teste:', ticketsError);
    } else {
      console.log('✅ [DEV] Tickets de teste removidos');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ [DEV] Erro na limpeza:', error);
    return { success: false, error };
  }
};

// 🔍 Helper para verificar estrutura da tabela profiles
(window as any).checkProfilesStructure = async () => {
  console.log('%c🔍 VERIFICANDO ESTRUTURA DA TABELA PROFILES', 'color: #2563eb; font-weight: bold; font-size: 14px');
  
  try {
    // Tentar buscar um perfil para ver quais colunas existem
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.log('❌ Erro ao acessar profiles:', error.message);
      return;
    }
    
    if (profile) {
      console.log('✅ Tabela profiles encontrada');
      console.log('📋 Colunas disponíveis:');
      Object.keys(profile).forEach(key => {
        const value = profile[key];
        const type = typeof value;
        console.log(`   ${key}: ${type} = ${value}`);
      });
      
      // Verificar especificamente colunas relacionadas a departamento
      const hasDepartmentId = 'department_id' in profile;
      const hasDepartment = 'department' in profile;
      
      console.log('');
      console.log('%c🏢 CONFIGURAÇÃO DE DEPARTAMENTO:', 'color: #7c3aed; font-weight: bold');
      console.log(`   department_id (UUID): ${hasDepartmentId ? '✅ Existe' : '❌ Não existe'}`);
      console.log(`   department (TEXT): ${hasDepartment ? '✅ Existe' : '❌ Não existe'}`);
      
      if (hasDepartmentId) {
        console.log('');
        console.log('✅ Estrutura atualizada detectada - usando department_id');
        return 'department_id';
      } else if (hasDepartment) {
        console.log('');
        console.log('⚠️ Estrutura legacy detectada - usando department');
        console.log('💡 Considere executar a migração: 20240321000002_add_department_to_profiles.sql');
        return 'department';
      } else {
        console.log('');
        console.log('❌ Nenhuma coluna de departamento encontrada');
        console.log('🔧 Execute as migrações de departamento primeiro');
        return null;
      }
    } else {
      console.log('❌ Nenhum perfil encontrado na tabela');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return null;
  }
};

// 📋 Helper para testar migração evolution_instances
(window as any).testEvolutionInstancesMigration = async () => {
  console.log('%c🔄 TESTANDO MIGRAÇÃO EVOLUTION_INSTANCES', 'color: #2563eb; font-weight: bold; font-size: 14px');
  
  try {
    // Verificar se a tabela existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('evolution_instances')
      .select('count', { count: 'exact', head: true });
    
    if (tableError) {
      console.log('❌ Tabela evolution_instances não existe ainda');
      console.log('📋 Execute esta migração no Supabase SQL Editor:');
      console.log('');
      console.log('%csupabase/migrations/20240321000005_evolution_instances_simple.sql', 'background: #f3f4f6; padding: 4px; border-radius: 4px; font-family: monospace');
      return { exists: false };
    }
    
    console.log('✅ Tabela evolution_instances existe');
    
    // Verificar instâncias existentes
    const { data: instances, error: instancesError } = await supabase
      .from('evolution_instances')
      .select('*');
    
    if (instancesError) {
      console.log('❌ Erro ao buscar instâncias:', instancesError.message);
      return { exists: true, error: instancesError };
    }
    
    console.log(`📊 Total de instâncias: ${instances?.length || 0}`);
    
    if (instances && instances.length > 0) {
      console.log('');
      console.log('%c📋 INSTÂNCIAS ENCONTRADAS:', 'color: #059669; font-weight: bold');
      instances.forEach((instance, index) => {
        console.log(`${index + 1}. ${instance.instance_name}`);
        console.log(`   Departamento: ${instance.department_name}`);
        console.log(`   Status: ${instance.status}`);
        console.log(`   Padrão: ${instance.is_default ? 'Sim' : 'Não'}`);
        console.log('');
      });
    }
    
    // Verificar departamentos
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true);
    
    if (deptError) {
      console.log('⚠️ Erro ao buscar departamentos:', deptError.message);
    } else {
      console.log(`🏢 Departamentos ativos: ${departments?.length || 0}`);
      
      if (departments) {
        departments.forEach((dept) => {
          const deptInstances = instances?.filter(i => i.department_id === dept.id) || [];
          console.log(`   ${dept.name}: ${deptInstances.length} instância(s)`);
        });
      }
    }
    
    console.log('');
    console.log('%c✅ TESTE CONCLUÍDO', 'color: #16a34a; font-weight: bold');
    return { exists: true, instances, departments };
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return { exists: false, error };
  }
};

// Função para verificar se a migração evolution_instances foi executada
export const checkEvolutionInstancesTable = async () => {
  console.log('\n🔍 VERIFICANDO TABELA EVOLUTION_INSTANCES');
  console.log('==========================================');
  
  try {
    // Verificar se a tabela existe
    const { data, error } = await supabase
      .from('evolution_instances')
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('❌ Tabela evolution_instances não existe');
        console.log('💡 Execute a migração: 20240321000005_evolution_instances_simple.sql');
        return false;
      } else {
        console.log('❌ Erro ao acessar tabela:', error.message);
        return false;
      }
    }

    console.log('✅ Tabela evolution_instances existe');
    
    // Verificar estrutura da tabela
    const { data: allInstances, error: selectError } = await supabase
      .from('evolution_instances')
      .select('id, instance_name, department_id, department_name, status, is_default, created_at')
      .limit(5);

    if (selectError) {
      console.log('❌ Erro ao consultar instâncias:', selectError.message);
      return false;
    }

    console.log(`📊 Total de instâncias encontradas: ${allInstances?.length || 0}`);
    
    if (allInstances && allInstances.length > 0) {
      console.log('📋 Instâncias existentes:');
      allInstances.forEach((instance, index) => {
        console.log(`   ${index + 1}. ${instance.instance_name} (${instance.department_name}) - ${instance.status}`);
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return false;
  }
};

// Função para verificar se precisa executar migrações
export const checkMigrationStatus = async () => {
  console.log('\n🔍 VERIFICANDO STATUS DAS MIGRAÇÕES');
  console.log('====================================');
  
  const profilesOk = await (window as any).checkProfilesStructure();
  const evolutionOk = await checkEvolutionInstancesTable();
  
  console.log('\n📋 RESUMO DO STATUS:');
  console.log('===================');
  console.log(`Tabela profiles: ${profilesOk ? '✅ OK' : '❌ Precisa migração'}`);
  console.log(`Tabela evolution_instances: ${evolutionOk ? '✅ OK' : '❌ Precisa migração'}`);
  
  if (!profilesOk) {
    console.log('\n🛠️  AÇÃO NECESSÁRIA:');
    console.log('Execute no Supabase SQL Editor:');
    console.log('1. 20240321000002_add_department_to_profiles.sql');
  }
  
  if (!evolutionOk) {
    console.log('\n🛠️  AÇÃO NECESSÁRIA:');
    console.log('Execute no Supabase SQL Editor:');
    console.log('2. 20240321000005_evolution_instances_simple.sql');
  }
  
  if (profilesOk && evolutionOk) {
    console.log('\n🎉 Todas as migrações estão aplicadas!');
    console.log('Você pode usar o sistema WhatsApp normalmente.');
  }
  
  return { profilesOk, evolutionOk };
};

// Registrar funções no console
(window as any).checkEvolutionInstancesTable = checkEvolutionInstancesTable;
(window as any).checkMigrationStatus = checkMigrationStatus;

// Helper para mostrar comandos disponíveis
(window as any).devHelp = () => {
  console.log(`
🛠️ Comandos de Desenvolvimento Disponíveis:

📋 Tickets:
testTicketCreation(numero?, nome?, mensagem?)     - Cria ticket de teste
queryTickets(canal?)                              - Lista tickets (filtro: email, phone, chat, web)
cleanTestTickets()                                - Remove tickets de teste  
checkTicketsTable()                               - Verifica estrutura da tabela

📱 WhatsApp/Evolution API:
testEvolutionAPI()                                - Testa funções da Evolution API
testRealEvolutionAPI()                            - Testa conexão com Evolution API real
createWhatsAppTestTicket()                        - Cria ticket de teste com WhatsApp
simulateWhatsAppMessage(ticketId, mensagem?)      - Simula mensagem do WhatsApp
cleanWhatsAppTestData()                           - Remove dados de teste WhatsApp

🔧 Diagnóstico de Migração:
checkProfilesStructure()                          - Verifica estrutura tabela profiles
testEvolutionInstancesMigration()                 - Testa migração evolution_instances
checkEvolutionInstancesTable()                    - Verifica se tabela evolution_instances existe
checkMigrationStatus()                            - Verifica status de todas as migrações

📊 Verificação:
devHelp()                                         - Mostra esta ajuda

💡 Exemplos:
checkProfilesStructure()
testEvolutionInstancesMigration()
testTicketCreation('5511999888777', 'João', 'Preciso de ajuda')
createWhatsAppTestTicket()
testEvolutionAPI()
  `);
};

// Log inicial
console.log('🛠️ [DEV] Dev Helpers carregados! Digite devHelp() para ver comandos disponíveis.');

// Teste da Evolution API real configurada
(window as any).testRealEvolutionAPI = async () => {
  console.log('%c🚀 TESTANDO EVOLUTION API REAL', 'color: #16a34a; font-weight: bold; font-size: 14px');
  console.log('==========================================');
  
  try {
    const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL || 'https://press-evolution-api.jhkbgs.easypanel.host';
    const apiKey = import.meta.env.VITE_EVOLUTION_API_KEY || '429683C4C977415CAAFCCE10F7D57E11';
    
    console.log(`🔗 URL: ${apiUrl}`);
    console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
    
    // Teste 1: Verificar se API está online
    console.log('\n1️⃣ Testando conectividade...');
    const response = await fetch(`${apiUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const instances = await response.json();
    console.log('✅ API está online!');
    console.log(`📊 Instâncias existentes: ${instances.length || 0}`);
    
    if (instances.length > 0) {
      console.log('\n📋 Instâncias encontradas:');
      instances.forEach((instance: any, index: number) => {
        console.log(`   ${index + 1}. ${instance.instance.instanceName} - Status: ${instance.instance.status}`);
      });
    }
    
    // Teste 2: Verificar instâncias do banco local
    console.log('\n2️⃣ Verificando instâncias no banco local...');
    const { data: localInstances, error } = await supabase
      .from('evolution_instances')
      .select('instance_name, status, department_name')
      .eq('is_active', true);
    
    if (error) {
      console.log('❌ Erro ao buscar instâncias locais:', error.message);
    } else {
      console.log(`📊 Instâncias locais: ${localInstances?.length || 0}`);
      localInstances?.forEach((instance, index) => {
        console.log(`   ${index + 1}. ${instance.instance_name} (${instance.department_name}) - Status: ${instance.status}`);
      });
    }
    
    // Teste 3: Sincronização
    console.log('\n3️⃣ Verificando sincronização...');
    const localNames = localInstances?.map(i => i.instance_name) || [];
    const remoteNames = instances.map((i: any) => i.instance.instanceName) || [];
    
    const onlyLocal = localNames.filter(name => !remoteNames.includes(name));
    const onlyRemote = remoteNames.filter((name: string) => !localNames.includes(name));
    
    if (onlyLocal.length > 0) {
      console.log('⚠️  Instâncias apenas no banco local:', onlyLocal);
    }
    
    if (onlyRemote.length > 0) {
      console.log('⚠️  Instâncias apenas na Evolution API:', onlyRemote);
    }
    
    if (onlyLocal.length === 0 && onlyRemote.length === 0) {
      console.log('✅ Instâncias sincronizadas!');
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    return {
      success: true,
      api_online: true,
      remote_instances: instances.length,
      local_instances: localInstances?.length || 0,
      sync_issues: {
        only_local: onlyLocal,
        only_remote: onlyRemote
      }
    };
    
  } catch (error: any) {
    console.error('❌ ERRO NO TESTE:', error.message);
    
    if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
      console.log('\n💡 POSSÍVEIS SOLUÇÕES:');
      console.log('1. Verificar se Evolution API está rodando');
      console.log('2. Verificar URL na variável VITE_EVOLUTION_API_URL');
      console.log('3. Verificar se há problemas de CORS');
      console.log('4. Verificar conexão de internet');
    } else if (error.message.includes('401') || error.message.includes('403')) {
      console.log('\n💡 PROBLEMA DE AUTENTICAÇÃO:');
      console.log('1. Verificar API Key na variável VITE_EVOLUTION_API_KEY');
      console.log('2. Verificar se API Key está correta na Evolution API');
    }
    
    return {
      success: false,
      error: error.message,
      api_online: false
    };
  }
}; 